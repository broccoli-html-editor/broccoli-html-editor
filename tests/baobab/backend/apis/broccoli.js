/**
 * API: broccoli
 */
module.exports = function( data, callback, main, socket ){
	delete(require.cache[require('path').resolve(__filename)]);
	var path = require('path');

	data = data||{};
	callback = callback||function(){};
	var Broccoli = require('./../../../../libs/main.js');
	var broccoli = new Broccoli({
		'paths_module_template': {
			'PlainHTMLElements': '../PlainHTMLElements/',
			'testMod1': '../modules1/',
			'testMod2': '../modules2/'
		} ,
		'documentRoot': path.resolve(__dirname, '../../../testdata/htdocs/')+'/',
		'pathHtml': '/editpage/index.html',
		'pathResourceDir': '/editpage/index_files/resources/',
		'realpathDataDir': path.resolve(__dirname, '../../../testdata/htdocs/editpage/index_files/guieditor.ignore/')+'/'
	});



	if(data.api == 'gpiBridge'){
		broccoli.gpi(
			data.bridge.api,
			data.bridge.options,
			function(rtn){
				callback(rtn);
			}
		);
		return ;

	}else if(data.api == 'getPackageList'){
		broccoli.getPackageList(function(list){
			callback(list);
		});
		return ;

	}else if(data.api == 'buildBowl'){
		var json = require( path.resolve(__dirname, '../../../testdata/htdocs/editpage/index_files/guieditor.ignore/data.json') );
		broccoli.buildBowl(
			json.bowl.main ,
			{
				'mode': 'canvas'
			} ,
			function(html){
				// console.log(html);
				callback(html);
			}
		);
		return ;

	}else if(data.api == 'buildHtml'){
		broccoli.buildHtml(
			{
				'mode': 'canvas'
			} ,
			function(htmls){
				// console.log(htmls);
				callback(htmls);
			}
		);
		return ;

	}

	setTimeout(function(){
		data.messageByBackend = 'callbacked by backend API "broccoli".';
		callback(data);
	}, 1000);
	return;
}
