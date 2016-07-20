# be-tunnel

Public your localhost service. A TCP tunnel.

# Usage

* server site

```
node server-site.js
```

* client site

```
node client-site.js \
--tunnel-host <YOUR_SERVER_NAME> \
--backend-host localhost \
--backend-port 80 \
--service-port 3000
```

* other net work

```
curl http://<YOUR_SERVER_NAME>:3000
```

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
* UDP 协议支持