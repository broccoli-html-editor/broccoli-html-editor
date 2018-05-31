<?php
/**
 * broccoli-html-editor fields
 */
namespace broccoliHtmlEditor\fields;

/**
 * HTML Attribute Text Field
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class html_attr_text extends \broccoliHtmlEditor\fieldBase{

	/**
	 * データをバインドする
	 */
	public function bind( $fieldData, $mode, $mod ){
		$rtn = '';
		if(is_string($fieldData)){
			$rtn = $fieldData;
			$rtn = htmlspecialchars( $rtn ); // ←HTML特殊文字変換
			// $rtn = preg_replace('/\r\n|\r|\n/s', '<br />', $rtn); // ← 属性値などに使うので、改行コードは改行コードのままじゃないとマズイ。
		}
		if( $mode == 'canvas' && !strlen($rtn) ){
			$rtn = '(ダブルクリックしてテキストを編集してください)';
		}

		return $rtn;
	}

}
