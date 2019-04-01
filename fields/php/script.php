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
class script extends \broccoliHtmlEditor\fieldBase{

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
		if(is_array($fieldData) && is_string(@$fieldData['src'])){
			$rtn = ''.$fieldData['src'];
		}
		if(property_exists($mod, 'autowrap') && $mod->autowrap){
			switch($fieldData['lang']){
				case 'javascript':
					$rtn = '<script>'.$rtn.'</script>';
					break;
				case 'css':
					$rtn = '<style>'.$rtn.'</style>';
					break;
				case 'php':
					break;
				default:
					break;
			}
		}
		if( $mode == 'canvas' ){
			$rtn = '<span style="display:inline-block;color:#969800;background-color:#f0f1b3;border:1px solid #969800;font-size:10px;padding:0.2em 1em;max-width:100%;overflow:hidden;white-space:nowrap;">SCRIPT (ダブルクリックしてスクリプトを記述してください)</span>';
		}
		return $rtn;
	}

}
