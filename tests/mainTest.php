<?php
/**
 * test for broccoli-html-editor/broccoli-html-editor
 */
class mainTest extends PHPUnit_Framework_TestCase{
	public function setup(){
		mb_internal_encoding('UTF-8');
		require_once(__DIR__.'/php_test_helper/helper.php');
	}


	/**
	 * インスタンス初期化
	 */
	public function testInitialize(){
		$broccoli = testHelper::makeDefaultBroccoli();
		$this->assertTrue( is_object($broccoli) );
	}


	/**
	 * モジュールIDを分解する
	 */
	public function testParseModuleId(){
		$broccoli = testHelper::makeDefaultBroccoli();

		// 分解できるモジュールID
		$parsedId = $broccoli->parseModuleId('pkg1:cat1/mod1');
		$this->assertEquals($parsedId['package'], 'pkg1');
		$this->assertEquals($parsedId['category'], 'cat1');
		$this->assertEquals($parsedId['module'], 'mod1');

		$parsedId = $broccoli->parseModuleId('pkg-_1:cat-_=+1/mod-_=+1');
		$this->assertEquals($parsedId['package'], 'pkg-_1');
		$this->assertEquals($parsedId['category'], 'cat-_=+1');
		$this->assertEquals($parsedId['module'], 'mod-_=+1');

		$parsedId = $broccoli->parseModuleId('pkg1cat1/mod1');
		$this->assertEquals($parsedId['package'], null);
		$this->assertEquals($parsedId['category'], 'pkg1cat1');
		$this->assertEquals($parsedId['module'], 'mod1');

		$parsedId = $broccoli->parseModuleId(':pkg1cat1/mod1');
		$this->assertEquals($parsedId['package'], null);
		$this->assertEquals($parsedId['category'], 'pkg1cat1');
		$this->assertEquals($parsedId['module'], 'mod1');

		// 分解できないモジュールID
		$parsedId = $broccoli->parseModuleId('pkg1:cat1//mod1');
		$this->assertFalse($parsedId);

		$parsedId = $broccoli->parseModuleId('pkg1;:cat1/mod1');
		$this->assertFalse($parsedId);

		$parsedId = $broccoli->parseModuleId('pkg1:cat1mod1');
		$this->assertFalse($parsedId);

		$parsedId = $broccoli->parseModuleId('pkg1cat1mod1');
		$this->assertFalse($parsedId);

		$parsedId = $broccoli->parseModuleId('pkg1:a:cat1/mod1');
		$this->assertFalse($parsedId);

		$parsedId = $broccoli->parseModuleId('pkg1: cat1 / mod1');
		$this->assertFalse($parsedId);

	}

	/**
	 * モジュールの絶対パスを取得する
	 */
	public function testGettingModuleRealpath(){
		$broccoli = testHelper::makeDefaultBroccoli();

		// モジュールの絶対パスを取得する
		$realpath = $broccoli->getModuleRealpath('testMod1:units/cols2');
		$this->assertEquals($realpath, __DIR__.'/testdata/modules1/units/cols2/');

		// 実在しないモジュールの絶対パスを取得する
		$realpath = $broccoli->getModuleRealpath('testMod1:units/cols2/');
		$this->assertFalse($realpath);

		$realpath = $broccoli->getModuleRealpath('testMod1:units/unExistsModule');
		$this->assertFalse($realpath);

		$realpath = $broccoli->getModuleRealpath('pkg1:cat1/mod1');
		$this->assertFalse($realpath);

	}

	/**
	 * パッケージ一覧の取得
	 */
	public function testGettingPackageList(){
		$broccoli = testHelper::makeDefaultBroccoli();

		// パッケージ一覧の取得
		$list = $broccoli->getPackageList();
		$this->assertEquals($list['testMod1']['packageId'], 'testMod1');
		$this->assertEquals($list['testMod1']['packageName'], 'テストモジュール1');
		$this->assertEquals($list['testMod1']['categories']['units']['modules']['cols2']['moduleId'], 'testMod1:units/cols2');
		$this->assertEquals($list['testMod1']['categories']['units']['modules']['cols2']['realpath'], __DIR__.'/testdata/modules1/units/cols2/');

	}

}
