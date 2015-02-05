#!/bin/sh

# shared
. ./shared.sh

#
print -e "\033[32m"
print "> Executing batch 02-import-clubs.sh"
print -e "\033[0m"
print " This batch will: "
print "  - import all clubs from ../data/clubs/??.csv"
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
  export NODE_ENV="DEV"
  export YESWESCORE_PORT=$PORT
fi

# building csv
rnd=`echo $RANDOM`
cat ../data/clubs/??.csv | head -1 > /tmp/clubs-$rnd.csv
ls -1 ../data/clubs/??.csv | xargs -n 1 sed 1d >> /tmp/clubs-$rnd.csv

./02-import-clubs/import.js /tmp/clubs-$rnd.csv

if [ $? -eq 0 ]
then
  print " Everything ok, removing /tmp/clubs-$rnd.csv"
  rm /tmp/clubs-$rnd.csv
else
  print " Error => do not remove /tmp/clubs-$rnd.csv"
fi
