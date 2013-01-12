define(['jquery', 'underscore', 'backbone', 'models/Game'],
function($, _, Backbone, Game){

  var Games = Backbone.Collection.extend({ 
	  
    url:function() {
      return serviceURLGames;
    },
    
    
    //always fetched and saved only locally, never saves on remote
    //local:true,
    //localStorage: new Backbone.LocalStorage("games"), // Unique name within your app.
    
    
	model:Game, 
	
	initialize: function () {
		this.changeSort("city");
		
	},
	
	//FIXME : if exists in localStorage, don't request
	
    sync: function(method, model, options) {
    	
    
   	 var params = _.extend({
         type: 'GET',
         dataType: 'json',
         url: model.url(),
         processData:false,
     }, options);

     return $.ajax(params);
     
        
        /*FIXME : Gestion du localStorage*/
    	/*
      return $.ajax({
        dataType: 'json',
        url: model.url(),
        type:'GET',
        processData:false,
        error: function(jqXHR, textStatus, errorThrown){
            //FIXME : gestion des erreurs
        	//alert('error');
        },
        success:function(data) { 
        	console.log('games sync ',JSON.stringify(data));
        	window.localStorage.setItem("games", JSON.stringify(data));
        	model.parse(data);
        }
      }, options);
       */  
        
        
    },
    
    /* ON AFFICHE QUE EN FCT DES IDS */
    filterWithIds: function(ids) {
    	return _(this.models.filter(function(c) { return _.include(ids, Game.id); }));
	},
    
    /*
    comparator: function(item) {
    	//POSSIBLE MULTI FILTER [a,b,..]
        return [item.get("city")];
      },
    */
    
    comparator: function (property) {
    	return selectedStrategy.apply(Game.get(property));
    },
    
    strategies: {
        city: function (item) { return [item.get("city")]; }, 
        status: function (item) { return [item.get("status")]; },
    },
    
    changeSort: function (sortProperty) {
        this.comparator = this.strategies[sortProperty];
    }

  });
  
  return new Games();
});
