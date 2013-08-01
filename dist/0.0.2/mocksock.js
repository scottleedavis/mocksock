/*  
mocksock.js, version 0.0.2
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
      return '[Mocksock.Request] ' + this.request_type + ' : ' + this.message;
    }
  }
  
  
})();
(function () {
  
  /* Response object
  ------------------------------------*/
  Mocksock.Response = function(client, event_type, message) {

    this.type = event_type;
    this.data = message;
    this.currentTarget = client;

    function textStatus () {
      return event_type == 'open' ? 'success' : 'fail';
    }

    this.toString = function () {
      return '[' + textStatus() + '] ' + message;
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
    // Configuration API
    respond: function (message) {
      guardResponseNotSet(this);
      this.__response_type = 'message';
      this.__response_message = message;
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
      return request.request_type == this.event_type;
    },
    
    response: function (client) {
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
    
    // Client API
    request: function (request, callback) {
      var response;
      if (responder = this.findResponder(request)) {
        response = responder.response(request.client);
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
      }
      Mocksock.logRound(this, request, response)
      callback( response );
    },
    
    // URL matching
    // Should do regexes, tokens, etc.
    match: function (url) {
      return url == this.url; 
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
