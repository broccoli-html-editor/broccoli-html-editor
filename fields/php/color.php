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
		if(is_array($fieldData) && array_key_exists('src', $fieldData) && is_string($fieldData['src'])){
			$rtn = ''.$fieldData['src'];
			$rtn = htmlspecialchars( $rtn );
			$rtn = preg_replace('/\r\n|\r|\n/s', '<br />', $rtn);
		}elseif( is_string($fieldData) ){
			$rtn = htmlspecialchars( $fieldData );
			$rtn = preg_replace('/\r\n|\r|\n/s', '<br />', $rtn);
		}
		if( $mode == 'canvas' && !strlen($rtn) ){
			$rtn = '';
		}
		return $rtn;
	}

}
