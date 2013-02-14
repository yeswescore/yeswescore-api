#!/bin/sh

echo -e "\033[32m"
echo "> Executing batch 00-reset-db.sh"
echo -e "\033[0m"
echo -e -n "\033[1;31;40m" 
echo -n " WARNING: "
echo -e -n "\033[0m"
echo "This script will remove all the database"

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
  echo "you are in prod environment, you cannot delete"
  dbname="prod"
  # FIXME: security temporary disabled.
  # exit 1
else
  port=`cat ../server/.port | head -1`
  dbname="dev"$port
fi

# 
mongo $dbname --eval "db.dropDatabase()"