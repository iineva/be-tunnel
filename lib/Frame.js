

// Frame define:
// buffer[0-1]   : header, 0xFE88
// buffer[2-3]   : type [0x01 = open, 0x02 = close, 0x03 = data, 0x04 = register
// buffer[4-7]   : frame count
// buffer[8-9]   : client ID, UInt16
// buffer[10-13] : user ID, UInt32
// buffer[14-17] : if type=0x03, data length
// buffer[18-x]  : if type=0x03, data content, if type=0x04 register json content

module.exports = class Frame {

  // 帧类型
  static get Type() {
    return {
      open     : 0x01, // 开启链接
      close    : 0x02, // 关闭链接
      data     : 0x03, // 转发数据包
      register : 0x04, // 注册服务 (通知服务器，后端服务的信息，并注册前端端口)
    };
  }

  // frame value offset
  static get Offset() {
    return {
      header   : 0,
      type     : 2,
      count    : 4,
      clientId : 8,
      userId   : 10,
      length   : 14,
      data     : 18,
    };
  }

  // 帧头
  static get Header() { return 0xFE88; }

  // 最小帧大小（无data时）
  static get MinFrameLength() { return 18; }

  // 构造
  constructor(type = undefined, clientId = 0, userId = 0, data = undefined) { // 构造函数
    if (typeof type === 'number') {
      this.count = 0;
      this.type = type;
      if (typeof clientId === 'object') {
        this.data = clientId;
      } else {
        this.clientId = clientId;
      }
      this.userId = userId;
      if (!this.data && data) {
        this.data = data;
      }
    } else {
      // init with buffer
      this.initWithBuffer(type);
    }
  }

  initWithBuffer(buffer) { // 通过Buffer构造一个Frame
    
    // check header
    if ( buffer.length < Frame.MinFrameLength ) {
      console.error('Error Frame Buffer Size!');
      return null;
    }
    if (buffer.readUInt16BE(0) != Frame.Header) {
      console.error('Error Frame Header!');
      return null;
    }

    this.clientId = buffer.readUInt16BE(Frame.Offset.clientId);
    this.userId   = buffer.readUInt32BE(Frame.Offset.userId)
    this.type     = buffer.readUInt16BE(Frame.Offset.type);
    this.count    = buffer.readUInt32BE(Frame.Offset.count);

    switch (this.type) {
      case Frame.Type.data: { // 截取转发的数据包
        this.length = buffer.readUInt32BE(Frame.Offset.length);
        this.data   = buffer.slice(Frame.MinFrameLength, Frame.MinFrameLength + this.length);
        break;
      }
      case Frame.Type.register: { // 解析注册信息
        this.length    = buffer.readUInt32BE(Frame.Offset.length);
        let jsonBuffer = buffer.slice(Frame.MinFrameLength, Frame.MinFrameLength + this.length);
        this.data      = JSON.parse(jsonBuffer);
        break;
      }
    }
  }

  get buffer() {
    
    let size = Frame.MinFrameLength;

    let buffer = new Buffer(size);

    // set frame header
    buffer.writeUInt16BE(Frame.Header, Frame.Offset.header);
    
    // set frame type
    buffer.writeUInt16BE(this.type, Frame.Offset.type);

    // set frame count
    buffer.writeUInt32BE(this.count, Frame.Offset.count);

    // set data frame id
    buffer.writeUInt16BE(this.clientId, Frame.Offset.clientId);
    buffer.writeUInt32BE(this.userId, Frame.Offset.userId);

    // store data
    switch (this.type) {
      case Frame.Type.data: { // 截取转发的数据包
        buffer.writeUInt32BE(this.data.length, Frame.Offset.length);
        buffer = Buffer.concat([buffer, this.data]);
        break;
      }
      case Frame.Type.register: { // 解析注册信息
        let jsonBuffer = new Buffer(JSON.stringify(this.data));
        buffer.writeUInt32BE(jsonBuffer.length, Frame.Offset.length);
        buffer = Buffer.concat([buffer, jsonBuffer]);
        break;
      }
      default: {
        buffer.writeUInt32BE(0, Frame.Offset.length);
        break;
      }
    }

    return buffer;
  }
}
