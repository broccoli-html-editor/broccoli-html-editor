<?php
/**
 * broccoli-html-editor fields
 */
namespace broccoliHtmlEditor\fields;

/**
 * Multi Text Field
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class multitext extends \broccoliHtmlEditor\fieldBase{

	/**
	 * データをバインドする
	 */
	public function bind( $fieldData, $mode, $mod ){
		$rtn = '';
		if(is_object($fieldData) && is_string(@$fieldData->src)){
			$rtn = ''.$fieldData->src;

			switch( $fieldData->editor ){
				case 'text':
					$rtn = htmlspecialchars( $rtn ); // ←HTML特殊文字変換
					$rtn = preg_replace('/\r\n|\r|\n/s', '<br />', $rtn); // ← 改行コードは改行タグに変換
					break;
				case 'markdown':
					$rtn = \Michelf\MarkdownExtra::defaultTransform($rtn);
					break;
				case 'html':
				default:
					break;
			}
		}
		if( $mode == 'canvas' && !strlen($rtn) ){
			$rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;white-space:nowrap;">(ダブルクリックしてテキストを編集してください)</span>';
		}
		return $rtn;
	}

}