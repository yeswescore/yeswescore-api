#!/bin/sh

# shared
. ./shared.sh

print "setuping c9.io environment for ya :)"

mkdir /home/$USER/tmp
mkdir /home/$USER/tmp/yeswescore-cron/
mkdir /home/$USER/tmp/yeswescore-api/
mkdir /home/$USER/tmp/yeswescore-www/
mkdir /home/$USER/tmp/yeswescore-proxy/

mkdir /home/$USER/mongo

# @see https://docs.c9.io/setting_up_mongodb.html
echo 'mongod --bind_ip=$IP --dbpath=/home/'$USER'/mongo --nojournal --rest "$@"' > /home/$USER/mongod
chmod a+x /home/$USER/mongod

echo "you can now start mongo using : /home/$USER/mongod"

