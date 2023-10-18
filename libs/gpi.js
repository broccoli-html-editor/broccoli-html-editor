/**
 * gpi.js (General Purpose Interface)
 */
module.exports = function(broccoli, api, options, callback){
	delete(require.cache[require('path').resolve(__filename)]);

	var _this = this;
	callback = callback || function(){};

	var Promise = require('es6-promise').Promise;
	var it79 = require('iterate79');
	var path = require('path');
	var fs = require('fs');

	// console.log('broccoli: set language "'+options.lang+'"');
	broccoli.lb.setLang( options.lang );
	// console.log( broccoli.lb.get('ui_label.close') );

	new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
		switch(api){
			case "getBootupInfomations":
				// broccoli の初期起動時に必要なすべての情報を取得する
				var $bootup = {};
				$bootup.result = true;

				it79.fnc(
					{},
					[
						function(it1){
							$bootup.conf = {};
							$bootup.conf.appMode = broccoli.getAppMode();
							$bootup.languageCsv = fs.readFileSync( __dirname+'/../data/language.csv' ).toString();
							it1.next();
						},
						function(it1){
							broccoli.getAllModuleList(function(allModuleList){
								$bootup.allModuleList = allModuleList;
								$bootup.contentsDataJson = {};
								try {
									$bootup.contentsDataJson = fs.readFileSync(broccoli.realpathDataDir+'/data.json');
									$bootup.contentsDataJson = JSON.parse( $bootup.contentsDataJson );
								} catch (e) {
									broccoli.log('[ERROR] FAILED to load data.json - '+broccoli.realpathDataDir+'/data.json');
									$bootup.contentsDataJson = {};
								}

								it1.next();

							});
						},
						function(it1){
							broccoli.resourceMgr.getResourceDb( function(resourceDb){
								// console.log(resourceDb);
								$bootup.resourceDb = resourceDb;
								var resourceList = [];
								for(var resKey in resourceDb){
									resourceList.push(resKey);
								}
								$bootup.resourceList = resourceList;

								it1.next();

							} );
						},
						function(it1){
							broccoli.getPackageList(function(modulePackageList){
								$bootup.modulePackageList = modulePackageList;
								it1.next();
							});
						},
						function(it1){
							$bootup.userData = {};
							broccoli.userStorage.load('modPaletteCondition', function(data){
								$bootup.userData.modPaletteCondition = data;
								it1.next();
							});
						},
						function(it1){
							$bootup.errors = broccoli.get_errors();
							if( $bootup.errors && $bootup.errors.length ){
								$bootup.result = false;
							}
							it1.next();
						},
						function(it1){
							callback($bootup);
						}
					]
				);

				break;

			case "getConfig":
				// broccoli の設定を取得する
				var conf = {};
				conf.appMode = broccoli.getAppMode();
				conf.errors = broccoli.get_errors();
				callback({
					"result": true,
					"config": conf,
				});
				break;

			case "getLanguageCsv":
				// 言語ファイル(CSV)を取得
				var csv = fs.readFileSync( __dirname+'/../data/language.csv' ).toString();
				callback({
					"result": true,
					"language": csv,
				});
				break;

			case "getModulePackageList":
				// モジュールパッケージ一覧を取得する
				broccoli.getPackageList(function(list){
					callback({
						result: true,
						modulePackageList: list,
					});
				});
				break;

			case "getModule":
				// モジュール情報を取得する
				var moduleId = options.moduleId;
				broccoli.getModule(moduleId, undefined, function(module){
					if(!module){
						callback(false);
						return;
					}
					var moduleInfo = {};
					moduleInfo.id = moduleId;
					moduleInfo.internalId = module.internalId;
					moduleInfo.name = module.info.name;
					moduleInfo.thumb = module.thumb;
					moduleInfo.areaSizeDetection = module.info.areaSizeDetection;
					moduleInfo.isSystemModule = module.isSystemModule;
					moduleInfo.isSubModule = module.isSubModule;
					moduleInfo.isSingleRootElement = module.isSingleRootElement;
					moduleInfo.isClipModule = module.isClipModule;
					moduleInfo.hidden = module.hidden;
					moduleInfo.deprecated = module.deprecated;
					module.getPics(function(pics){
						moduleInfo.pics = pics;

						module.getReadme(function(readme){
							moduleInfo.readme = readme;

							callback({
								"result": true,
								"moduleInfo": moduleInfo,
							}); 
						});
					});
				});
				break;

			case "getClipModuleContents":
				// クリップモジュールの内容を取得する
				var moduleId = options.moduleId;
				broccoli.getModule(moduleId, undefined, function(module){
					if(!module){
						callback({
							result: false,
							errors: ["moduleId is required."],
						});
						return;
					}
					module.getClipContents(function(clip){

						if( options.resourceMode == 'temporaryHash' ){
							for(var resKey in clip.resources){
								if( !resKey.length ){ continue; }
								if( typeof(clip.resources[resKey]) !== typeof({}) ){ continue; }
								var bin = '-----broccoli-resource-temporary-hash='+resKey;
								clip.resources[resKey].base64 = (new Buffer(bin)).toString('base64');
							}
						}

						callback({
							result: true,
							clipContents: clip,
						});
					});
				});
				break;

			case "replaceClipModuleResources":
				// クリップモジュールのリソースを取得し、コンテンツのリソースを更新する
				var moduleId = options.moduleId;
				broccoli.getModule(moduleId, undefined, function(module){
					if(!module){
						callback({
							result: false,
							errors: ["moduleId is required."],
						});
						return;
					}
					var rtn = {};
					module.getClipContents(function(clip){
						broccoli.resourceMgr.getResourceDb(function(resourceDb){
							it79.ary(
								resourceDb,
								function(it1, resInfo, resKey){
									if( !resKey.length ){ it1.next(); return; }
									if( typeof(resInfo) !== typeof({}) ){ it1.next(); return; }
									if( resInfo.base64.match( /^LS0tLS1icm9jY29saS1yZXNvdXJjZS10ZW1wb3JhcnktaGFz/ ) ){
										var bin = (new Buffer(resInfo.base64, 'base64')).toString();
										var $hash = bin.replace(/^\-\-\-\-\-broccoli\-resource\-temporary\-hash\=/, '');
										broccoli.resourceMgr.updateResource(resKey, clip.resources[$hash], function(){
											rtn[resKey] = clip.resources[$hash];
											it1.next();
										});
										return;
									}
									it1.next();
								},
								function(){
									callback({
										result: true,
										affectedResources: rtn,
									});
								}
							);
						});
					});
				});
				break;

			case "getAllModuleList":
				// 全モジュールの一覧を取得する
				broccoli.getAllModuleList(function(list){
					callback({
						result: true,
						moduleList: list,
					});
				});
				break;

			case "getContentsDataJson":
				var dataJson = {};
				try {
					dataJson = fs.readFileSync(broccoli.realpathDataDir+'/data.json');
					dataJson = JSON.parse( dataJson );
				} catch (e) {
					broccoli.log('[ERROR] FAILED to load data.json - '+broccoli.realpathDataDir+'/data.json');
					dataJson = {};
				}
				callback({
					result: true,
					data: dataJson,
				});
				break;

			case "saveContentsData":
				var jsonString = JSON.stringify( options.data, null, 4 );
				var result;
				it79.fnc(
					{},
					[
						result = function(it1, data){
							// contentsSourceData を保存する
							fs.writeFile(
								broccoli.realpathDataDir+'/data.json' ,
								jsonString ,
								function(){
									it1.next(data);
								}
							);
						} ,
						function(it1, data){
							callback(result ? {
								"result": true,
							} : {
								"result": false,
								"errors": ['Failed to save contents data.'],
							});
						}
					]
				);
				break;

			case "buildHtml":
				broccoli.buildHtml(
					{
						'mode': 'canvas',
						'bowlList': options.bowlList
					} ,
					function(htmls){
						callback({
							result: true,
							htmls: htmls,
						});
					}
				);
				break;

			case "buildModuleCss":
				broccoli.buildModuleCss(function(css){
					callback({
						result: true,
						css: css,
					});
				});
				break;

			case "buildModuleJs":
				broccoli.buildModuleJs(function(js){
					callback({
						result: true,
						js: js,
					});
				});
				break;

			case "updateContents":
				broccoli.updateContents(
					function(result){
						callback(result ? {
							result: true,
						} : {
							result: true,
							errors: ["Failed to update contents data."],
						});
					}
				);
				break;

			case "resourceMgr.getResource":
				broccoli.resourceMgr.getResource(
					options.resKey ,
					function(resInfo){
						callback({
							result: true,
							resourceInfo: resInfo,
						});
					}
				);
				break;

			case "resourceMgr.duplicateResource":
				broccoli.resourceMgr.duplicateResource(
					options.resKey ,
					function(newResKey){
						callback({
							result: true,
							newResourceKey: newResKey,
						});
					}
				);
				break;

			case "resourceMgr.getResourceDb":
				broccoli.resourceMgr.getResourceDb(
					function(resourceDb){
						callback({
							result: true,
							resourceDb: resourceDb,
						});
					}
				);
				break;

			case "resourceMgr.getResourceList":
				broccoli.resourceMgr.getResourceDb(
					function(resourceDb){
						var resourceList = [];
						for(var resKey in resourceDb){
							resourceList.push(resKey);
						}
						callback({
							result: true,
							resourceList: resourceList,
						});
					}
				);
				break;

			case "resourceMgr.addResource":
				broccoli.resourceMgr.addResource(
					function(newResKey){
						callback({
							result: true,
							newResourceKey: newResKey,
						});
					}
				);
				break;

			case "resourceMgr.addNewResource":
				broccoli.resourceMgr.addNewResource(
					options.resInfo ,
					function(result){
						result.result = true;
						callback(result);
					}
				);
				break;

			case "resourceMgr.getResourcePublicPath":
				broccoli.resourceMgr.getResourcePublicPath(
					options.resKey ,
					function(publicPath){
						callback({
							"result": true,
							"publicPath": publicPath,
						});
					}
				);
				break;

			case "resourceMgr.updateResource":
				broccoli.resourceMgr.updateResource(
					options.resKey ,
					options.resInfo ,
					function(result){
						callback(result ? {
							result: true,
						} : {
							result: false,
							errors: ["Failed to update resource data."],
						});
					}
				);
				break;

			case "resourceMgr.resetBinFromBase64":
				broccoli.resourceMgr.resetBinFromBase64(
					options.resKey ,
					function(result){
						callback(result);
					}
				);
				break;

			case "resourceMgr.resetBase64FromBin":
				broccoli.resourceMgr.resetBase64FromBin(
					options.resKey ,
					function(result){
						callback(result);
					}
				);
				break;

			case "resourceMgr.save":
				broccoli.resourceMgr.save(
					options.resourceDb ,
					function(result){
						callback(result ? {
							result: true,
						} : {
							result: false,
							errors: ["Failed to save resource DB."],
						});
					}
				);
				break;

			case "resourceMgr.removeResource":
				broccoli.resourceMgr.removeResource(
					options.resKey ,
					function(result){
						callback(result ? {
							result: true,
						} : {
							result: false,
							errors: ["Failed to remove resource."],
						});
					}
				);
				break;

			case "fieldGpi":
				broccoli.fieldDefinitions[options.__fieldId__].gpi(
					options.options,
					function(result){
						callback(result);
					}
				);
				break;

			case "saveUserData":
				var result = true;
				it79.fnc(
					{},
					[
						function(it1){
							if( options.modPaletteCondition ){
								broccoli.userStorage.save('modPaletteCondition', options.modPaletteCondition, function(result){
									if( !result ){
										result = false;
									}
									it1.next();
								});
								return;
							}
							it1.next();
						},
						function(it1){
							callback(result ? {
								result: true,
							} : {
								result: false,
								errors: ["Failed to save user data."],
							});
						}
					]
				);
				break;

			default:
				callback({
					'result': false,
					'errors': ['Unknown GPI function. ('+$api+')'],
				});
				break;
		}

	}); });

	return;
}
