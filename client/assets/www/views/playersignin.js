define(['jquery', 
        'underscore', 
        'backbone',
        'text!templates/playerSigninTemplate.html'
        ],
function($, _, Backbone,playerSigninTemplate){

  
  var PlayerSigninView = Backbone.View.extend({

    el:"#index",
    

    initialize:function() {
    	
	   	 	
	    this.render();
	    	
        $.mobile.hidePageLoadingMsg(); 

    },
    
    
    events: {
        'submit form#frmSigninPlayer':'signin'
    },
      
    
    signin: function (event) {
    	
        var name = $('#name').val();
           

        console.log('test authentification');
        
        return false;
      },     
    

    //render the content into div of view
    render: function(){
    	
      this.$el.html(_.template(playerSigninTemplate,{}));     
                                    
      this.$el.trigger('pagecreate');
      
      return this;
    },


   

    onClose: function(){
      //Clean
      this.undelegateEvents();

    }

  });
  return PlayerSigninView;
});


