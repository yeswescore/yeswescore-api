#!/bin/sh

function usage()
{
  echo ""
  echo "error: "$1
  echo ""
  echo "usage: ./02-import-clubs.sh"
  echo " ( You must put clubs.csv in ./02-import-clubs/ )"
  echo ""
}

echo "Executing batch 02-import-clubs.sh"
echo "This batch will: "
echo "  - import all clubs from 02-import-clubs/clubs.csv"
echo "  - create a new club if the club doesn't exist using fedid as primary key"
echo ""
echo -n "Are you sure you want to continue [Y/n]: "
read o
# are we ok to continue ?
if [ $o != "Y" ]
then
  echo "bye bye"
  exit 1
fi

# are we in dev or in prod.
prod=`ifconfig 2>/dev/null | grep "91.121.184.177" |wc -l`

if [ $prod -eq 1 ]
then
  echo "you are in prod environment, are you sure you want to import ?"
  export NODE_ENV="prod"
else
  port=`cat ../server/.port | head -1`
  export ZESCORE_PORT=$port
  echo -n "using port number $port, is it ok ? [Y/n]"
  read o
  # are we ok to continue ?
  if [ $o != "Y" ]
  then
    echo "bye bye"
    exit 1
  fi
fi

# building csv
sudo rm -f /tmp/clubs.csv
cat ../data/clubs/*.csv | head -1 > /tmp/clubs.csv
ls -1 ../data/clubs/*.csv | xargs -n 1 sed 1d >> /tmp/clubs.csv

./02-import-clubs/import.js
