var GameListView = Backbone.View.extend({

    el:"#index",

    listview:"#listGamesView",
    
    mode:'',

    initialize:function(data) {

        this.gameListTemplate = _.template(tpl.get('gameListTemplate'));
        this.gameListViewTemplate = _.template(tpl.get('gameListViewTemplate'));
        
        $.mobile.showPageLoadingMsg();
        
        console.log('gamelist mode ', data);
        
        if (data.mode==='club') {
        	this.games = new Games();
        	this.games.setMode('clubid',data.clubid);	
        }
        else if (data.mode==='me') {
        	this.games = new Games();
        	this.games.setMode('me',data.id);	
        }        
        else
        	this.games = new GamesFollow();
        	
        this.mode = data.mode;
        
        this.games.fetch();

        this.render();
        
        //this.games.on( 'all', this.renderList, this );
        this.games.on("all", this.renderList, this);
        //this.games.findAll();
        
        //$.mobile.showPageLoadingMsg();
        
    },
    
    events: {
        "keyup input#search-basic": "search"
    },

    search:function() {
     
      //FIXME if($("#search-basic").val().length>3) {
        
    	  var q = $("#search-basic").val();
    	  
    	  $(this.listview).empty();
    	  
          //gamesList = new GamesSearch();
          //gamesList.setQuery(q);
          //gamesList.fetch();
          this.games.setMode('player',q);
		  this.games.fetch();          
          
          $(this.listview).html(_.template(this.gameListViewTemplate({games:this.games.toJSON(),query:q})));    	

          $(this.listview).listview('refresh');
       //}
          
          
          return this;    
      
    },

    //render the content into div of view
    render: function(){

      this.$el.html(_.template(this.gameListTemplate({mode:this.mode})));
      //Trigger jquerymobile rendering
      this.$el.trigger('pagecreate');
      
      //return to enable chained calls
      return this;
    },

    renderList: function(query) {
    
     console.log('renderList');
    	
      $(this.listview).html(_.template(this.gameListViewTemplate({games:this.games.toJSON(),query:' '})));    	

      $(this.listview).listview('refresh');
      
      $.mobile.hidePageLoadingMsg();
           
      return this;
    },
    

    onClose: function(){
      //Clean
      this.undelegateEvents();
      this.games.off("all",this.renderList,this);
      
    }

});

