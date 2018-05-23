<?php
/**
 * broccoli-html-editor
 */
namespace broccoliHtmlEditor;

/**
 * BaseClass of Fields
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class fieldBase{

	/** $broccoli */
	private $broccoli;

	/**
	 * Constructor
	 */
	public function __construct($broccoli){
		$this->broccoli = $broccoli;
	}

}
