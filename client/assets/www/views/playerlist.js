define(['jquery', 
        'underscore', 
        'backbone',
        'text!templates/playerSearchTemplate.html',
        'text!templates/playerListViewTemplate.html',             
        'models/Player',
        'models/Players'
        ],
function($, _, Backbone,playerSearchTemplate,playerListViewTemplate,Player,Players){

  var PlayerListView = Backbone.View.extend({

    el:"#index",

    listview:"#listPlayersView",

    initialize:function() {

        $.mobile.showPageLoadingMsg();
         
        if (this.id !== 'null') {
        	console.log('on demande les joueurs par club '+this.id);
        	
        	//Players = new Players();
        	Players.setMode('club',this.id);
    	  	Players.fetch();
        	
        	Players.on( 'all', this.renderList, this );
        }
        
        this.render();
        //this.renderList();
        
            $.mobile.hidePageLoadingMsg();
   
    },
    
    
    events: {
        "keyup input#search-basic": "search"
    },


    search:function() {
     
      //FIXME if($("#search-basic").val().length>3) {
        
    	  var q = $("#search-basic").val();
    	  
    	  //PlayersSearch.setQuery(q);
    	  //PlayersSearch.fetch();
          //$(this.listview).html(_.template(playerListViewTemplate,{players:PlayersSearch.toJSON(),query:q}));    	

          $(this.listview).listview('refresh');
       //}
      
    },

    //render the content into div of view
    render: function(){

      this.$el.html(_.template(playerSearchTemplate,{}));
      //Trigger jquerymobile rendering
      this.$el.trigger('pagecreate');

      //return to enable chained calls
      return this;
    },

    renderList: function(query) {
	
      $(this.listview).html(_.template(playerListViewTemplate,{players:Players.toJSON(),query:' '}));    	

      $(this.listview).listview('refresh');
  
      

      return this;
    },

    onClose: function(){
      //Clean
      this.undelegateEvents();
      Players.off("all",this.render,this);
      
    }

  });
  return PlayerListView;
});


