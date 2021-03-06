#!/bin/sh

# shared
. ./shared.sh

#
print -e "\033[32m"
print "> Executing batch 00-reset-db.sh"
print -e "\033[0m"
print -e -n "\033[1;31;40m" 
print -n " WARNING: "
print -e -n "\033[0m"
print "This script will remove all the database"

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
    print "you are in prod environment, you cannot delete"
    dbname="prod"
    # FIXME: security temporary disabled.
    exit 1
  else
    port=`cat ../server/.port | head -1`
    dbname="dev"$port
  fi
else
  # cloud9
  dbname="dev"$PORT
fi

# 
mongo $dbname --eval "db.dropDatabase()"