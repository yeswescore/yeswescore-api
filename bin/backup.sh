#!/bin/sh

# backup
sudo ssh -p 42 188.165.247.143 'cd /data/backup/; mongodump; now=`date +%Y-%m-%d_%H-%M-%S`; tar -jcvf dump.prod.$now.bz2 dump; rm -rf /data/backup/dump'
# rsync
sudo rsync -rltov --del --ignore-errors --force -e 'ssh -p 42' root@188.165.247.143:/data/backup/ /data/backup/
