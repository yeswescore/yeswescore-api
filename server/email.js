var https = require("https")
  , Conf = require("./conf.js")
  , DB = require("./db.js")
  , app = require("./app.js")
  , winston = require("winston");

var emailLogger = winston.loggers.get('email');
  
// using mandrill
// cf. https://mandrillapp.com/api/docs/messages.html
var Email = {
  send: function (to, subject, message) {
    app.log('EMAIL: sending email to ['+to+'] subject ['+subject+'] message ['+message+']');
    
    var data = {
      "key": Conf.get("email.mandrill.key"),
      "message": {
        "html": message,
        "subject": subject,
        "from_email": Conf.get("email.from.email"),
        "from_name": Conf.get("email.from.name"),
        "to": [ { "email": to } ],
        "auto_text": true,
        "url_strip_qs": false,
        "preserve_recipients": true
      },
      "async": true
    };
    data = JSON.stringify(data);
        
    var postOptions = {
      host: Conf.get("email.mandrill.host"),
      path: Conf.get("email.mandrill.path.messages.send"),
      method : "POST",
      headers : {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    // dedicated loggers
    emailLogger.info(data);
    emailLogger.info(postOptions);
    
    var req = https.request(postOptions, function(res) {
      var answer = "";
      res.on("data", function (chunk) { answer += chunk })
         .on("end", function () {
            app.log("EMAIL: email sended to "+to);
            emailLogger.info(answer);
          });
    });
    req.on("error", function (e) {
      app.log("EMAIL: "+e, "error");
      emailLogger.error(e);
    });
    req.write(data);
    req.end();
  },
  
  sendEmailConfirmation: function (email, token) {
    app.log("EMAIL: sendEmailConfirmation to "+email+" (token="+token+")");
    var url = null;
    if (typeof email === "string" && email &&
        typeof token === "string" && token) {
      // FIXME: email encoding, escape ?
      url = Conf.getAbsoluteUrl(Conf.get("api.email")+"confirm/?token="+token);
      app.log("EMAIL: sendEmailConfirmation callback url: "+url);
      // FIXME: locals.
      if (Conf.env === "DEV" && !Conf.get("email.send.confirmation")) {
        app.log('EMAIL: simulating sending email to ' + email);
        return url;
      }
      this.send(
        email,
        'Confirmation de votre email',
        'Veuillez cliquer sur ce lien pour confirmer votre email: <a href="' + url + '">' + url + '</a>'
      );
    }
    return url;
  }
};

module.exports = Email;