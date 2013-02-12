var GamesCollection = Backbone.Collection.extend({
  		 
	model:GameModel, 
	
	//storeName : "game",	
	//localStorage: new Backbone.localStorage("games"),
	//localStorage: new Store("games"),
	
	mode:'default',
	
	
	initialize: function (param) {	
		this.changeSort("city");		
		
		if (param==='follow')
			this.storage = new Offline.Storage('gamesfollow', this);		
		else
			//, keys:{parent_id:this}
			this.storage = new Offline.Storage('games', this);
	},
	
	getOrFetch:  function(id) {
	
		var model = this.get(id) || this.getByCid(id);
		if (model) return model;
		
		var url = appConfig.serviceURLGames + "/" + id;
		return new this.model().fetch({url:url});
	
	},
		  
    url:function() {
    
      console.log('mode de games',this.mode); 	
          
      if (this.mode === 'clubid') 
      	return appConfig.serviceURLClubs+""+this.query+"/games/";    
      else if (this.mode === 'club') 
      	return appConfig.serviceURLGames;
      else if (this.mode === 'player') 
      	return appConfig.serviceURLGames+"?q="+this.query;
      else if (this.mode === 'me') {
      
      // /v1/players/:id/games/  <=> cette url liste tous les matchs dans lequel un player joue / a joué
	  // /v1/players/:id/games/?owned=true <=> cette url liste tous les matchs qu'un player possède (qu'il a créé)
      
      	return appConfig.serviceURLPlayers+this.query+"/games/";
      }
      else
      	return appConfig.serviceURLGames;
      		      	
      	
    },
    
    
    setMode:function(m,q) {
    	this.mode=m;
    	this.query=q;
    },
    
    	
	//FIXME : if exists in localStorage, don't request
	/*
    sync: function(method, model, options) {
    
    //checkConnection();
    //console.log('etat du tel ',appConfig.networkState);
    
    console.log(' On est dans Games Collection avec '+model.url());
    
     return Backbone.sync(method, model, options); 
      
    },
    */
    
    
    /* ON AFFICHE QUE EN FCT DES IDS */
    //filterWithIds: function(ids) {
    //	return _(this.models.filter(function(c) { return _.include(ids, Game.id); }));
	//},
    
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
        player: function (item) { return [item.get("teams[0].players[0].name"),item.get("teams[1].players[0].name")]; },
    },
    
    changeSort: function (sortProperty) {
        this.comparator = this.strategies[sortProperty];
    }

});

