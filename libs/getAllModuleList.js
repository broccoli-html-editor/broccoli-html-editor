/**
 * getAllModuleList.js
 */
module.exports = function(broccoli, callback){
	delete(require.cache[require('path').resolve(__filename)]);

	var _this = this;
	callback = callback || function(){};

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var fs = require('fs');
	var $modules = broccoli.paths_module_template;

	it79.fnc(
		{'tmp':{}, 'rtn':{}},
		[
			function(it0, data){
				broccoli.getPackageList(function(list){
					data.tmp['_sys/root'] = broccoli.createModuleInstance('_sys/root');
					data.tmp['_sys/unknown'] = broccoli.createModuleInstance('_sys/unknown');
					data.tmp['_sys/html'] = broccoli.createModuleInstance('_sys/html');
					for(var pkgId in list){
						for(var catId in list[pkgId].categories){
							for(var modId in list[pkgId].categories[catId].modules){
								var mod = list[pkgId].categories[catId].modules[modId];
								data.tmp[mod.moduleId] = broccoli.createModuleInstance(mod.moduleId);
							}
						}
					}
					it0.next(data);
				});
			} ,
			function(it0, data){
				it79.ary(
					data.tmp,
					function(it2, obj, modId){
						obj.init(function(){
							data.rtn[modId] = {};
							data.rtn[modId].id = obj.id;
							data.rtn[modId].fields = obj.fields;
							data.rtn[modId].isSystemModule = obj.isSystemModule;
							data.rtn[modId].isSingleRootElement = obj.isSingleRootElement;
							data.rtn[modId].templateType = obj.templateType;
							data.rtn[modId].template = obj.template;
							data.rtn[modId].info = obj.info;
							it2.next();
						});
					},
					function(){
						it0.next(data);
					}
				);
			} ,
			function(it0, data){
				callback(data.rtn);
			}
		]
	);

	return;
}
