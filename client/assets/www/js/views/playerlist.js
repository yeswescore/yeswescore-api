var PlayerListView = Backbone.View.extend({

    el:"#index",
    listview:"#listPlayersView",

    initialize:function() {
    	
    	this.playerListViewTemplate = _.template(tpl.get('playerListViewTemplate'));
    	this.playerSearchTemplate = _.template(tpl.get('playerSearchTemplate'));    	
    	
        $.mobile.showPageLoadingMsg();
         
        if (this.id !== 'null') {
        	console.log('on demande les joueurs par club '+this.id);
        	
        	this.players = new Players();
        	this.players.setMode('club',this.id);
    	  	this.players.fetch();
        	
        	this.players.on( 'all', this.renderList, this );
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
    	  
    	  this.players.setMode('search',q);
    	  //PlayersSearch.fetch();
          $(this.listview).html(_.template(playerListViewTemplate,{players:this.players.toJSON(),query:q}));    	

          $(this.listview).listview('refresh');
       //}
      
    },

    //render the content into div of view
    render: function(){

      this.$el.html(_.template(this.playerSearchTemplate({})));
      //Trigger jquerymobile rendering
      this.$el.trigger('pagecreate');

      //return to enable chained calls
      return this;
    },

    renderList: function(query) {
	
      $(this.listview).html(_.template(this.playerListViewTemplate({players:this.players.toJSON(),query:' '})));    	

      $(this.listview).listview('refresh');
  
      

      return this;
    },

    onClose: function(){
      //Clean
      this.undelegateEvents();
      this.players.off("all",this.render,this);
      
    }

  });



