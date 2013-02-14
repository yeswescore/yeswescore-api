var ClubModel = Backbone.Model.extend({
	  
	    urlRoot: appConfig.serviceURLClubs,
	    
	    //storeName : "club",	
	  	
	    mode: '',	  	
	        
	    initialize: function () {	
			
	    },
	  
	    sync: function (method, model, options) {
	    	
	    /*
       	 var params = _.extend({
             type: 'GET',
             dataType: 'json',
             url: model.url(),
             processData:false
         }, options);

         return $.ajax(params);
         */
         
         return Backbone.sync(method, model, options); 
	    	
	    },
	    
	    defaults: {     
		    sport: "tennis",
			name: "",
			ligue: "",
			zip: "",
			outdoor: 0,
			indoor: 1,
			countPlayers: 0,
			countPlayers1AN: 0,
			countTeams: 0,
			countTeams1AN: 0,
			school:"",
			location:{address: "",city: "",pos: [0,0]},
			dates: {update: "",creation: new Date()},
			updated_at : new Date()
	    }
	  
	 
  });

  