#!/bin/sh

echo -e "\033[32m"
echo "> Executing batch 01-generate-fake-data.sh"
echo -e "\033[0m"
echo -e -n "\033[1;31;40m" 
echo -n " WARNING: "
echo -e -n "\033[0m"
echo "This script will generate fake data in the database"

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
prod=`ifconfig 2>/dev/null | grep "91.121.184.177" |wc -l`

if [ $prod -eq 1 ]
then
  echo " You are in prod environment, you cannot generate"
  export NODE_ENV="PROD"
  # FIXME: security temporary disabled.
  # exit 1
else
  export NODE_ENV="DEV"
  port=`cat ../server/.port | head -1`
  export ZESCORE_PORT=$port
fi

./01-generate-fake-data/generate.js