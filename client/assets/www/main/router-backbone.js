define([
        'jquery',
        'underscore',
        'backbone',
        'models/Version', //majuscule !     
        'views/account',
        'views/club',    
        'views/game',
        'views/gameadd', 
        'views/gameend',         
        'views/index',        
        'views/player',
        'views/playerform',
        'views/playersignin', 
        'views/playerlist',                
        'jqm'
        ],
	function($, _, Backbone,VersionApp,AccountView,ClubView,GameView,GameAddView,GameEndView,IndexView,PlayerView,PlayerFormView,PlayerSigninView,PlayerListView) {

        var Router = Backbone.Router.extend({
        //define routes and mapping route to the function
        routes: {
            '':                                             'index',
            'games/add':									'gameAdd',
            'games/end':									'gameEnd',                       
            'games/:id':                               		'game',
            'players/list':                               	'playerList',  
            'players/club/:id':                             'playerListByClub',                        
            'players/form':                               	'playerForm',  
            'players/signin':                               'playerSignin',  
            'players/follow/:id':                           'playerFollow',    
            'players/nofollow/:id':                           'playerNoFollow',                                    
            'players/:id':                               	'player',
            'clubs/:id':                               		'club',            
            'account':										'account'	
        },
        
        
        initialize:function(options) {
        	
            var me=this;
            //Global Transition handler
            $("a").live("touch click",function(e) {
                me.setNextTransition(this);
            });
            
            
            /* Controle du numéro de Version */
            version = new VersionApp({id:versionClient});
            version.fetch();         
            version.on( 'change', this.versionControl, this );
            
        },
        
       
        
        versionControl: function(){
        	
        	versionGet = version.toJSON()[0].value;
        	
        	if (versionGet!==versionClient)
        		alert('Update zeScore please !');
        	
        },
        
        account:function() {
        	
            var accountView=new AccountView();
            zescore.appView.show(accountView);
            this.changePage(accountView);
            
            //$.mobile.showPageLoadingMsg();
                      
        },  
        
        changePage:function (view) {
            //Default
            var reverse=zescore.defaults.reverse;
            var transition=zescore.defaults.transition;
            //Get last transition information if exists
            if(zescore.nextTransition.type!=undefined) {
                if(zescore.nextTransition.reverse!=undefined) {
                    reverse=true;
                }
                transition=zescore.nextTransition.type;
            }
            $.mobile.changePage($(view.el), {
                                        transition:transition,
                                        changeHash:false,
                                        reverse:reverse
                                    });
        },        
        
        club:function(id) {
        	
            var clubView=new ClubView({id:id});
            zescore.appView.show(clubView);
            this.changePage(clubView);
            
            $.mobile.showPageLoadingMsg();
                      
        },

        index:function(lang){

            var indexView=new IndexView({lang:this.lang});
            zescore.appView.show(indexView);
            this.changePage(indexView);
            
        },

        game:function(id) {
        	
            var gameView=new GameView({id:id});
            zescore.appView.show(gameView);
            this.changePage(gameView);
            
            $.mobile.showPageLoadingMsg();
                      
        },

        gameAdd:function() {
        	
            var gameAddView=new GameAddView();
            zescore.appView.show(gameAddView);
            this.changePage(gameAddView);
            
            //$.mobile.showPageLoadingMsg();
                      
        },  
        
        gameEnd:function() {
        	
            var gameEndView=new GameEndView();
            zescore.appView.show(gameEndView);
            this.changePage(gameEndView);
            
            //$.mobile.showPageLoadingMsg();
                      
        },  
        
        player:function(id) {
        	
            var playerView=new PlayerView({id:id, follow:''});
            zescore.appView.show(playerView);
            this.changePage(playerView);
            
            $.mobile.showPageLoadingMsg();
                      
        },
        
        
       playerFollow:function(id) {
        	
            var playerView=new PlayerView({id:id,follow:'true'});
            zescore.appView.show(playerView);
            this.changePage(playerView);
            
            $.mobile.showPageLoadingMsg();
                      
        },

       playerNoFollow:function(id) {
        	
            var playerView=new PlayerView({id:id,follow:'false'});
            zescore.appView.show(playerView);
            this.changePage(playerView);
            
            $.mobile.showPageLoadingMsg();
                      
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
          zescore.nextTransition.type=$(el).attr("data-transition");
          zescore.nextTransition.reverse=$(el).attr("data-reverse");
        }

    });

    return Router;

});




