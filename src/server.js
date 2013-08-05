(function () {
  
  Mocksock.Server = function (url) {
    this.url = this.URL = url;
    this.responders = [];
  }
  
  Mocksock.Server.prototype = {
    addResponder: function (type, msg) {
      var responder = new Mocksock.Responder(type, msg);
      this.responders.push(responder);
      return responder;
    },
    // Configuration DSL
    onmessage: function (message) {
      return this.addResponder('message', message);
    },
    onconnect: function () {
      return this.addResponder('open', '');
    },
    
    doResponse: function(callback, request, response, count, delay, first){
        Mocksock.logRound(this, request, response, first);
        callback( response );
        if( count > 1 ){

          var _this = this;
          setTimeout( function(){
            _this.doResponse(callback, request, response, count-1, delay, false);
          }, delay);
        }

    },

    // Client API
    request: function (request, callback) {
      var response;
      if (responder = this.findResponder(request)) {
        
        response = responder.response(request.client);
        var count = 1;
        var delay = 1;

        if( responder.options  ){

          count = typeof responder.options.count !== 'undefined' ? responder.options.count : 1;
          delay = typeof responder.options.delay !== 'undefined' ? responder.options.delay : 1;

        }
        
        this.doResponse(callback, request, response, count, delay, true);

      } else {
        switch(request.request_type) {
         case 'open': // should let client open connection
          response = new Mocksock.Response(request.client, 'open');
         break;
         case 'close': // should let client open connection
           response = new Mocksock.Response(request.client, 'close');
         break;
         default:
          response = new Mocksock.Response(request.client, 'close', '[Mocksock.Server] No response configured for ' + request.toString());
         break; 
        }
        Mocksock.logRound(this, request, response)
        callback( response );     
      }

    },
    
    // URL matching
    // Should do regexes, tokens, etc.
    match: function (url) {
      return url === this.url; 
    },
    
    findResponder: function (request) {
      for(var i=0, t=this.responders.length;i<t;i++) {
        if( this.responders[i].match(request) ) return this.responders[i];
      }
      return null;
    }
  }
  
  Mocksock.servers = [];
  
  Mocksock.Server.configure = function (url, config) {
    var server = new Mocksock.Server(url);
    config.apply(server, []);
    Mocksock.servers.push(server);
    return server;
  }
  
  Mocksock.Server.find = function (url) {
    for(var i=0, t=Mocksock.servers.length;i<t;i++) {
      if( Mocksock.servers[i].match(url) ) return Mocksock.servers[i];
    }
    return null;
  }
  
  
})();