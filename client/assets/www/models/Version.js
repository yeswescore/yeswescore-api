define(['jquery', 'underscore', 'backbone'],
function($, _, Backbone){

  var VersionApp = Backbone.Model.extend({
	
	  	// inject variable version 
	  	url : function() {
	  		return apiURL+"/bootstrap/conf.json?version="+this.id;
	  	},
	    
	    initialize: function () {	
	    	
	    }	    
 
  });
  return VersionApp;
  
  
});