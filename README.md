# betunnel

Base on <https://github.com/sstur/node-websocket-tunnel>

user <--> node-websocket-tunnel（client）<--> node-websocket-tunnel（server）<--> shadowsock server

# Usage

* Server

```
PORT=8080 docker run -d \
--restart=always \
--name=betunnel-server \
-e PORT=$PORT \
-p $PORT=$PORT \
ineva/be-tunnel-server
```

* Client

if https SERVER_NAME = wss://<HOST_NAME>
if http  SERVER_NAME =  ws://<HOST_NAME>

```
docker run -d \
--restart=always \
--name=betunnel-client \
-e SERVER=<SERVER_NAME> \
-e LISTEN=8388 \
-e FORWARD=8388 \
-p 8389:8388 \
ineva/be-tunnel-client
```