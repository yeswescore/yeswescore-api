define(['jquery', 
        'underscore', 
        'backbone',
        'text!templates/playerViewTemplate.html',
        'models/Player',
        'models/Players'
        ],
function($, _, Backbone,playerViewTemplate,Player,Players,Owner){

  
	
  var PlayerView = Backbone.View.extend({

    el:"#index",

    initialize:function(options) {
    
    	this.follow = options.follow;
    	
        player = new Player({id:this.id});
        player.fetch(); 
    	
    	//this.render();

    	
    	player.on( 'change', this.render, this );

    },

    //render the content into div of view
    render: function(){
    
      /*FIXME : Prevoir le unfollow */
      if (this.follow === 'true') {
    		Players.follow(player);	
      }
    	
      this.$el.html(_.template(playerViewTemplate,{
                                    player:player.toJSON(),follow:this.follow
                                    }));
      
      $.mobile.hidePageLoadingMsg();      
                                    

      this.$el.trigger('pagecreate');
      
      return this;
    },



    onClose: function(){
      //Clean
      this.undelegateEvents();
      player.off("change",this.render,this); 
      
      //this.$el.off('pagebeforeshow'); 
    }

  });
  return PlayerView;
});


