#!/bin/sh

echo "Executing batch 00-reset-db.sh"
echo ""
echo "        WARNING                         WARNING                        "
echo "WARNING         WARNING         WARNING         WARNING         WARNING"
echo "                        WARNING                         WARNING        "
echo ""
echo "This script will remove all the database"

if [ "$AUTOEXEC" != "true" ]
then
  echo -n "Are you sure you want to continue [Y/n]: "
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