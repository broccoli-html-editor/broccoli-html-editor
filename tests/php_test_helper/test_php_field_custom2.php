<?php
class test_php_field_custom2 extends \broccoliHtmlEditor\fieldBase{
	/**
	 * データをバインドする
	 */
	public function bind( $fieldData, $mode, $mod ){
		$rtn = (object) array();
		$rtn->val1 = 'value of val1';
		$rtn->val2 = 'value of val2';
		return $rtn;
	}

}
