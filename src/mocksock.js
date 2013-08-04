var Mocksock = (function () {
  
  function log_enabled () {
    return window['console'] && Mocksock.settings.log;
  }
  
  return {

    settings: {
      log: true
    },

    mock: function (settings) {
      window['WebSocket'] = Mocksock.Client;
      if( settings.hasOwnProperty('log') ){
        this.settings.log = settings.log;
      }
    },

    logEvent: function(evt) {
      if(!log_enabled()) return false;

      var mocksock_id = evt.currentTarget.__mocksock_id ? evt.currentTarget.__mocksock_id : '' ;
      var event_type = evt.type ? evt.type : '';
      var event_data = evt.data ? evt.data : '';
      console.log('[Mocksock.Response] - client ' + mocksock_id + ' | ' + event_type + ' : ' + event_data );
    },

    logRound: function (server, request, response) {
      if(!log_enabled()) return false;
      console.log('[Mocksock] client '+request.client.__mocksock_id+':'+request.toString()+' => server '+server.URL+':'+response.toString());
    }
    
  };
})();