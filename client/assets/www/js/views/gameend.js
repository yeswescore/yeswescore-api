var GameEndView = Backbone.View.extend({

    el:"#index",
    
    initialize:function() {
    	
    	this.gameEndTemplate = _.template(tpl.get('gameEndTemplate'));
    	
	   	//Owner = JSON.parse(window.localStorage.getItem("Owner"));
	   	
	   	this.players = new PlayersCollection("me");
		this.Owner = new PlayerModel(this.players.storage.findAll({local:true}));  

    	this.render();
        $.mobile.hidePageLoadingMsg(); 

    },
    
    
    events: {
        'submit form#frmEndGame':'endGame'
    },
    
    
      
    endGame: function (event) {
    	
        var privateNote = $('#privateNote').val(),
        fbNote = $('#fbNote').val();
        
        //Backbone.Router.navigate("/#games/"+game.id, true);
        
        alert(privateNote+' '+fbNote);
        
        return false;
      },     
    

    //render the content into div of view
    render: function(){

	   	this.$el.html(_.template(this.gameEndTemplate({playerid:Owner.id,token:Owner.token})));     
                                    
	   	this.$el.trigger('pagecreate');
      
	   	return this;
    },


   

    onClose: function(){
      //Clean
      this.undelegateEvents();

    }

  });



