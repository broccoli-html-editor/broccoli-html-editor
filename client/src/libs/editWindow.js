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

	var $editWindow;
	var tplFrame = '';
	tplFrame += '<form action="javascript:;">';
	tplFrame += '<div>';
	tplFrame += '</div>';
	tplFrame += '<div>';
	tplFrame += '<button type="submit">OK</button>';
	tplFrame += '</div>';
	tplFrame += '</form>';

	this.init = function(instancePath, elmEditWindow, callback){
		callback = callback || function(){};

		console.log( broccoli.contentsSourceData.get(instancePath) );
		$editWindow = $(elmEditWindow);
		$editWindow.append(tplFrame);
		$editWindow.find('form').bind('submit', function(){
			callback();
		});
console.log($editWindow.html());
		return this;
	}

	return;
}
