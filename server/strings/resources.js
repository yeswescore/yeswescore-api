var Resources = {
  fr: {
    "email.confirmation.subject": "Yes We Score: Confirmation de votre email",
    "email.confirmation.content": "Veuillez cliquer sur ce lien pour confirmer votre email: <a href=\"%URL%\">%URL%</a>",
    "email.password.subject": "Yes We Score: votre nouveau mot de passe",
    "email.password.content": "Voici votre nouveau mot de passe : %PASSWORD%",
    "game.push.started": "Votre joueur %PLAYER1% commence son match contre %PLAYER2% %RANK2%",
    "game.push.created": "Votre joueur %PLAYER1% va jouer contre %PLAYER2% %RANK2% le %DATE%",
    "game.push.finished.win": "Votre joueur %PLAYER1% remporte la victoire contre %PLAYER2% %RANK2% : %SCORE%",
    "game.push.finished.loose": "Votre joueur %PLAYER1% a perdu contre %PLAYER2% %RANK2% : %SCORE%"        
  },
  en: {
    "email.confirmation.subject": "Yes We Score: Email confirmation",
    "email.confirmation.content": "Please click on this link to confirm your email: <a href=\"%URL%\">%URL%</a>",
    "email.password.subject": "Yes We Score: new password",
    "email.password.content": "Your new password is : %PASSWORD%",
    "game.push.started": "Your player %PLAYER1% is starting the match against %PLAYER2% %RANK2%",
    "game.push.created": "Your player %PLAYER1% will start the match against %PLAYER2% %RANK2%  %DATE%",
    "game.push.finished.win": "Your player %PLAYER1% won against %PLAYER2% %RANK2% : %SCORE%",
    "game.push.finished.loose": "Your player %PLAYER1% has lost against %PLAYER2% %RANK2% : %SCORE%"      
  }
};

Resources.getString = function (language, key) {
  if (typeof this[language] === "undefined" ||
      typeof this[language][key] === "undefined")
    return "";
  return this[language][key];
}

module.exports = Resources;