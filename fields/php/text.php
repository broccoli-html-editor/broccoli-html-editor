<?php
/**
 * broccoli-html-editor fields
 */
namespace broccoliHtmlEditor\fields;

/**
 * Text Field
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class text extends \broccoliHtmlEditor\fieldBase{

	/**
	 * データをバインドする
	 */
	public function bind( $fieldData, $mode, $mod ){
		$rtn = '';
		if(is_array($fieldData) && array_key_exists('src', $fieldData) && is_string($fieldData['src'])){
			$rtn = ''.$fieldData['src'];
			$rtn = htmlspecialchars( $fieldData );
			$rtn = preg_replace('/\r\n|\r|\n/s', '<br />', $rtn);
		}elseif( is_string($fieldData) ){
			$rtn = htmlspecialchars( $fieldData );
			$rtn = preg_replace('/\r\n|\r|\n/s', '<br />', $rtn);
		}
		if( $mode == 'canvas' && !strlen($rtn) ){
			$rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;white-space:nowrap;">(ダブルクリックしてテキストを編集してください)</span>';
		}
		return $rtn;
	}

}
