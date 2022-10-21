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

	/** $broccoli */
	private $broccoli;

	/**
	 * Constructor
	 */
	public function __construct($broccoli){
		$this->broccoli = $broccoli;
		parent::__construct($broccoli);
	}

	/**
	 * データをバインドする
	 */
	public function bind( $fieldData, $mode, $mod ){
		$rtn = '';
		if(is_array($fieldData) && array_key_exists('src', $fieldData) && is_string($fieldData['src'])){
			$rtn = $fieldData['src'];
			$rtn = htmlspecialchars( $rtn );
		}elseif(is_string($fieldData)){
			$rtn = $fieldData;
			$rtn = htmlspecialchars( $rtn );
		}
		if( $mode == 'canvas' && !strlen(''.$rtn) ){
			$rtn = '('.$this->broccoli->lb()->get('ui_message.double_click_to_edit_text').')';
		}

		return $rtn;
	}

}
