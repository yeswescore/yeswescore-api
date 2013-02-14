var VersionModel = Backbone.Model.extend({
	
	  	// inject variable version 
	  	url : function() {
	  		return apiURL+"/bootstrap/conf.json?version="+this.id;
	  	},
	    
	    initialize: function () {	
	    	
	    }	    
 
  });
  
