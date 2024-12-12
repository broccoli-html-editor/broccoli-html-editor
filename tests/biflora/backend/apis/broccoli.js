/**
 * API: broccoli
 */
module.exports = function( data, callback, main, socket ){
	delete(require.cache[require('path').resolve(__filename)]);
	var path = require('path');
	var it79 = require('iterate79');
	var fs = require('fs');

	data = data||{};
	callback = callback||function(){};

	var Broccoli = require('./../../../../libs/main.js');
	var broccoli = new Broccoli();

	it79.fnc(data, [
		function(it1, data){
			broccoli.init(
				{
					'paths_module_template': {
						'PlainHTMLElements': '../PlainHTMLElements/',
						'testMod1': '../modules1/',
						'testMod2': '../modules2/',
						'testMod3': '../modules3-deprecated/'
					} ,
					'documentRoot': path.resolve(__dirname, '../../../testdata/htdocs/')+'/',
					'pathHtml': '/editpage/index.html',
					'pathResourceDir': '/editpage/index_files/resources/',
					'realpathDataDir': path.resolve(__dirname, '../../../testdata/htdocs/editpage/index_files/guieditor.ignore/')+'/',
					'customFields': {
						'custom1': function(broccoli){
							/**
							 * データをバインドする
							 */
							this.bind = function( fieldData, mode, mod, callback ){
								var php = require('phpjs');
								var rtn = ''
								if(typeof(fieldData)===typeof('')){
									rtn = php.htmlspecialchars( fieldData ); // ←HTML特殊文字変換
									rtn = rtn.replace(new RegExp('\r\n|\r|\n','g'), '<br />'); // ← 改行コードは改行タグに変換
								}
								if( mode == 'canvas' && !rtn.length ){
									rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;white-space:nowrap;">(ダブルクリックしてテキストを編集してください)</span>';
								}
								rtn = '<div style="background-color:#993; color:#fff; padding:1em;">'+rtn+'</div>';
								setTimeout(function(){
									callback(rtn);
								}, 0);
								return;
							}

						}
					} ,
					'fieldConfig': {
						'image': {
							'filenameAutoSetter': 'ifEmpty'
						}
					},
					'bindTemplate': function(htmls, callback){
						var fin = '';
						fin += '<!DOCTYPE html>'+"\n";
						fin += '<html>'+"\n";
						fin += '    <head>'+"\n";
						fin += '        <meta charset="utf-8" />'+"\n";
						fin += '        <title>sample page</title>'+"\n";
						fin += '        <link rel="stylesheet" href="../common/css/common.css" />'+"\n";
						fin += '        <link rel="stylesheet" href="../common/css/module.css" />'+"\n";
						fin += '        <script src="../common/js/module.js"></script>'+"\n";
						fin += '        <style media="screen">'+"\n";
						fin += '            img{max-width:100%;}'+"\n";
						fin += '        </style>'+"\n";
						fin += '    </head>'+"\n";
						fin += '    <body>'+"\n";
						fin += '        <div class="theme_wrap">'+"\n";
						fin += '        <h1>sample page</h1>'+"\n";
						fin += '        <h2>main</h2>'+"\n";
						fin += '        <div class="contents" data-contents="main">'+"\n";
						fin += htmls['main']+"\n";
						fin += '        </div><!-- /main -->'+"\n";
						fin += '        <h2>secondly</h2>'+"\n";
						fin += '        <div class="contents" data-contents="secondly">'+"\n";
						fin += htmls['secondly']+"\n";
						fin += '        </div><!-- /secondly -->'+"\n";
						fin += '        <h2>thirdly</h2>'+"\n";
						fin += '        <div class="contents" data-contents="thirdly">'+"\n";
						fin += htmls['thirdly']+"\n";
						fin += '        </div><!-- /thirdly -->'+"\n";
						fin += '        <footer>'+"\n";
						fin += '            <a href="../editpage/">top</a>, <a href="http://www.pxt.jp/" target="_blank">pxt</a>'+"\n";
						fin += '            <form action="javascript:alert(\'form submit done.\');">'+"\n";
						fin += '                <input type="submit" value="submit!" />'+"\n";
						fin += '            </form>'+"\n";
						fin += '        </footer>'+"\n";
						fin += '        </div>'+"\n";
						fin += '    </body>'+"\n";
						fin += '</html>'+"\n";
						fin += '<script data-broccoli-receive-message="yes">'+"\n";
						fin += 'window.addEventListener(\'message\',(function() {'+"\n";
						fin += 'return function f(event) {'+"\n";
						fin += 'if(!event.data.scriptUrl){return;}'+"\n";
						fin += 'if(event.origin!=\'http://127.0.0.1:8088\'){return;}// <- check your own server\'s origin.'+"\n";
						fin += 'var s=document.createElement(\'script\');'+"\n";
						fin += 'document.querySelector(\'body\').appendChild(s);s.src=event.data.scriptUrl;'+"\n";
						fin += 'window.removeEventListener(\'message\', f, false);'+"\n";
						fin += '}'+"\n";
						fin += '})(),false);'+"\n";
						fin += '</script>'+"\n";

						callback(fin);
						return;
					},
					'log': function(msg){
						console.error('[ERROR HANDLED]'+msg);
					},
					'userStorage': function($key, $val, callback){
						// ユーザー固有の情報を読み書きします。
						var path = __dirname+'/../../../testdata/htdocs/user_storage/'+$key+'.json';
						if( arguments.length == 2 ){
							// 読み取りとしてコールされる場合、引数が2つだけ提供されます。
							callback = arguments[1];
							var data = fs.readFileSync( path ).toString();
							callback(data);
							return;
						}else{
							// 書き込みの要求の場合、引数が3つ提供されます。
							var result = fs.writeFileSync( path, $val );
							callback(result);
							return;
						}
					},
			        'noimagePlaceholder': __dirname + '/../../../testdata/htdocs/common/img/none.png',
					'extra': {
						// 任意のデータをセットします。
						// セットされたデータは、モジュールテンプレートやカスタムフィールドから参照することができます。
						'foo': 'bar',
					},
				},
				function(){
					it1.next(data);
				}
			);
		} ,
		function(it1, data){
			if(data.api == 'gpiBridge'){
				broccoli.gpi(
					data.bridge.api,
					data.bridge.options,
					function(rtn){
						it1.next(rtn);
					}
				);
				return ;

			}

			setTimeout(function(){
				data.messageByBackend = 'Callbacked by backend API "broccoli".';
				it1.next(data);
			}, 0);
			return;

		} ,
		function(it1, data){
			callback(data);
			it1.next(data);
		}
	]);


	return;
}
