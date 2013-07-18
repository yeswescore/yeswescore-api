var Conf = require("../conf.js")
  , DB = require("../db.js")
  , Push = require("../push.js")
  , app = require("../app.js");

TEST_DEVICE = "test",

app.get('/v2/push/broadcast/', function (req, res) {

  var payload = {
   "aps": {
	  "alert": "Hello everyone!",
	  "badge": 3
    }
  };
    
  Push.pushNotification("/api/push/broadcast/", payload, function(error) {
    //return app.defaultError(res)(error);
  });
  
  res.send('broadcast send');

});
  
app.get('/v2/push/register/', function (req, res) {

  Push.registerDevice(TEST_DEVICE, function(error) {
    //return app.defaultError(res)(error);
  });
  
  res.send('register send');
});  
/**


// 1 to run a broadcast test, 0 to skip
TEST_BROADCAST = 0,
// The number of test events to wait for
EXPECTED_TESTS = 3 + TEST_BROADCAST,
// The device_token for your test device
TEST_DEVICE = "",


events = require("events"),
util = require("util");

var Test = function() {
	events.EventEmitter.call(this);
}

util.inherits(Test, events.EventEmitter);

Test.prototype.pushBroadcast = function() {
	var self = this,
		payload = {
			"aps": {
				"alert": "Hello everyone!",
				"badge": 3
			}
		};

	Push.pushNotification("/api/push/broadcast/", payload, function(error) {
		self.emit("finished", error, "pushBroadcast")
	});
}

Test.prototype.pushNotification = function() {
	var self = this,
		payload = {
			"device_tokens": [TEST_DEVICE],
			"aps": {
				"alert": "Hello test device!",
				"badge": 3
			}
		};

	Push.pushNotification("/api/push/", payload, function(error) {
		self.emit("finished", error, "pushNotification")
	});
}

var test = new Test(),
	failed = 0,
	passed = 0;

test.on("finished", function(error, test_name) {
	if (error) {
		failed += 1;
		console.log("Failed " + test_name + ".");
		error.message && console.log(error.message);
		error.stack && console.log(error.stack);
	}
	else {
		passed += 1;
		console.log("Passed " + test_name + ".");
	}

	if (passed + failed === EXPECTED_TESTS) {
		Push.unregisterDevice(TEST_DEVICE, function(error) {
			if (error) {
				failed += 1;
				console.log("Failed unregisterDevice.");
			}
			else { 
				passed += 1; 
				console.log("Passed unregisterDevice.");
			}
			console.log("Completed " + (EXPECTED_TESTS + 1) + " tests (" + passed + " passed, " + failed + " failed).");
			process.exit();
		});
	}
});

test.on("registered", function(error) {
	if (error) {
		error.messge && console.log(error.message);
		error.stack && console.log(error.stack);
		process.exit();
	}
	else {
		passed += 1;
		console.log("Passed registerDevice.");

		if (TEST_BROADCAST) {
			test.pushBroadcast();
		}

		test.pushNotification();

		Push.getDeviceTokenCounts(function(error, total, active) {
			if ((!total && isNaN(total)) || (!active && isNaN(active))) {
				test.emit("finished", new Error("Bogus data: " + total + ", " + active + "."), "getDeviceTokenCounts");
			}
			else {
				test.emit("finished", error, "getDeviceTokenCounts");
			}
		});
	}
});

Push.registerDevice(TEST_DEVICE, function(error) {
	test.emit("registered", error);
});
*/
