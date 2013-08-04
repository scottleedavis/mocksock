
var ok_server = Mocksock.Server.configure('ws://ok.host', function () {

  var jsonObj = {
    'test': 'test-val',
    'test2': 'test-val-2'
  };
  var jsonRespObj = {
    'test': 'all good',
    'test2': 'total legit'
  };
  var jsonObj2 = {
    'test44': 'test-val',
    'test22': 'test-val-2'
  };
  var jsonRespObj2 = {
    'test44': 'pass',
    'test22': 'pass'
  };
  var JSONString = JSON.stringify(jsonObj);
  var JSONString2 = JSON.stringify(jsonObj2);
  var JSONStringResp = JSON.stringify(jsonRespObj);
  var JSONStringResp2 = JSON.stringify(jsonRespObj2);
  this.onmessage(JSONString).respond(JSONStringResp);
  this.onmessage(JSONString2).respond(JSONStringResp2);

});


module('Mock server', {
  setup: function () {
    Mocksock.mock({log:true});
  }
});

asyncTest('it triggers onopen when connecting', function () {

  var socket = new WebSocket('ws://ok.host');
  var called = false;
  socket.onopen = function (evt) {
    called = true;
  }
  setTimeout(function(){
    ok(called, 'onopen callback was executed');
    equal(socket.readyState, 1, 'readyState is 1');
    start();
  }, 12);
  
});


asyncTest('trying JSON encoded message', function () {

  var socket = new WebSocket('ws://ok.host');
  var response = null;
  var jsonObj = {
  'test': 'test-val',
  'test2': 'test-val-2'
  };
  var jsonRespObj = {
  'test': 'all good',
  'test2': 'total legit'
  };

  socket.onmessage = function (evt) {
    response = evt.data;
  };


  setTimeout(function(){

      socket.send(JSON.stringify(jsonObj));
      equal(response, JSON.stringify(jsonRespObj) );
      start();

 }, 1);

});

asyncTest('trying different JSON encoded message', function () {

  var socket = new WebSocket('ws://ok.host');
  var response = null;
  var jsonObj2 = {
    'test44': 'test-val',
    'test22': 'test-val-2'
  };
  var jsonRespObj2 = {
    'test44': 'pass',
    'test22': 'pass'
  };

  socket.onmessage = function (evt) {
    response = evt.data;
  };


  setTimeout(function(){

      socket.send(JSON.stringify(jsonObj2));
      equal(response, JSON.stringify(jsonRespObj2) );
      start();

 }, 1);

});


