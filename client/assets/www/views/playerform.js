define(['jquery', 
        'underscore', 
        'backbone',
        'text!templates/playerFormTemplate.html',
        'models/Player',
        'models/Club',
        'models/Clubs'
        ],
function($, _, Backbone,playerFormTemplate,Player,Owner,Club,Clubs){

  
  var PlayerFormView = Backbone.View.extend({

    el:"#index",
    
    listview:"#suggestions",
    
    clubs:null,

    initialize:function() {
    	
    	Owner = JSON.parse(window.localStorage.getItem("Owner"));
			
        player = new Player({id:Owner.id});
        player.fetch(); 
    	
    	this.renderPlayer();
    	
    	player.on( 'change', this.renderPlayer, this );			
  	
      	 	
        $.mobile.hidePageLoadingMsg(); 

    },
    
    
    events: {
        'submit form#frmAddPlayer':'add',
        'keyup #club': 'updateList'
    },
    
    updateList: function (event) {
    
       var q = $("#club").val();
    	    
      console.log('updateList');	  
    	  
   		//Utiliser ClubListViewTemplate
      $(this.listview).html('<li><a href="" data-transition="slide">Club 1</a></li>');    	

      $(this.listview).listview('refresh');
    
    },
    
          
    add: function (event) {
    	
        var name = $('#name').val(),
        	nickname = $('#nickname').val(),
            password = $('#password').val(),
            rank = $('#rank').val(),
            id = $('#id').val(),
            token = $('#token').val(),
            club = $('#club').val(),            
            player = null;
           

         player = new Player({
        	id: id,
        	token: token,
         	name: name,
        	nickname: nickname,
            password: password,
            rank: rank,
            club: club
          });
         
         
         //console.log('player form envoie '+player);
         
         player.save();
        
         //Backbone.Router.navigate('#players/add');
        
        return false;
      },     
    

    //render the content into div of view
    renderPlayer: function(){
    	
      this.$el.html(_.template(playerFormTemplate,{player:player.toJSON(),playerid:Owner.id,token:Owner.token}));     
                                    
      this.$el.trigger('pagecreate');
      
      return this;
    },


   

    onClose: function(){
      //Clean
      this.undelegateEvents();
      player.off("change",this.renderPlayer,this); 

    }

  });
  return PlayerFormView;
});


