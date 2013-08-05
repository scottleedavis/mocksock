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