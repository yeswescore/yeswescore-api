/* Fixme : On passe tout dans l'objet */
//var apiURL = "http://reachtheflow.com:8084";
//var serviceURL = apiURL+"/v1/";
//var serviceURLGames = apiURL+"/v1/games/";
//var serviceURLPlayers = apiURL+"/v1/players/";
//var serviceURLClubs = apiURL+"/v1/clubs/";
//var versionClient = "0.0.0.1";
/********************************/

jQuery.support.cors = true;
/* pas de cache */
jQuery.ajaxSetup({ cache: false });

DEV = '0';

if (DEV === '1') {
	var appConfig = {
			  apiURL : "http://91.121.184.177:1024",
			  serviceAuth : "http://91.121.184.177:1024/v1/auth/",		  
			  serviceConf : "http://91.121.184.177:1024/bootstrap/conf.json",		  
			  serviceURL : "http://91.121.184.177:1024/v1/",
			  serviceURLGames : "http://91.121.184.177:1024/v1/games/",
			  serviceURLPlayers : "http://91.121.184.177:1024/v1/players/",
			  serviceURLClubs : "http://91.121.184.177:1024/v1/clubs/",
			  versionClient : "0.0.0.1",
			  gameRefresh : 5000,
			  networkState: "false",
			  latitude: 0,
			  longitude: 0,
			  updated_at : new Date()
	}
}
else {
	var appConfig = {
			  apiURL : "http://api.yeswescore.com",
			  serviceAuth : "http://api.yeswescore.com/v1/auth/",		  
			  serviceConf : "http://api.yeswescore.com/bootstrap/conf.json",		  
			  serviceURL : "http://api.yeswescore.com/v1/",
			  serviceURLGames : "http://api.yeswescore.com/v1/games/",
			  serviceURLPlayers : "http://api.yeswescore.com/v1/players/",
			  serviceURLClubs : "http://api.yeswescore.com/v1/clubs/",
			  versionClient : "0.0.0.1",
			  gameRefresh : 35000,
			  networkState: "false",
			  latitude: 0,
			  longitude: 0,
			  updated_at : new Date()
	}
}
//



var Conf = window.localStorage.getItem("Conf");

/* Update tous les 5 jours*/

if (Conf===null) {
	
		window.localStorage.setItem("Conf",JSON.stringify(appConfig));
		appConfig = JSON.parse(window.localStorage.getItem("Conf"));	
		
}
else {
	
	console.log("Conf mis à jour ",Conf.updated_at);
}



