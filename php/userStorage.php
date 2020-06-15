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
	public function load($key){
		$fnc = $this->broccoli->options['userStorage'];
		if( !is_callable($fnc) ){
			return false;
		}
		$rtn = $fnc($key);
		return $rtn;
	}

	/**
	 * ユーザー固有の情報を保存する
	 */
	public function save($key, $val){
		$fnc = $this->broccoli->options['userStorage'];
		if( !is_callable($fnc) ){
			return false;
		}
		$rtn = $fnc($key, $val);
		return $rtn;
	}

}
