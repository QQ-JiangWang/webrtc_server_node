'use strict';
//数据库创建
var mysql    = require('mysql');
//创建连接池
var pool = mysql.createPool({
    host     : '47.97.68.127',
    user     : 'root',
    password : '123456',
    database : 'webrtc'
});
function query( sql, values ) {
    // 返回一个 Promise
    var promise = new Promise(( resolve, reject ) => {
        pool.getConnection(function(err,connect){//通过getConnection()方法进行数据库连接
            if(err){
                //logger.error('[CREATE CONNECTION] - ',err.message);
                console.log(err.message);
            }else{
                connect.query(sql, values, ( err, rows) => {
                    if ( err ) {
                        reject( err )
                    } else {
                        resolve( rows )
                    }
                    connect.release();//释放连接池中的数据库连接
                })
            }
        });

    });
    return promise;
}

//创建关联房间的用户
function createRoomUser (room,users){
    users.forEach( user => {
        var addSql = 'INSERT INTO webrtc_roomuser(roomid,userid,status) VALUES(?,?,?)';
        var addSqlParams = [];
        addSqlParams.push(room);
        addSqlParams.push(user);
        addSqlParams.push(0);
        pool.getConnection(function(err,connect){//通过getConnection()方法进行数据库连接
            if(err){
                //logger.error('[CREATE CONNECTION] - ',err.message);
            }else{
                connect.query(addSql,addSqlParams, (err, result) => {
                    if(err){
                        console.log('[UPDATE ERROR] - ',err.message);
                        //logger.error('[UPDATE ERROR] - ',err.message);
                    }
                    connect.release();
                });
            }
        });
    })
}
//修改用户加入房间状态
function updateRoomUserStatus(data) {
    if (!data){
        return false;
    }
    var addSql = 'UPDATE webrtc_roomuser SET status = 1,soketid = ? WHERE userid = ? and roomid = ?';
    var addSqlParams = [];
    addSqlParams.push(data.socketId);
    addSqlParams.push(data.userId);
    addSqlParams.push(data.room);
    pool.getConnection(function(err,connect){//通过getConnection()方法进行数据库连接
        if(err){
            //logger.error('[CREATE CONNECTION] - ',err.message);
        }else{
            connect.query(addSql,addSqlParams, (err, result) => {
                if(err){
                    console.log('[UPDATE ERROR] - ',err.message);
                    //logger.error('[UPDATE ERROR] - ',err.message);
                    return false;
                }
                connect.release();
                return true;
            });
        }
    });

}
//删除房间用户
function deleteRoomUser(socket,room) {
    if (!socket || !room){
        return false;
    }
    var addSql = 'delete from webrtc_roomuser  WHERE  roomid = ? and soketid = ?';
    var addSqlParams = [];
    addSqlParams.push(room);
    addSqlParams.push(socket);
    pool.getConnection(function(err,connect){//通过getConnection()方法进行数据库连接
        if(err){
            //logger.error('[CREATE CONNECTION] - ',err.message);
        }else{
            connect.query(addSql,addSqlParams, (err, result) => {
                if(err){
                    console.log('[UPDATE ERROR] - ',err.message);
                    //logger.error('[UPDATE ERROR] - ',err.message);
                    return false;
                }
                connect.release();
                return true;
            });
        }
    });

}
//暴露操作数据库方法
exports.query = query;
exports.updateRoomUserStatus = updateRoomUserStatus;
exports.createRoomUser = createRoomUser;
exports.deleteRoomUser = deleteRoomUser;