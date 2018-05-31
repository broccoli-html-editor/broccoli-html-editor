<?php
/**
 * broccoli-html-editor fields
 */
namespace broccoliHtmlEditor\fields;

/**
 * Select Field
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class select extends \broccoliHtmlEditor\fieldBase{

	/**
	 * データをバインドする
	 */
	public function bind( $fieldData, $mode, $mod ){
		$rtn = '';
		if( is_null($fieldData) && @$mod->default ){
			// 値が undefined の場合は、defaultの値を参照する。
			// このケースは、既に使用されたモジュールに、
			// 後からselectフィールドを追加した場合などに発生する。
			$fieldData = $mod->default;
		}
		$rtn = $fieldData;

		if( !strlen($rtn) && @$mod->options ){
			$isHit = false;
			foreach( $mod->options as $idx=>$val ){
				if( $rtn == @$val->value ){
					$isHit = true;
					break;
				}
			}
			if( !$isHit ){
				// 選択値が空白で、空白の選択肢がなければ、1件目のオプションを選ぶ。
    			foreach( $mod->options as $idx=>$val ){
					$rtn = @$val->value;
					break;
				}
			}
		}
		if( $mode == 'canvas' && !strlen($rtn) ){
			// $rtn = '(ダブルクリックして選択してください)';
				// ↑未選択時のダミー文はなしにした。
				// 　クラス名の modifier 部分の拡張などに使用する場合に、
				// 　クラス名とダミー文が合体して存在しないクラス名になってしまうので。
		}

		return $rtn;
	}

}
