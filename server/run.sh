#!/bin/sh
#

docker run -d \
--restart-always \
--name=betunnel-server \
--net=host \
-e PORT=8080 \
betunnel-server