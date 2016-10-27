#!/bin/sh
#

PORT=8080

docker run -d \
--restart=always \
--name=betunnel-server \
-e PORT=$PORT \
-p $PORT=$PORT \
betunnel-server

