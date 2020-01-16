const express = require('express');
const app = express();
const server = require('http').createServer(app);
const log4js = require('log4js');
const bodyParser = require('body-parser');
const path = require("path");
const ejs = require('ejs');
const SkyRTC = require('./public/dist/js/SkyRTC.js').listen(server);
const ecb = require('./utils/aes-ecb.js');

const dbUtil = require('./utils/databaseConnect.js');
const port = process.env.PORT || 3000;
const hostname = "0.0.0.0";
const UUID = require('node-uuid');
const key = new Buffer("c4b84456c1379bec99c4d1b7e9f13173", 'hex');
//const key256 = new Buffer("c4b84456c1379bec99c4d1b7e9f13173c4b84456c1379bec99c4d1b7e9f13173", 'hex')

//日志存储
log4js.configure({
    appenders: {
        file: {
            type: 'file',
            filename: 'app.log',
            layout: {
                type: 'pattern',
                pattern: '%r %p - %m',
            }
        }
    },
    categories: {
        default: {
            appenders: ['file'],
            level: 'debug'
        }
    }
});

const logger = log4js.getLogger();



app.use(express.static(path.join(__dirname, 'public')), null);

server.listen(port, hostname, function () {
    console.log(`Server running at http://${hostname}:${port}/`);
});

app.engine('.html',ejs.renderFile);
/*app.set('views', __dirname + '/views'); // general config
app.set('view engine', 'html');*/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
//加入房间
app.post('/webrtcJoinRoom', async function (req, res) {
    var str = req.body.par;
    if (!str){
        res.json({code:'1',msg:"未传递参数！"});
        return;
    }
    console.log("参数："+str);
    //str = str.replace(/\s*/g,"");
    var pars;
    try{
        var crypto_buffer =ecb.decText(str,key);
        var str1 = crypto_buffer.toString();
        pars = JSON.parse(str1);
        console.log("解析参数："+pars);
    }catch (e) {
        res.json({code: "2", msg: e.message});
        return
    }
    try{
        if (pars) {
            var addSql = 'select * from webrtc_roomlist where token = ? and id = ?';
            var addSqlParams = [];
            addSqlParams.push(pars.token);
            addSqlParams.push(pars.room);

            var result = await dbUtil.query(addSql,addSqlParams);
            if (!result){
                res.json({code: "3", msg: "房间不存在或验证失败！"});
                return;
            }
            addSql = 'select * from webrtc_roomuser where userid = ? and roomid = ?';
            addSqlParams = [];
            addSqlParams.push(pars.user);
            addSqlParams.push(pars.room);
            logger.info("用户加入房间",addSqlParams)
            var roomUserResult = await dbUtil.query(addSql,addSqlParams);
            if (!roomUserResult || roomUserResult.length == 0){
                res.json({code: "4", msg: "该用户不属于这个房间"});
                return;
            }
            if (roomUserResult.length > 1) {
                res.json({code: "6", msg: "该用户重复存在这个房间"});
                return;
            }
            if (roomUserResult[0].status == 1){
                res.json({code: "7", msg: "该用户已加入这个房间"});
                return;
            }
            //dbUtil.updateRoomUserStatus(roomUserResult[0].id);
            var data = {
                room : pars.room,
                video : pars.video,
                audio : pars.audio,
                user : pars.user
            };
            console.log("转发页面参数："+JSON.stringify(data));
            res.render("index.html", {data: JSON.stringify(data)});
        }
    }catch (e) {
        res.json({code: "5", msg: e.message});
    }

    //res.sendfile(__dirname + '/views/index.html');

});

//创建房间
app.post('/webrtcCreateRoom', async function (req, res) {
    var users = req.body.users;
    if (!users){
        res.json({code:'1',msg:'未传用户信息'});
        return;
    }

    try{
        var token = UUID.v4();
        var addSql = 'INSERT INTO webrtc_roomlist(token) VALUES(?)';
        var addSqlParams = [];
        addSqlParams.push(token);
        var result = await dbUtil.query(addSql,addSqlParams);
        if (result && result.insertId){
            dbUtil.createRoomUser(result.insertId,users);
            res.json({code:'200',result:{room:result.insertId,token:token}});
        } else{
            res.json({code:'2',msg:'创建房间失败'});
        }
    }catch (e) {
        res.json({code:'3',msg:e.message});
    }
});
app.post('/webrtcCreateUserCode', function (req, res) {
    var user = req.body.user;
    var video = req.body.video;
    var audio = req.body.audio;
    var room = req.body.room;
    var token = req.body.token;
    var data = JSON.stringify({room:room,token:token,video:video,audio:audio,user:user})
    console.log("加入房间人参数："+data)
    var text_encrypt = ecb.encText(data,key);
    res.json({code:'200',result:text_encrypt});
});

app.get('/webrtcLogin', function (req, res) {
    res.sendfile(__dirname + '/views/login.html');
})
app.get('/createRoom', function (req, res) {
    res.sendfile(__dirname + '/views/createRoom.html');
})
SkyRTC.rtc.on('new_connect', async function (socket) {
    console.log('创建新连接');
    logger.info("创建新连接");
});

SkyRTC.rtc.on('remove_peer',async function (socket,room,that) {
    console.log("remove_peer socket:"+socket);
    console.log("remove_peer room:"+room);
    var flag = await dbUtil.deleteRoomUser(socket,room);
    if (flag){
        logger.info(socket + "用户离开房间"+room+"成功");
    } else{
        logger.info(socket + "用户离开房间"+room +"失败");
    }

});

SkyRTC.rtc.on('new_peer', async function (data) {
    var datas = {
        room:data.room,
        userId:data.userId,
        socketId:data.id
    }
    var flag = await dbUtil.updateRoomUserStatus(datas);
    if (flag){
        logger.info("新用户" + data.id + "加入房间" + data.room+"成功");
    } else{
        logger.info("新用户" + data.id + "加入房间" + data.room+"失败");
    }
});

SkyRTC.rtc.on('socket_message', function (socket, msg) {
    console.log("接收到来自" + socket.id + "的新消息：" + msg);
    logger.info("接收到来自" + socket.id + "的新消息：" + msg);
});

SkyRTC.rtc.on('ice_candidate', function (socket, ice_candidate) {
    console.log("接收到来自" + socket.id + "的ICE Candidate");
    logger.info("接收到来自" + socket.id + "的ICE Candidate");
});

SkyRTC.rtc.on('offer', function (socket, offer) {
    console.log("接收到来自" + socket.id + "的Offer");
    logger.info("接收到来自" + socket.id + "的Offer");
});

SkyRTC.rtc.on('answer', function (socket, answer) {
    console.log("接收到来自" + socket.id + "的Answer");
    logger.info("接收到来自" + socket.id + "的Answer");
});

SkyRTC.rtc.on('error', function (error) {
    console.log("发生错误：" + error.message);
    logger.error("发生错误：" + error.message);
});