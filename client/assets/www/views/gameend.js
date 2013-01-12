define(['jquery', 
        //'jqmacomplete',
        'underscore', 
        'backbone',
        'text!templates/gameEndTemplate.html',
        'models/Game',
        'models/Player',        
        //'models/Games'
        ],
function($, _, Backbone,gameEndTemplate,Game,Player,Owner){

  
	
  var GameEndView = Backbone.View.extend({

    el:"#index",
    
    initialize:function() {
    	
	   	Owner = JSON.parse(window.localStorage.getItem("Owner"));

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

	   	this.$el.html(_.template(gameEndTemplate,{playerid:Owner.id,token:Owner.token}));     
                                    
	   	this.$el.trigger('pagecreate');
      
	   	return this;
    },


   

    onClose: function(){
      //Clean
      this.undelegateEvents();

    }

  });
  return GameEndView;
});


