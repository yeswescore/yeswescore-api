#!/bin/bash

# shared
. ./shared.sh

#
BASEDIR=$(dirname $0)

if [ $# -eq 1 ]
then
  database=$1
else
  database="test"
fi

# minimum of security
if [ "$NODE_ENV" = "PROD" ]
then
  print " You are in prod environment, you cannot dump the DB."
  exit 1
fi

if [ "$database" = "" ]
then
  print "database name cannot be empty string"
  exit 1
fi

if [ "$database" = "prod" ]
then
  print "cannot import 'prod' into 'prod'"
  exit 1
fi

# this question can be skipped programaticaly
if [ "$AUTOEXEC" != "true" ]
then
  print    "Importing 'prod' database into '"$database"'"
  print -n " Are you sure you want to continue [Y/n]: "
  read o
  # are we ok to continue ?
  if [ $o != "Y" ]
  then
    print "bye bye"
    exit 1
  fi
fi

# IMPORTING MONGO PROD DATA.
cd /data/backup/
latest=`ls -1tr | tail -1`
mkdir -p ~/tmp/prod_db_dump/
cp $latest ~/tmp/prod_db_dump/
cd ~/tmp/prod_db_dump
rm -rf ~/tmp/prod_db_dump/dump/
tar -xvjf $latest

# restoring collections
mongo $database --eval 'db.clubs.remove()'
mongo $database --eval 'db.games.remove()'
mongo $database --eval 'db.files.remove()'
mongo $database --eval 'db.players.remove()'
mongorestore --collection clubs --db $database dump/prod/clubs.bson
mongorestore --collection games --db $database dump/prod/games.bson
mongorestore --collection files --db $database dump/prod/files.bson
mongorestore --collection players --db $database dump/prod/players.bson

# FIXME:
# - redirect prod emails domain to yeswescore domain
# - remove prod mobile phone tokens
# - import pictures

