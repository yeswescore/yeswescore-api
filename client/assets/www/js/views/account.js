var AccountView = Backbone.View.extend({

    el:"#index",
    
    initialize:function() {
    	
		
    	this.accountViewTemplate = _.template(tpl.get('accountViewTemplate'));
    
    	Owner = JSON.parse(window.localStorage.getItem("Owner"));
    	
    	this.render();

    },

    //render the content into div of view
    render: function(){

      //console.log('render account Owner ',Owner);
      //console.log('render account Owner.Club  ',Owner.club);
      //console.log('render account Owner.Club.id  ',Owner.club.id);
      
        
      $(this.el).html(_.template(this.accountViewTemplate({Owner:Owner})));
      
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



