var Conf = require("./conf.js")
  , http = require('http')
  , https = require('https')
  , DB = require("./db.js")
  , app = require("./app.js")
  , Resources = require("./strings/resources.js")
  , winston = require("winston");

var pushLogger = winston.loggers.get('push');
TEST_DEVICE = "2e86eb31-b552-4c4b-a02f-f7d532f550c4";
  
// using urbanairship
// cf. https://github.com/cojohn/node-urban-airship/blob/master/lib/urban-airship.js
var Push = {

  _auth : null,
  _key : Conf.get("push.urbanairship.key"),
  _secret : Conf.get("push.urbanairship.secret"),
  _master : Conf.get("push.urbanairship.master"),
  

   sendPushs : function(err,push) {   
     var that = this;
     var msg = "";    
   
     if (push.status.indexOf('ongoing')!=-1) {
       //if never start
       //if (push.dates.start==="")
       //{
	     msg = Resources.getString(push.language, "game.push.started");
	     msg = msg.replace(/%PLAYER1%/g, push.player.name);
         if (typeof push.opponent.name === "undefined")	      
	       msg = msg.replace(/%PLAYER2%/g, push.opponent.name);
         if (typeof push.opponent.rank === "undefined")     	       
	       msg = msg.replace(/%RANK2%/g, push.opponent.rank);
	   //}              
     }

     else if (push.status.indexOf('created')!=-1) {
       msg = Resources.getString(push.language, "game.push.created");      
       msg = msg.replace(/%PLAYER1%/g, push.player.name); 
       if (typeof push.opponent.name === "undefined")
         msg = msg.replace(/%PLAYER2%/g, push.opponent.name);
       if (typeof push.opponent.rank === "undefined")
         msg = msg.replace(/%RANK2%/g, push.opponent.rank);      
       msg = msg.replace(/%DATE%/g, push.dates.create);                  
     }

     else if (push.status.indexOf('finished')!=-1) {   
     
       app.log('state finished win:'+push.win);
       
       if (push.win==="1")
       {
         msg = Resources.getString(push.language, "game.push.finished.win");
         msg = msg.replace(/%PLAYER1%/g, push.player.name);
         if (typeof push.opponent.name === "undefined")          
           msg = msg.replace(/%PLAYER2%/g, push.opponent.name);
         if (typeof push.opponent.rank === "undefined")           
           msg = msg.replace(/%RANK2%/g, push.opponent.rank);
         msg = msg.replace(/%SCORE%/g, push.score);
       }
       else 
       {
         msg = Resources.getString(push.language, "game.push.finished.loose");
         msg = msg.replace(/%PLAYER1%/g, push.player.name); 
         if (typeof push.opponent.name === "undefined")            
           msg = msg.replace(/%PLAYER2%/g, push.opponent.name);
         if (typeof push.opponent.rank === "undefined")            
           msg = msg.replace(/%RANK2%/g, push.opponent.rank);
         msg = msg.replace(/%SCORE%/g, push.score);      
       }       
     }
     
     app.log('push.js '+push.status+' msg:'+msg);   
   
     if (msg!=="") {
	   http.get({
         host: Conf.get('http.host'),
         port: Conf.get('http.port'),
         path: "/players/push/" +push.player.id 
       }, function(res){
	     var data = '';
	
	     res.on('data', function (chunk){
	        data += chunk;
	     });
	
	     //get followers
	     res.on('end',function(){
	       var followers = JSON.parse(data);
	      
	       var android=false;
	       var android_tab=[];
	       var ios=false;
	       var ios_tab=[];
	        
	       followers.forEach(function (follower) {
	         app.log( follower.name+' '+follower.push.token+' '+follower.push.platform );          

			 if (follower.push.platform.indexOf('android')!=-1) {
			   android=true;
			   android_tab.push(follower.push.token);
			 }

			 if (follower.push.platform.indexOf('ios')!=-1) {
			   ios=true;
			   ios_tab.push(follower.push.token);
			 }
						
			 if (android == true)
			 {
			   app.log('test envoi android');
			 
			   var payload = {"android": {"alert": msg}, "apids": android_tab};	
			   that.pushNotification("/api/push/", payload, function(error) {
			     app.log(error);
			   });			
			 }
			
			 if (ios == true)
			 {
			   app.log('test envoi ios');
			   
			   var payload = {"aps": {"alert": msg}, "device_tokens": ios_tab};	
			   that.pushNotification("/api/push/", payload, function(error) {
			     app.log(error);
			   });			
			 }						
		  });		          
	    });
	   });
	 }      
   }, 

  getIndexWinningTeam: function (score) {
    if (typeof score !== "string")
      return null;
    var scoreDetails = score.split("/");
    if (scoreDetails.length !== 2)
      return null;
    var scoreTeamA = parseInt(scoreDetails[0], 10);
    var scoreTeamB = parseInt(scoreDetails[1], 10)
    if (scoreTeamA == NaN || scoreTeamB == NaN)
      return null;
    if (scoreTeamA == scoreTeamB)
      return -1; // draw
    if (scoreTeamA < scoreTeamB)
      return 1; // team B is winning
    return 0; // team A is winning
  },
  
/**
 * Gets the number of devices tokens authenticated with the application.
 *
 * @params callback(error, total, active)
 */
  getDeviceTokenCounts : function(callback) {
	this._auth = new Buffer(this._key + ":" + this._master, "utf8").toString("base64");

	this._transport("/api/device_tokens/count/", "GET", function(error, response_data) {
		callback(error, response_data.device_tokens_count || 0, response_data.active_device_tokens_count || 0);
	});  
  }, 
  
  
/**
 * Push a notification to a registered device.
 *
 * @params
 *	path of the push Notification.
 *	payload the object being sent to Urban Airship as specified http://urbanairship.com/docs/push.html
 *	callback
 */  
  pushNotification : function(path, payload, callback) {
	this._auth = new Buffer(this._key + ":" + this._master, "utf8").toString("base64");
    this._transport(path, "POST", payload, callback);
  },
 
/**
 * Register a new device.
 *
 * @params
 *	device_id - The device identifier
 *	data - The JSON payload (optional)
 *	callback
 */
  registerDevice : function(device_id, data, callback) {
	this._auth = new Buffer(this._key + ":" + this._secret, "utf8").toString("base64");

	var path = "/api/device_tokens/" + device_id;
	
	app.log("PUSH: registerDevice "+path+' avec '+this._key+' '+this._secret);

	if (data) {
		// Registration with optional data
		this._transport(path, "PUT", data, callback);
	}
	else {
		// Simple registration with no additional data
		this._transport(path, "PUT", callback);
	}
  },
  
/**
 * Unregister a device.
 *
 * @params
 *	device_id - The device identifier
 *	callback
 */
  unregisterDevice : function(device_id, callback) {
	this._auth = new Buffer(this._key + ":" + this._secret, "utf8").toString("base64");
	this._transport("/api/device_tokens/" + device_id, "DELETE", callback);
  },  
  
/*
 * Send things to UA!
 *
 * @params
 *	path - API route
 *	method - The HTTPS method to employ
 *	request_data - The JSON data we are sending (optional)
 *	callback
 */
  _transport : function(path, method, request_data, callback) {
  
    app.log('PUSH: sending notification path ['+path+'] method ['+method+'] request_data ['+request_data+']');
  
	var self = this,
		rd = "",
		response_data = "",
		https_opts = {
			"host": "go.urbanairship.com",
			"port": 443,
			"path": path,
			"method": method,
			"headers": {
				"Authorization": "Basic " + this._auth,
				"User-Agent": "node-urban-airship/0.2"
			}
		};

   app.log('PUSH https_opts '+https_opts);		

	// We don't necessarily send data
	if (request_data instanceof Function) {
		callback = request_data;
		request_data = null;
	}

	// Set a Content-Type and Content-Length header if we are sending data
	if (request_data) {
		rd = JSON.stringify(request_data);

		https_opts.headers["Content-Type"] = "application/json";
		https_opts.headers["Content-Length"] = Buffer.byteLength(rd, "utf8");
	}
	else {
		https_opts.headers["Content-Length"] = 0;
	}

    // dedicated loggers
    pushLogger.info(https_opts);

	var request = https.request(https_opts, function(response) {
		response.setEncoding("utf8");

		response.on("data", function(chunk) {
			response_data += chunk;
		});

		response.on("end", function() {
			// You probably forget the trailing '/'
			if ((response.statusCode == 301 || response.statusCode == 302) && response.headers && response.headers.location) {
				var url = require("url"),
					parsed_url = url.parse(response.headers.location);

				self._transport(parsed_url.pathname + (parsed_url.search || ""), method, request_data, callback);
			}
			// Success on 200 or 204, 201 on new device registration
			else if ([200,201,204].indexOf(response.statusCode) >= 0) {
				try {
					switch (true) {
						case /application\/json/.test(response.headers["content-type"]):
							callback(null, JSON.parse(response_data));
							break;
						default:
							callback(null, response_data);
					}
					
					app.log("PUSH: notification sended "+response_data);
            		pushLogger.info(response_data);
				}
				catch (ex) {
					callback(ex);
					app.log("PUSH: "+ex, "error 1");
            		pushLogger.error(ex);		
				}
			}
			else {
				callback(new Error(response_data));
				app.log("PUSH: "+new Error(response_data), "error 2");
            	pushLogger.error(new Error(response_data));				
			}
		});

		response.on("error", function(error) {
			callback(error);
			app.log("PUSH: "+error, "error 3");
            pushLogger.error(e);
		});
	});

	request.on("error", function(error) {
		callback(error);
		app.log("PUSH: "+error, "error 4");
        pushLogger.error(e);
	});

	if (request_data) {
		request.write(rd);
	}

	request.end();
  }

};

module.exports = Push;