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

	// /**
	//  * リソースを加工する (Server Side)
	//  */
	// this.resourceProcessor = function( path_orig, path_public, resInfo, callback ){
	// 	// ↓デフォルトの処理。オリジナルファイルをそのまま公開パスへ複製する。
	// 	var fsEx = require('fs-extra');
	// 	fsEx.copy( path_orig, path_public, function(err){
	// 		callback(true);
	// 	} );
	// 	return this;
	// }

	// /**
	//  * GPI (Server Side)
	//  */
	// this.gpi = function(options, callback){
	// 	callback = callback || function(){};
	// 	new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
	// 		callback(options);
	// 	}); });
	// 	return this;
	// }


}
