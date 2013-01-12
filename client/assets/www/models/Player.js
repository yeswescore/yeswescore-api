define(['jquery', 'underscore', 'backbone'],
function($, _, Backbone){

  var Player = Backbone.Model.extend({
	  
	    urlRoot: serviceURLPlayers,
	    
	    mode: '',
	        
	    initialize: function () {	
			
	    },
	    
	
	     
	    sync: function (method, model, options) {
	    	
	    	//console.log('sync '+method+" model "+model);
	    	
	    	
	        if (method === 'create' || method === 'update') {

	        	if (this.get('id')==='')
	        	{
		          return $.ajax({
		            dataType: 'json',
		            url: model.url(),
		            type:'POST',
		            data: {
		              nickname: (this.get('nickname') || ''),
		              name: (this.get('name') || ''),
		              rank: (this.get('rank') || ''),
		              password: (this.get('password') || ''),
		              club: (this.get('club') || '')		              
		            },
		            success: function (data) {
		              	              
		              //console.log('data result Player',data);
		              
		              //Display Results
		              //TODO : prevoir code erreur
		              if (data.id !== null)
		            	  $('span.success').html('Enregistrement OK '+data.id).show();
		              else 
		            	  $('span.success').html('Erreur').show();
		              
		              //FIXME : recup id et token = player ok
		              //On fixe dans localStorage
		              if (data.token !== null)
		              	window.localStorage.setItem("Owner",JSON.stringify(data));
		              else 
		              	console.log('Erreur Creation User par defaut');
		              
		            }
		          });
	        	}
	        	//Update
	        	else 
	        	{
	        		return $.ajax({
			            dataType: 'json',
			            url: serviceURLPlayers+(this.get('id') || '')+'/?playerid='+(this.get('id') || '')+'&token='+(this.get('token') || ''),
			            type:'POST',
			            data: {
				          id: (this.get('id') || ''),   
			              nickname: (this.get('nickname') || ''),
			              name: (this.get('name') || ''),
			              rank: (this.get('rank') || ''),
			              club: (this.get('club') || null),
			              games: [],
			              password: (this.get('password') || ''),	
			              token:(this.get('token') || '')
			            },
			            success: function (data) {
			              	              
			              //console.log('data result Player',data);
			              
			              //Display Results
			              //TODO : prevoir code erreur
	
			              $('span.success').html('MAJ OK').show();
			             
			              //On met à jour le local storage
			              window.localStorage.removeItem("Owner");
			              window.localStorage.setItem("Owner",JSON.stringify(data));
			              
			            }
			          });	        		
	        		
	        	}
		          
	          
	          
	        } 
	        else {
	        	
	        	 var params = _.extend({
	                 type: 'GET',
	                 dataType: 'json',
	                 url: model.url(),
	                 processData:false
	             }, options);

	             return $.ajax(params);
	             
	        }

	       
	        
	        
	      },
	    	   
	    
	    defaults: {     
    
	    }
	  
	 
  });
  return Player;
  
  
});