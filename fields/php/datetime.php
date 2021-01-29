<?php
/**
 * broccoli-html-editor fields
 */
namespace broccoliHtmlEditor\fields;

/**
 * DateTime Field
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class datetime extends \broccoliHtmlEditor\fieldBase{

	/**
	 * データをバインドする
	 */
	public function bind( $fieldData, $mode, $mod ){
		$rtn = '';
		$format = 'Y-m-d H:i:s';
		if( property_exists($mod, 'format') && strlen($mod->format) ){
			$format = $mod->format;
		}
		if(is_array($fieldData) && array_key_exists('src', $fieldData) && is_string($fieldData['src'])){
			$time = strtotime($fieldData['src']);
			$rtn = date( $format, $time ); // ←日付フォーマット
			$rtn = htmlspecialchars( $rtn ); // ←HTML特殊文字変換
			$rtn = preg_replace('/\r\n|\r|\n/s', '<br />', $rtn); // ← 改行コードは改行タグに変換
		}elseif( is_string($fieldData) && strlen($fieldData) ){
			$time = strtotime($fieldData);
			$rtn = date( $format, $time ); // ←日付フォーマット
			$rtn = htmlspecialchars( $rtn ); // ←HTML特殊文字変換
			$rtn = preg_replace('/\r\n|\r|\n/s', '<br />', $rtn); // ← 改行コードは改行タグに変換
		}
		if( $mode == 'canvas' && !strlen($rtn) ){
			$rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;white-space:nowrap;">(ダブルクリックして編集してください)</span>';
		}
		return $rtn;
	}

}
