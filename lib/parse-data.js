/**
 *  解析多个Json组合成的数据
 */

// 协议:
// buffer[0] : header, 0xFE
// buffer[1] : header, 0x88
// buffer[2-9] : id, utf8 string
// buffer[10] : action [0x01 = open, 0x02 = close, 0x03 = data, 0x04 = register
// buffer[11-14] : if action=0x03, data length
// buffer[15-x] : if action=0x03, data content, if action=0x04 register json content


var header = 0xFE88;
var type = {
    open     : 0x01, // 开启链接
    close    : 0x02, // 关闭链接
    data     : 0x03, // 转发数据包
    register : 0x04, // 注册服务 (通知服务器，后端服务的信息，并注册前端端口)
};
var bufferCache = []; // 包不足够长的，缓存

/**
 * 创建要发送的数据buffer
 */
function createBuffer(id, action, data) {
    var size = 11 + (data?4:0);
    var buffer = new Buffer(size);
    buffer.writeUInt16BE(header, 0);
    id && buffer.write(id, 2, 8, 'utf8');
    buffer.writeUInt8(action, 10);
    switch (action) {
        case type.data: { // 截取转发的数据包
            buffer.writeUInt32BE(data.length, 11);
            buffer = Buffer.concat([buffer, data]);
            break;
        }
        case type.register: { // 解析注册信息
            var jsonBuffer = new Buffer(JSON.stringify(data));
            buffer.writeUInt32BE(jsonBuffer.length, 11);
            buffer = Buffer.concat([buffer, jsonBuffer]);
            break;
        }
    }
    return buffer;
}

/**
 * 解析收到的数据(一个数据包内可能有多个数据帧，所以解析成数组)
 * return [object]
 */
function parseBuffer(buffer) {
    var bufferArray = parseBufferToBufferArray(buffer);
    var objectArray = [];
    for (var i=0; i < bufferArray.length; i++) {
        objectArray.push(parseOneBuffer(bufferArray[i]));
    }
    return objectArray;
}

/**
 * 解析一个数据包
 */
function parseOneBuffer(buffer) {
    var obj = {
        id: buffer.toString('utf8', 2, 10),
        action: buffer.readUInt8(10),
    };
    switch (obj.action) {
        case type.data: { // 截取转发的数据包
            obj.dataLength = buffer.readUInt32BE(11);
            obj.data = buffer.slice(15, 15 + obj.dataLength);
            break;
        }
        case type.register: { // 解析注册信息
            obj.dataLength = buffer.readUInt32BE(11);
            var jsonBuffer = buffer.slice(15, 15 + obj.dataLength);
            obj.data = JSON.parse(jsonBuffer);
            break;
        }
    }
    return obj;
}

/**
 * 根据数据头截断数据包
 * return [Buffer]
 */
function parseBufferToBufferArray(buffer) {

    if (bufferCache.length) {
        // 上次有缓存，拼接后处理
        bufferCache.push(buffer);
        buffer = Buffer.concat(bufferCache);
        bufferCache = [];
    }

    // 计算数据包长度是否合适
    if (buffer.length < 11) {
        return [];
    }
    var length = 11;
    var action = buffer.readUInt8(10);
    switch (action) {
        case type.data:
        case type.register: {
            if (buffer.length < 15) {
                return [];
            }
            length = 15 + buffer.readUInt32BE(11);
            break;
        }
    }
    if (buffer.length < length) {
        // 缓存不足够长的包
        bufferCache.push[buffer];
        return [];
    }

    // 检测数据头
    if (buffer.readUInt16BE(0) !== header) {
        console.log('❌数据头错误 : parseBufferToBufferArray : ', buffer);
        return [];
    }
    
    var bufferArray = [buffer.slice(0, length)];
    var otherBuffer = [];
    if (buffer.length > length) {
        // 截取后面的数据包
        return parseBufferToBufferArray(buffer.slice(length, buffer.length - length));
    }

    for (var i=0; i < otherBuffer.length; i++) {
        // 合并多个数据包
        bufferArray.push( otherBuffer[i] );
    }
    return bufferArray;
}

module.exports.type = type;
module.exports.header = header;
module.exports.createBuffer = createBuffer;
module.exports.parseBuffer = parseBuffer;