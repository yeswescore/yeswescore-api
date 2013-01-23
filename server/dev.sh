#!/bin/sh

export NODE_ENV="DEV"
if [ "$1" = "debug" ]
then
  node --debug server.js
else
  node server.js
fi