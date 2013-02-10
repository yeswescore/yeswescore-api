$(document).bind("mobileinit", function () {
    $.mobile.ajaxEnabled = false;
    $.mobile.linkBindingEnabled = false;
    $.mobile.hashListeningEnabled = false;
    $.mobile.pushStateEnabled = false;
    $.mobile.allowCrossDomainPages = true;
    //DESACTIVATE INIT FOR DOM
    //$.mobile.autoInitializePage = false;
    
    //$.mobile.defaultPageTransition = 'none';    
    //$.mobile.autoInitializePage = false;
    //$.mobile.touchOverflowEnabled = false;
    //$.mobile.defaultDialogTransition = 'none';
    //$.mobile.loadingMessage = 'Daten werden geladen...' ;
    //$.mobile.slideText:"none";
    //$.mobile.slideUpText:"none";
    
    
    var iosDevice = ((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))) ? true : false;

    $.extend($.mobile, {
      //autoInitializePage : false,
      touchOverflowEnabled : false,
      slideText :  (iosDevice) ? "slide" : "none",
      slideUpText :  (iosDevice) ? "slideup" : "none",
      defaultPageTransition:(iosDevice) ? "slide" : "none",
      defaultDialogTransition:(iosDevice) ? "slideup" : "none"
    });

    // Remove page from DOM when it's being replaced
    //$('div[data-role="page"]').live('pagehide', function (event, ui) {
    //    $(event.currentTarget).remove();
    //});
});
