#!/bin/sh

# shared
. ./shared.sh

#
print -e "\033[32m"
print "> Executing batch 02-import-clubs-tennis.sh"
print -e "\033[0m"
print " This batch will: "
print "  - import all clubs from ../data/clubs/tennis/??.csv"
print "  - create a new club if the club doesn't exist using fedid as primary key"
print ""
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
    print " You are in prod environment, are you sure you want to import ?"
    export NODE_ENV="prod"
  else
    export NODE_ENV="DEV"
    port=`cat ../server/.port | head -1`
    export YESWESCORE_PORT=$port
  fi
else
  # cloud9
  export NODE_ENV="DEV"
  export YESWESCORE_PORT=$PORT
fi

# building csv
rnd=`echo $RANDOM`
cat ../data/clubs/tennis/??.csv | head -1 > /tmp/tennis/clubs-$rnd.csv
ls -1 ../data/clubs/tennis/??.csv | xargs -n 1 sed 1d >> /tmp/tennis/clubs-$rnd.csv

./02-import-clubs/import-tennis.js /tmp/tennis/clubs-$rnd.csv

if [ $? -eq 0 ]
then
  print " Everything ok, removing /tmp/clubs-$rnd.csv"
  rm /tmp/tennis/clubs-$rnd.csv
else
  print " Error => do not remove /tmp/clubs-$rnd.csv"
fi
