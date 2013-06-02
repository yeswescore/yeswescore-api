#!/bin/sh

mongo dev22222 --eval "db.dropDatabase()"
mongorestore --collection clubs --db dev22222 clubs.bson
mongorestore --collection games --db dev22222 games.bson
mongorestore --collection players --db dev22222 players.bson
