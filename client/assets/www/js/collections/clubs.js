var ClubsCollection = Backbone.Collection.extend({ 

	model:ClubModel, 
	
  	mode:'default',
  	
  	query:'',
	  
	//storeName : "club",	
	
	initialize: function (param) {

		if (param==='follow')
			this.storage = new Offline.Storage('clubsfollow', this);		
		else		
		this.storage = new Offline.Storage('clubs', this);	
		
	},	
	  
    url:function() {

	  if (this.mode === 'search')
        return appConfig.serviceURLClubs+'autocomplete/?q='+this.query;        
      else	
      	return appConfig.serviceURLClubs;
      
    },
    
	
	setMode:function(m,q) {
    	this.mode=m;
    	this.query=q;
    },
		
	
	//FIXME : if exists in localStorage, don't request
	
    sync: function(method, model, options) {
    	
    /*
   	 var params = _.extend({
         type: 'GET',
         dataType: 'json',
         url: model.url(),
         processData:false,
     }, options);

     return $.ajax(params);
     */
    	
		return Backbone.sync(method, model, options); 
        
    },
    
   
  });
  