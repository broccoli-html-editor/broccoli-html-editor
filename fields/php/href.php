<?php
/**
 * broccoli-html-editor fields
 */
namespace broccoliHtmlEditor\fields;

/**
 * href Field
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class href extends \broccoliHtmlEditor\fieldBase{

	/**
	 * データをバインドする
	 */
	public function bind( $fieldData, $mode, $mod ){
		$rtn = '';
		if(is_array($fieldData) && array_key_exists('src', $fieldData) && is_string($fieldData['src'])){
			$rtn = htmlspecialchars( $fieldData['src'] );
		}elseif(is_string($fieldData)){
			$rtn = htmlspecialchars( $fieldData );
		}
		if( $mode == 'canvas' && !strlen($rtn) ){
			$rtn = '';
		}

		return $rtn;
	}

}
