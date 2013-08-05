/*  
mocksock.js, version 0.0.5
The MIT License (MIT)

Copyright (c) 2013 Scott Lee Davis (@skawtus)
Copyright (c) 2011 Ismael Celis (@ismasan) 
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
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
(function () {
  
  // A request is sent from the client to the server and it
  // knows about the client and request type ('open', 'message', 'close')
  
  Mocksock.Request = function (client, request_type, message) {
    this.client = client;
    this.request_type = request_type;
    this.message = message;
  }
  
  Mocksock.Request.prototype = {
    toString: function () {
      var request_type = this.request_type ? this.request_type : '' ;
      var message = this.message ? this.message : '';
      return '[Request] ' + request_type + ' : ' + message;
    }
  }
  
  
})();
(function () {
  
  /* Response object
  ------------------------------------*/
  Mocksock.Response = function(client, event_type, message) {

    this.client = client;
    this.type = event_type;
    this.data = message;
    this.currentTarget = client;

    this.textStatus = function() {
      return (this.type === 'open' || this.type === 'message') ? 'success' : 'fail';
    }

    this.textContent = function() {
      return this.data ? this.data : '';
    }

    this.toString = function() {
      return '[' + this.textStatus() + '] ' + this.textContent();
    }
  }
  
  
})();
(function () {
  
  // WebSocket mock. It is important that it implements the same API and public attributes
  // so we only add those to the prototype.
  Mocksock.clients = [];
  
  Mocksock.Client = function (url) {
    
    // Stubs
    this.onmessage = function (evt) {
      Mocksock.logEvent(evt);
    }
    this.onclose = function (evt) {
      Mocksock.logEvent(evt);
    }
    this.onopen = function (evt) {
      Mocksock.logEvent(evt);
    }
    
    var url = url;
    
    this.__server = null;
    
    this.readyState = 0; // 'connecting' http://dev.w3.org/html5/websockets/#websocket
    
    var self = this;
    
    this.close = function () {
      readyState(2);
      var request = new Mocksock.Request(self, 'close');
      self.__server.request(request, dispatch);
    }
    
    this.send = function (msg) {
      if(this.readyState != 1) return false;
      var request = new Mocksock.Request(self, 'message', msg);
      self.__server.request(request, dispatch);
      return true;
    }
    
    function readyState (state) {
      self.readyState = state;
    }
    
    function dispatch (response) {
      // Store history here, or something
      switch(response.type) {
        case 'open': readyState(1); break;
        case 'close': readyState(3); break;
      }
      self['on'+response.type](response);
    }
    
    function connect () {
      self.__server = Mocksock.Server.find(url);
      if (!self.__server) throw('[Mocksock.Client#connect] No server configured for URL ' + url)
      var request = new Mocksock.Request(self, 'open')
      self.__server.request(request, dispatch);
    }
    setTimeout(connect, Mocksock.settings.connecttion_delay);
    
    Mocksock.clients.push(this);
    this.__mocksock_id = Mocksock.clients.length;
  }
  
  
})();
(function () {
  
  /* Responder objects store responses to matched requests
  ---------------------------------------------------------*/
  
  function guardResponseNotSet(responder) {
    if( responder.__response_type ) 
      throw('Response for ' + responder.message + ' has already been set to ' + responder.__response_type + ' with ' + responder.__response_message)
  }
  
  Mocksock.Responder = function (event_type, message) {
    this.event_type = event_type;
    this.message = message;
  }
  
  Mocksock.Responder.prototype = {

    __response_type: null,
    __response_message: null,
    client: null,
    options: null,

    // Configuration API
    respond: function (message, options) {
      guardResponseNotSet(this);
      this.__response_type = 'message';
      this.__response_message = message;
      if( options )
        this.options = options;
      return this;
    },
    fail: function (message) {
      guardResponseNotSet(this);
      this.__response_type = 'close';
      this.__response_message = message;
      return this;
    },

    // Public methods
    match: function (request) {
      return ( (request.request_type === this.event_type) &&
        (request.message === this.message) );
    },
    
    response: function (client) {
      this.client = client;
      return new Mocksock.Response(client, this.__response_type, this.__response_message);
    }
    
  }
  
  
})();
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
