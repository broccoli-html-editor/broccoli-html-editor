<?php
/**
 * broccoli-html-editor
 */
namespace broccoliHtmlEditor;

/**
 * broccoli-html-editor core class
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class broccoliHtmlEditor{

	/**
	 * Constructor
	 */
	public function __construct(){
	}

	/**
	 * Initialize
	 * @param array $options オプション
	 */
	public function init( $options ){

	}

	/**
	 * モジュールIDを分解する
	 */
	public function parseModuleId( $module_id ){
		$rtn = array(
			'package' => false,
			'category' => false,
			'module' => false,
		);
		if( !is_string($moduleId) ){
			return false;
		}
		if( !preg_match('/^(?:([0-9a-zA-Z\\_\\-\\.]*?)\\:)?([^\\/\\:\\s]+)\\/([^\\/\\:\\s]+)$/', $moduleId, $matched) ){
			return false;
		}
		$rtn['package'] = $matched[1];
		$rtn['category'] = $matched[2];
		$rtn['module'] = $matched[3];

		if( !strlen($rtn['package']) ){
			$rtn['package'] = null;
		}
		return $rtn;
	}

	/**
	 * モジュールの絶対パスを取得する
	 */
	public function getModuleRealpath( $module_id ){

	}

	/**
	 * パッケージ一覧の取得
	 */
	public function getPackageList(){

	}


}
