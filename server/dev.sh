#!/bin/sh

BASEDIR=$(dirname $0)
cd $BASEDIR;

# are we in dev or in prod.
prod=`ifconfig 2>/dev/null | grep "91.121.184.177" |wc -l`

if [ $prod -eq 1 ]
then
  echo "you are in prod environment, you cannot launch the server using ./dev.sh"
  exit 1
fi

# reset the db
export AUTOEXEC="true"
oldPath=`pwd`
cd ../batchs;
./00-reset-db.sh
# generate fake data
./01-generate-fake-data.sh
# import clubs
./02-import-clubs.sh
cd $oldPath;

export NODE_ENV="DEV"
if [ -f ".port" ]
then
  port=`cat .port | head -1`
  echo "using port number $port from file .port"
  echo "mongo db will be dev$port"
  export ZESCORE_PORT=$port
  if [ "$1" = "debug" ]
  then
    echo "debug mode activated"
    node --debug server.js
  else
    node server.js
  fi
else
  echo "  Please create .port file containing port number "
  echo "  Exemple:  echo \"15123\" > .port "
fi