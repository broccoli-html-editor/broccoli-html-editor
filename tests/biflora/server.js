var fs = require('fs');
var path = require('path');
var express = require('express'),
	app = express();
var server = require('http').Server(app);
var biflora = require('biflora');

var main = require( path.resolve(__dirname, './backend/main.js') );
var _port = 8088;
var backendApis = {};
backendApis['broccoli'] = require( path.resolve(__dirname, './backend/apis/broccoli.js') );
backendApis['socketTest'] = require( path.resolve(__dirname, './backend/apis/socketTest.js') );


console.log('port number is '+_port);

// middleware - biflora resources
app.use( biflora.clientLibs() );
biflora.setupWebSocket(server, backendApis, main);

// middleware - frontend documents
app.use( express.static( path.resolve(__dirname, '../testdata/htdocs/') ) );

// {$_port}番ポートでLISTEN状態にする
server.listen( _port, function(){
	console.log('message: server-standby');
} );
