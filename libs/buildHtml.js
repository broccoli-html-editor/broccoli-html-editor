/**
 * buildHtml.js
 */
module.exports = function(broccoli, data, options, callback){
	var _this = this;
	options = options || {};
	callback = callback || function(){};

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var fs = require('fs');

	setTimeout(function(){
		callback('<div>now building...</div>');
	}, 400);
	return;
}
