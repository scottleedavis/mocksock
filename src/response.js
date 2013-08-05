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