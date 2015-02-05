#!/bin/sh

# cloud9 specific
print() { if [ -z "$C9_UID" ]; then echo $*; else /bin/echo $*; fi }
