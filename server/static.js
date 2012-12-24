// simple static server
var express = require('express');
var app = express();

// start screen
app.get('/v1/games/', function(req, res){
  res.send(JSON.stringify(data.games));
});

//
app.get('/hello.txt', function(req, res){
  res.send('Hello World');
});
app.listen(8080);

//
// fake data
//
var data = {
  games : [
    {
      id: "50d8148bd618474f630cad8b",
      date_creation: "2012-12-24T07:35:40+00:00", // @see ISO_8601
      date_start: "2012-12-24T07:36:04+00:00",
      date_end: "2012-12-24T09:12:38+00:00",
      location: { long: "50.952588", lat: "1.94767" },
      country: "france",
      city: "marck",
      sport: "tennis",
      type: "singles",
      players: [
        {
          id: "76ab42cdab3ee54563beb45a",
          pseudo: "vt3ktek",
          name: "Vincent Terrasi",
          rank: "15/2",
          club: {
            id: "a328eb98c49f0653e557e745",
            name: "tcMarck"
          }
        },
        {
          id: "1accba567ff42d4567ab455",
          pseudo: "syndr0m",
          name: "Marc Dassonneville",
          rank: "15/2",
          club: {
            id: "a328eb98c49f0653e557e745",
            name: "tcMarck"
          }
        }
      ]
    },
    {
      id: "3457648bd618474f6367867b",
      date_creation: "2012-12-24T07:35:40+00:00", // @see ISO_8601
      date_start: "2012-12-24T07:36:04+00:00",
      date_end: "2012-12-24T09:12:38+00:00",
      location: { long: "50.952588", lat: "1.94767" },
      country: "france",
      city: "marck",
      sport: "tennis",
      type: "singles",
      players: [
        {
          id: "8cba5235783ccb45634534c5",
          pseudo: "fredo",
          name: "Alfred Jean",
          rank: "15/2",
          club: {
            id: "a328eb98c49f0653e557e745",
            name: "tcMarck"
          }
        },
        {
          id: "ff62355782edbd4567852ca7",
          pseudo: "mimi",
          name: "Julie Pierail",
          rank: "15/2",
          club: {
            id: "a328eb98c49f0653e557e745",
            name: "tcMarck"
          }
        }
      ]
    },
    {
      id: "89322345761846785446456b",
      date_creation: "2012-12-24T07:35:40+00:00", // @see ISO_8601
      date_start: "2012-12-24T07:36:04+00:00",
      date_end: "2012-12-24T09:12:38+00:00",
      location: { long: "50.952588", lat: "1.94767" },
      country: "france",
      city: "marck",
      sport: "tennis",
      type: "singles",
      players: [
        {
          id: "05230b679634254563cca32a",
          pseudo: "musclor",
          name: "Jean Ardre",
          rank: "15/2",
          club: {
            id: "a328eb98c49f0653e557e745",
            name: "tcMarck"
          }
        },
        {
          id: "279d78567ff42d9548bd5355",
          pseudo: "camembert",
          name: "Nicolas Poiriet",
          rank: "15/2",
          club: {
            id: "a328eb98c49f0653e557e745",
            name: "tcMarck"
          }
        }
      ]
    },
    {
      id: "986754315498474f63556d8b",
      date_creation: "2012-12-24T07:35:40+00:00", // @see ISO_8601
      date_start: "2012-12-24T07:36:04+00:00",
      date_end: "2012-12-24T09:12:38+00:00",
      location: { long: "50.952588", lat: "1.94767" },
      country: "france",
      city: "marck",
      sport: "tennis",
      type: "singles",
      players: [
        {
          id: "7970ac23549425ac76dd465a",
          pseudo: "tintin",
          name: "Luc Stoten",
          rank: "15/2",
          club: {
            id: "a328eb98c49f0653e557e745",
            name: "tcMarck"
          }
        },
        {
          id: "173424ab6345cd74884ab455",
          pseudo: "Mickouze",
          name: "Michael Vanlenterdin",
          rank: "15/2",
          club: {
            id: "a328eb98c49f0653e557e745",
            name: "tcMarck"
          }
        }
      ]
    }
  ]
}