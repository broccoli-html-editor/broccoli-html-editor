var assert = require('assert');
var path = require('path');
var fs = require('fs');
var phpjs = require('phpjs');
var Promise = require("es6-promise").Promise;
var Broccoli = require('../libs/main.js');

function makeDefaultBroccoli(){
	return new Broccoli({
		'testMod1': './testdata/modules1/',
		'testMod2': './testdata/modules2/'
	}, {
		'cd': __dirname
	});
}

describe('インスタンス初期化', function() {

	it("インスタンス初期化", function(done) {
		this.timeout(60*1000);

		var broccoli = makeDefaultBroccoli();
		// console.log(broccoli.paths_module_template);

		assert.equal(typeof(broccoli.paths_module_template), typeof({}));
		assert.equal(broccoli.paths_module_template.testMod1, path.resolve(__dirname,'testdata/modules1/')+'/');
		assert.equal(broccoli.paths_module_template.testMod2, path.resolve(__dirname,'testdata/modules2/')+'/');

		done();
	});

	it("オプションなしの初期化", function(done) {
		this.timeout(60*1000);
		var broccoli = new Broccoli({
			'testMod1': './tests/testdata/modules1/',
			'testMod2': './tests/testdata/modules2/'
		});
		assert.equal(typeof(broccoli.paths_module_template), typeof({}));
		assert.equal(broccoli.paths_module_template.testMod1, path.resolve('.','tests/testdata/modules1/')+'/');
		assert.equal(broccoli.paths_module_template.testMod2, path.resolve('.','tests/testdata/modules2/')+'/');

		done();
	});

});

describe('モジュールIDを分解する', function() {

	it("モジュールIDを分解する", function(done) {
		this.timeout(60*1000);

		var broccoli = makeDefaultBroccoli();
		var parsedId = broccoli.parseModuleId('pkg1:cat1/mod1');
		assert.equal(parsedId.package, 'pkg1');
		assert.equal(parsedId.category, 'cat1');
		assert.equal(parsedId.module, 'mod1');

		var parsedId = broccoli.parseModuleId('pkg-_1:cat-_=+1/mod-_=+1');
		assert.equal(parsedId.package, 'pkg-_1');
		assert.equal(parsedId.category, 'cat-_=+1');
		assert.equal(parsedId.module, 'mod-_=+1');

		done();
	});

	it("分解できないモジュールID", function(done) {
		this.timeout(60*1000);

		var broccoli = makeDefaultBroccoli();
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
	});

});

describe('パッケージ一覧の取得', function() {

	it("パッケージ一覧を取得する", function(done) {
		this.timeout(60*1000);

		var broccoli = makeDefaultBroccoli();
		broccoli.getPackageList(function(list){
			// console.log( list );
			assert.equal(list.length, 2);
			assert.equal(list[0].packageId, 'testMod1');
			assert.equal(list[0].packageName, 'テストモジュール1');
			done();
		});

	});

});

describe('モジュール一覧の取得', function() {

	it("パッケージIDからモジュール一覧を取得する", function(done) {
		this.timeout(60*1000);

		var broccoli = makeDefaultBroccoli();
		broccoli.getModuleListByPackageId('testMod1', function(modules){
			// console.log( modules );
			// console.log(modules.categories.units.modules);
			assert.equal(modules.categories.units.modules.cols2.moduleId, 'testMod1:units/cols2');
			assert.equal(modules.categories.units.modules.cols2.realpath, path.resolve(__dirname, 'testdata/modules1/units/cols2/')+'/');
			done();
		});

	});

});
