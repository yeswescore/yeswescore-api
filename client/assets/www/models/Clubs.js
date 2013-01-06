define(['jquery', 'underscore', 'backbone', 'models/Club'],
function($, _, Backbone, Club){

  var Clubs = Backbone.Collection.extend({ 
	  
	  
    url:function() {
      return serviceURLClubs;
    },
    

	model:Club, 
	
	initialize: function () {

		
	},
	
	//FIXME : if exists in localStorage, don't request
	
    sync: function(method, model, options) {
    	
    /*
   	 var params = _.extend({
         type: 'GET',
         dataType: 'json',
         url: model.url(),
         processData:false,
     }, options);

     return $.ajax(params);
     */
    	

        
    },
    
    


  });
  
  return new Clubs();
});
