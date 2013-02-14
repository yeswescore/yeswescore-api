var PlayersCollection = Backbone.Collection.extend({
  
  	model:PlayerModel, 
  		
  	mode:'default',
  	
  	query:'',
  	
  	//storeName : "player",	

	//FIXME 
	//localStorage: new Backbone.LocalStorage("players"), 
	
	initialize: function (param) {
		this.changeSort("name");
		
		console.log('Players mode '+param);
		
		//, {local:true}
		
		if (param==='follow')
			this.storage = new Offline.Storage('playersfollow', this);		
		else if (param==='me')
			this.storage = new Offline.Storage('Owner', this);
		else		
			this.storage = new Offline.Storage('players', this);	
		
	},
	  
    url:function() {
    	
     console.log('url() : mode de Players',this.mode); 	
     //console.log('url Players',appConfig.serviceURLPlayers+'autocomplete/?q='+this.query); 	
          
     if (this.mode === 'club')
        return appConfig.serviceURLPlayers+'?club='+this.query;
     else if (this.mode === 'search'  )
        return appConfig.serviceURLPlayers+'autocomplete/?q='+this.query;        
      else	
      	return appConfig.serviceURLPlayers;
      	
      	
    },
	

	
	/*
	follow: function(follow) {
		// FIXME : 1 objet 
		if (window.localStorage.getItem("PlayersFollow")!==null )
		{
			//on cree la pile
			var pile = new Players({url:JSON.parse(window.localStorage.getItem("PlayersFollow"))});				
			pile.add(follow) ;				
			window.localStorage.setItem("PlayersFollow",JSON.stringify(pile));
		}
		//Ajoute le premier element
		else 
			window.localStorage.setItem("PlayersFollow",JSON.stringify(follow));
	},
	
	getFollows: function() {
	
		return JSON.parse(window.localStorage.getItem("PlayersFollow"));
		
	
	},	
	*/
	
	setMode:function(m,q) {
    	this.mode=m;
    	this.query=q;
    },
	
	/*
    sync: function(method, model, options) {
    
        
        return Backbone.sync(method, model, options); 
    },
    */
    
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
        name: function (item) { return [item.get("name")]; }, 
        nickname: function (item) { return [item.get("nickname")]; },
        rank: function (item) { return [item.get("rank")]; }        
    },
    
    changeSort: function (sortProperty) {
        this.comparator = this.strategies[sortProperty];
    }

  });
  
