var express = require('express');
var app = express();

auth = express.basicAuth("yws", "yws");

app.use(express.logger());
app.use(express.compress());
app.use(express.methodOverride());
app.use(express.bodyParser());

app.use(auth);

app.use(express.static(__dirname + '/public'));

app.listen(54321);