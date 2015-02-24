var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , Authentication = require('../authentication.js');

var Definitions = {
  Club: null,
  File: null,
  Game: null,
  Player: null,
  StreamItem: null,
  Team:null
};

Definitions.generateClub = function (DB) {
  // ClubID,Name,Ligue,Zip,City,Outdoor,Indoor,Players,Players-1AN,Teams,Teams-1AN,School?
  // =>
  // fedid,name,ligue,zip,city,outdoor,indoor,countPlayers,countPlayers1AN,countTeams,countTeams1AN,school
  Definitions.Club = {
    sport: { type: String, enum: ["tennis", "badminton", "padel", "racquetball", "tabletennis", "squash", "speedbadminton"], default: "tennis" },
    name: String,
    dates : {
      creation: { type: Date, default: Date.now },
      update: { type: Date, default: Date.now }
    },
    location: {
      city: String,
      pos: {type: [Number], index: '2d'},
      address: String,
      zip: String
    },
    fedid: { type: String, unique: true, sparse: true },
    ligue: String,
    outdoor: Number,
    indoor: Number,
    countPlayers: Number,
    countPlayers1AN: Number,
    countTeams: Number,
    countTeams1AN: Number,
    school: String,
    owner: { type: Schema.Types.ObjectId, ref: "Player" },
    // private
    _deleted: { type: Boolean, default: false }, // FIXME: unused
    _reported: { type: Boolean, default: false },
    // private searchable fields
    _searchableName: String  // AUTO-FIELD (Club pre save)
  };
};

Definitions.generateFile = function (DB) {
  Definitions.File = {
    _id: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: "Player" },
    dates : {
      creation: { type: Date, default: Date.now }
    },
    path: { type: String },
    mimeType: { type: String, enum: [ "image/jpeg" ], default: "image/jpeg" },
    bytes: { type: Number, default: 0 },
    metadata: Schema.Types.Mixed, // { usage: "profil/streamitem/...", id: }
    // private
    _deleted: { type: Boolean, default: false },  // FIXME: unused
    _reported: { type: Boolean, default: false } // FIXME: unused
  };
};

Definitions.generateGame = function (DB) {
  Definitions.Game = {
    sport: { type: String, enum: ["tennis", "badminton", "padel", "racquetball", "tabletennis", "squash", "speedbadminton"], default: "tennis" },
    status: { type: String, enum: [ "created", "ongoing", "finished", "canceled", "aborted" ], default: "created" },
    owner: { type: Schema.Types.ObjectId, ref: "Player" },
    dates : {
      creation: { type: Date, default: Date.now },
      update: { type: Date, default: Date.now },
      start: Date,
      end: Date, // AUTO-FIELD (status)
      expected: { type: Date }
    },
    location : {
      country: String,
      city: String,
      pos: {type: [Number], index: '2d'}
    },
    teams: [ DB.Schemas.Team ],
    stream: [ DB.Schemas.StreamItem ],
    streamCommentsSize: { type: Number, default: 0 },
    streamImagesSize: { type: Number, default: 0 },
    infos: {
      type: { type: String, enum: [ "singles", "doubles" ] },
      subtype: { type: String, enum: [ "A", "B", "C", "D", "E", "F", "G", "H", "I" ] },
      sets: String, // 6/1;6/2
      score: String,
      court: { type: String, enum: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
                                    "A", "B", "C", "D", "E", "F", "" ] },
      surface: { type: String, enum: ["BP", "EP", "EPDM", "GAS", "GAZ", "MOQ",
                                      "NVTB", "PAR", "RES", "TB", "" ] },
      tour: String,
      startTeam: { type: Schema.Types.ObjectId },
      official: { type: Boolean, default: true },
      pro: { type: Boolean, default: false },
      numberOfBestSets: { type: Number },
      maxiSets: { type: Number },      
      winners: {
        players: [ { type: Schema.Types.ObjectId, ref: "Player" } ],  // AUTO-FIELD (status)
        teams: [ { type: Schema.Types.ObjectId, ref: "Team" } ],      // AUTO-FIELD (status)
        status: { type: String, enum: ["win", "draw"] }               // AUTO-FIELD (status)
      }
    },
    // private
    _deleted: { type: Boolean, default: false },  // FIXME: unused
    _reported: { type: Boolean, default: false }, // FIXME: unused
    // private searchable fields
    _searchableCity: String,                                // AUTO-FIELD (Game pre save)
    _searchablePlayersNames: [ String ],                    // AUTO-FIELD (Player post save) ASYNC
    _searchablePlayersClubsIds: [ Schema.Types.ObjectId ],  // AUTO-FIELD (Player post save) ASYNC
    _searchablePlayersClubsNames: [ String ]                // AUTO-FIELD (Player post save) ASYNC
  };

  // SETTERS.
  // REFACTO : not usefull
  Definitions.Game.status.set = function (status) {
    // handling status.
    var oldStatus = this.status;

    this.dates = this.dates || {};
    if (status === "created" && oldStatus === "ongoing")
      this.dates.start = undefined;
    if (status === "ongoing" && oldStatus === "created")
      this.dates.start = Date.now();
    if (status === "ongoing" && oldStatus === "finished")
      this.dates.end = undefined;
    if ((status === "finished" && oldStatus === "created")
        || (status === "finished" && oldStatus === "ongoing")
        || (status === "aborted" && oldStatus === "created")
        || (status === "aborted" && oldStatus === "ongoing")
        ) {
      // end of game
      this.dates.end = Date.now();

      if (status === "aborted") {
        //TODO : choose winner
      }

    }
    return status;
  };
};

Definitions.generatePlayer = function (DB) {
  Definitions.Player = {
    name: String,
    sport: { type: String, enum: ["tennis", "badminton", "padel", "racquetball", "tabletennis", "squash", "speedbadminton"], default: "tennis" },
    location: {
      currentPos: { type: [Number], index: '2d'},
      city: String,
      address: String,
      zip: String
    },
    dates : {
      creation: { type: Date, default: Date.now },
      update: { type: Date, default: Date.now },
      birth: { type: Date }
    },
    push: {
      platform: { type: String, enum: [ "android", "ios", "wp8", "bb" ] },
      token: { type: String }
    },
    gender: { type: String, enum: [ "", "man", "woman" ] },
    profile: {
      image: { type: String, ref: "File" }
    },
    email: {
      address: { type: String, unique: true, sparse: true },
      // internal features of the email.
      // should be refactored withe mailer worker + redis stack.
      status: { type: String, enum: ["pending-confirmation", "confirmed"] },
      _backup: { type: String },
      _token: { type: String },
      _dates: {
        _created: { type: Date },
        _sended: { type: Date },
        _confirmed: { type: Date }
      }
    },
    language: { type: String, enum: [ "en", "fr" ] },
    idlicense: String,
    password: { type: String, default: null },
    token: { type: String, default: Authentication.generateToken },
    connection: {
      facebook: {
        id: String,
        token: String
      }
    },
    rank: String,
    club: {
      id: { type: Schema.Types.ObjectId, ref: "Club" },
      name: String // AUTO-FIELD (Player pre save)
    },
    games: [ { type: Schema.Types.ObjectId, ref: "Game" } ], // AUTO-FIELD (Game post save)
    following: [ { type: Schema.Types.ObjectId, ref: "Player" } ],
    owner: { type: Schema.Types.ObjectId, ref: "Player" },
    type: { type: String, enum: [ "default", "owned" ], default: "default" },
    // private
    _deleted: { type: Boolean, default: false },  // FIXME: unused
    _reported: { type: Boolean, default: false },
    // private searchable fields
    _searchableName: String,      // AUTO-FIELD (Player pre save)
    _searchableClubName: String   // AUTO-FIELD (Player pre save)
  };
};

Definitions.generateStreamItem = function (DB) {
  Definitions.StreamItem = {
    dates : {
      creation: { type: Date, default: Date.now },
      update: { type: Date, default: Date.now }
    },
    type: { type: String, enum: [ "comment", "image" ] },
    owner: {
      player: { type: Schema.Types.ObjectId, ref: "Player" },
      facebook: { id: String, name: String }
    },
    data: Schema.Types.Mixed,
    // private
    _deleted: { type: Boolean, default: false },
    _reported: { type: Boolean, default: false }
  };
};

Definitions.generateTeam = function (DB) {
  Definitions.Team = {
    sport: { type: String, default: "default" },
    name: String,
    dates : {
      creation: { type: Date, default: Date.now },
      update: { type: Date, default: Date.now }
    },
    players: [ { type: Schema.Types.ObjectId, ref: "Player" } ],
    substitutes: [ { type: Schema.Types.ObjectId, ref: "Player" } ],
    captain: { type: Schema.Types.ObjectId, ref: "Player" },
    captainSubstitute: { type: Schema.Types.ObjectId, ref: "Player" },
    coach: { type: Schema.Types.ObjectId, ref: "Player" },
    //
    club: { type: Schema.Types.ObjectId, ref: "Club" },
    competition: { type: Boolean, default: true },
    profile: {
      image: { type: String, ref: "File" }
    },
    //
    stream: [ DB.Schemas.StreamItem ],
    streamCommentsSize: { type: Number, default: 0 },
    streamImagesSize: { type: Number, default: 0 },
    // private searchable fields
    _searchableName: String,      // AUTO-FIELD (Team pre save)
    // private owner list
    _owners:[ { type: Schema.Types.ObjectId, ref: "Player" } ],
    // private
    _deleted: { type: Boolean, default: false },  // FIXME: unused
    _reported: { type: Boolean, default: false }  // FIXME: unused
  };
};

module.exports = Definitions;
