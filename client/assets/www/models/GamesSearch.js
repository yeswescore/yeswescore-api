define(['jquery', 'underscore', 'backbone','models/Game'],
function($, _, Backbone,Game){

  var GamesSearch = Backbone.Collection.extend({ 
	  
    url:function() {
      return serviceURLGames+"?q="+this.query;
    },
    
    setQuery:function(q) {
    	this.query=q;
    },
    
    initialize : function(){
        this.query = '';
        this.changeSort("player");
    },
    
	model:Game, 
	
	//FIXME localStorage: new Backbone.LocalStorage("games"), 
	
    sync: function(method, model, options) {
        var params = _.extend({
            type: 'GET',
            dataType: 'json',
            url: model.url(),
            processData:false
        }, options);

        return $.ajax(params);
    },
    
    comparator: function (property) {
    	return selectedStrategy.apply(Game.get(property));
    },
    
    strategies: {
        city: function (item) { return [item.get("city")]; }, 
        status: function (item) { return [item.get("status")]; },
        player: function (item) { return [item.get("teams[0].players[0].name"),item.get("teams[1].players[0].name")]; },        
    },
    
    changeSort: function (sortProperty) {
        this.comparator = this.strategies[sortProperty];
    }

  });
  
  return new GamesSearch();
});
