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

	/** 設定情報 */
	public	$paths_module_template,
			$realpathHtml,
			$realpathResourceDir,
			$realpathDataDir,
			$options;

	/** FileSystem Utility */
	private $fs;

	/** Resource Manager */
	private $resourceMgr;

	/** BaseClass of Fields */
	private $fieldBase;

	/** Field Definitions */
	private $fieldDefinitions;

	/**
	 * Constructor
	 */
	public function __construct(){
		$this->fs = new \tomk79\filesystem();
	}

	/**
	 * $fs
	 */
	public function fs(){
		return $this->fs;
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
		$this->realpathHtml = $this->fs->normalize_path($this->fs->get_realpath( $options['documentRoot'].'/'.$options['pathHtml'] ));
		$this->realpathResourceDir = $this->fs->normalize_path($this->fs->get_realpath( $options['documentRoot'].'/'.$options['pathResourceDir'].'/' ));
		$this->realpathDataDir = $this->fs->normalize_path($this->fs->get_realpath( $options['realpathDataDir'].'/' ));
		$this->options = $options;

		$this->resourceMgr = new resourceMgr($this);
		$this->fieldBase = new fieldBase($this);
		$this->fieldDefinitions = array();

		// $this->lb = new LangBank(__DIR__.'/../data/language.csv'); // TODO: 代替手段を用意する

		$this->resourceMgr->init();

		$loadFieldDefinition = function($fieldId, $mod = null){
			if(is_null($mod) || !class_exists($mod)){
				$mod = 'broccoliHtmlEditor\\fields\\'.$fieldId;
			}
			if(!class_exists($mod)){
				return null;
			}
			$rtn = new $mod( $this );
			$rtn->__fieldId__ = $fieldId;
			return $rtn;
		};
		$this->fieldDefinitions['href'] = $loadFieldDefinition('href');
		$this->fieldDefinitions['html'] = $loadFieldDefinition('html');
		$this->fieldDefinitions['html_attr_text'] = $loadFieldDefinition('html_attr_text');
		$this->fieldDefinitions['image'] = $loadFieldDefinition('image');
		$this->fieldDefinitions['markdown'] = $loadFieldDefinition('markdown');
		$this->fieldDefinitions['multitext'] = $loadFieldDefinition('multitext');
		$this->fieldDefinitions['select'] = $loadFieldDefinition('select');
		$this->fieldDefinitions['text'] = $loadFieldDefinition('text');

		if( $this->options['customFields'] ){
			foreach( $this->options['customFields'] as $idx=>$className ){
				$this->fieldDefinitions[$idx] = $loadFieldDefinition( $idx, $this->options['customFields'][$idx] );
			}
		}
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
		// delete(require.cache[require('path').resolve(__filename)]);

		// var _this = this;
		// callback = callback || function(){};

		// var it79 = require('iterate79');
		// var path = require('path');
		// var php = require('phpjs');
		// var fs = require('fs');
		// var $modules = broccoli.paths_module_template;
		// var rtn = {};

		// it79.fnc(
		// 	{},
		// 	[
		// 		function(it0, data){
		// 			it79.ary(
		// 				$modules,
		// 				function(it1, row, idx){
		// 					var realpath = row;
		// 					var infoJson = {};
		// 					try {
		// 						infoJson = JSON.parse(fs.readFileSync( realpath+'info.json' ));
		// 					} catch (e) {
		// 						infoJson = {};
		// 					}
		// 					rtn[idx] = {
		// 						'packageId': idx,
		// 						'packageName': (infoJson.name || idx),
		// 						'realpath': realpath,
		// 						'infoJson': infoJson,
		// 						'deprecated': (infoJson.deprecated || false)
		// 					};
		// 					broccoli.getModuleListByPackageId(idx, function(modList){
		// 						rtn[idx].categories = modList.categories;
		// 						it1.next();
		// 					});
		// 				} ,
		// 				function(){
		// 					it0.next();
		// 				}
		// 			);
		// 		} ,
		// 		function(it0, data){
		// 			callback(rtn);
		// 		}
		// 	]
		// );

	}


}
