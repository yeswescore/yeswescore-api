var PlayerModel = Backbone.Model.extend({
	  
	    urlRoot: appConfig.serviceURLPlayers,
	    
	    mode: '',
	        
	    initialize: function () {	
			

	    },
	    
	
		login: function (mail, password) {
		
				return $.ajax({
		            dataType: 'json',
		            url: appConfig.serviceAuth,
		            type:'POST',
		            data: {
		              email: mail,
		              uncryptedPassword: password	              
		            },
		            success: function (data) {
		              	              
		              console.log('data result Login',data);
		              
		              //Display Results
		              //TODO : prevoir code erreur
		              if (data.id !== undefined) {
		            	  $('span.success').html('Login OK '+data.id).show();
		            	
		            	
		            	  //window.localStorage.setItem("Owner",JSON.stringify(data));  
		            	  
		            	  players = new PlayersCollection('me');
            			  players.create(data);
		            	  
		              }
		              else 
		            	  $('span.success').html('Erreur').show();
		              
		              

					  //FIXME : on redirige sur la page moncompte
		              
		            }
		          });		
		
		
		},
	     
	    sync: function (method, model, options) {
	    	
	    	console.log('sync '+method+" model "+model+ " url "+model.url());
	    	
	    	
	    	/*
	    	//|| method === 'update'
	        if (method === 'create') {

				console.log('player id:',this.get('playerid'));

				//si pas de Id
	        	if (this.get('playerid') === undefined)
	        	{

		          return $.ajax({
		            dataType: 'json',
		            url: model.url(),
		            type:'POST',
		            data: {
		              nickname: (this.get('nickname') || ''),
		              name: (this.get('name') || ''),
		              rank: (this.get('rank') || ''),
		              email: (this.get('email') || ''),
		              uncryptedPassword: (this.get('password') || ''),
		              club: (this.get('club') || '')		              
		            },
		            success: function (data) {
		              	              
		              console.log('data result Player',data);
		              
		              //Display Results
		              //TODO : prevoir code erreur
		              if (data.id !== null)
		            	  $('span.success').html('Enregistrement OK '+data.id).show();
		              else 
		            	  $('span.success').html('Erreur').show();
		              
		              //FIXME : recup id et token = player ok
		              //On fixe dans localStorage
		              if (data.token !== null) {
		                data.password='';
		              	window.localStorage.setItem("Owner",JSON.stringify(data));
		              }
		              else 
		              	console.log('Erreur Creation User par defaut');
		              
		            },
		            error: function (xhr, ajaxOptions, thrownError) {
        				
        				//if creation of user fails, we create a temp player
        				console.log('Erreur on crée un faux');
        				
        				store = new window.Store('Owner');
        				data = new Player({nickname: '',name: '',rank: '',password:'',club: '',token: ''}); 
        				store.createIndex(data);
        				//window.localStorage.setItem("Owner",JSON.stringify(data));
        				
      				}
		          });
	        	}
	        	//Update
	        	else 
	        	{
	        	
	        			/////////////////////////////////////////////////
	        	
		        		console.log('url update',appConfig.serviceURLPlayers+(this.get('playerid') || '')+'/?playerid='+(this.get('playerid') || '')+'&token='+(this.get('token') || ''));
		        		
		        		var dataSend = {
					          id: (this.get('playerid') || ''),   
				              nickname: (this.get('nickname') || ''),
				              name: (this.get('name') || ''),
				              email: (this.get('email') || ''),				              
				              rank: (this.get('rank') || ''),
				              idlicense: (this.get('idlicense') || ''),
				              games: [],
				              token:(this.get('token') || '')
				            };

							//si  mot de passe defini
				           if (this.get('password') !== '') {			     
				           	 dataSend.uncryptedPassword = this.get('password');			           	 
				           }	

							// si club non nul
				           if (this.get('clubid') !== '') {			     
				           	 dataSend.club = {id:(this.get('clubid') || undefined)};
				           }
				            
				       console.log('dataSend',dataSend);
		        		
		        		return $.ajax({
				            dataType: 'json',
				            url: appConfig.serviceURLPlayers+(this.get('playerid') || '')+'/?playerid='+(this.get('playerid') || '')+'&token='+(this.get('token') || ''),
				            type:'POST',
				            data: dataSend,
				            success: function (data) {
				              	              
				              console.log('data result Player',data);
				              
				              //Display Results
				              //TODO : prevoir code erreur
				              $('span.success').html('MAJ OK '+data.id).show();
	
							 if (data.id!==undefined ) {
				             
				              //On met à jour le local storage
				             
				              	window.localStorage.removeItem("Owner");
				              	window.localStorage.setItem("Owner",JSON.stringify(data));
				              	
				              	}
				              
				            }
				          });	        		
	        		
	        	}
		          
	          
	          
	        } 
	        */
			
			//window.localStorage.setItem("Owner",JSON.stringify(new PlayerModel()));
	       
	        return Backbone.sync(method, model, options); 
	        
	      },
	      
	    	   
	    
	    defaults: {   
		    name: "",
			nickname: "",
			rank: "NC",
			type: "default",
			games: [],
			club: {id: "",name: ""},
			dates: {update: "",creation:new Date()},
			location: {currentPos: [0,0]},
			updated_at : new Date()			
	    }
	  
	 
  });

  
  
