var IndexView = Backbone.View.extend({

    el:"#index",

    listview:"#listGamesView",

    initialize:function() {

    	//template:_.template($('#home').html()),

        //this.indexViewTemplate = _.template($('#indexViewTemplate').html());
        //this.gameListViewTemplate = _.template($('#gameListViewTemplate').html());
    	
        this.indexViewTemplate = _.template(tpl.get('indexViewTemplate'));
        this.gameListViewTemplate = _.template(tpl.get('gameListViewTemplate'));
  
  		//we capture config from bootstrap
  		//FIXME: put a timer
        //this.config = new Config();
        //this.config.fetch();
        
        this.games = new GamesCollection();
        
        this.games.fetch();
        
        //console.log('on pull');
		//this.games.storage.sync.pull();   
        
        this.render();
        
        //console.log('this.games in cache size ',this.games.length);
        
        if (this.games.length>0) {
         	$.mobile.hidePageLoadingMsg();
        	this.renderList();
        }
        else 		
        	this.games.on( 'all', this.renderList, this ); 
        
        
        //Controle si localStorage contient Owner
        //var Owner = window.localStorage.getItem("Owner");

        var Owner;
        if (Owner === undefined) {
        	//alert('Pas de owner');
        	//Creation user à la volée
        	
        	//debug si pas de Owner, on init le localStorage
        	window.localStorage.clear();
        	
            //player = new PlayerModel();
            //player.save();
            players = new PlayersCollection('me');
            players.create();

        }
  
       
        
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

      this.$el.html(_.template(this.indexViewTemplate(),{}));
      //Trigger jquerymobile rendering
      this.$el.trigger('pagecreate');
      
      //return to enable chained calls
      return this;
    },

    renderList: function(query) {
    	
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

