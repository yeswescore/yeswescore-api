$(document).bind("mobileinit", function () {
    $.mobile.ajaxEnabled = false;
    $.mobile.linkBindingEnabled = false;
    $.mobile.hashListeningEnabled = false;
    $.mobile.pushStateEnabled = false;
    
    $.extend($.mobile, {
      slideText:"none",
      slideUpText:"none",
      defaultPageTransition:"none",
      defaultDialogTransition:"none"
    });    

    
    // Remove page from DOM when it's being replaced
    $('div[data-role="page"]').live('pagehide', function (event, ui) {
         $(event.currentTarget).remove();
    });
    
    
});
