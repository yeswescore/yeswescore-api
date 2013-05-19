#!/bin/bash

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

echo -n "Nombre de players : "
mongo $dbname --quiet --eval 'printjson(db.players.find({ "dates.creation": { $gte: ISODate("2013-05-12T00:00:00.000Z") } }).count())'

echo -n "Nombre de players ayant un nom : "
mongo $dbname --quiet --eval 'printjson(db.players.find({ "dates.creation": { $gte: ISODate("2013-05-12T00:00:00.000Z") }, "name": { $ne: "" } }).count())'

echo -n "Nombre de players ayant un email: "
mongo $dbname --quiet --eval 'printjson(db.players.find({ "dates.creation": { $gte: ISODate("2013-05-12T00:00:00.000Z") }, "email": { $ne: undefined } }).count())'

echo "Liste des emails: "
mongo $dbname --quiet --eval 'db.players.find({ "dates.creation": { $gte: ISODate("2013-05-12T00:00:00.000Z") }, email: { $ne: undefined } }, { "dates.creation": 1, "email.address": 1, "email.status": 1,  _id: 0 }).forEach(function (o) { print(tojson(o, "", true)); })'
