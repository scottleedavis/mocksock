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