#!/bin/sh
#

docker run -d \
--restart=always \
--name=betunnel-client \
-e SERVER='wss://ubuntu-workspace-iineva.c9users.io' \
-e LISTEN=8388 \
-e FORWARD=8388 \
-p 8389:8388 \
ineva/be-tunnel-client

