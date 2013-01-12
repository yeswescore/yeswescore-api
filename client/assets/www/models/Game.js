define(['jquery', 'underscore', 'backbone'],
function($, _, Backbone){

  var Game = Backbone.Model.extend({
	  
	    urlRoot: serviceURLGames,
	        
	    initialize: function () {	
			
	    },
	    
	    setSets: function (s) {	
			this.sets=s;
	    },

	    sync: function (method, model, options) {
	    	
	    	
	    	//console.log('method Game',method);
	    	
	        if (method === 'create') {
	        	

          	  var team1_json='';
          	  var team2_json='';
          	  
          	  //if player exists / not exists	
         	  
          	  if (this.get('team1_id') === '' ) team1_json = {name:this.get('team1')};
          	  else team1_json = {id:this.get('team1_id')};

          	  if (this.get('team2_id') === '' ) team2_json = {name:this.get('team2')};
          	  else team2_json = {id:this.get('team2_id')};    
          	  
	          var tmp = {
		              //playerid: (this.get('playerid') || ''),
		              //token: (this.get('token') || ''),
		              teams:[{id:null,players:[team1_json]},
		                     {id:null,players:[team2_json]}],
		              city: (this.get('city') || '')
		            };
	          
	          console.log('tmp Game POST',JSON.stringify(tmp));          	  
          	        		
	        	
	          return $.ajax({
	            dataType: 'json',
	            url: model.url()+'?playerid='+(this.get('playerid') || '')+'&token='+(this.get('token') || ''),
	            type:'POST',
	            data: {
	              //FIXME : BUG player_id au lieu de owner	
	              //playerid: (this.get('playerid') || ''),
	              //token: (this.get('token') || ''),
	              
	              teams:[{id:null,players:[team1_json]},
	                     {id:null,players:[team2_json]}],
	              city: (this.get('city') || '')
	            },
	            success: function (result) {
	              // put your code after the game is saved/updated.

		          console.log('data result Game',result);	            	
		          
		          //FIXME : on redirige sur 
		          //console.log('navigate '+'#games/'+result.id);
		          window.location.href ='#games/'+result.id;
		          
		          
		          
	            }
	          });
	        }
	        else if (method === 'update') {	
	        	
	          return $.ajax({
	            dataType: 'json',
	            url: model.url()+'?playerid='+(this.get('playerid') || '')+'&token='+(this.get('token') || ''),
	            type:'POST',
	            data: {
	              //FIXME : BUG player_id au lieu de owner	
	              //playerid: (this.get('playerid') || ''),
	              //token: (this.get('token') || ''),
	              
	              teams:[{id:null,points:(this.get('team1_points') || ''),players:[{id:this.get('team1_id')}]},
	                     {id:null,points:(this.get('team2_points') || ''),players:[{id:this.get('team2_id')}]}],
	               //integrer les points      
	              sets: (this.get('sets') || '')
	            },
	            success: function (result) {
	              // put your code after the game is saved/updated.

		          //console.log('data update Game',result);	            	
		          
		          
	            }
	          });	        
	        
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
	        id: null,
	        date_creation: null,
	        date_start: null,
	        date_end: null,
	        pos : null,
	        city: "",
	        type: "singles",
	        sets: "0/0",
	        score: "0/0",
	        status: "",
	        teams: null    
	    }
	  
	 
  });
  return Game;
  
});