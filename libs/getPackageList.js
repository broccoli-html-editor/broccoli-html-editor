/**
 * getPackageList.js
 */
module.exports = function(broccoli, callback){
	delete(require.cache[require('path').resolve(__filename)]);

	var _this = this;
	callback = callback || function(){};

	var it79 = require('iterate79');
	var LangBank = require('langbank');
	var path = require('path');
	var php = require('phpjs');
	var fs = require('fs');
	var $modules = broccoli.paths_module_template;
	var rtn = {};

	function fncFindLang( $lb, $key, $default ){
		var $tmpName = $lb.get($key);
		if( $tmpName.length && $tmpName !== '---' ){
			return $tmpName;
		}
		return $default;
	};

	it79.fnc(
		{},
		[
			function(it0, data){
				it79.ary(
					$modules,
					function(it1, row, idx){
						var realpath = row;
						var lb = new LangBank(path.resolve( realpath, 'language.csv' ), function(){
							lb.setLang(broccoli.lb.lang);

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
								'infoJson': infoJson,
								'deprecated': (infoJson.deprecated || false)
							};

							// Multi Language
							infoJson.name = fncFindLang(lb, 'name', infoJson.name);
							rtn[idx].packageName = fncFindLang(lb, 'name', rtn[idx].packageName);

							broccoli.getModuleListByPackageId(idx, function(modList){
								rtn[idx].categories = modList.categories;
								it1.next();
							});
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
