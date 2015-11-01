var assert = require('assert');
var path = require('path');
var fs = require('fs');
var phpjs = require('phpjs');
var Promise = require("es6-promise").Promise;
var Broccoli = require('../libs/main.js');

function makeDefaultBroccoli(options, callback){
	options = options||{};
	var paths_module_template = options.paths_module_template || {
		'PlainHTMLElements': '../PlainHTMLElements/',
		'testMod1': '../modules1/',
		'testMod2': '../modules2/'
	};
	var broccoli = new Broccoli();
	broccoli.init(
		{
			'paths_module_template': paths_module_template,
			'documentRoot': path.resolve(__dirname, 'testdata/htdocs/')+'/',
			'pathHtml': '/test1/test1.html',
			'pathResourceDir': '/test1/test1_files/resources/',
			'realpathDataDir': path.resolve(__dirname, 'testdata/htdocs/test1/test1_files/guieditor.ignore/')+'/'
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

			var parsedId = broccoli.parseModuleId('pkg1cat1/mod1');
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

	it("テストデータをfinalizeモードでビルドする", function(done) {
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

	it("テストデータをcanvasモードでビルドする", function(done) {
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

});
