var net = require('net');

// be-tunnel server site
var HOST = '127.0.0.1';
var PORT = 3001;

// target site
var T_HOST = 'www.ineva.cn';
var T_PORT = '22';

var client = new net.Socket();
var target = []; // target socket
client.connect(PORT, HOST, function() {

    console.log('CONNECTED TO be-tunnel SERVER: ' + HOST + ':' + PORT);

    // 为客户端添加“data”事件处理函数
	// data是服务器发回的数据
    client.on('data', function(data) {

        // console.log('从be-tunnel收到数据: ' + data.length + ' byte');

        var data = JSON.parse(data);
        var id = data.id;

        switch (data.action) {
            case 'open': {

				/*
					data.action = 'open'
					data.id = xxx
				*/
                console.log('收到连接通知：' + data.id);
                var s = new net.Socket();
                target[id] = s;
                s.connect(T_PORT, T_HOST, function() {
                    s.on('close', function() {
                        console.log('连接关闭: ' + id);
                        s.destroy();
                        delete target[id];
                    });
                    s.on('data', function(d) {
                        // 收到目标服务反回的数据
                        // console.log('收到目标服务反回的数据');
                        console.log('.');
                        client.write(JSON.stringify({
                            'id': id,
                            'action': 'data',
                            'data': d.toString("base64")
                        }));
                    });
                });
                break;
            }
			case 'close': {
                /*
                    data.action = 'close'
                    data.id = xxx
                */
                var s = target[id];
                if (s) {
                    s.destroy();
                    delete target[id];
                }
                break;
            }
            case 'data': {
                /*
                    data.action = 'data'
                    data.id = xxx
                    data.data
                */
                var s = target[id];
                if (s) {
                    var d = new Buffer(data.data, 'base64');
                    s.write(d);
                }
                break;
			}
		}

	    // console.log('DATA: ' + data);
	    // 完全关闭连接

	});

	// 为客户端添加“close”事件处理函数
	client.on('close', function() {
        console.log('Connection closed');
        for(var id in target){
            target[id].destroy();
        }
        target = [];
	});

});
