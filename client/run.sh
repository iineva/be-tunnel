#!/bin/sh
#

docker run -d \
--restart-always \
--net=host \
--name=betunnel-client \
-e SERVER='wss://ubuntu-workspace-iineva.c9users.io' \
-e LISTEN=8388 \
-e FORWARD=8388 \
betunnel-client