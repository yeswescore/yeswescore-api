var ClubView = Backbone.View.extend({

    el:"#index",

    initialize:function() {
    	
    	this.clubViewTemplate = _.template(tpl.get('clubViewTemplate'));
    	
        this.club = new ClubModel({id:this.id});
        this.club.fetch(); 
    	
    	//this.render();
    	
        this.club.on( 'change', this.render, this );

    },
    
    events: {
        'vclick #followButton': 'follow'
    },  
    
    
    follow : function() {
    	
       this.clubsfollow = new ClubsCollection('follow');

       this.clubsfollow.create(this.club);

    },      

    //render the content into div of view
    render: function(){
    	
    	
      //this.el is the root element of Backbone.View. By default, it is a div.
      //$el is cached jQuery object for the view's element.
      //append the compiled template into view div container   	
      this.$el.html(_.template(this.clubViewTemplate({
                                    club:this.club.toJSON()
                                    })));
      
      $.mobile.hidePageLoadingMsg();      
                                    
      //Trigger jquerymobile rendering
      //var thisel=this.$el;
      //this.$el.on( 'pagebeforeshow',function(event){
      //   thisel.trigger('pagecreate');
      //});
      //return to enable chained calls

      this.$el.trigger('pagecreate');
      
      return this;
    },


    

    onClose: function(){
      //Clean
      this.undelegateEvents();
      this.club.off("change",this.render,this); 
      
      //this.$el.off('pagebeforeshow'); 
    }

  });
  


