var PlayerView = Backbone.View.extend({

    el:"#index",

    initialize:function(options) {
    	
    	this.playerViewTemplate = _.template(tpl.get('playerViewTemplate'));
    
    	//this.follow = options.follow;
    	
    	console.log('init player view');
    	
    	this.players = new PlayersCollection();

		cache = this.players.storage.find({id:this.id});
		this.player = new PlayerModel(cache);		
		
    	console.log('Player',this.player.toJSON());
    	
        //this.player = new PlayerModel({id:this.id});
        //this.player.fetch(); 
        
        // control if player id in playersfollow
        this.playersfollow = new PlayersCollection('follow');
		result = this.playersfollow.storage.find({id:this.id});
		if (result===null) 
			this.follow = 'false';
		else	
			this.follow = 'true';
			
        
        this.render();
    	//change
        //this.player.on( 'change', this.render, this );

    },
    
    events: {
        'vclick #followPlayerButton': 'followPlayer'
    },

    followPlayer:function() {
    	
    	
    	if (this.follow==='true') 
    	{
	       this.playersfollow = new PlayersCollection('follow');
	       
	       console.log('On ne suit plus nofollow '+this.id);
	       
	       this.playersfollow.storage.remove(this.player);
	    	       
	       $('span.success').html('Vous ne suivez plus ce joueur').show();
	       //$('#followPlayerButton').html('Suivre ce joueur');
       	   $("#followButton .ui-btn-text").text("Suivre ce joueur");	       
	       
	       this.follow = 'false';
       
		}
		else 
		{
		
       		this.playersfollow = new PlayersCollection('follow');
       		
       		this.playersfollow.create(this.player);
    	       
       		$('span.success').html('Vous suivez ce joueur').show();	
       		//$('#followPlayerButton').html('Ne plus suivre ce joueur');	
       		$("#followButton .ui-btn-text").text("Ne plus suivre ce joueur");
       		
	        this.follow = 'true';       		
       		
		}
		
		this.$el.trigger('pagecreate');
		
		    	
    },    

	/*
    followPlayer:function() {
    	
       this.playersfollow = new PlayersCollection('follow');
       
       this.playersfollow.create(this.player);
    	       
       $('span.success').html('Vous suivez ce joueur').show();
    	
    },*/

    //render the content into div of view
    render: function(){
    
    	console.log('render player view ',this.player);
    
    
    	
      this.$el.html(_.template(this.playerViewTemplate({
                                    player:this.player.toJSON(),follow:this.follow
                                    })));
      
      
      $.mobile.hidePageLoadingMsg();      
                                    

      this.$el.trigger('pagecreate');
      
      return this;
    },



    onClose: function(){
      //Clean
      this.undelegateEvents();
      this.player.off("change",this.render,this); 
      
      //this.$el.off('pagebeforeshow'); 
    }

  });


