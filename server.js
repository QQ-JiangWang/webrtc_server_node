const express = require('express');
const app = express();
const server = require('http').createServer(app);
const log4js = require('log4js');
//const bodyParser = require('body-parser');
const path = require("path");
const SkyRTC = require('./public/dist/js/SkyRTC.js').listen(server);
const ecb = require('./public/dist/js/aes-ecb.js');
const port = process.env.PORT || 3000;
const hostname = "0.0.0.0";
const rooms = new Map();
const UUID = require('node-uuid');
const key = new Buffer("c4b84456c1379bec99c4d1b7e9f13173", 'hex');
const key256 = new Buffer("c4b84456c1379bec99c4d1b7e9f13173c4b84456c1379bec99c4d1b7e9f13173", 'hex')

//const ejs = require('ejs');
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




var logger = log4js.getLogger();
app.use(express.static(path.join(__dirname, 'public')), null);


server.listen(port, hostname, function () {
    console.log(`Server running at http://${hostname}:${port}/`);
});

/*app.engine('ejs',ejs.renderFile);
app.set('views', __dirname + '/views'); // general config
app.set('view engine', 'html');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.post('/index', function (req, res) {
    debugger
    res.sendfile(__dirname + '/index.html');

});*/
app.get('/', function (req, res) {
    var str = req.query.par;
    var crypto_buffer =ecb.decText(str,key);
    var str1 = crypto_buffer.toString();
    console.log(str1);
    //localStorage.setItem('room', str);
    res.sendfile(__dirname + '/index.html');

});
//创建房间
app.get('/webrtcCreateRoom', function (req, res) {
    var room = 1;
    var uuid = UUID.v4();
    var result = null;
    while(true){
        if (!rooms.get(room)){
            result = {
                room:room,
                token:uuid
            }
            rooms.set(room,uuid);
            break;
        }
        room++;
    }
    res.json(result);
});

SkyRTC.rtc.on('new_connect', function (socket) {
    console.log('创建新连接');
    logger.info("创建新连接");
});

SkyRTC.rtc.on('remove_peer', function (socketId) {
    console.log(socketId + "用户离开");
    logger.info(socketId + "用户离开");
});

SkyRTC.rtc.on('new_peer', function (socket, room) {
    console.log("新用户" + socket.id + "加入房间" + room);
    logger.info("新用户" + socket.id + "加入房间" + room);
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