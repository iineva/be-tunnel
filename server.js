/**
 * 直接转发端口数据到某主机
 */

var net = require('net');
var randomstring = require('random-string');
var parseData = require('./lib/parse-data');

var HOST = '127.0.0.1';
var PORT = 3001; // be-tunnel使用的端口
var P = 3000; // 外部访问的端口

var connects = []; // 保存链接
var client = null; // 客户端服务器

// 创建一个TCP服务器实例，调用listen函数开始监听指定端口
// 传入net.createServer()的回调函数将作为”connection“事件的处理函数
// 在每一个“connection”事件中，该回调函数接收到的socket对象是唯一的
net.createServer(function(sock) {

    if (client) {
        console.log('❌be-tunnel重复链接');
        sock.destroy();
        return;
    }

    client = net.createServer(function(s) {
        // 转发用户的请求
        console.log('客户端链接: ' + s.remoteAddress + ':' + s.remotePort);

        if (!sock) {
            s.destroy();
            return;
        }

        // 保存socket链接
        var id = randomstring(8);
        connects[id] = s;

        // 发送open通知
        sock && sock.writable && sock.write(parseData.createBuffer(id, parseData.type.open));

        // 关闭时清除链接
        s.on('close', function() {
            console.log('客户端断开链接!');
            sock && sock.writable && sock.write(parseData.createBuffer(id, parseData.type.close));
        });
        // 收到数据时转发
        s.on('data', function(d) {
            // console.log('从客户端接受到数据');
            process.stdout.write('.');
            sock && sock.writable && sock.write(parseData.createBuffer(id, parseData.type.data, d));
        });

    }).listen(P, HOST);


    ///////////////////////////////////////////////////
    console.log('CLIENT CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
    // 为这个socket实例添加一个"data"事件处理函数
    sock.on('data', function(buffer) {
        // console.log('从be-tunnel收到数据: ' + data.length + ' byte');
        // 收到be-tunnel客户端数据，回转给客户端
        var objectArray = parseData.parseBuffer(buffer);
        for (var i = 0; i < objectArray.length; i++) {
            // 遍历处理所有数据包
            var object = objectArray[i];
            var s = connects[object.id];
            s.write(object.data);
        }
    });

    // 为这个socket实例添加一个"close"事件处理函数
    sock.on('close', function() {
        console.log('be-tunnel客户端断开');

        // 销毁客户端服务器
        client.close();
        client = null;

        // 清理所有链接
        for(var id in connects){
            connects[id].destroy();
        }
        connects = [];
    });

}).listen(PORT, HOST);

console.log('Server listening on ' + HOST +':'+ PORT);
