<?php
/**
 * test for broccoli-html-editor/broccoli-html-editor
 */
class mainTest extends PHPUnit_Framework_TestCase{
	public function setup(){
		mb_internal_encoding('UTF-8');
	}


	/**
	 * 普通にインスタンス化して実行してみるテスト
	 */
	public function testStandard(){
		$broccoli = new broccoliHtmlEditor\broccoliHtmlEditor();
		$this->assertTrue( is_object($broccoli) );
	}

}
