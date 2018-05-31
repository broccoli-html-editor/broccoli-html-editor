<?php
/**
 * broccoli-html-editor fields
 */
namespace broccoliHtmlEditor\fields;

/**
 * Markdown Field
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class markdown extends \broccoliHtmlEditor\fieldBase{

	/**
	 * データをバインドする
	 */
	public function bind( $fieldData, $mode, $mod ){
		$rtn = '';
		if( is_string($fieldData) ){
			$rtn = \Michelf\MarkdownExtra::defaultTransform($fieldData);
		}
		if( $mode == 'canvas' && !strlen($rtn) ){
			$rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;white-space:nowrap;">(ダブルクリックしてマークダウンを編集してください)</span>';
		}

		return $rtn;
	}

}
