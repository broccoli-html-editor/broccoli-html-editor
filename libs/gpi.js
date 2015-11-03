/**
 * gpi.js (General Purpose Interface)
 */
module.exports = function(broccoli, api, options, callback){
	delete(require.cache[require('path').resolve(__filename)]);

	var _this = this;
	callback = callback || function(){};

	var it79 = require('iterate79');
	var path = require('path');
	var fs = require('fs');

	switch(api){
		case "getModulePackageList":
			// モジュールパッケージ一覧を取得する
			broccoli.getPackageList(function(list){
				callback(list);
			});
			break;
		case "getAllModuleList":
			// 全モジュールの一覧を取得する
			broccoli.getAllModuleList(function(list){
				callback(list);
			});
			break;
		case "getContentsDataJson":
			var dataJson = fs.readFileSync(broccoli.realpathDataDir+'/data.json');
			dataJson = JSON.parse( dataJson );
			callback(dataJson);
			break;
		case "saveContentsData":
			var jsonString = JSON.stringify( options.data, null, 1 );
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
						// HTML本体を更新する
						broccoli.buildHtml(
							{"mode":"finalize"},
							function(htmls){
								broccoli.options.bindTemplate(htmls, function(fin){
									fs.writeFile(
										broccoli.realpathHtml ,
										fin ,
										function(){
											it1.next(data);
										}
									);
								});
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
					'mode': 'canvas'
				} ,
				function(htmls){
					// console.log(htmls);
					callback(htmls);
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

	return;
}
