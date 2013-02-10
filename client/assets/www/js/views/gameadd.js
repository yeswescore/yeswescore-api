var GameAddView = Backbone.View.extend({

    el:"#index",

    listview1:"#team1_suggestions",    
    listview2:"#team2_suggestions",

        
    initialize:function() {
    	
    	this.playerListAutoCompleteViewTemplate = _.template(tpl.get('playerListAutoCompleteViewTemplate'));
    	this.gameAddTemplate = _.template(tpl.get('gameAddTemplate'));
    	

	   	Owner = JSON.parse(window.localStorage.getItem("Owner"));

    	this.render();
        $.mobile.hidePageLoadingMsg(); 

    },
    
    
    events: {
        'submit form#frmAddGame':'addGame',
        'change #myself': 'updateTeam1',   
        'change #team1': 'changeTeam1',   
        'keyup #team1': 'updateListTeam1',        
        'keyup #team2': 'updateListTeam2',
        'click #team1_choice' : 'displayTeam1',
        'click #team2_choice' : 'displayTeam2'              
    },
    
    displayTeam1: function(li) {
    	

       	selectedId = $('#team1_choice:checked').val();
    	selectedName = $('#team1_choice:checked').next('label').text();
    	selectedRank = $('#team1_choice:checked').next('label').next('label').text();
    	//$('label[for=pre-payment]').text();
    	
    	$('#team1').val(selectedName);
    	$('#rank1').val(selectedRank);
    	$('#team1_id').val(selectedId); 
    	$('team1_error').html('');
    	
    	//console.log('selected '+selectedId+' '+selectedName);
    	
    	$(this.listview1).html('');
    	$(this.listview1).listview('refresh');
    	
    },
    
    displayTeam2: function(li) {

       	selectedId = $('#team2_choice:checked').val();
    	selectedName = $('#team2_choice:checked').next('label').text();
    	selectedRank = $('#team2_choice:checked').next('label').next('label').text();    	
    	//$('label[for=pre-payment]').text();
    	
    	$('#team2').val(selectedName);
    	$('#rank2').val(selectedRank);
    	$('#team2_id').val(selectedId); 
    	$('team2_error').html('');
    	
    	//console.log('selected '+selectedId+' '+selectedName);
    	
    	$(this.listview2).html('');
    	$(this.listview2).listview('refresh');
    	 
    },        
    
    fetchCollection: function() {
        if (this.collectionFetched) return;
        
        //this.usersCollection.fetch();
        /*
        this.userCollection.fetch({ url: serviceURLPlayers+'97e2f09341b45294f3cd2699', success: function() {
    	    console.log('usersCollection 2',this.userCollection);
    	}});        */
        //Games.fetch();
        
        this.collectionFetched = true;
     },

     changeTeam1: function() {
    	 
    	 if ( $('#myself').attr('checked') !== undefined) {
    	 
    	 	console.log($('#myself').attr('checked'));
    		 
    		 //Si Owner.name == : On update objet Player
    		 if (Owner.name === '') {
    			 
    	         player = new Player({
    	        	id: Owner.id, 
    	            token: Owner.token,
    	        	name: Owner.name,
    	        	nickname: Owner.nickname,
    	            password: Owner.password,
    	            rank: Owner.rank,
    	            club: Owner.club
    	           });
    	          
    	         console.log('Player gameadd',player)
    	         
    	          player.save();    			 
    			 
    			 
    		 }
    		 
    	 }
    	 
     },
     
     updateTeam1: function() {
    	 
    	 //alert('click');
    	 $('#team1').val(Owner.name);
    	 $('#rank1').val(Owner.rank); 
    	 $('#team1_id').val(Owner.id); 

     },
     
    updateListTeam1: function (event) {
    
	    if ( $('#myself').attr('checked') === undefined) {
	      var q = $("#team1").val();
	       
	      this.playersTeam1 = new Players();
	      this.playersTeam1.setMode('search',q);
	      if (q.length>2) {
	      	this.playersTeam1.fetch();
	      	
	      	this.playersTeam1.on( 'all', this.renderListTeam1, this );
	      	
	      }
		 }
    
    },    
    
    renderListTeam1: function () {
    	var q = $("#team1").val();
    	$(this.listview1).html(_.template(this.playerListAutoCompleteViewTemplate({players:this.playersTeam1.toJSON(),query:q,select:1})));    		
	    $(this.listview1).listview('refresh');
    },     
    
      
    updateListTeam2: function (event) { 
      var q = $("#team2").val();       
      this.playersTeam2 = new Players();
      this.playersTeam2.setMode('search',q);
      if (q.length>2) {
      	this.playersTeam2.fetch();

	    this.playersTeam2.on( 'all', this.renderListTeam2, this );
	 }
    
    },
    
    renderListTeam2: function () {
    	var q = $("#team2").val();
		$(this.listview2).html(_.template(this.playerListAutoCompleteViewTemplate({players:this.playersTeam2.toJSON(),query:q,select:2})));    	
		$(this.listview2).listview('refresh');
    },     
      
    addGame: function (event) {
    	
       // var id = $('#id').val(),
        	var team1 = $('#team1').val(),
        	rank1 = $('#rank1').val(),
        	team1_id = $('#team1_id').val(),        	
            team2 = $('#team2').val(),
            rank2 = $('#rank2').val(),            
            team2_id = $('#team2_id').val(),            
            city = $('#city').val(),
            playerid = $('#playerid').val(),
            token = $('#token').val(), 
            court = $('#court').val(),            
            surface = $('#surface').val(),
            tour = $('#tour').val(),
            subtype = $('#subtype').val(),                       
            game=null;
           
        if (team1==='' && team1_id==='' ) {
        	
        	//alert('Il manque le joueur 1 '+$('#myself').attr('checked'));
        
        	$('span.team1_error').html('Vous devez indiquer un joueur !').show();
        	return false;
        }

        if (rank1===''  ) {
        	
        	//alert('Il manque le joueur 1 '+$('#myself').attr('checked'));
        
        	$('span.team1_error').html('Vous devez indiquer le classement !').show();
        	return false;
        }        
        
        if (team2==='' && team2_id==='' ) {        

        	$('span.team2_error').html('Vous devez indiquer un joueur !').show();
        	return false;
        	
    	}
    	
    	
        if (rank2===''  ) {
        	
        	//alert('Il manque le joueur 1 '+$('#myself').attr('checked'));
        
        	$('span.team2_error').html('Vous devez indiquer le classement !').show();
        	return false;
        }           
        //FIXME:si player existe pas on le cree à la volée
        
        
        //if (id === '') {
          var game = new Game({
          	team1:team1,
          	team2:team2,
            team1_id:team1_id,
            team2_id:team2_id,
            city: city,
            playerid: playerid,
            court: court,
            surface: surface,
            subtype: subtype,
            tour: tour,
            token: token
          });
       // } 
       
       console.log('gameadd',game.toJSON());
        
        /*
        else {
          var game = new Game({
            id: id,
            team1: team1_id,
            team2: team2_id,
            city: city,
            playerid: playerid,
            token: token
          });
        }
        */
        
        //on sauve dans model
        //game.save();
        
        //On sauve dans Collections
        games = new Games();
        games.create(game);
     
        //games.save(name: 'Diving with scuba') # local save
        //Si connexion on envoie au serveur
		games.storage.sync.push(); // POST /api/dreams and PUT /api/dreams/:id
        

        //if (game.id !== 'null')
        	//Backbone.Router.navigate("/#games/"+game.id, true);
        //	console.log('routage');

       
  	  
        return false;
      },     
    

    //render the content into div of view
    render: function(){

	   	this.$el.html(_.template(this.gameAddTemplate({playerid:Owner.id,token:Owner.token})));     
                                    
	   	this.$el.trigger('pagecreate');
      
	   	return this;
    },


   

    onClose: function(){
      //Clean
      this.undelegateEvents();
      if (this.playersTeam1!==undefined) this.playersTeam1.off("all",this.renderListTeam1,this);
      if (this.playersTeam2!==undefined) this.playersTeam2.off("all",this.renderListTeam2,this);

    }

  });



