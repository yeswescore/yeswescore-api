var AccountView = Backbone.View.extend({

    el:"#index",
    
    initialize:function() {
    	
		
    	this.accountViewTemplate = _.template(tpl.get('accountViewTemplate'));
    
    	//Owner = JSON.parse(window.localStorage.getItem("Owner"));
    	this.players = new PlayersCollection("me");
		this.Owner = new PlayerModel(this.players.storage.findAll({local:true})[0]); 
		
		console.log(this.Owner.toJSON()); 

		console.log(this.Owner.id); 
    	
    	this.render();

    },
    
    events: {
        'vclick #debug': 'debug'      
    },
        
    debug: function(){        
        

        console.log('synchro');
        players = new PlayersCollection('me');
        players.storage.sync.push();

        players = new PlayersCollection();
        players.storage.sync.push();

        //games = new GamesCollection();
        //games.storage.sync.push();
        
        
        
    },

    //render the content into div of view
    render: function(){

      //console.log('render account Owner ',Owner);
      //console.log('render account Owner.Club  ',Owner.club);
      //console.log('render account Owner.Club.id  ',Owner.club.id);
      
        
      $(this.el).html(_.template(this.accountViewTemplate({Owner:this.Owner})));
      
      $(this.el).trigger('pagecreate');
    	
      //this.$el.html(_.template(this.accountViewTemplate(),{Owner:Owner}));     
      //$.mobile.hidePageLoadingMsg();                              
      //this.$el.trigger('pagecreate');
       
      return this;
    },


    onClose: function(){
      //Clean
      this.undelegateEvents();

    }

  });



