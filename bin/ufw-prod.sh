#!/bin/sh

echo "unused, please do it manually"
exit; 

# Firewall
# ssh to everyone
# ufw allow 42/tcp
# ssh for dev host only
ufw allow from 91.121.184.177 to any port 42
# port 80 pour tout le monde
ufw allow proto tcp from any to any port 80
#
ufw enable