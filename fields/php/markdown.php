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
		if( is_string($fieldData) ){
			$rtn = $this->broccoli->markdown($fieldData);
		}
		if( $mode == 'canvas' && !strlen($rtn) ){
			$rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;white-space:nowrap;">(ダブルクリックしてマークダウンを編集してください)</span>';
		}

		return $rtn;
	}

}
