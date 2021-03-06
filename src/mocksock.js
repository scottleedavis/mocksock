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
      console.log('[Mocksock] client ' + mocksock_id + ' | ' + event_type + ' : ' + event_data );
    },

    logRound: function (server, request, response, first) {
      if(!log_enabled()) return false;

      var request_id = request ? request.client.__mocksock_id : '';
      var request_str = first ? request.toString() : '';
      var server_url = server ? server.URL : '';
      var response_str = response ? response.toString() : '';
      if( request_str === '' ){
          console.log('[Mocksock] server '+server_url+':'+response_str +' =>  client '+request_id+':'+request_str);
      } else {
          console.log('[Mocksock] client '+request_id+':'+request_str+' => server '+server_url+':'+response_str);
      }
      
    }
    
  };
})();