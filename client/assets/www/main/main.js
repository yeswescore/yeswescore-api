require.config({
    //path mappings for module names not found directly under baseUrl
    paths: {
        jquery:         '../scripts/vendor/jquery-1.7.1.min',
        jqm:            '../scripts/vendor/jquery.mobile-1.1.1.min',
        //jqmacomplete:   '../scripts/vendor/jqm.autoComplete-1.5.0',  
        underscore:     '../scripts/vendor/lodash.min',
        backbone:       '../scripts/vendor/backbone-min-amd',
        backbone_poller:'../scripts/vendor/backbone.poller',        
        //backbonestore:'../scripts/vendor/backbone.localStorage', 
        //backboneoff:  '../scripts/vendor/backbone_offline',     
        //backbonedual: '../scripts/vendor/backbone.dualstorage',             
        //backbonesync: '../scripts/vendor/backbone.localstoragesync',        
        text:           '../scripts/vendor/text',
        jqmr :          '../scripts/vendor/jquery.mobile.router.min',
        models:         '../models',
        views:          '../views',
        templates:      '../templates'
    }

});

//1. load router.js,
define(['jquery','underscore', 'backbone', 'router-backbone','appview','jqm-config'],function($, _, Backbone,Router,AppView) {
    $(function(){
            
        window.zescore = window.zescore || {
            appView:AppView,
            routers:{
                router:new Router()
            },
            nextTransition: {
                type:"",
                reverse:false,
            },
            defaults:{
                lang: "fr",
                transition: "slide",
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

        Backbone.history.start();
    });
    
});

