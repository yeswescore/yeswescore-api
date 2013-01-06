define(['jquery', 'underscore', 'backbone'],
function($, _, Backbone){

  var Club = Backbone.Model.extend({
	  
	    urlRoot: serviceURLClubs,
	  
	  	name: '',
	        
	    initialize: function () {	
			
	    },
	    	    
	    
	    defaults: {     
 
	    }
	  
	 
  });
  return Club;
  
  
});