#!/bin/sh

sudo rsync -rltov --del --ignore-errors --force -e 'ssh -p 42' ~/git/yeswescore/server root@188.165.247.143:42/opt/web/yeswescore/server/