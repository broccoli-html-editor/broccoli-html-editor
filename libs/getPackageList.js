/**
 * getPackageList.js
 */
module.exports = function(broccoli, callback){
	var _this = this;
	callback = callback || function(){};

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var fs = require('fs');
	var $modules = broccoli.paths_module_template;
	var rtn = [];

	it79.ary(
		$modules,
		function(it1, row, idx){
			var realpath = row;
			var infoJson = {};
			try {
				infoJson = JSON.parse(fs.readFileSync( realpath+'info.json' ));
			} catch (e) {
				infoJson = {};
			}
			rtn.push({
				'packageId': idx,
				'packageName': (infoJson.name || idx),
				'realpath': realpath,
				'infoJson': infoJson
			});
			it1.next();
		},
		function(){
			callback(rtn);
		}
	);

	return;
}
