define(['jquery', 
        'underscore', 
        'backbone',
        'text!templates/clubViewTemplate.html',
        'models/Club'
        ],
function($, _, Backbone,clubViewTemplate,Club){

  
	
  var ClubView = Backbone.View.extend({

    el:"#index",

    initialize:function() {
    	
        club = new Club({id:this.id});
        club.fetch(); 
    	
    	//this.render();
    	
    	club.on( 'change', this.render, this );

    },

    //render the content into div of view
    render: function(){
    	
    	
      //this.el is the root element of Backbone.View. By default, it is a div.
      //$el is cached jQuery object for the view's element.
      //append the compiled template into view div container   	
      this.$el.html(_.template(clubViewTemplate,{
                                    club:club.toJSON()
                                    }));
      
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


    /*
    renderList: function() {
      $.mobile.hidePageLoadingMsg()

      
      $(this.listentries).html(_.template(listEntriesViewTemplate,{
                                    entries:Entries,
                                    labels:Labels.attributes
                                  }));
     

      this.$el.trigger('pagecreate');

      return this;
    },
     */

    onClose: function(){
      //Clean
      this.undelegateEvents();
      club.off("change",this.render,this); 
      
      //this.$el.off('pagebeforeshow'); 
    }

  });
  return ClubView;
});


