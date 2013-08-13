#!/bin/sh

echo -e "\033[32m"
echo "> Executing batch 06-compute-streamImagesSize.sh"
echo -e "\033[0m"
echo -e -n "\033[1;31;40m" 
echo -n " WARNING: "
echo -e -n "\033[0m"
echo "This script will update data in the database"

if [ "$AUTOEXEC" != "true" ]
then
  echo -n " Are you sure you want to continue [Y/n]: "
  read o
  # are we ok to continue ?
  if [ $o != "Y" ]
  then
    echo "bye bye"
    exit 1
  fi
fi

# are we in dev or in prod.
if [ "$NODE_ENV" = "PROD" ]
then
  echo " You are in prod environment, you cannot generate"
  export NODE_ENV="PROD"
  logfile='/var/log/yeswescore-cron/compute-streamImagesSize.log'
else
  export NODE_ENV="DEV"
  port=`cat ../server/.port | head -1`
  export YESWESCORE_PORT=$port
  logfile='/home/'$USER'/tmp/yeswescore-cron/compute-streamImagesSize.log'
fi

./05-compute-streamImagesSize/compute.js 2>&1 | tee $logfile