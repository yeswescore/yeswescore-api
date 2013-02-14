var PlayerSigninView = Backbone.View.extend({

    el:"#index",
    

    initialize:function() {
    	
    	this.playerSigninTemplate = _.template(tpl.get('playerSigninTemplate'));
	   	 	
	    this.render();
	    	
        $.mobile.hidePageLoadingMsg(); 

    },
    
    
    events: {
        'submit form#frmSigninPlayer':'signin'
    },
      
    
    signin: function (event) {
    	
        var email = $('#email').val();
        var password = $('#password').val();        

        console.log('test authentification avec '+email);
        
        this.player = new Player();
        this.player.login(email,password);
        
        return false;
      },     
    

    //render the content into div of view
    render: function(){
    	
      this.$el.html(_.template(this.playerSigninTemplate({})));     
                                    
      this.$el.trigger('pagecreate');
      
      return this;
    },


    onClose: function(){
      //Clean
      this.undelegateEvents();

    }

  });



