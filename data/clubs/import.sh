 #!/bin/sh
 
db="dev8080"
mongoimport -d $db -c clubs --type csv --file 01.csv --headerline
mongoimport -d $db -c clubs --type csv --file 03.csv --headerline
mongoimport -d $db -c clubs --type csv --file 04.csv --headerline
mongoimport -d $db -c clubs --type csv --file 07.csv --headerline
mongoimport -d $db -c clubs --type csv --file 08.csv --headerline
mongoimport -d $db -c clubs --type csv --file 09.csv --headerline
mongoimport -d $db -c clubs --type csv --file 11.csv --headerline
mongoimport -d $db -c clubs --type csv --file 12.csv --headerline
mongoimport -d $db -c clubs --type csv --file 15.csv --headerline
mongoimport -d $db -c clubs --type csv --file 19.csv --headerline
mongoimport -d $db -c clubs --type csv --file 20.csv --headerline
mongoimport -d $db -c clubs --type csv --file 24.csv --headerline
mongoimport -d $db -c clubs --type csv --file 25.csv --headerline
mongoimport -d $db -c clubs --type csv --file 26.csv --headerline
mongoimport -d $db -c clubs --type csv --file 28.csv --headerline
mongoimport -d $db -c clubs --type csv --file 29.csv --headerline
mongoimport -d $db -c clubs --type csv --file 30.csv --headerline
mongoimport -d $db -c clubs --type csv --file 31.csv --headerline
mongoimport -d $db -c clubs --type csv --file 32.csv --headerline
mongoimport -d $db -c clubs --type csv --file 33.csv --headerline
mongoimport -d $db -c clubs --type csv --file 34.csv --headerline
mongoimport -d $db -c clubs --type csv --file 35.csv --headerline
mongoimport -d $db -c clubs --type csv --file 37.csv --headerline
mongoimport -d $db -c clubs --type csv --file 38.csv --headerline
