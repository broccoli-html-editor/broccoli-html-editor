<?php
/**
 * broccoli-html-editor fields
 */
namespace broccoliHtmlEditor\fields;

/**
 * Color Field
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class color extends \broccoliHtmlEditor\fieldBase{

	/**
	 * データをバインドする
	 */
	public function bind( $fieldData, $mode, $mod ){
		$rtn = '';
		if( is_string($fieldData) ){
			$rtn = htmlspecialchars( $fieldData ); // ←HTML特殊文字変換
			$rtn = preg_replace('/\r\n|\r|\n/s', '<br />', $rtn); // ← 改行コードは改行タグに変換
		}
		if( $mode == 'canvas' && !strlen($rtn) ){
			$rtn = '';
		}
		return $rtn;
	}

}
