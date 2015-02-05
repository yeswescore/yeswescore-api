#!/bin/sh

# shared
. ./shared.sh

#
print -e "\033[32m"
print "> Executing batch 05-compute-streamCommentsSize.sh"
print -e "\033[0m"
print -e -n "\033[1;31;40m" 
print -n " WARNING: "
print -e -n "\033[0m"
print "This script will update data in the database"

if [ "$AUTOEXEC" != "true" ]
then
  print -n " Are you sure you want to continue [Y/n]: "
  read o
  # are we ok to continue ?
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
    print " You are in prod environment, you cannot generate"
    export NODE_ENV="PROD"
    logfile='/var/log/yeswescore-cron/compute-streamCommentsSize.log'
  else
    export NODE_ENV="DEV"
    port=`cat ../server/.port | head -1`
    export YESWESCORE_PORT=$port
    logfile='/home/'$USER'/tmp/yeswescore-cron/compute-streamCommentsSize.log'
  fi
else
  # cloud9
  export NODE_ENV="DEV"
  export YESWESCORE_PORT=$PORT
  logfile='/home/'$USER'/tmp/yeswescore-cron/compute-streamCommentsSize.log'
fi

./05-compute-streamCommentsSize/compute.js 2>&1 | tee -a $logfile