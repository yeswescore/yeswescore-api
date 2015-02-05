#!/bin/sh

# shared
. ../batchs/shared.sh

#
BASEDIR=$(dirname $0)
cd $BASEDIR;

# are we in dev or in prod.
if [ "$NODE_ENV" = "PROD" ]
then
  print "you are in prod environment, you cannot launch the server using ./dev.sh"
  exit 1
fi


resetdb="Y"
if [ ! -z "$C9_UID" ]
then
  # cloud9 only
  print -n " Are you sure you want to generate data ? [Y/n]: "
  read resetdb
  # are we ok to continue
fi

# reset the db
if [ $resetdb = "Y" ]
then
  export AUTOEXEC="true"
  oldPath=`pwd`
  cd ../batchs;
  ./00-reset-db.sh
  # generate fake data
  ./01-generate-fake-data.sh
  # import clubs
  # ./02-import-clubs.sh # disabled, too long in dev :)
  cd $oldPath;
fi

export NODE_ENV="DEV"

if [ ! -z "$C9_UID" ]
then
  port=$PORT
  fbport=4242  # fake
  wwwport=4243 # fake
fi

if [ -f ".port" ]
then
  port=`cat .port | head -1`
  fbport=`cat ../../yeswescore-facebook/server/.port`
  wwwport=`cat ../../yeswescore-www/server/.port`
fi

if [ -z "$port" ]
then
  print "  Please create .port file containing port number "
  print "  Exemple:  echo \"15123\" > .port "
  exit
fi

print ""
print "using port number $port from file .port for api"
print "using port number $fbport from file .port for fb"
print "using port number $wwwport from file .port for www"
print "mongo db will be dev$port"
export YESWESCORE_PORT=$port
export YESWESCORE_FACEBOOK_PORT=$fbport
export YESWESCORE_WWW_PORT=$wwwport
if [ "$1" = "debug" ]
then
  print "debug mode activated"
  print " please launch 'node-inspector' to debug."
  node --debug server.js
else
  print "to debug, use> ./dev.sh debug"
  print "to nohup, use> ./dev.sh nohup"
  node server.js
fi