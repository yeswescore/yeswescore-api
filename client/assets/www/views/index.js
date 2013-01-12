define(['jquery', 
        'underscore', 
        'backbone',
        'text!templates/indexViewTemplate.html',
        'text!templates/gameListViewTemplate.html',        
        'models/Games',       
        'models/GamesSearch',
        'models/Player'
        ],
function($, _, Backbone,indexViewTemplate,gameListViewTemplate,Games,GamesSearch,Player){

  var IndexView = Backbone.View.extend({

    el:"#index",

    listview:"#listGamesView",

    initialize:function() {

        $.mobile.showPageLoadingMsg();
  
        Games.fetch();        
 
        this.render();
        this.renderList();

        Games.on( 'all', this.renderList, this );
        
        //Controle si localStorage contient Owner
        var Owner = window.localStorage.getItem("Owner");
        
        if (Owner === null) {
        	//alert('Pas de owner');
        	//Creation user à la volée
            player = new Player();
            player.save();
        }
        
        
    },
    
    events: {
        "keyup input#search-basic": "search"
    },

    search:function() {
     
      //FIXME if($("#search-basic").val().length>3) {
        
    	  var q = $("#search-basic").val();
    	  
    	  GamesSearch.setQuery(q);
    	  GamesSearch.fetch();
    	  
          $(this.listview).html(_.template(gameListViewTemplate,{games:GamesSearch.toJSON(),query:q}));    	

          $(this.listview).listview('refresh');
       //}
      
    },

    //render the content into div of view
    render: function(){
	  //this.el is the root element of Backbone.View. By default, it is a div.
      //$el is cached jQuery object for the view's element.
      //append the compiled template into view div container
      this.$el.html(_.template(indexViewTemplate,{}));
      //Trigger jquerymobile rendering
      this.$el.trigger('pagecreate');

      //return to enable chained calls
      return this;
    },

    renderList: function(query) {
	
      $(this.listview).html(_.template(gameListViewTemplate,{games:Games.toJSON(),query:' '}));    	

      $(this.listview).listview('refresh');
      $.mobile.hidePageLoadingMsg();
      

      return this;
    },

    onClose: function(){
      //Clean
      this.undelegateEvents();
      Games.off("all",this.render,this);
      
    }

  });
  return IndexView;
});


