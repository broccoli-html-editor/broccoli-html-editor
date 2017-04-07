var assert = require('assert');
var path = require('path');
var fs = require('fs');
var fsEx = require('fs-extra');
var utils79 = require('utils79');
var phpjs = require('phpjs');
var Promise = require("es6-promise").Promise;
var Broccoli = require('../libs/main.js');

function makeDefaultBroccoli(options, callback){
	options = options||{};
	var paths_module_template = options.paths_module_template || {
		'PlainHTMLElements': '../PlainHTMLElements',
		'testMod1': '../modules1',
		'testMod2': '../modules2'
	};
	var contents_id = options.contents_id||'test1/test1';
	// console.log(contents_id);

	var broccoli = new Broccoli();
	broccoli.init(
		{
			'paths_module_template': paths_module_template,
			'documentRoot': require('path').resolve(__dirname, 'testdata/htdocs/'),
			'pathHtml': require('path').resolve('/'+contents_id+'.html'),
			'pathResourceDir': require('path').resolve('/'+contents_id+'_files/resources/'),
			'realpathDataDir': require('path').resolve(__dirname, 'testdata/htdocs/'+contents_id+'_files/guieditor.ignore/'),
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
			'bindTemplate': function(htmls, callback){
				var fin = '';
				fin += '<!DOCTYPE html>'+"\n";
				fin += '<html>'+"\n";
				fin += '    <head>'+"\n";
				fin += '        <meta charset="utf-8" />'+"\n";
				fin += '        <title>sample page</title>'+"\n";
				fin += '        <link rel="stylesheet" href="/common/css/common.css" />'+"\n";
				fin += '        <link rel="stylesheet" href="/common/css/module.css" />'+"\n";
				fin += '        <script src="/common/js/module.js"></script>'+"\n";
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
				fin += '        <footer>'+"\n";
				fin += '            <a href="/editpage/">top</a>, <a href="http://www.pxt.jp/" target="_blank">pxt</a>'+"\n";
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
				fin += 'if(event.origin!=\'http://127.0.0.1:8088\'){return;}// <- check your own server\'s origin.'+"\n";
				fin += 'var s=document.createElement(\'script\');'+"\n";
				fin += 'document.querySelector(\'body\').appendChild(s);s.src=event.data.scriptUrl;'+"\n";
				fin += 'window.removeEventListener(\'message\', f, false);'+"\n";
				fin += '}'+"\n";
				fin += '})(),false);'+"\n";
				fin += '</script>'+"\n";

				callback(fin);
				return;
			}
		},
		function(){
			callback(broccoli);
		}
	);
	return;
}

describe('インスタンス初期化', function() {

	it("インスタンス初期化", function(done) {
		this.timeout(60*1000);

		makeDefaultBroccoli( {}, function(broccoli){
			// console.log(broccoli.options.documentRoot);
			// console.log(broccoli.realpathHtml);
			// console.log(broccoli.paths_module_template);

			assert.equal(typeof(broccoli.paths_module_template), typeof({}));
			assert.equal(broccoli.paths_module_template.testMod1, path.resolve(__dirname,'testdata/modules1/')+'/');
			assert.equal(broccoli.paths_module_template.testMod2, path.resolve(__dirname,'testdata/modules2/')+'/');

			done();
		} );
	});

	it("[ERROR] オプションなしの初期化", function(done) {
		this.timeout(60*1000);
		var broccoli = new Broccoli();
		// console.log(broccoli);
		assert.strictEqual(typeof(broccoli.paths_module_template), typeof(undefined));

		done();
	});

});

describe('モジュールIDを分解する', function() {

	it("モジュールIDを分解する", function(done) {
		this.timeout(60*1000);

		makeDefaultBroccoli( {}, function(broccoli){
			var parsedId = broccoli.parseModuleId('pkg1:cat1/mod1');
			assert.equal(parsedId.package, 'pkg1');
			assert.equal(parsedId.category, 'cat1');
			assert.equal(parsedId.module, 'mod1');

			var parsedId = broccoli.parseModuleId('pkg-_1:cat-_=+1/mod-_=+1');
			assert.equal(parsedId.package, 'pkg-_1');
			assert.equal(parsedId.category, 'cat-_=+1');
			assert.equal(parsedId.module, 'mod-_=+1');

			var parsedId = broccoli.parseModuleId('pkg1cat1/mod1');
			assert.equal(parsedId.package, null);
			assert.equal(parsedId.category, 'pkg1cat1');
			assert.equal(parsedId.module, 'mod1');

			var parsedId = broccoli.parseModuleId(':pkg1cat1/mod1');
			assert.equal(parsedId.package, null);
			assert.equal(parsedId.category, 'pkg1cat1');
			assert.equal(parsedId.module, 'mod1');

			done();
		} );
	});

	it("分解できないモジュールID", function(done) {
		this.timeout(60*1000);

		makeDefaultBroccoli( {}, function(broccoli){
			var parsedId = broccoli.parseModuleId('pkg1:cat1//mod1');
			assert.equal(parsedId, false);

			var parsedId = broccoli.parseModuleId('pkg1;:cat1/mod1');
			assert.equal(parsedId, false);

			var parsedId = broccoli.parseModuleId('pkg1:cat1mod1');
			assert.equal(parsedId, false);

			var parsedId = broccoli.parseModuleId('pkg1cat1mod1');
			assert.equal(parsedId, false);

			var parsedId = broccoli.parseModuleId('pkg1:a:cat1/mod1');
			assert.equal(parsedId, false);

			var parsedId = broccoli.parseModuleId('pkg1: cat1 / mod1');
			assert.equal(parsedId, false);

			done();
		} );
	});

});

describe('モジュールの絶対パスを取得する', function() {

	it("モジュールの絶対パスを取得する", function(done) {
		this.timeout(60*1000);

		makeDefaultBroccoli( {}, function(broccoli){
			var realpath = broccoli.getModuleRealpath('testMod1:units/cols2');
			assert.equal(realpath, path.resolve(__dirname, 'testdata/modules1/units/cols2')+'/');

			done();
		} );
	});

	it("実在しないモジュールの絶対パスを取得する", function(done) {
		this.timeout(60*1000);

		makeDefaultBroccoli( {}, function(broccoli){
			var realpath = broccoli.getModuleRealpath('testMod1:units/cols2/');
			assert.strictEqual(realpath, false);

			var realpath = broccoli.getModuleRealpath('testMod1:units/unExistsModule');
			assert.strictEqual(realpath, false);

			var realpath = broccoli.getModuleRealpath('pkg1:cat1/mod1');
			assert.strictEqual(realpath, false);

			done();
		} );
	});

});

describe('パッケージ一覧の取得', function() {

	it("パッケージ一覧を取得する", function(done) {
		this.timeout(60*1000);

		makeDefaultBroccoli( {}, function(broccoli){
			broccoli.getPackageList(function(list){
				// console.log( list );
				assert.equal(list['testMod1'].packageId, 'testMod1');
				assert.equal(list['testMod1'].packageName, 'テストモジュール1');
				assert.equal(list['testMod1'].categories.units.modules.cols2.moduleId, 'testMod1:units/cols2');
				assert.equal(list['testMod1'].categories.units.modules.cols2.realpath, path.resolve(__dirname, 'testdata/modules1/units/cols2/')+'/');
				done();
			});
		} );
	});

});

describe('モジュール一覧の取得', function() {

	it("パッケージIDからモジュール一覧を取得する", function(done) {
		this.timeout(60*1000);

		makeDefaultBroccoli( {}, function(broccoli){
			broccoli.getModuleListByPackageId('testMod1', function(modules){
				// console.log( modules );
				// console.log(modules.categories.units.modules);
				assert.equal(modules.categories.units.modules.cols2.moduleId, 'testMod1:units/cols2');
				assert.equal(modules.categories.units.modules.cols2.realpath, path.resolve(__dirname, 'testdata/modules1/units/cols2/')+'/');
				done();
			});
		} );
	});

});


describe('resourceMgr を操作する', function() {

	it("resMgr.resetBase64FromBin()", function(done) {
		this.timeout(15*1000);
		makeDefaultBroccoli( {}, function(broccoli){
			var resMgr = broccoli.resourceMgr;
			resMgr.resetBase64FromBin('06f830991ad501926013ab2f9a52621b', function(result){
				// console.log(result);
				assert.equal(true, result);
				done();
			});
		} );
	});

	it("resMgr.resetBinFromBase64()", function(done) {
		this.timeout(15*1000);
		makeDefaultBroccoli( {}, function(broccoli){
			var resMgr = broccoli.resourceMgr;
			resMgr.resetBinFromBase64('06f830991ad501926013ab2f9a52621b', function(result){
				// console.log(result);
				assert.equal(true, result);
				done();
			});
		} );
	});

});


describe('モジュールインスタンスを生成する', function() {

	it("testMod1:units/cols2", function(done) {
		this.timeout(15*1000);
		makeDefaultBroccoli( {}, function(broccoli){
			var mod = broccoli.createModuleInstance('testMod1:units/cols2', {});
			mod.init(function(result){
				// console.log( result );
				assert.strictEqual(result, true);
				// console.log( mod );
				assert.strictEqual(typeof(mod), typeof({}));
				assert.strictEqual(mod.templateType, 'broccoli');
				assert.strictEqual(mod.isSingleRootElement, true);
				done();
			});
		} );
	});

	it("testMod1:dev/twig", function(done) {
		this.timeout(15*1000);
		makeDefaultBroccoli( {}, function(broccoli){
			var mod = broccoli.createModuleInstance('testMod1:dev/twig', {});
			mod.init(function(result){
				// console.log( result );
				assert.strictEqual(result, true);
				// console.log( mod );
				assert.strictEqual(typeof(mod), typeof({}));
				assert.strictEqual(mod.templateType, 'twig');
				assert.strictEqual(mod.isSingleRootElement, true);
				done();
			});
		} );
	});

	it("testMod1:units/thumb_list", function(done) {
		this.timeout(15*1000);
		makeDefaultBroccoli( {}, function(broccoli){
			var mod = broccoli.createModuleInstance('testMod1:units/thumb_list', {});
			mod.init(function(result){
				// console.log( result );
				assert.strictEqual(result, true);
				// console.log( mod );
				assert.strictEqual(typeof(mod), typeof({}));
				assert.strictEqual(mod.templateType, 'broccoli');
				assert.strictEqual(mod.isSingleRootElement, true);
				done();
			});
		} );
	});

	it("testMod1:dev/multitext", function(done) {
		this.timeout(15*1000);
		makeDefaultBroccoli( {}, function(broccoli){
			var mod = broccoli.createModuleInstance('testMod1:dev/multitext', {});
			mod.init(function(result){
				// console.log( result );
				assert.strictEqual(result, true);
				// console.log( mod );
				assert.strictEqual(typeof(mod), typeof({}));
				assert.strictEqual(mod.templateType, 'broccoli');
				assert.strictEqual(mod.isSingleRootElement, false);
				done();
			});
		} );
	});

});

describe('全モジュールの一覧の取得', function() {

	it("全モジュールの一覧を取得する", function(done) {
		this.timeout(60*1000);

		makeDefaultBroccoli( {}, function(broccoli){
			broccoli.getAllModuleList(function(modules){
				// console.log( modules );
				// console.log( modules['testMod1:units/unit'] );
				assert.strictEqual(modules['testMod1:units/unit'].isSystemModule, false);
				assert.strictEqual(modules['testMod1:units/unit'].fields.main.name, 'main');
				done();
			});
		} );
	});

});

describe('ビルドする', function() {

	it("モジュールのCSSをビルドする", function(done) {
		this.timeout(15*1000);
		makeDefaultBroccoli( {}, function(broccoli){
			broccoli.buildModuleCss(
				function( src, err ){
					fs.writeFileSync(path.resolve(__dirname, './testdata/htdocs/common/css/module.css'), src);
					// console.log( src );
					done();
				}
			);
		} );
	});

	it("モジュールのJavaScriptをビルドする", function(done) {
		this.timeout(15*1000);
		makeDefaultBroccoli( {}, function(broccoli){
			broccoli.buildModuleJs(
				function( src, err ){
					fs.writeFileSync(path.resolve(__dirname, './testdata/htdocs/common/js/module.js'), src);
					// console.log( src );
					done();
				}
			);
		} );
	});

	it("editpageをfinalizeモードでビルドする", function(done) {
		this.timeout(15*1000);
		makeDefaultBroccoli( {'contents_id': 'editpage/index'}, function(broccoli){
			var data = require(__dirname+'/testdata/htdocs/editpage/index_files/guieditor.ignore/data.json');
			// console.log(data);
			var dataBowlMain = undefined;
			try {
				dataBowlMain = data.bowl.main;
			} catch (e) {
			}
			broccoli.buildBowl(
				dataBowlMain ,
				{
					'mode': 'finalize'
				} ,
				function( html, err ){
					fs.writeFileSync(path.resolve(__dirname, './testdata/htdocs/test2/index.html'), html);
					// console.log( html );
					done();
				}
			);
		} );
	});

	it("editpageをcanvasモードでビルドする", function(done) {
		this.timeout(15*1000);
		makeDefaultBroccoli( {'contents_id': 'editpage/index'}, function(broccoli){
			var data = require(__dirname+'/testdata/htdocs/editpage/index_files/guieditor.ignore/data.json');
			// console.log(data);
			var dataBowlMain = undefined;
			try {
				dataBowlMain = data.bowl.main;
			} catch (e) {
			}
			broccoli.buildBowl(
				dataBowlMain ,
				{
					'mode': 'canvas'
				} ,
				function( html, err ){
					fs.writeFileSync(path.resolve(__dirname, './testdata/htdocs/test2/index.canvas.html'), html);
					// console.log( html );
					done();
				}
			);
		} );
	});

	it("テストデータ1をfinalizeモードでビルドする", function(done) {
		this.timeout(15*1000);
		makeDefaultBroccoli( {}, function(broccoli){
			var data = require(__dirname+'/testdata/htdocs/test1/test1_files/guieditor.ignore/data.json');
			// console.log(data);
			broccoli.buildBowl(
				data.bowl.main ,
				{
					'mode': 'finalize'
				} ,
				function( html, err ){
					fs.writeFileSync(path.resolve(__dirname, './testdata/htdocs/test1/test1.html'), html);
					// console.log( html );
					done();
				}
			);
		} );
	});

	it("テストデータ1をcanvasモードでビルドする", function(done) {
		this.timeout(15*1000);
		makeDefaultBroccoli( {}, function(broccoli){
			var data = require(__dirname+'/testdata/htdocs/test1/test1_files/guieditor.ignore/data.json');
			// console.log(data);
			broccoli.buildBowl(
				data.bowl.main ,
				{
					'mode': 'canvas'
				} ,
				function( html, err ){
					fs.writeFileSync(path.resolve(__dirname, './testdata/htdocs/test1/test1.canvas.html'), html);
					// console.log( html );
					done();
				}
			);
		} );
	});

	it("テストデータ3-1 新規ブランクdata.json をfinalizeモードでビルドする", function(done) {
		this.timeout(15*1000);
		makeDefaultBroccoli( {'contents_id': 'test3/1'}, function(broccoli){
			broccoli.buildHtml(
				{
					'mode': 'finalize',
					'bowlList': ['main','secondly']
				} ,
				function( htmls ){
					// console.log( htmls );
					fs.writeFileSync(path.resolve(__dirname, './testdata/htdocs/test3/1.main.html'), htmls['main'] );
					fs.writeFileSync(path.resolve(__dirname, './testdata/htdocs/test3/1.secondly.html'), htmls['secondly'] );
					done();
				}
			);
		} );
	});

	it("テストデータ3-1 新規ブランクdata.json をcanvasモードでビルドする", function(done) {
		this.timeout(15*1000);
		makeDefaultBroccoli( {'contents_id': 'test3/1'}, function(broccoli){
			broccoli.buildHtml(
				{
					'mode': 'canvas',
					'bowlList': ['main','secondly']
				} ,
				function( htmls ){
					// console.log( htmls );
					fs.writeFileSync(path.resolve(__dirname, './testdata/htdocs/test3/1.main.canvas.html'), htmls['main'] );
					fs.writeFileSync(path.resolve(__dirname, './testdata/htdocs/test3/1.secondly.canvas.html'), htmls['secondly'] );
					done();
				}
			);
		} );
	});

	it("未定義のモジュールを含む場合のビルド", function(done) {
		this.timeout(15*1000);
		makeDefaultBroccoli( {}, function(broccoli){
			var data = require(__dirname+'/testdata/htdocs/unknown_module/unknown_files/guieditor.ignore/data.json');
			// console.log(data);
			broccoli.buildBowl(
				data.bowl.main ,
				{
					'mode': 'finalize'
				} ,
				function( html, err ){
					fs.writeFileSync(path.resolve(__dirname, './testdata/htdocs/unknown_module/unknown.html'), html);
					// console.log( html );
					done();
				}
			);
		} );
	});

	it("空のdata.jsonでビルド", function(done) {
		this.timeout(15*1000);
		makeDefaultBroccoli( {}, function(broccoli){
			var data = require(__dirname+'/testdata/htdocs/unknown_module/empty_data_json_files/guieditor.ignore/data.json');
			// console.log(data);
			broccoli.buildBowl(
				undefined ,
				{
					'mode': 'finalize'
				} ,
				function( html, err ){
					fs.writeFileSync(path.resolve(__dirname, './testdata/htdocs/unknown_module/empty_data_json.html'), html);
					// console.log( html );
					done();
				}
			);
		} );
	});

	it("editpageをビルドして更新する", function(done) {
		this.timeout(15*1000);
		makeDefaultBroccoli( {'contents_id': 'editpage/index'}, function(broccoli){
			broccoli.updateContents( function(result){
				assert.strictEqual(result, true);
				done();
			} );
		} );
	});

	it("editpageのリソースを保存しなおす(imageフィールドの加工処理を含む)", function(done) {
		this.timeout(15*1000);
		makeDefaultBroccoli( {'contents_id': 'editpage/index'}, function(broccoli){
			broccoli.resourceMgr.getResourceDb(
				function(resourceDb){

					// 一旦ディレクトリをすべて削除して、復元されることを確認する。
					fsEx.emptyDir(
						require('path').resolve(__dirname, './testdata/htdocs/editpage/index_files/guieditor.ignore/resources/'),
						function(err){
							setTimeout(function(){
								broccoli.resourceMgr.save(
									resourceDb ,
									function(result){

										assert.strictEqual(utils79.is_file( require('path').resolve(__dirname, './testdata/htdocs/editpage/index_files/guieditor.ignore/resources/1e970f28b68cf1c3318431e73040c492/bin.svg') ), true);
										assert.strictEqual(utils79.is_file( require('path').resolve(__dirname, './testdata/htdocs/editpage/index_files/guieditor.ignore/resources/1e970f28b68cf1c3318431e73040c492/res.json') ), true);
										assert.strictEqual(result, true);
										done();
									}
								);
							}, 500);
						}
					);

				}
			);
		} );
	});

});
