<?php
/**
 * broccoli-html-editor
 */
namespace broccoliHtmlEditor;

/**
 * broccoli-html-editor core class
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class broccoliHtmlEditor{

	/** モジュールのパス一覧 */
	private $paths_module_template;

	/** FileSystem Utility */
	private $fs;

	/**
	 * Constructor
	 */
	public function __construct(){
		$this->fs = new \tomk79\filesystem();
	}

	/**
	 * Initialize
	 * @param array $options オプション
	 */
	public function init( $options = array() ){
		$options = (is_array($options) ? $options : array());
		$options['appMode'] = ($options['appMode'] ? $options['appMode'] : 'web'); // web | desktop
		$options['paths_module_template'] = ($options['paths_module_template'] ? $options['paths_module_template'] : array());
		$options['documentRoot'] = ($options['documentRoot'] ? $options['documentRoot'] : '.'); // current directory.
		$options['pathHtml'] = ($options['pathHtml'] ? $options['pathHtml'] : null);
		$options['pathResourceDir'] = ($options['pathResourceDir'] ? $options['pathResourceDir'] : null);
		$options['realpathDataDir'] = ($options['realpathDataDir'] ? $options['realpathDataDir'] : null);
		$options['bindTemplate'] = ($options['bindTemplate'] ? $options['bindTemplate'] : function($htmls){
			$fin = '';
			foreach($htmls as $i=>$row){
				$fin .= $htmls[$i];
			}
			return $fin;
		});
		$options['log'] = ($options['log'] ? $options['log'] : function($msg){
			var_dump($msg);
		});
		if( !$options['pathHtml'] || !$options['pathResourceDir'] || !$options['realpathDataDir'] ){
			// 必須項目
			// var_dump($options);
			var_dump('[ERROR] $options[\'pathHtml\'], $options[\'pathResourceDir\'], and $options[\'realpathDataDir\'] are required.');
			return;
		}

		foreach( $options['paths_module_template'] as $i=>$row ){
			$options['paths_module_template'][$i] = $this->fs->get_realpath( $options['documentRoot'].'/'.$this->fs->normalize_path( $options['paths_module_template'][$i] ).'/' );
		}

		$options['pathHtml'] = $this->fs->normalize_path( $this->fs->get_realpath($options['pathHtml']) );
		$options['pathResourceDir'] = $this->fs->normalize_path( $this->fs->get_realpath($options['pathResourceDir']) );

		$this->paths_module_template = $options['paths_module_template'];
		// $this->realpathHtml = $this->fs->get_realpath( $options.documentRoot, './'+$options.pathHtml );
		// $this->realpathResourceDir = $this->fs->get_realpath( $options.documentRoot, './'+$options.pathResourceDir )+'/';
		// $this->realpathDataDir = $this->fs->get_realpath( $options.realpathDataDir )+'/';
		// $this->options = $options;

		// this.resourceMgr = new (require('./resourceMgr.js'))(this);
		// this.fieldBase = new (require('./fieldBase.js'))(this);
		// this.fieldDefinitions = {};

		// it79.fnc({},
		// 	[
		// 		function(it1, data){
		// 			_this.lb = new LangBank(__dirname+'/../data/language.csv', function(){
		// 				// _this.lb.setLang( 'ja' ); // <- 言語設定はクライアントからオプションで投げられるので、 gpi がセットし直します。
		// 				it1.next(data);
		// 			});
		// 		} ,
		// 		function(it1, data){
		// 			_this.resourceMgr.init( function(){
		// 				it1.next(data);
		// 			} );
		// 		} ,
		// 		function(it1, data){
		// 			loadFieldDefinition();
		// 			it1.next(data);
		// 		} ,
		// 		function(it1, data){
		// 			callback();
		// 			it1.next(data);
		// 		}
		// 	]
		// );
	}

	/**
	 * モジュールIDを分解する
	 */
	public function parseModuleId( $moduleId ){
		$rtn = array(
			'package' => false,
			'category' => false,
			'module' => false,
		);
		if( !is_string($moduleId) ){
			return false;
		}
		if( !preg_match('/^(?:([0-9a-zA-Z\\_\\-\\.]*?)\\:)?([^\\/\\:\\s]+)\\/([^\\/\\:\\s]+)$/', $moduleId, $matched) ){
			return false;
		}
		$rtn['package'] = $matched[1];
		$rtn['category'] = $matched[2];
		$rtn['module'] = $matched[3];

		if( !strlen($rtn['package']) ){
			$rtn['package'] = null;
		}
		return $rtn;
	}

	/**
	 * モジュールの絶対パスを取得する
	 */
	public function getModuleRealpath( $moduleId ){
		$parsedModuleId = $this->parseModuleId($moduleId);
		if($parsedModuleId === false){
			return false;
		}
		if(!@$this->paths_module_template[$parsedModuleId['package']]){
			return false;
		}
		$realpath = $this->fs->get_realpath($this->paths_module_template[$parsedModuleId['package']]);
		if( !file_exists($realpath) || !is_dir($realpath) ){
			return false;
		}
		$realpath = $this->fs->get_realpath( $realpath.'/'.$parsedModuleId['category'].'/'.$parsedModuleId['module'].'/' );
		if( !file_exists($realpath) || !is_dir($realpath) ){
			return false;
		}

		return $this->fs->normalize_path($realpath);
	}

	/**
	 * パッケージ一覧の取得
	 */
	public function getPackageList(){

	}


}
