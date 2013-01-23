#!/bin/sh

sudo rsync -rltov --del --ignore-errors --force -e 'ssh -p 42' ~/git/zescore/server root@188.165.247.143:42/opt/web/zescore/server/