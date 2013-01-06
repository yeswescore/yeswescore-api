define(['jquery', 'underscore', 'backbone','models/Player'],
function($, _, Backbone,Player){

  var PlayersSearch = Backbone.Collection.extend({ 
	  
    url:function() {
      return serviceURLGames+"?q="+this.query;
    },
    
    setQuery:function(q) {
    	this.query=q;
    },
    
    initialize : function(){
        this.query = '';
        this.changeSort("id");
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
        id: function (item) { return [item.get("id")]; }
    },
    
    changeSort: function (sortProperty) {
        this.comparator = this.strategies[sortProperty];
    }

  });
  
  return new PlayersSearch();
});
