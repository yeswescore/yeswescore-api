zescore
=======

Server install

# install mongo
apt-get install mongodb
# install node
sudo apt-get install python-software-properties python g++ make
sudo apt-get install software-properties-common
sudo add-apt-repository ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install nodejs npm
# install git
apt-get install git
# clone du projet
git clone https://github.com/syndr0m/zescore.git
# install des modules necessaires pour le projet
cd zescore
npm install -l
