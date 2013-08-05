
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
  var jsonObj3 = {
    'test88': 'test-val',
    'test11': 'test-val-2'
  };
  var jsonRespObj3 = {
    'test88': 'pass',
    'test11': 'pass'
  };
  var JSONString = JSON.stringify(jsonObj);
  var JSONString2 = JSON.stringify(jsonObj2);
  var JSONString3 = JSON.stringify(jsonObj3);
  var JSONStringResp = JSON.stringify(jsonRespObj);
  var JSONStringResp2 = JSON.stringify(jsonRespObj2);
  var JSONStringResp3 = JSON.stringify(jsonRespObj3);

  this.onmessage(JSONString).respond(JSONStringResp );

  this.onmessage(JSONString2).respond(JSONStringResp2);

  this.onmessage(JSONString3).respond(JSONStringResp3, {count:1, delay:1} );

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
    equal(response, JSON.stringify(jsonRespObj) );
    start();

  };


  setTimeout(function(){

      socket.send(JSON.stringify(jsonObj));

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
    equal(response, JSON.stringify(jsonRespObj2) );
    start();
  };


  setTimeout(function(){

      socket.send(JSON.stringify(jsonObj2));

 }, 1);

});

asyncTest('trying multi-response JSON encoded message', function () {

  expect(3);
  var socket = new WebSocket('ws://ok.host');
  var response = null;
  var jsonObj3 = {
    'test88': 'test-val',
    'test11': 'test-val-2'
  };
  var jsonRespObj3 = {
    'test88': 'pass',
    'test11': 'pass'
  };

  start();
  
  socket.onmessage = function (evt) {
    response = evt.data;
    equal(response, JSON.stringify(jsonRespObj3) );
    stop();
  };


  setTimeout(function(){

      socket.send(JSON.stringify(jsonObj3));


 }, 1);


  setTimeout(function(){

      //socket.send(JSON.stringify(jsonObj3));
      //equal(response, JSON.stringify(jsonRespObj3) );
     start();
     //stop();

 }, 1000);


});


