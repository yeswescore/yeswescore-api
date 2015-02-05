#!/bin/sh

# shared
. ./shared.sh

#
print -e "\033[32m"
print "> Executing batch 04-finishing-games.sh"
print -e "\033[0m"
print " This batch will: "
print "  - close all games opened for more than 24h"
print ""

BASEDIR=$(dirname $0)
cd $BASEDIR;

# are we ok to continue ?
if [ "$AUTOEXEC" != "true" ]
then
  print -n " Are you sure you want to continue [Y/n]: "
  read o
  if [ $o != "Y" ]
  then
    print "bye bye"
    exit 1
  fi
fi

# are we using cloud 9 ?
if [ -z "$C9_UID" ]
then
  # are we in dev or in prod.
  if [ "$NODE_ENV" = "PROD" ]
  then
    export NODE_ENV="prod"
    dbname="prod"
    logfile='/var/log/yeswescore-cron/finishing-games.log'
  else
    export NODE_ENV="DEV"
    port=`cat ../server/.port | head -1`
    export YESWESCORE_PORT=$port
    dbname="dev"$port
    logfile='/home/'$USER'/tmp/yeswescore-cron/finishing-games.log'
  fi
else
  # cloud9
  export NODE_ENV="DEV"
  export YESWESCORE_PORT=$PORT
  dbname="dev"$PORT
  logfile='/home/'$USER'/tmp/yeswescore-cron/finishing-games.log'
fi

# on log la fermeture des games
# pour pouvoir eventuellement faire un rollback !
print "*************** FINISHING GAMES ****************** " >> $logfile
date >> $logfile
print "**************************************************" >> $logfile
mongo $dbname --eval 'db.games.find({status:"ongoing", "dates.creation": { $lt: new Date(Date.now() - 24 * 3600 * 1000) }}).forEach(function (g) { printjson(g); })' 2>&1 >> $logfile
print "**************************************************" >> $logfile
mongo $dbname --eval 'db.games.update({status:"ongoing", "dates.creation": { $lt: new Date(Date.now() - 24 * 3600 * 1000) }},{ $set : { "dates.end": new Date(), "status" : "finished" } }, false, true)' 2>&1 >> $logfile