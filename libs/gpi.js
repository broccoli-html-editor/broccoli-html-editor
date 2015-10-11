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
		default:
			callback(true);
			break;
	}

	return;
}
