/**
 * be-tunnel server site
 */

var net = require('net');
var randomstring = require('random-string');
var parseData = require('./parse-data');

module.exports = function createServer(tunnel_host, tunnel_port, server_host, server_port) {

    var connects = []; // 保存链接
    var client = null; // 客户端服务器

    tunnel_host = tunnel_host || '127.0.0.1';
    tunnel_port = tunnel_port || 2121;
    server_host = server_host || '127.0.0.1';
    server_port = server_port || 80;

    // 启动be-tunnel服务
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

        }).listen(server_port, server_host);


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
                s && sock.writable && s.write(object.data);
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
                delete connects[id];
            }
        });

    }).listen(tunnel_port, tunnel_host);

    console.log('Server listening on ' + tunnel_host +':'+ tunnel_port);

}
