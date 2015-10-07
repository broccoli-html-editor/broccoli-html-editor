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
		case "getPackageList":
			// モジュールパッケージ一覧を取得する
			broccoli.getPackageList(function(list){
				callback(list);
			});
			break;
		case "getContentsDataJson":
			var dataJson = require( broccoli.realpathDataDir+'/data.json' );
			callback(dataJson);
			break;
		case "saveContentsDataJson":
			var jsonString = JSON.stringify( options.data );
			console.log(jsonString);
			fs.writeFile(
				broccoli.realpathDataDir+'/data.json' ,
				jsonString ,
				function(){
					callback(true);
				}
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
