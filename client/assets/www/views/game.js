define(['jquery', 
        'underscore', 
        'backbone',
        'backbone_poller',
        'text!templates/gameViewTemplate.html',
        'models/Game'
        //'models/Games'
        ],
function($, _, Backbone,PollingManager,gameViewTemplate,Game,tennis,tennis_update,poller,Owner){

  
	
  var GameView = Backbone.View.extend({

    el:"#index",

    initialize:function() {
    	
    	Owner = JSON.parse(window.localStorage.getItem("Owner"));
    	
        tennis = new Game({id:this.id});
        //tennis.fetch(); 
		//tennis.on( 'change', this.render, this );
        
        var options = {
		  // default delay is 1000ms
		  delay: 5000, 
		  //data: {id:this.id}
		};
        

    	
    	poller = Backbone.Poller.get(tennis, options)
    	poller.start();
    			
		//first poll
		poller.on('complete', this.render, this);
		//next poll
		poller.on('success', this.render, this);
		
		/*
		poller.on('error', function(model){
		  console.error('oops! something went wrong'); 
		};   
		*/	
    	
    	poller.start();
    	


    },
    
    events: {
        'click #setPlusSetButton': 'setPlusSet',   
        'click #setMinusSetButton': 'setMinusSet',
        'click #setPlusPointButton': 'setPlusPoint',   
        'click #setMinusPointButton': 'setMinusPoint',
        'click #endButton': 'end',   
        'click #cancelButton': 'cancel',
        'submit #frmAttachment': 'submitAttachment',
        'click #team1_set1_div': 'setTeam1Set1',
        'click #team1_set2_div': 'setTeam1Set2',
        'click #team1_set3_div': 'setTeam1Set3',
        'click #team2_set1_div': 'setTeam2Set1',
        'click #team2_set2_div': 'setTeam2Set2',
        'click #team2_set3_div': 'setTeam2Set3',                        
    },
    
    
    setTeamSet: function(input,div){	
    
    	if( $.isNumeric(input.val()) )
    		set = parseInt(input.val(), 10 ) + 1; 	
    	else
    		set='1';	   
    	    	 	 
		input.val(set);
		div.html(set);	
		this.sendUpdater();   
		  
    },    
    
    setTeam1Set1: function(){		
		this.setTeamSet($('#team1_set1'),$('#team1_set1_div'));		
    },
      
    setTeam1Set2: function(options){	   	
		this.setTeamSet($('#team1_set2'),$('#team1_set2_div'));	
    },      

    setTeam1Set3: function(){	
		this.setTeamSet($('#team1_set3'),$('#team1_set3_div'));		
    },  

    setTeam2Set1: function(){		
		this.setTeamSet($('#team2_set1'),$('#team2_set1_div'));	
    },
      
    setTeam2Set2: function(){		
		this.setTeamSet($('#team2_set2'),$('#team2_set2_div'));		
    },      

    setTeam2Set3: function(){		
		this.setTeamSet($('#team2_set3'),$('#team2_set3_div'));		
    }, 
    
    submitAttachment: function(data){
    
    	//formData = new FormData($(this)[0]);
    	console.log('date-form',data);
    
    	/*
		$.ajax({
            type:'POST',
            url:urlServiceUpload,
            data:formData,
            contentType: false,
            processData: false,
            error:function (jqXHR, textStatus, errorThrown) {
                alert('Failed to upload file')
            },
            success:function () {
                alert('File uploaded')
            }
        })*/

        return false;
    
    },
    
    sendUpdater: function(){
    	
    	//console.log('action setPlusSet avec '+$('input[name=team_selected]:checked').val()); 
    	
    	//ADD SERVICE
    	var game_id = $('#game_id').val(),
        	team1_id = $('#team1_id').val(),
        	team1_points = $('#team1_points').val(),
        	team1_set1 = $('#team1_set1').val(),
        	team1_set2 = $('#team1_set2').val(),
        	team1_set3 = $('#team1_set3').val(),        	
        	team2_id = $('#team2_id').val(),
            team2_points = $('#team2_points').val(),
            team2_set1 = $('#team2_set1').val(),
        	team2_set2 = $('#team2_set2').val(),
        	team2_set3 = $('#team2_set3').val(),                           
            playerid = $('#playerid').val(),
            token = $('#token').val(),    
            tennis_update = null;
  

  		if ($.isNumeric(team1_set1)===false) team1_set1='0';
  		if ($.isNumeric(team2_set1)===false) team2_set1='0';
  			  			
  		var sets_update = team1_set1+'/'+team2_set1;
  		
  		if (team1_set2>0 || team2_set2>0) {
  			
  			if ($.isNumeric(team1_set2)===false) team1_set2='0';
  			if ($.isNumeric(team2_set2)===false) team2_set2='0';
  			 
  			sets_update += ";"+team1_set2+'/'+team2_set2;
  		}
  		if (team1_set3>0 || team2_set3>0) {
  		
  		  	if ($.isNumeric(team1_set3)===false) team1_set3='0';
  			if ($.isNumeric(team2_set3)===false) team2_set3='0';
  			  		
  			sets_update += ";"+team1_set3+'/'+team2_set3;
  		}
  		
  		//FIXME : On remplace les espaces par des zeros
  		//sets_update = sets_update.replace(/ /g,'0');
  		
  		//console.log('sets_update',sets_update);
  			    	
    	tennis_update = new Game({sets:sets_update,team1_points:team1_points,team2_points:team2_points,id:game_id,team1_id:team1_id,team2_id:team2_id,playerid:playerid,token:token});
      	
    	//console.log('setPlusSet',tennis_update);
    	
    	tennis_update.save();    	

    },
    
    setPlusSet: function(){		

 		var selected = 	$('input[name=team_selected]:checked').val();
 		var set = parseInt($('#team'+selected+'_set1').val(), 10 ) + 1;  
 		//console.log(set);

		//FIXME : Regle de Gestion selon le score 		
 		
		$('#team'+selected+'_set1').val(set);
		$('#team'+selected+'_set1_div').html(set);
		
		this.sendUpdater();
	 	
    },
    
    setMinusSet: function(){	
   
 		var selected = 	$('input[name=team_selected]:checked').val();
 		var set = parseInt($('#team'+selected+'_set1').val(), 10 ) - 1;  
 		console.log(set);

		if (set<0) set = 0;
		//FIXME : Regle de Gestion selon le score  		
 		
 		
		$('#team'+selected+'_set1').val(set);
		$('#team'+selected+'_set1_div').html(set);		
		
		this.sendUpdater();    	  	    
    },
    
    setPlusPoint: function(){	

		// 15 30 40 AV

 		var selected = 	$('input[name=team_selected]:checked').val();  		
 		var point = $('#team'+selected+'_points').val();
 		
 		if (point==='00') point='15';
 		else if (point==='15') point='30';
 		else if (point==='30') point='40';
 		else if (point==='40') point='AV';
 		else if (point==='AV') point='00'; 		
 		   	
		$('#team'+selected+'_points').val(point);
		$('#team'+selected+'_points_div').html(point);  
		
		this.sendUpdater();  	  	    
    },
    
    setMinusPoint: function(){	

 		var selected = 	$('input[name=team_selected]:checked').val();  
 		var point = $('#team'+selected+'_points').val();

 		if (point==='AV') point='40';
 		else if (point==='40') point='30';
 		else if (point==='30') point='15';
 		else if (point==='15') point='00';
 		else if (point==='00') point='00'; 	 		
 		
		$('#team'+selected+'_points').val(point);
		$('#team'+selected+'_points_div').html(point);  
		
		this.sendUpdater(); 
		
    },   

    //render the content into div of view
    render: function(){
    
      //console.log('render sets is',tennis.toJSON().sets);
    	
      this.$el.html(_.template(gameViewTemplate,{
                                    game:tennis.toJSON(),Owner:Owner
                                    }));                                        

	  $.mobile.hidePageLoadingMsg();
      this.$el.trigger('pagecreate');
      
      return this;
    },


    end : function() {
    	
      msg = 'Cette action est definitive. Confirmez-vous ?';
      
      navigator.notification.alert(
          msg,  
          alertDismissed,         // callback
          'Information',            // title
          'Ok'                  // buttonName
      );
      
      window.location.href= '#games/end/'+game.id;
    	
    },
    
    cancel : function() {
    	
    	console.log('On retire la derniere action');
      	
      },    

    onClose: function(){
      //Clean
      this.undelegateEvents();
      tennis.off("change",this.render,this); 
      
      poller.stop();
      poller.off('complete', this.render, this);
      poller.off('success', this.render, this);
      //this.$el.off('pagebeforeshow'); 
    }

  });
  return GameView;
});


