var express = require("express")
  , app = express()
  , Conf = require("./conf.js")
  , winston = require("winston");

// default express options
app.use(express.compress());       // we do want to compress responses
// security
app.use(function (req, res, next) {
  app.disable('x-powered-by');
  res.setHeader('X-Powered-By', 'PHP/5.2.4-2freebsd'); // fake headers, but shouldn't be the same in dev & prod.
  next();
});
// methodOverride working with querystring?_method=xxxx
app.use(function (req, res, next) {
  if (req.query && req.query._method) {
    if (!req.body)
      req.body = { };
    req.body._method = req.query._method;
  }
  next();
});
app.use(express.methodOverride()); // we want to simulate http verbs. (delete & put)

// CORS in dev.
if (Conf.get("env") === "DEV") {
  app.use(function allowCrossDomain(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });
}


var routes = { /* "/v1/games/:id" : function (req, res) { ... } */ };
app.get = (function (oldGet) {
  return function () {
    if (typeof arguments[1] === "function")
      routes[arguments[0]] = arguments[1];
    if (typeof arguments[2] === "function")
      routes[arguments[0]] = arguments[2];
    oldGet.apply(app, arguments);
  }
})(app.get);

app.internalRedirect = function (route) {
  return routes[route];
};
  
app.defaultError = function (res, msg) { 
  return function (err) {
    app.log('message: ' +  msg + ' error: ' + err, 'error');
    res.send(404, JSON.stringify({error:err, message:msg}));
  };
};

// @param string fields   ex: "a,b,c,d,e,f.g.h,i,..."
// @param populate        ex: "a.b,c.d.e.f"
// @return { 'select' : fields, 'populate1': fields, ... }
app.createPopulateFields = function (fields, populate) {
  var populate = populate || "";
  var populatePaths = populate.split(",");
  var fields = fields || "";
  var fieldsPath = fields.split(",");
  var l = populatePaths.length;
  var result = {};
  result.select = fieldsPath.filter(function (field) {
    for (var i = 0; i < l; ++i) {
      if (field.startsWith(populatePaths[i]+".")) {
        return false;
      }
    }
    return true;
  }).join(" ");
  // every other fields
  populatePaths.forEach(function (populatePath) {
    result[populatePath] = fieldsPath.filter(function (field) {
      return field.startsWith(populatePath+".");
    }).map(function (field) {
      return field.replace(populatePath+".", "");
    }).join(" ");
    if (result[populatePath] === "")
      result[populatePath] = null; // <=> no specific fields
  });
  return result;
};

var logsPath = Conf.get("logs.path");
// definition of access, default & stats loggers.
var logs = {
  access : {
    file: {
      filename: logsPath+'access.log',
      maxsize: 104857600 // = 100 Mo
    }
  },
  info: {
    file: {
      filename: logsPath+'info.log',
      maxsize: 104857600, // = 100 Mo
      timestamp: true
    }
  },
  email: {
    file: {
      filename: logsPath+'email.log',
      maxsize: 104857600, // = 100 Mo
      timestamp: true
    }
  },
  report: {
    file: {
      filename: logsPath+'report.log',
      maxsize: 104857600, // = 100 Mo
      timestamp: true,
      json:false
    }
  },
  stats: {
    file: {
      filename: logsPath+'stats.log',
      maxsize: 104857600, // = 100 Mo
      timestamp: false,
      json:false
    }
  }
};
if (Conf.get("env") === "DEV") {
  // IN DEV ENVIRONMENT => CONSOLE LOGS !
  logs.access["console"] = {
    level: 'info',
    colorize: true,
  };
  logs.info["console"] = {
    level: 'info',
    colorize: 'true',
    timestamp: true
  };
  logs.email["console"] = {
    level: 'info',
    colorize: 'true',
    timestamp: true
  };
  logs.report["console"] = {
    level: 'info',
    colorize: 'true',
    timestamp: true
  };
  logs.stats["console"] = {
    level: 'info',
    colorize: 'true',
    timestamp: true
  };
}

// creating logs !
Object.keys(logs).forEach(function (category) {
  winston.loggers.add(category, logs[category]);
});

// HIGH LEVEL LOGGING FUNCTION
var defaultLogger = winston.loggers.get('info');
app.log = function (msg, level) {
  if (level === "error")
    defaultLogger.error(msg);
  else
    defaultLogger.info(msg);
};


// AUTO LOG ACCESS
var accessLogger = winston.loggers.get('access');
var winstonStream = {
    write: function(message, encoding){
        accessLogger.info(message);
    }
};
app.use(express.logger({stream:winstonStream}));

module.exports = app;