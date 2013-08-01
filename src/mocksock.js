var Mocksock = (function () {
  
  function log_enabled () {
    return window['console'] && Mocksock.settings.log;
  }
  
  return {
    mock: function () {
      window['WebSocket'] = Mocksock.Client;
    },
    logEvent: function(evt) {
      if(!log_enabled()) return false;
      console.log(evt, '[Mocksock.Response] - client ' + evt.currentTarget.__mocksock_id + ' | ' + evt.type + ' : ' + evt.data);
    },
    logRound: function (server, request, response) {
      if(!log_enabled()) return false;
      console.log('[Mocksock] client '+request.client.__mocksock_id+':'+request.toString()+' => server '+server.URL+':'+response.toString());
    },
    settings: {
      // Needed so we can attach user event callbacks before connecting
      connection_delay: 10,
      // Logging switch
      log: true
    }
  };
})();