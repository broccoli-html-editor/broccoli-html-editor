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
		'realpathDataDir': path.resolve(__dirname, '../../../testdata/htdocs/editpage/index_files/guieditor.ignore/')+'/',
		'bindTemplate': function(htmls, callback){
			var fin = '';
			fin += '<!DOCTYPE html>'+"\n";
			fin += '<html>'+"\n";
			fin += '    <head>'+"\n";
			fin += '        <meta charset="utf-8" />'+"\n";
			fin += '        <title>sample page</title>'+"\n";
			fin += '        <style media="screen">'+"\n";
			fin += '            img{max-width:100%;}'+"\n";
			fin += '        </style>'+"\n";
			fin += '    </head>'+"\n";
			fin += '    <body>'+"\n";
			fin += '        <h1>sample page</h1>'+"\n";
			fin += '        <h2>main</h2>'+"\n";
			fin += '        <div class="contents" data-contents="main">'+"\n";
			fin += htmls['main']+"\n";
			fin += '        </div><!-- /main -->'+"\n";
			fin += '        <h2>secondly</h2>'+"\n";
			fin += '        <div class="contents" data-contents="secondly">'+"\n";
			fin += htmls['secondly']+"\n";
			fin += '        </div><!-- /secondly -->'+"\n";
			fin += '    </body>'+"\n";
			fin += '</html>';

			callback(fin);
			return;
		}
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

	}

	setTimeout(function(){
		data.messageByBackend = 'callbacked by backend API "broccoli".';
		callback(data);
	}, 1000);
	return;
}
