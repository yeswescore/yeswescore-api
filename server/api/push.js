var Conf = require("../conf.js")
  , DB = require("../db.js")
  , Push = require("../push.js")
  , app = require("../app.js");

TEST_DEVICE = "2e86eb31-b552-4c4b-a02f-f7d532f550c4",

app.get('/v2/push/broadcast/', function (req, res) {
  var payload = {
   "aps": {
	  "alert": "Hello everyone!",
	  "badge": 3
    }
  };   
  Push.pushNotification("/api/push/broadcast/", payload, function(error) {});
  res.send('broadcast send');
});
  
app.get('/v2/push/send/:id', function (req, res) {    
  Push.sendPushs(null,req.params.id,'La partie commence');
  res.send('register send');
});  
