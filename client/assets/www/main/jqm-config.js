/* Base service URL */
var apiURL = "http://reachtheflow.com:8080";
var serviceURL = apiURL+"/v1/";
var serviceURLGames = apiURL+"/v1/games/";
var serviceURLPlayers = apiURL+"/v1/players/";
var serviceURLClubs = apiURL+"/v1/clubs/";
var versionClient = "0.0.0.1";


var Conf = {

 get: function (o) {
 
 },
 set: function (key, value) {
   // local storage
  },

 

}; 


//var apiURL = conf.get('api.url');

/* ******************** */

define(['jquery'], function($){
  'use strict';
    $(document).bind("mobileinit", function () {
        $.mobile.ajaxEnabled = false;
        $.mobile.linkBindingEnabled = false;
        $.mobile.hashListeningEnabled = false;
        $.mobile.pushStateEnabled = false;
        // // Remove page from DOM when it's being replaced
        // $('div[data-role="page"]').live('pagehide', function (event, ui) {
        //     $(event.currentTarget).remove();
        // });
    });
});

