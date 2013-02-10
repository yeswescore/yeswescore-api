

var AppRouter = Backbone.Router.extend({
  routes: {
     '':                                            'index',
    'games/me/:id':									'gameMe',     
    'games/add':									'gameAdd',
    'games/follow':									'gameFollow',    
    'games/end/:id':								'gameEnd', 
    'games/club/:id':								'gameClub',                           
    'games/:id':                               		'game',
    'players/list':                               	'playerList',  
    'players/club/:id':                             'playerListByClub',                        
    'players/form':                               	'playerForm',  
    'players/signin':                               'playerSignin',  
    'players/follow':                           	'playerFollow',      
    //'players/follow/:id':                           'playerFollow',    
    //'players/nofollow/:id':                         'playerNoFollow',                                    
    'players/:id':                               	'player',
    'clubs/:id':                               		'club',            
    'account':										'account'	
  },
  
  
  initialize:function(options) {
  	
      var me=this;
      //Global Transition handler
      $("a").live("touch vclick",function(e) {
          me.setNextTransition(this);
      });
     
  },
  
  
  account: function() {

    var accountView=new AccountView();
    zescore.appView.show(accountView);
    this.changePage(accountView);
	
  },  
  
  club:function(id) {
  	
      var clubView=new ClubView({id:id});
      zescore.appView.show(clubView);
      this.changePage(clubView);
      
      ////$.mobile.showPageLoadingMsg();
                
  },  
  
  index: function() {
	  
	var indexView=new IndexView();
	zescore.appView.show(indexView);
	this.changePage(indexView);
	
	//$.mobile.showPageLoadingMsg();
  },
  
  
  game:function(id) {
  	
      var gameView=new GameView({id:id});
      zescore.appView.show(gameView);
      this.changePage(gameView);
      
      //$.mobile.showPageLoadingMsg();
                
  },

  gameAdd:function() {
  	
      var gameAddView=new GameAddView();
      zescore.appView.show(gameAddView);
      this.changePage(gameAddView);
      
      ////$.mobile.showPageLoadingMsg();
                
  },  
  
  gameEnd:function() {
  	
      var gameEndView=new GameEndView();
      zescore.appView.show(gameEndView);
      this.changePage(gameEndView);
      
      ////$.mobile.showPageLoadingMsg();
                
  },  

  gameFollow:function() {
  	
      var gameFollowView=new GameFollowView();
      zescore.appView.show(gameFollowView);
      this.changePage(gameFollowView);
      
      ////$.mobile.showPageLoadingMsg();
                
  },


  gameMe:function(id) {
  	
      var gameListView=new GameListView({mode:'me',id:id});
      zescore.appView.show(gameListView);
      this.changePage(gameListView);
      
                
  },
  
  gameClub:function(id) {
  	
      var gameListView=new GameListView({mode:'club',clubid:id});
      zescore.appView.show(gameListView);
      this.changePage(gameListView);
      
                
  },
  
  player:function(id) {
  	
      var playerView=new PlayerView({id:id, follow:''});
      zescore.appView.show(playerView);
      this.changePage(playerView);
      
      //$.mobile.showPageLoadingMsg();
                
  },
  
  
 playerFollow:function(id) {
  	
      var playerFollowView=new PlayerFollowView();
      zescore.appView.show(playerFollowView);
      this.changePage(playerFollowView);
      
      //$.mobile.showPageLoadingMsg();
                
  },

 playerNoFollow:function(id) {
  	
      var playerView=new PlayerView({id:id,follow:'false'});
      zescore.appView.show(playerView);
      this.changePage(playerView);
      
      //$.mobile.showPageLoadingMsg();
                
  },
  
  playerForm:function() {
  	
      var playerFormView=new PlayerFormView();
      zescore.appView.show(playerFormView);
      this.changePage(playerFormView);
     
  }, 

  playerList:function() {
  	
      var playerListView=new PlayerListView();
      zescore.appView.show(playerListView);
      this.changePage(playerListView);
     
  }, 

  playerListByClub:function(id) {
  	
      var playerListView=new PlayerListView({id:id});
      zescore.appView.show(playerListView);
      this.changePage(playerListView);
     
  }, 

  playerSignin:function() {
  	
      var playerSigninView=new PlayerSigninView();
      zescore.appView.show(playerSigninView);
      this.changePage(playerSigninView);
     
  },         
  
  setNextTransition:function(el) {
      //zescore.nextTransition.type=$(el).attr("data-transition");
      //zescore.nextTransition.reverse=$(el).attr("data-reverse");
    },
  
  
  changePage:function (page) {
	  
	  
      //Default
	  /*
      var reverse=zescore.defaults.reverse;
      var transition=zescore.defaults.transition;
      //Get last transition information if exists
      if(zescore.nextTransition.type!=undefined) {
          if(zescore.nextTransition.reverse!=undefined) {
              reverse=true;
          }
          transition=zescore.nextTransition.type;
      }*/
	  
      $.mobile.changePage($(page.el), {
                                  //transition:transition,
    	  						  transition:'none',
    	  						  changeHash:false,
                                  //reverse:reverse
    	  						  reverse:false
                              });
      

  }, 

  
  /*
  changePage: function (page) {
    $(page.el).attr('data-role', 'page');
    page.render();
    $('body').append($(page.el));
    $.mobile.changePage($(page.el), {
      changeHash: false,
      transition: 'none',
    });
  },*/
  

  historyCount: 0,
});



$(document).ready(function () {
  
  tpl.loadTemplates([
                     'accountViewTemplate',
                     'clubListViewTemplate','clubViewTemplate','clubListAutoCompleteViewTemplate',
                     'gameListTemplate','gameAddTemplate','gameEndTemplate','gameListViewTemplate','gamePrefTemplate','gameViewTemplate','gameViewScoreBoardTemplate','gameViewCommentListTemplate',
                     'indexViewTemplate',
                     'playerFormTemplate','playerListAutoCompleteViewTemplate','playerListViewTemplate','playerSearchTemplate','playerSigninTemplate','playerViewTemplate'
                    ], function() {
	  
	  var AppView = {

	    show:function(view) {
	        if (this.currentView){
	          this.currentView.close();
	        }

	        this.currentView = view;
	    }

	}  

	window.zescore = window.zescore || {
	      appView:AppView,
	      routers:{
	          router:new AppRouter()
	      },
	      nextTransition: {
	          type:"none",
	          reverse:false,
	  },
	  defaults:{
	      lang: "fr",
	      //transition: "slide",
	      transition: "none",
	      reverse:false
	   }
	  };
	  //Extend view
	  Backbone.View.prototype.close = function(){
	    this.off();
	    if (this.onClose){
	      this.onClose();
	    }
	  }	  
	  
	  
    //app = new AppRouter();
    
    Backbone.history.start();
  });
});
