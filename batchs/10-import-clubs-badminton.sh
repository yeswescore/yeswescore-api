#!/bin/sh

echo -e "\033[32m"
echo "> Executing batch 02-import-clubs-badminton.sh"
echo -e "\033[0m"
echo " This batch will: "
echo "  - import all clubs from ../data/clubs/badminton/??.csv"
echo "  - create a new club if the club doesn't exist using fedid as primary key"
echo ""
# are we ok to continue ?
if [ "$AUTOEXEC" != "true" ]
then
  echo -n " Are you sure you want to continue [Y/n]: "
  read o
  if [ $o != "Y" ]
  then
    echo "bye bye"
    exit 1
  fi
fi

# are we in dev or in prod.
if [ "$NODE_ENV" = "PROD" ]
then
  echo " You are in prod environment, are you sure you want to import ?"
  export NODE_ENV="prod"
else
  export NODE_ENV="DEV"
  port=`cat ../server/.port | head -1`
  export YESWESCORE_PORT=$port
fi

# building csv
rnd=`echo $RANDOM`
cat ../data/clubs/badminton/??.csv | head -1 > /tmp/badminton/clubs-$rnd.csv
ls -1 ../data/clubs/badminton/??.csv | xargs -n 1 sed 1d >> /tmp/badminton/clubs-$rnd.csv

./02-import-clubs/import-badminton.js /tmp/badminton/clubs-$rnd.csv

if [ $? -eq 0 ]
then
  echo " Everything ok, removing /tmp/clubs-$rnd.csv"
  rm /tmp/badminton/clubs-$rnd.csv
else
  echo " Error => do not remove /tmp/clubs-$rnd.csv"
fi
