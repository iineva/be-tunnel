/**
 *  解析多个Json组合成的数据
 */

// 协议:
// buffer[0] : header, 0xFE
// buffer[1] : header, 0x88
// buffer[2-9] : id, utf8 string
// buffer[10] : action [0x01 = open, 0x02 = close, 0x03 = data
// buffer[11-14] : if action=0x03, data length
// buffer[15-x] : if action=0x03, data content

var header = 0xFE88;
var type = {
    open: 0x01,
    close: 0x02,
    data: 0x03,
};

/**
 * 创建要发送的数据buffer
 */
function createBuffer(id, action, dataBuffer) {
    var size = 11 + (dataBuffer?4:0);
    var buffer = new Buffer(size);
    buffer.writeUInt16BE(header, 0);
    buffer.write(id, 2, 8, 'utf8');
    buffer.writeUInt8(action, 10);
    if (action === type.data) {
        buffer.writeUInt32BE(dataBuffer.length, 11);
        buffer = Buffer.concat([buffer, dataBuffer]);
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
    if (obj.action === type.data) {
        obj.dataLength = buffer.readUInt32BE(11);
        obj.data = buffer.slice(15, 15 + obj.dataLength);
    }
    return obj;
}

/**
 * 根据数据头截断数据包
 * return [Buffer]
 */
function parseBufferToBufferArray(buffer) {
    // 计算数据包长度是否合适
    if (buffer.length < 11) {
        return [];
    }
    var length = 11;
    var action = buffer.readUInt8(10);
    if (action === type.data) {
        if (buffer.length < 15) {
            return [];
        }
        length = 15 + buffer.readUInt32BE(11);
    }
    if (buffer.length < length) {
        return [];
    }

    // 检测数据头
    if (buffer.readUInt16BE(0) !== header) {
        console.log('❌数据头错误 : parseBufferToBufferArray')
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