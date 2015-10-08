/**
 * editWindow.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ callback(); return false; }

	var _this = this;

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var twig = require('twig');
	var $ = require('jquery');

	this.init = function(instancePath, elmEditWindow, callback){
		callback = callback || function(){};

		console.log( broccoli.contentsSourceData.get(instancePath) );

		callback();
		return this;
	}

	return;
}
