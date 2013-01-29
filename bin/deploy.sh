#!/bin/sh

# verifying parameters
if [ $# -ne 1 ]
then
  echo "usage : ./deploy.sh branch"
  exit 1
fi

# if not master, ask for confirmation
if [ "$1" != "master" ]
then
  echo "press Y to confirm you want to checkout branch '$1' [Y/N]"
  read y
  if [ $y = "Y" ]
  then
    echo "confirmed"
  else
    echo "canceled"
    exit 1
  fi
fi

# start checkout
echo "checkouting $1"
# cleaning deploy directory
rm -rf ~/deploy/
mkdir ~/deploy/
cd ~/deploy/
# grabbing code from github
git clone -b $1 git@github.com:syndr0m/zescore.git
# analysing result
if [ $? -eq 0 ]
then
  echo "branch $1 is deployed in ~/deploy/zescore/"
else
  echo "error during clone, abort."
  exit 1
fi

# rsync
echo "sending code to integration environment"
sudo rsync -rltov --del --ignore-errors --force -e 'ssh -p 42' zescore/server /opt/web/zescore/
echo "sending code to prod server"
sudo rsync -rltov --del --ignore-errors --force -e 'ssh -p 42' zescore/server root@188.165.247.143:/opt/web/zescore/