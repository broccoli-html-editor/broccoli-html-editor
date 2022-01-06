<?php
/**
 * test for broccoli-html-editor/broccoli-html-editor
 */
class mainTest extends PHPUnit\Framework\TestCase{
	private $fs;

	public function setup() : void{
		mb_internal_encoding('UTF-8');
		require_once(__DIR__.'/php_test_helper/helper.php');
		testHelper::start_built_in_server();
		$this->fs = new \tomk79\filesystem();
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
		$this->assertEquals($realpath, $this->fs->normalize_path(__DIR__.'/testdata/modules1/units/cols2/'));

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
		$this->assertEquals($list['testMod1']['packageName'], 'テストモジュール1(en)');
		$this->assertEquals($list['testMod1']['categories']['units']['modules']['cols2']['moduleId'], 'testMod1:units/cols2');
		$this->assertEquals($list['testMod1']['categories']['units']['modules']['cols2']['realpath'], $this->fs->normalize_path(__DIR__.'/testdata/modules1/units/cols2/'));

	}

	/**
	 * モジュール一覧の取得
	 */
	public function testGettingModuleListByPackageId(){
		$broccoli = testHelper::makeDefaultBroccoli();

		// パッケージIDからモジュール一覧を取得する
		$modules = $broccoli->getModuleListByPackageId('testMod1');
		$this->assertEquals($modules['categories']['units']['modules']['cols2']['moduleId'], 'testMod1:units/cols2');
		$this->assertEquals($modules['categories']['units']['modules']['cols2']['realpath'], $this->fs->normalize_path(__DIR__.'/testdata/modules1/units/cols2/'));
	}

	/**
	 * resourceMgr を操作する
	 */
	public function testResourceMgr(){
		$broccoli = testHelper::makeDefaultBroccoli();

		// resMgr.resetBase64FromBin()
		$resMgr = $broccoli->resourceMgr();
		$result = $resMgr->resetBase64FromBin('06f830991ad501926013ab2f9a52621b');
		$this->assertTrue($result);

		// resMgr.resetBinFromBase64()
		$resMgr = $broccoli->resourceMgr();
		$result = $resMgr->resetBinFromBase64('06f830991ad501926013ab2f9a52621b');
		$this->assertTrue($result);
	}

	/**
	 * モジュールインスタンスを生成する
	 */
	public function testCreateModuleInstance(){
		$broccoli = testHelper::makeDefaultBroccoli();

		// testMod1:units/cols2
		$mod = $broccoli->createModuleInstance('testMod1:units/cols2', array());
		$result = $mod->init();
		// var_dump( $result );
		$this->assertTrue($result);
		// var_dump( $mod );
		$this->assertSame(is_object($mod), true);
		$this->assertSame($mod->getTemplateType(), 'broccoli');
		$this->assertTrue($mod->isSingleRootElement);

		// testMod1:dev/twig
		$mod = $broccoli->createModuleInstance('testMod1:dev/twig', array());
		$result = $mod->init();
		// var_dump( $result );
		$this->assertSame($result, true);
		// var_dump( $mod );
		$this->assertTrue(is_object($mod));
		$this->assertSame($mod->getTemplateType(), 'twig');
		$this->assertTrue($mod->isSingleRootElement);
	
		// testMod1:units/thumb_list
		$mod = $broccoli->createModuleInstance('testMod1:units/thumb_list', array());
		$result = $mod->init();
		// var_dump( $result );
		$this->assertSame($result, true);
		// var_dump( $mod );
		$this->assertTrue(is_object($mod));
		$this->assertSame($mod->getTemplateType(), 'broccoli');
		$this->assertTrue($mod->isSingleRootElement);
	

		// testMod1:dev/multitext
		$mod = $broccoli->createModuleInstance('testMod1:dev/multitext', array());
		$result = $mod->init();
		// var_dump( $result );
		$this->assertTrue($result);
		// var_dump( $mod );
		$this->assertTrue(is_object($mod));
		$this->assertSame($mod->getTemplateType(), 'broccoli');
		$this->assertFalse($mod->isSingleRootElement);
	
	}


	/**
	 * 全モジュールの一覧の取得
	 */
	public function testGettingAllModuleList(){
		$broccoli = testHelper::makeDefaultBroccoli();	

		// 全モジュールの一覧を取得する
		$modules = $broccoli->getAllModuleList();
		// var_dump( $modules );
		// var_dump( $modules['testMod1:units/unit'] );
		$this->assertSame($modules['testMod1:units/unit']->isSystemModule, false);
		$this->assertSame($modules['testMod1:units/unit']->fields->{'main'}->name, 'main');

	}

	/**
	 * ビルドする
	 */
	public function testBuild(){
		$broccoli = testHelper::makeDefaultBroccoli();

		// モジュールのCSSをビルドする
		$src = $broccoli->buildModuleCss();
		file_put_contents(__DIR__.'/testdata/htdocs/common/css/module.css', $src);
		// var_dump( $src );


		// モジュールのJavaScriptをビルドする
		$src = $broccoli->buildModuleJs();
		file_put_contents(__DIR__.'/testdata/htdocs/common/js/module.js', $src);
		// var_dump( $src );


		// editpageをfinalizeモードでビルドする
		$broccoli = testHelper::makeDefaultBroccoli(array(
			'contents_id' => 'editpage/index',
		));
		$data = json_decode( file_get_contents(__DIR__.'/testdata/htdocs/editpage/index_files/guieditor.ignore/data.json') );
		// var_dump($data);
		$dataBowlMain = @$data->bowl->main;
		$html = $broccoli->buildBowl(
			$dataBowlMain ,
			array(
				'mode' => 'finalize'
			)
		);
		file_put_contents(__DIR__.'/testdata/htdocs/test2/index.html', $html);
		// var_dump( $html );


		// editpageをcanvasモードでビルドする
		$broccoli = testHelper::makeDefaultBroccoli(array(
			'contents_id' => 'editpage/index',
		));
		$data = json_decode(file_get_contents(__DIR__.'/testdata/htdocs/editpage/index_files/guieditor.ignore/data.json'));
		// var_dump($data);
		$dataBowlMain = @$data->bowl->main;
		$html = $broccoli->buildBowl(
			$dataBowlMain ,
			array(
				'mode' => 'canvas'
			)
		);
		file_put_contents(__DIR__.'/testdata/htdocs/test2/index.canvas.html', $html);
		// var_dump( $html );


		// テストデータ1をfinalizeモードでビルドする
		$broccoli = testHelper::makeDefaultBroccoli();
		$data = json_decode(file_get_contents(__DIR__.'/testdata/htdocs/test1/test1_files/guieditor.ignore/data.json'));
		// var_dump($data);
		$html = $broccoli->buildBowl(
			$data->bowl->main ,
			array(
				'mode' => 'finalize'
			)
		);
		file_put_contents(__DIR__.'/testdata/htdocs/test1/test1.html', $html);
		// var_dump( $html );


		// テストデータ1をcanvasモードでビルドする
		$broccoli = testHelper::makeDefaultBroccoli();
		$data = json_decode(file_get_contents(__DIR__.'/testdata/htdocs/test1/test1_files/guieditor.ignore/data.json'));
		// var_dump($data);
		$html = $broccoli->buildBowl(
			$data->bowl->main ,
			array(
				'mode' => 'canvas'
			)
		);
		file_put_contents(__DIR__.'/testdata/htdocs/test1/test1.canvas.html', $html);
		// var_dump( $html );



		// テストデータ3-1 新規ブランクdata.json をfinalizeモードでビルドする
		$broccoli = testHelper::makeDefaultBroccoli(array(
			'contents_id' => 'test3/1',
		));
		$htmls = $broccoli->buildHtml(
			array(
				'mode' => 'finalize',
				'bowlList' => array('main','secondly')
			)
		);
		// var_dump( $htmls );
		file_put_contents(__DIR__.'/testdata/htdocs/test3/1.main.html', $htmls['main'] );
		file_put_contents(__DIR__.'/testdata/htdocs/test3/1.secondly.html', $htmls['secondly'] );


		// テストデータ3-1 新規ブランクdata.json をcanvasモードでビルドする
		$broccoli = testHelper::makeDefaultBroccoli(array(
			'contents_id' => 'test3/1',
		));
		$htmls = $broccoli->buildHtml(
			array(
				'mode' => 'canvas',
				'bowlList' => array('main','secondly')
			)
		);
		file_put_contents(__DIR__.'/testdata/htdocs/test3/1.main.canvas.html', $htmls['main'] );
		file_put_contents(__DIR__.'/testdata/htdocs/test3/1.secondly.canvas.html', $htmls['secondly'] );


		// 未定義のモジュールを含む場合のビルド
		$broccoli = testHelper::makeDefaultBroccoli();
		$data = json_decode(file_get_contents(__DIR__.'/testdata/htdocs/unknown_module/unknown_files/guieditor.ignore/data.json'));
		// var_dump($data);
		$html = $broccoli->buildBowl(
			$data->bowl->main ,
			array(
				'mode' => 'finalize'
			)
		);
		file_put_contents(__DIR__.'/testdata/htdocs/unknown_module/unknown.html', $html);


		// 空のdata.jsonでビルド
		$broccoli = testHelper::makeDefaultBroccoli();
		$data = json_decode(file_get_contents(__DIR__.'/testdata/htdocs/unknown_module/empty_data_json_files/guieditor.ignore/data.json'));
		// var_dump($data);
		$html = $broccoli->buildBowl(
			null ,
			array(
				'mode' => 'finalize'
			)
		);
		file_put_contents(__DIR__.'/testdata/htdocs/unknown_module/empty_data_json.html', $html);



		// editpageをビルドして更新する
		$broccoli = testHelper::makeDefaultBroccoli(array('contents_id' => 'editpage/index'));
		$result = $broccoli->updateContents();
		$this->assertTrue($result);



		// editpageのリソースを保存しなおす(imageフィールドの加工処理を含む)
		$broccoli = testHelper::makeDefaultBroccoli(array('contents_id' => 'editpage/index'));
		$resourceDb = $broccoli->resourceMgr()->getResourceDb();
		$result = $broccoli->resourceMgr()->save( $resourceDb );
		$this->assertSame(is_file( __DIR__.'/testdata/htdocs/editpage/index_files/guieditor.ignore/resources/1e970f28b68cf1c3318431e73040c492/bin.svg'), true);
		$this->assertSame(is_file( __DIR__.'/testdata/htdocs/editpage/index_files/guieditor.ignore/resources/1e970f28b68cf1c3318431e73040c492/res.json'), true);
		$this->assertSame($result, true);

	}

	/**
	 * 後処理
	 */
	public function testCleaning(){
		unlink(__DIR__.'/php_test_helper/error.log');
		$this->assertFalse( is_file( __DIR__.'/php_test_helper/error.log' ) );
	}

}
