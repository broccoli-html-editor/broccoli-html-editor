<?php
/**
 * broccoli-html-editor
 */
namespace broccoliHtmlEditor;

/**
 * User Storage Manager
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class userStorage{

	/** $broccoli */
	private $broccoli;

	/**
	 * Constructor
	 */
	public function __construct($broccoli){
		$this->broccoli = $broccoli;
	}

	/**
	 * ユーザー固有の情報を取得する
	 */
	public function get($key){
		return null;
	}

	/**
	 * ユーザー固有の情報を保存する
	 */
	public function put($key, $val){
		return true;
	}

}
