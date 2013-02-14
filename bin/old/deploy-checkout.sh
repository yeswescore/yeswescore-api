#!/bin/sh

# verifying parameters
if [ $# -ne 1 ]
then
  echo "usage : ./deploy-checkout.sh branch"
  exit 1
fi

# if not master, ask for confirmation
if [ "$1" != "master" ]
then
  echo "press Y to confirm you want to checkout '$1' [Y/N]"
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
git clone -b $1 git@github.com:syndr0m/yeswescore.git
# analysing result
if [ $? -eq 0 ]
then
  echo "branch $1 is deployed in ~/deploy/yeswescore/"
  echo "[CHECKOUT-OK]"
else
  echo "error during clone, abort."
  exit 1
fi
