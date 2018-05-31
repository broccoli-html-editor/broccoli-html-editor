<?php
/**
 * broccoli-html-editor
 */
namespace broccoliHtmlEditor;

/**
 * BaseClass of Fields
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class fieldBase{

	/** $broccoli */
	private $broccoli;

	/** Field ID */
	public $__fieldId__;

	/**
	 * Constructor
	 */
	public function __construct($broccoli){
		$this->broccoli = $broccoli;
	}



	/**
	 * データをバインドする (Server Side)
	 */
	public function bind( $fieldData, $mode, $mod ){
		$rtn = '';
		if( is_string($fieldData) || is_null($fieldData) || is_int($fieldData) || is_float($fieldData) ){
			$rtn = ''.$fieldData;
		}
		if( $mode == 'canvas' && !strlen($rtn) ){
			$rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;white-space:nowrap;">(ダブルクリックしてHTMLコードを編集してください)</span>';
		}
		return $rtn;
	}

	/**
	 * リソースを加工する (Server Side)
	 */
	public function resourceProcessor( $path_orig, $path_public, $resInfo ){
		// ↓デフォルトの処理。オリジナルファイルをそのまま公開パスへ複製する。
		$result = copy( $path_orig, $path_public );
		return $result;
	}

	/**
	 * GPI (Server Side)
	 */
	public function gpi($options){
		return $options;
	}


}
