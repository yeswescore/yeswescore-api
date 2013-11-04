#!/bin/bash

BASEDIR=$(dirname $0)

# IMPORTING MONGO PROD DATA.
cd /data/backup/
latest=`ls -1tr | tail -1`
mkdir -p ~/tmp/stats/
cp $latest ~/tmp/stats/
cd ~/tmp/stats
rm -rf ~/tmp/stats/dump/
tar -xvjf $latest
# restoring collections
mongo stats --eval 'db.clubs.remove()'
mongo stats --eval 'db.games.remove()'
mongo stats --eval 'db.files.remove()'
mongo stats --eval 'db.players.remove()'
mongorestore --collection clubs --db stats dump/prod/clubs.bson
mongorestore --collection games --db stats dump/prod/games.bson
mongorestore --collection files --db stats dump/prod/files.bson
mongorestore --collection players --db stats dump/prod/players.bson
# IMPORTING PROD STATS
#sudo rsync -rltov -e 'ssh -p 42' root@188.165.247.143:/var/log/yeswescore-api/stats.log ~/tmp/stats/
cp /var/log/yeswescore-api/stats.log ~/tmp/stats/
cat stats.log | cut -c 7- > stats.csv
# processing data with node
#cd $BASEDIR;
#node process.js
