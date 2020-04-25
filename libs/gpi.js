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
				$bootup.conf = {};
				$bootup.conf.appMode = broccoli.getAppMode();
				$bootup['languageCsv'] = fs.readFileSync( __dirname+'/../data/language.csv' ).toString();

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

					broccoli.resourceMgr.getResourceDb( function(resourceDb){
						// console.log(resourceDb);
						$bootup.resourceDb = resourceDb;
						var resourceList = [];
						for(var resKey in resourceDb){
							resourceList.push(resKey);
						}
						$bootup.resourceList = resourceList;

						broccoli.getPackageList(function(modulePackageList){
							$bootup.modulePackageList = modulePackageList;
							$bootup.errors = broccoli.get_errors();
							callback($bootup);
						});

					} );

				});
				break;

			case "getConfig":
				// broccoli の設定を取得する
				var conf = {};
				conf.appMode = broccoli.getAppMode();
				conf.errors = broccoli.get_errors();
				callback(conf);
				break;

			case "getLanguageCsv":
				// 言語ファイル(CSV)を取得
				var csv = fs.readFileSync( __dirname+'/../data/language.csv' ).toString();
				callback(csv);
				break;

			case "getModulePackageList":
				// モジュールパッケージ一覧を取得する
				broccoli.getPackageList(function(list){
					callback(list);
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
					moduleInfo.name = module.info.name;
					moduleInfo.thumb = module.thumb;
					moduleInfo.areaSizeDetection = module.info.areaSizeDetection;
					moduleInfo.isSystemModule = module.isSystemModule;
					moduleInfo.isSubModule = module.isSubModule;
					moduleInfo.isSingleRootElement = module.isSingleRootElement;
					moduleInfo.isClipModule = module.isClipModule;
					moduleInfo.deprecated = module.deprecated;
					module.getPics(function(pics){
						moduleInfo.pics = pics;

						module.getReadme(function(readme){
							moduleInfo.readme = readme;

							callback(moduleInfo); 
						});
					});
				});
				break;

			case "getClipModuleContents":
				// クリップモジュールの内容を取得する
				var moduleId = options.moduleId;
				broccoli.getModule(moduleId, undefined, function(module){
					if(!module){
						callback(false);
						return;
					}
					module.getClipContents(function(clip){

						if( options.resourceMode == 'temporaryHash' ){
							for(var resId in clip.resources){
								var bin = '-----broccoli-resource-temporary-hash='+resId;
								clip.resources[resId].base64 = (new Buffer(bin)).toString('base64');
							}
						}

						callback(clip); 
					});
				});
				break;

			case "replaceClipModuleResources":
				// クリップモジュールのリソースを取得し、コンテンツのリソースを更新する
				var moduleId = options.moduleId;
				broccoli.getModule(moduleId, undefined, function(module){
					if(!module){
						callback(false);
						return;
					}
					module.getClipContents(function(clip){
						broccoli.resourceMgr.getResourceDb(function(resourceDb){
							it79.ary(
								resourceDb,
								function(it1, resInfo, resId){
									if( resInfo.base64.match( /^LS0tLS1icm9jY29saS1yZXNvdXJjZS10ZW1wb3JhcnktaGFz/ ) ){
										var bin = (new Buffer(resInfo.base64, 'base64')).toString();
										var $hash = bin.replace(/^\-\-\-\-\-broccoli\-resource\-temporary\-hash\=/, '');
										broccoli.resourceMgr.updateResource(resId, clip.resources[$hash], function(){
											it1.next();
										});
										return;
									}
									it1.next();
								},
								function(){
									callback(clip); 
								}
							);
						});
					});
				});
				break;

			case "getAllModuleList":
				// 全モジュールの一覧を取得する
				broccoli.getAllModuleList(function(list){
					callback(list);
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
				callback(dataJson);
				break;

			case "saveContentsData":
				var jsonString = JSON.stringify( options.data, null, 4 );
				// console.log(jsonString);
				it79.fnc(
					{},
					[
						function(it1, data){
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
							callback(true);
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
						// console.log(htmls);
						callback(htmls);
					}
				);
				break;

			case "buildModuleCss":
				broccoli.buildModuleCss(function(css){
					callback(css);
				});
				break;

			case "buildModuleJs":
				broccoli.buildModuleJs(function(js){
					callback(js);
				});
				break;

			case "updateContents":
				broccoli.updateContents(
					function(result){
						// console.log(result);
						callback(result);
					}
				);
				break;

			case "resourceMgr.getResource":
				broccoli.resourceMgr.getResource(
					options.resKey ,
					function(resInfo){
						// console.log(resInfo);
						callback(resInfo);
					}
				);
				break;

			case "resourceMgr.duplicateResource":
				broccoli.resourceMgr.duplicateResource(
					options.resKey ,
					function(newResKey){
						// console.log(newResKey);
						callback(newResKey);
					}
				);
				break;

			case "resourceMgr.getResourceDb":
				broccoli.resourceMgr.getResourceDb(
					function(resourceDb){
						// console.log(resourceDb);
						callback(resourceDb);
					}
				);
				break;

			case "resourceMgr.getResourceList":
				broccoli.resourceMgr.getResourceDb(
					function(resourceDb){
						// console.log(resourceDb);
						var resourceList = [];
						for(var resKey in resourceDb){
							resourceList.push(resKey);
						}
						callback(resourceList);
					}
				);
				break;

			case "resourceMgr.addResource":
				broccoli.resourceMgr.addResource(
					function(newResKey){
						// console.log(newResKey);
						callback(newResKey);
					}
				);
				break;

			case "resourceMgr.getResourcePublicPath":
				broccoli.resourceMgr.getResourcePublicPath(
					options.resKey ,
					function(publicPath){
						// console.log(publicPath);
						callback(publicPath);
					}
				);
				break;

			case "resourceMgr.getResourceOriginalRealpath":
				broccoli.resourceMgr.getResourceOriginalRealpath(
					options.resKey ,
					function(publicPath){
						// console.log(publicPath);
						callback(publicPath);
					}
				);
				break;

			case "resourceMgr.updateResource":
				// console.log('GPI resourceMgr.updateResource');
				// console.log(options);
				broccoli.resourceMgr.updateResource(
					options.resKey ,
					options.resInfo ,
					function(result){
						// console.log(result);
						callback(result);
					}
				);
				break;

			case "resourceMgr.resetBinFromBase64":
				// console.log('GPI resourceMgr.resetBinFromBase64');
				// console.log(options);
				broccoli.resourceMgr.resetBinFromBase64(
					options.resKey ,
					function(result){
						// console.log(result);
						callback(result);
					}
				);
				break;

			case "resourceMgr.resetBase64FromBin":
				// console.log('GPI resourceMgr.resetBase64FromBin');
				// console.log(options);
				broccoli.resourceMgr.resetBase64FromBin(
					options.resKey ,
					function(result){
						// console.log(result);
						callback(result);
					}
				);
				break;

			case "resourceMgr.save":
				// console.log('GPI resourceMgr.save');
				// console.log(options);
				broccoli.resourceMgr.save(
					options.resourceDb ,
					function(result){
						// console.log(result);
						callback(result);
					}
				);
				break;

			case "resourceMgr.removeResource":
				// console.log('GPI resourceMgr.save');
				// console.log(options);
				broccoli.resourceMgr.removeResource(
					options.resKey ,
					function(result){
						// console.log(result);
						callback(result);
					}
				);
				break;

			case "fieldGpi":
				// console.log(api);
				// console.log(options.__fieldId__);
				// console.log(options.options);
				broccoli.fieldDefinitions[options.__fieldId__].gpi(
					options.options,
					function(result){
						callback(result);
					}
				);
				break;

			default:
				callback(true);
				break;
		}

	}); });

	return;
}
