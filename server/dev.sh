#!/bin/sh

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