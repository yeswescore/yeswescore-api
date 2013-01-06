define(['jquery', 
        'underscore', 
        'backbone',
        'text!templates/accountViewTemplate.html'
        ],
function($, _, Backbone,accountViewTemplate,Owner){

  
	
  var AccountView = Backbone.View.extend({

    el:"#index",

    initialize:function() {
    
    
    	Owner = JSON.parse(window.localStorage.getItem("Owner"));
    	
    	this.render();
        

    },

    //render the content into div of view
    render: function(){
    	
    	
      //this.el is the root element of Backbone.View. By default, it is a div.
      //$el is cached jQuery object for the view's element.
      //append the compiled template into view div container
      console.log('club',Owner.club);
    	
      this.$el.html(_.template(accountViewTemplate,{Owner:Owner}));     
      
      $.mobile.hidePageLoadingMsg(); 
                                    
      this.$el.trigger('pagecreate');
      
      
      return this;
    },


   

    onClose: function(){
      //Clean
      this.undelegateEvents();

    }

  });
  return AccountView;
});


