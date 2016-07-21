
const Frame = require('./Frame');

module.exports = class FrameBuffer {
    
  constructor() {
    this.buffer = new Buffer(0);
  }
  
  // add buffer to cache to parse
  addBuffer(buffer) {
    this.buffer = Buffer.concat([this.buffer, buffer]);
  }

  // parse Frame from buffer
  getFrames() {

    let offset = 0;
    let frames = [];

    while( (this.buffer.length-offset) >= Frame.MinFrameLength ) {

      // 找数据包头
      if (this.buffer.readUInt16BE(offset) === Frame.Header) {
        
        // 检测数据包基本信息
        let type      = this.buffer.readUInt16BE( offset + Frame.Offset.type );
        let length    = this.buffer.readUInt32BE( offset + Frame.Offset.length );
        let endOffset = offset + Frame.MinFrameLength;
        
        switch (type) {
            case Frame.Type.data:
            case Frame.Type.register: {
                endOffset += length;
                if (endOffset > this.buffer.length) {
                  // 帧长度不足，跳出循环，丢弃offset之前的数据，保留剩下的数据
                  break;
                }
                break;
            }
        }

        // 解析buffer中的frame
        frames.push( new Frame(this.buffer.slice(offset, endOffset)) );

        // 初始化下次解析的变量
        offset = 0;
        this.buffer = this.buffer.slice(endOffset, this.buffer.length);
      } else {
        // 没找到帧头，继续偏移
        process.stdout.write('-');
        offset++;
      }
    }

    if (offset > 0) {
      // 清空已经解析过的数据  
      this.buffer = this.buffer.slice(offset, this.buffer.length);
    }

    return frames;
  }
}