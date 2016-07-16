# be-tunnel

# 基本原理

user <------> be-tunnel server <-------> be-tunnel client <---------> target server

# 同理，可以暴露localhost端口给外部访问

user <----> be-tunnel server (Public net) <----> be-tunnel client (localhost) <----> local server

# 链接时序

```
user --> be-tunnel server              target service
            |                           /\
            | port to client id          | port to target service
            \/                           |
         client id -----------------> be-thunnel client
```

# TODO

* 通道之间的数据使用加密算法加密
* BUG : 数据包比较大时，连接会断开