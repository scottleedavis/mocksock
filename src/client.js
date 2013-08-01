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