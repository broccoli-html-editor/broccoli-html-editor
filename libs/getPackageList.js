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
	var rtn = {};

	it79.fnc(
		{},
		[
			function(it0, data){
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
						rtn[idx] = {
							'packageId': idx,
							'packageName': (infoJson.name || idx),
							'realpath': realpath,
							'infoJson': infoJson
						};
						broccoli.getModuleListByPackageId(idx, function(modList){
							rtn[idx].categories = modList.categories;
							it1.next();
						});
					} ,
					function(){
						it0.next();
					}
				);
			} ,
			function(it0, data){
				callback(rtn);
			}
		]
	);

	return;
}
