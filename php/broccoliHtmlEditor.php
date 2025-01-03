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

	/** LangBank object */
	private $lb;

	/** Resource Manager */
	private $resourceMgr;

	/** User Storage Manager */
	private $userStorage;

	/** BaseClass of Fields */
	private $fieldBase;

	/** Field Definitions */
	private $fieldDefinitions;

	/** cache */
	private $_moduleCollection = array();
	private $_moduleInternalIdMap = array();

	/** Error Report */
	private $errors = array();

	/**
	 * Constructor
	 */
	public function __construct(){
		$this->fs = new \tomk79\filesystem();
	}

	/**
	 * $fs
	 * @return object FileSystem Utility Object.
	 */
	public function fs(){
		return $this->fs;
	}

	/**
	 * $lb
	 * @return object LangBank Object.
	 */
	public function lb(){
		return $this->lb;
	}

	/**
	 * $fieldBase
	 * @return object fieldBase Object.
	 */
	public function fieldBase(){
		return $this->fieldBase;
	}

	/**
	 * $resourceMgr
	 * @return object Resource Manager Object.
	 */
	public function resourceMgr(){
		return $this->resourceMgr;
	}

	/**
	 * $userStorage
	 * @return object User Storage Object.
	 */
	public function userStorage(){
		return $this->userStorage;
	}

	/**
	 * Initialize
	 * @param array $options オプション
	 */
	public function init( $options = array() ){
		$options = (is_array($options) ? $options : array());
		$options['appMode'] = $options['appMode'] ?? 'web'; // web | desktop
		$options['paths_module_template'] = $options['paths_module_template'] ?? array();
		$options['documentRoot'] = $options['documentRoot'] ?? '.'; // current directory.
		$options['pathHtml'] = $options['pathHtml'] ?? null;
		$options['pathResourceDir'] = $options['pathResourceDir'] ?? null;
		$options['realpathDataDir'] = $options['realpathDataDir'] ?? null;
		$options['bindTemplate'] = $options['bindTemplate'] ?? function($htmls){
			$fin = '';
			foreach($htmls as $i=>$row){
				$fin .= $htmls[$i];
			}
			return $fin;
		};
		$options['log'] = $options['log'] ?? function($msg){
		};
		$options['userStorage'] = $options['userStorage'] ?? null;
		if( !$options['pathHtml'] || !$options['pathResourceDir'] || !$options['realpathDataDir'] ){
			// 必須項目
			trigger_error('[ERROR] $options[\'pathHtml\'], $options[\'pathResourceDir\'], and $options[\'realpathDataDir\'] are required.');
			return;
		}

		foreach( $options['paths_module_template'] as $i=>$row ){
			$options['paths_module_template'][$i] = $this->fs->get_realpath( $this->fs->normalize_path( $options['paths_module_template'][$i] ).'/', $options['documentRoot'] );
		}

		$options['pathHtml'] = $this->fs->normalize_path( $this->fs->get_realpath($options['pathHtml']) );
		$options['pathResourceDir'] = $this->fs->normalize_path( $this->fs->get_realpath($options['pathResourceDir']) );

		if( !array_key_exists('fieldConfig', $options) || !$options['fieldConfig'] ){
			$options['fieldConfig'] = array();
		}

		$options['noimagePlaceholder'] = $options['noimagePlaceholder'] ?? null;
		$options['extra'] = $options['extra'] ?? (object) array();

		$this->paths_module_template = $options['paths_module_template'];
		$this->realpathHtml = $this->fs->normalize_path($this->fs->get_realpath( $options['documentRoot'].'/'.$options['pathHtml'] ));
		$this->realpathResourceDir = $this->fs->normalize_path($this->fs->get_realpath( $options['documentRoot'].'/'.$options['pathResourceDir'].'/' ));
		$this->realpathDataDir = $this->fs->normalize_path($this->fs->get_realpath( $options['realpathDataDir'].'/' ));
		$this->options = $options;

		$this->resourceMgr = new resourceMgr($this);
		$this->userStorage = new userStorage($this);
		$this->fieldBase = new fieldBase($this);
		$this->fieldDefinitions = array();

		$this->lb = new \tomk79\LangBank(__DIR__.'/../data/language.csv');

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
		$this->fieldDefinitions['file'] = $loadFieldDefinition('file');
		$this->fieldDefinitions['markdown'] = $loadFieldDefinition('markdown');
		$this->fieldDefinitions['multitext'] = $loadFieldDefinition('multitext');
		$this->fieldDefinitions['script'] = $loadFieldDefinition('script');
		$this->fieldDefinitions['select'] = $loadFieldDefinition('select');
		$this->fieldDefinitions['text'] = $loadFieldDefinition('text');
		$this->fieldDefinitions['color'] = $loadFieldDefinition('color');
		$this->fieldDefinitions['datetime'] = $loadFieldDefinition('datetime');

		if( array_key_exists('customFields', $this->options) && $this->options['customFields'] ){
			foreach( $this->options['customFields'] as $idx=>$className ){
				$this->fieldDefinitions[$idx] = $loadFieldDefinition( $idx, $this->options['customFields'][$idx] );
			}
		}
	}

	/**
	 * 汎用API
	 *
	 * @param  string $api 呼び出すAPIの種類
	 * @param  array|object $options オプション
	 * @return mixed 実行したAPIの返却値
	 */
	public function gpi($api, $options){
		$gpi = new gpi($this);
		$rtn = $gpi->gpi(
			$api,
			$options
		);
		return $rtn;
	}

	/**
	 * アプリケーションの実行モード設定を取得する
	 * @return string 'web'|'desktop'
	 */
	public function getAppMode(){
		$rtn = $this->options['appMode'];
		switch($rtn){
			case 'web':
			case 'desktop':
				break;
			default:
				$rtn = 'web';
				break;
		}
		return $rtn;
	}

	/**
	 * フィールド設定を取得する
	 * @return array フィールド設定
	 */
	public function getFieldConfig(){
		$rtn = $this->options['fieldConfig'];
		return $rtn;
	}

	/**
	 * 画像のプレースホルダーを取得する
	 * @return string プレースホルダ画像のデータURL
	 */
	public function getNoimagePlaceholder(){
		$rtn = null;
		$noimagePlaceholder = $this->options['noimagePlaceholder'];
		$mimetype = null;
		if( strlen($noimagePlaceholder ?? '') ){
			if( is_file($noimagePlaceholder) && is_readable($noimagePlaceholder) ){
				$mimetype = mime_content_type($noimagePlaceholder);
				if(!$mimetype){
					$mimetype = 'image/png';
				}
				$rtn = 'data:'.$mimetype.';base64,'.base64_encode(file_get_contents( $noimagePlaceholder ));
			}elseif( preg_match('/^https?\:\/\//', $noimagePlaceholder) ){
				$rtn = $noimagePlaceholder;
			}
		}
		if( !strlen($rtn ?? '') ){
			$noimagePlaceholder = __DIR__.'/../data/noimage-placeholder.svg';
			$mimetype = mime_content_type($noimagePlaceholder);
			if(!$mimetype){
				$mimetype = 'image/svg+xml';
			}
			$rtn = 'data:'.$mimetype.';base64,'.base64_encode(file_get_contents( $noimagePlaceholder ));
		}
		return $rtn;
	}

	/**
	 * extraデータを取得する
	 * @return mixed extraデータ
	 */
	public function getExtraData(){
		$rtn = $this->options['extra'] ?? null;
		return $rtn;
	}

	/**
	 * field定義を取得する
	 * @param  {String} fieldType フィールドの種類(text, html, markdown, multitext, etc...)
	 * @return {Object}           inputフィールドの定義オブジェクト
	 */
	public function getFieldDefinition($fieldType){
		if( $this->fieldDefinitions[$fieldType] ?? null ){
			// 定義済みのフィールドを返す
			$fieldDefinition = $this->fieldDefinitions[$fieldType];
		}else{
			// 定義がない場合は、デフォルトのfield定義を返す
			$fieldDefinition = $this->fieldBase;
		}
		return $fieldDefinition;
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
		if( !preg_match('/^(?:([0-9a-zA-Z\\_\\-\\.]*?)\\:)?([^\\/\\:\\s]*)\\/([^\\/\\:\\s]*)$/', $moduleId, $matched) ){
			return false;
		}
		$rtn['package'] = (strlen(''.$matched[1]) ? $matched[1] : null);
		$rtn['category'] = (strlen(''.$matched[2]) ? $matched[2] : null);
		$rtn['module'] = (strlen(''.$matched[3]) ? $matched[3] : null);

		if( !strlen(''.$rtn['package']) ){
			$rtn['package'] = null;
		}
		return $rtn;
	}

	/**
	 * インスタンスパスの末尾の連番を1つ進める
	 */
	public function incrementInstancePath($instancePath){
		if(preg_match( '/^(.*)\@([0-9]+)$/', $instancePath, $matched )){
			$tmpPath = $matched[1];
			$tmpNum = $matched[2];
			$tmpNum = Number($tmpNum);
			$tmpNum ++;
			$instancePath = $tmpPath . '@' . $tmpNum;
		}
		return $instancePath;
	}

	/**
	 * モジュールの絶対パスを取得する
	 */
	public function getModuleRealpath( $moduleId ){
		$parsedModuleId = $this->parseModuleId($moduleId);
		if($parsedModuleId === false){
			return false;
		}
		if(!($this->paths_module_template[$parsedModuleId['package']] ?? null)){
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
	 * システムテンプレートかどうか判断する
	 * @param  {String}  moduleId モジュールID
	 * @return {Boolean}          システムテンプレートであれば true, 違えば false
	 */
	public function isSystemMod( $moduleId ){
		if(!is_string($moduleId)){
			return false;
		}
		if( !preg_match('/^_sys\\//s', $moduleId) ){
			return false;
		}
		return true;
	}

	/**
	 * パッケージ一覧の取得
	 */
	public function getPackageList(){

		$modules = $this->paths_module_template;
		$rtn = array();
		if( !is_array( $modules ) || !count($modules) ){
			return $rtn;
		}

		$fncFindLang = function( $lb, $key, $default ){
			$tmpName = $lb->get($key);
			if( strlen(''.$tmpName) && $tmpName !== '---' ){
				return $tmpName;
			}
			return $default;
		};

		foreach( $modules as $idx=>$row ){
			$realpath = $row;

			$lb = new \tomk79\LangBank($realpath.'/language.csv');
			$lb->setLang( $this->lb()->lang );

			$infoJson = json_decode('{}');
			if( is_file($realpath.'/info.json') ){
				$infoJson = json_decode(file_get_contents( $realpath.'/info.json' ));
			}
			if( !property_exists( $infoJson, 'name' ) ){
				$infoJson->name = null;
			}

			// Multi Language
			$infoJson->name = $fncFindLang($lb, 'name', $infoJson->name);

			$rtn[$idx] = array(
				'packageId' => $idx,
				'packageName' => (($infoJson->name ?? null) ? $infoJson->name : $idx),
				'realpath' => $realpath,
				'infoJson' => $infoJson,
				'hidden' => (($infoJson->hidden ?? null) ? true : false),
				'deprecated' => (($infoJson->deprecated ?? null) ? true : false),
			);
			$modList = $this->getModuleListByPackageId($idx);
			$rtn[$idx]['categories'] = $modList['categories'];
		}
		return $rtn;
	}

	/**
	 * モジュール一覧を取得する
	 * @param  string $packageId package ID
	 * @return array モジュール一覧
	 */
	public function getModuleListByPackageId($packageId){

		$rtn = array();

		$fncFindLang = function( $lb, $key, $default ){
			$tmpName = $lb->get($key);
			if( strlen(''.$tmpName) && $tmpName !== '---' ){
				return $tmpName;
			}
			return $default;
		};

		$sortModuleDirectoryNames = function($dirNames, $sortBy){
			if( !is_array($sortBy) ){ return $dirNames; }
			sort($dirNames);
			$deleteArrayElm = function($ary, $val){
				foreach( $ary as $i=>$row ){
					if( $ary[$i] === $val ){
						array_splice($ary, $i , 1);
						return true;
					}
				}
				return false;
			};
			$arrayFind = function($ary, $val){
				foreach( $ary as $i=>$row ){
					if( $ary[$i] === $val ){return true;}
				}
				return false;
			};

			$rtn = array();
			foreach( $sortBy as $i=>$row ){
				if( !$arrayFind($dirNames, $row) ){continue;}
				array_push($rtn, $row);
				$deleteArrayElm($dirNames, $row);
			}
			foreach( $dirNames as $i=>$row ){
				array_push($rtn, $row);
			}
			return $rtn;
		};

		// パッケージ情報を取得
		$rtn['packageId'] = $packageId;
		$rtn['realpath'] = $this->paths_module_template[$packageId];
		if(is_null($rtn['realpath'])){
			$rtn['packageId'] = false;
			$rtn['realpath'] = false;
			return $rtn;
		}
		$rtn['packageInfo'] = @json_decode(file_get_contents( $rtn['realpath'].'/info.json' ));
		if(is_null($rtn['packageInfo'])){
			$rtn['packageInfo'] = array();
		}


		// モジュールカテゴリをリスト化
		$fileList = $this->fs->ls($rtn['realpath']);
		$rtn['categories'] = array();
		$fileList = $sortModuleDirectoryNames($fileList, $rtn['packageInfo']->sort ?? null);
		if( !$fileList ){
			$fileList = array();
		}
		foreach($fileList as $idx=>$row){
			$realpath = $this->fs->normalize_path($this->fs->get_realpath($rtn['realpath'].'/'.$row));
			if( is_dir($realpath) ){
				$realpath .= '/';

				$lb = new \tomk79\LangBank($realpath.'/language.csv');
				$lb->setLang( $this->lb()->lang );

				$rtn['categories'][$row] = array();
				$rtn['categories'][$row]['categoryId'] = $row;
				$rtn['categories'][$row]['categoryInfo'] = @json_decode(file_get_contents( $realpath.'/info.json' ));
				if( is_null($rtn['categories'][$row]['categoryInfo']) ){
					$rtn['categories'][$row]['categoryInfo'] = new \stdClass();
				}
				if( !property_exists($rtn['categories'][$row]['categoryInfo'], 'name') ){
					$rtn['categories'][$row]['categoryInfo']->name = null;
				}
				$rtn['categories'][$row]['categoryName'] = (($rtn['categories'][$row]['categoryInfo']->name ?? null) ? $rtn['categories'][$row]['categoryInfo']->name : $row);
				$rtn['categories'][$row]['realpath'] = $realpath;
				$rtn['categories'][$row]['hidden'] = (($rtn['categories'][$row]['categoryInfo']->hidden ?? null) ? true : false);
				$rtn['categories'][$row]['deprecated'] = (($rtn['categories'][$row]['categoryInfo']->deprecated ?? null) ? true : false);

				// Multi Language
				$rtn['categories'][$row]['categoryInfo']->name = $fncFindLang( $lb, 'name', $rtn['categories'][$row]['categoryInfo']->name );
				$rtn['categories'][$row]['categoryName'] = $fncFindLang( $lb, 'name', $rtn['categories'][$row]['categoryName'] );

				$rtn['categories'][$row]['modules'] = array();
			}
		}

		foreach($rtn['categories'] as $idx=>$row){
			$fileList = $this->fs->ls( $rtn['categories'][$idx]['realpath'] );
			$fileList = $sortModuleDirectoryNames($fileList, $row['categoryInfo']->sort ?? null);

			foreach($fileList as $idx2=>$row2){
				$realpath = $this->fs->normalize_path($this->fs->get_realpath($rtn['categories'][$idx]['realpath'].'/'.$row2.'/'));
				if( !is_dir($realpath) ){
					continue;
				}

				$lb = new \tomk79\LangBank($realpath.'/language.csv');
				$lb->setLang( $this->lb()->lang );

				$rtn['categories'][$idx]['modules'][$row2] = array();

				// moduleId
				$moduleId = $rtn['packageId'].':'.$rtn['categories'][$idx]['categoryId'].'/'.$row2;
				$rtn['categories'][$idx]['modules'][$row2]['moduleId'] = $moduleId;

				// info.json
				$rtn['categories'][$idx]['modules'][$row2]['moduleInfo'] = json_decode('{}');
				if( is_file( $realpath.'/info.json' ) ){
					$rtn['categories'][$idx]['modules'][$row2]['moduleInfo'] = json_decode(file_get_contents( $realpath.'/info.json' ));
					if(!is_object($rtn['categories'][$idx]['modules'][$row2]['moduleInfo'])){
						$rtn['categories'][$idx]['modules'][$row2]['moduleInfo'] = json_decode('{}');
					}
				}
				if( !property_exists( $rtn['categories'][$idx]['modules'][$row2]['moduleInfo'], 'name' ) ){
					$rtn['categories'][$idx]['modules'][$row2]['moduleInfo']->name = null;
				}
				$rtn['categories'][$idx]['modules'][$row2]['moduleInfo']->enabledParents = $this->normalizeEnabledParentsOrChildren($rtn['categories'][$idx]['modules'][$row2]['moduleInfo']->enabledParents ?? null, $moduleId);
				if( is_string($rtn['categories'][$idx]['modules'][$row2]['moduleInfo']->enabledBowls ?? null) ){
					$rtn['categories'][$idx]['modules'][$row2]['moduleInfo']->enabledBowls = array($rtn['categories'][$idx]['modules'][$row2]['moduleInfo']->enabledBowls ?? null);
				}
				$rtn['categories'][$idx]['modules'][$row2]['hidden'] = $rtn['categories'][$idx]['modules'][$row2]['moduleInfo']->hidden ?? false;
				$rtn['categories'][$idx]['modules'][$row2]['deprecated'] = $rtn['categories'][$idx]['modules'][$row2]['moduleInfo']->deprecated ?? false;

				// moduleInternalId
				$rtn['categories'][$idx]['modules'][$row2]['moduleInternalId'] = $moduleId;
				if( is_object($rtn['categories'][$idx]['modules'][$row2]['moduleInfo']) && property_exists( $rtn['categories'][$idx]['modules'][$row2]['moduleInfo'], 'id' ) ){
					$rtn['categories'][$idx]['modules'][$row2]['moduleInternalId'] = $this->getModuleInternalId($moduleId, $rtn['categories'][$idx]['modules'][$row2]['moduleInfo']->id);
				}

				// clip.json
				$rtn['categories'][$idx]['modules'][$row2]['clip'] = false;
				if( is_file( $realpath.'/clip.json' ) ){
					$rtn['categories'][$idx]['modules'][$row2]['clip'] = true;
				}

				// moduleName
				$rtn['categories'][$idx]['modules'][$row2]['moduleName'] = (strlen($rtn['categories'][$idx]['modules'][$row2]['moduleInfo']->name ?? '') ? $rtn['categories'][$idx]['modules'][$row2]['moduleInfo']->name : $moduleId);

				// realpath
				$rtn['categories'][$idx]['modules'][$row2]['realpath'] = $realpath;

				// thumb.png
				$realpathThumb = $this->fs->normalize_path($this->fs->get_realpath( $realpath.'/thumb.png' ));
				$rtn['categories'][$idx]['modules'][$row2]['thumb'] = null;
				if( is_file($realpathThumb) ){
					$rtn['categories'][$idx]['modules'][$row2]['thumb'] = 'data:image/png;base64,'.base64_encode( file_get_contents( $realpathThumb ) );
				}

				// README.md (html)
				$readmeHelper = new fncs_readme($this);
				$readme = $readmeHelper->get_html($realpath);

				$rtn['categories'][$idx]['modules'][$row2]['readme'] = $readme;

				// Multi Language
				$rtn['categories'][$idx]['modules'][$row2]['moduleName'] = $fncFindLang( $lb, 'name', $rtn['categories'][$idx]['modules'][$row2]['moduleName'] );
				$rtn['categories'][$idx]['modules'][$row2]['moduleInfo']->name = $fncFindLang( $lb, 'name', $rtn['categories'][$idx]['modules'][$row2]['moduleInfo']->name );

				$modInstance = $this->getModule($moduleId, null);
				$rtn['categories'][$idx]['modules'][$row2]['moduleInfo']->interface = $rtn['categories'][$idx]['modules'][$row2]['moduleInfo']->interface ?? $modInstance->fields();

			}

		}

		return $rtn;
	}

	/**
	 * enabledParents または enabledChildren を正規化する
	 */
	public function normalizeEnabledParentsOrChildren($enabledParentsOrChildren, $currentModuleId){
		$enabledParentsOrChildren = ($enabledParentsOrChildren ? $enabledParentsOrChildren : array());
		if(is_string($enabledParentsOrChildren)){
			$enabledParentsOrChildren = array($enabledParentsOrChildren);
		}
		foreach( $enabledParentsOrChildren as $idx=>$row ){
			$enabledParentsOrChildren[$idx] = $this->completeModuleId( $enabledParentsOrChildren[$idx], $currentModuleId );
		}
		return $enabledParentsOrChildren;
	}

	/**
	 * モジュールIDを補完して完成させる
	 */
	private function completeModuleId($targetModuleId, $currentModuleId){
		$currentModuleId = ($currentModuleId ? $currentModuleId : '');
		preg_match('/^([\s\S]+)\:([\s\S]+)\/([\s\S]+?)$/', $currentModuleId, $matched);
		$pkgName = $matched[1];
		$catName = $matched[2];
		$mogName = $matched[3];
		if(preg_match('/^_sys\//', $targetModuleId)){
			// システムフィールドはそのまま
			return $targetModuleId;
		}
		if(!preg_match('/^[\S]+\:/', $targetModuleId)){
			$targetModuleId = $pkgName.':'.$targetModuleId;
			return $targetModuleId;
		}
		return $targetModuleId;
	}

	/**
	 * モジュールの内部IDを補完して完成させる
	 */
	public function getModuleInternalId($targetModuleId, $internalIdTemplate = null){
		$internalId = $targetModuleId;
		$tmpParsedModuleInternalIdBefore = $this->parseModuleId($internalId);
		$tmpParsedModuleInternalIdAfter = $this->parseModuleId($internalIdTemplate);
		if( strlen(''.$tmpParsedModuleInternalIdAfter['package']) ){
			$tmpParsedModuleInternalIdBefore['package'] = $tmpParsedModuleInternalIdAfter['package'];
		}
		if( strlen(''.$tmpParsedModuleInternalIdAfter['category']) ){
			$tmpParsedModuleInternalIdBefore['category'] = $tmpParsedModuleInternalIdAfter['category'];
		}
		if( strlen(''.$tmpParsedModuleInternalIdAfter['module']) ){
			$tmpParsedModuleInternalIdBefore['module'] = $tmpParsedModuleInternalIdAfter['module'];
		}
		$internalId = $tmpParsedModuleInternalIdBefore['package'].':'.$tmpParsedModuleInternalIdBefore['category'].'/'.$tmpParsedModuleInternalIdBefore['module'];
		return $internalId;
	}

	/**
	 * 全モジュールの一覧を取得する
	 */
	public function getAllModuleList(){
		static $_allModuleList = null;
		if( $_allModuleList ){
			return $_allModuleList;
		}

		$modules = $this->paths_module_template;
		$data = array('tmp'=>array(), 'rtn'=>array());

		$list = $this->getPackageList();
		$data['tmp']['_sys/root'] = $this->getModule('_sys/root');
		$data['tmp']['_sys/unknown'] = $this->getModule('_sys/unknown');
		$data['tmp']['_sys/html'] = $this->getModule('_sys/html');
		$data['tmp']['_sys/image'] = $this->getModule('_sys/image');

		foreach( $list as $pkgId=>$pkg ){
			foreach( $list[$pkgId]['categories'] as $catId=>$cat ){
				foreach( $list[$pkgId]['categories'][$catId]['modules'] as $modId=>$mod ){
					$data['tmp'][$mod['moduleId']] = $this->getModule($mod['moduleId']);
				}
			}
		}

		foreach( $data['tmp'] as $modId=>$obj ){
			$obj->init();
			$data['rtn'][$modId] = json_decode('{}');
			$data['rtn'][$modId]->id = $obj->id;
			$data['rtn'][$modId]->internalId = $obj->internalId;
			$data['rtn'][$modId]->fields = $obj->fields;
			$data['rtn'][$modId]->isSystemModule = $obj->isSystemModule;
			$data['rtn'][$modId]->isSingleRootElement = $obj->isSingleRootElement;
			$data['rtn'][$modId]->isClipModule = $obj->isClipModule;
			$data['rtn'][$modId]->templateType = $obj->templateType;
			$data['rtn'][$modId]->template = $obj->template;
			$data['rtn'][$modId]->languageCsv = $obj->languageCsv;
			$data['rtn'][$modId]->info = $obj->info;
			if($obj->subModule){
				$data['rtn'][$modId]->subModule = json_decode('{}');
				foreach( $obj->subModule as $idx=>$row ){
					$data['rtn'][$modId]->subModule->{$idx} = json_decode('{}');
					$data['rtn'][$modId]->subModule->{$idx}->id = $obj->subModule->{$idx}->id;
					$data['rtn'][$modId]->subModule->{$idx}->internalId = $obj->subModule->{$idx}->internalId;
					$data['rtn'][$modId]->subModule->{$idx}->subModName = $obj->subModule->{$idx}->subModName;
					$data['rtn'][$modId]->subModule->{$idx}->fields = $obj->subModule->{$idx}->fields;
					$data['rtn'][$modId]->subModule->{$idx}->isSystemModule = $obj->subModule->{$idx}->isSystemModule;
					$data['rtn'][$modId]->subModule->{$idx}->isSingleRootElement = $obj->subModule->{$idx}->isSingleRootElement;
					$data['rtn'][$modId]->subModule->{$idx}->isClipModule = $obj->subModule->{$idx}->isClipModule;
					$data['rtn'][$modId]->subModule->{$idx}->templateType = $obj->subModule->{$idx}->templateType;
					$data['rtn'][$modId]->subModule->{$idx}->template = $obj->subModule->{$idx}->template;
					$data['rtn'][$modId]->subModule->{$idx}->languageCsv = $obj->subModule->{$idx}->languageCsv;
					$data['rtn'][$modId]->subModule->{$idx}->info = $obj->subModule->{$idx}->info;
				}
			}
		}

		return $data['rtn'];
	}

	/**
	 * class: モジュール
	 * @param  string   $moduleId モジュールID
	 * @param  array   $options  Options
	 * @return object            module object
	 */
	public function createModuleInstance($moduleId, $options = array()){
		$rtn = new classModule($this, $moduleId, $options);
		return $rtn;
	}

	/**
	 * モジュールオブジェクトを取得する
	 */
	public function getModule($moduleId, $subModName = null){
		if(!strlen(''.$moduleId)){
			return false;
		}
		$rtn = null;
		if( array_key_exists($moduleId, $this->_moduleCollection) ){
			$rtn = $this->_moduleCollection[$moduleId];
		}

		if( $rtn === false ){
			// 過去に生成を試みて、falseになっていた場合
			return false;
		}
		if( is_null($rtn) ){
			$mod = $this->createModuleInstance($moduleId);
			$this->_moduleCollection[$moduleId] = $mod;
			if( $this->_moduleCollection[$moduleId] === false ){
				// falseの場合、該当するモジュールが定義されていない。
				// 結果を記憶して、falseを返す。
				return false;
			}
			$this->_moduleCollection[$moduleId]->init();
			$rtn = $this->_moduleCollection[$moduleId];
			$this->_moduleInternalIdMap[$this->_moduleCollection[$moduleId]->internalId] = $moduleId;
			if( is_string($subModName) ){
				return $rtn->subModule->{$subModName};
			}
			return $rtn;
		}
		if( is_string($subModName) ){
			if( !isset($rtn->subModule->{$subModName}) || !$rtn->subModule->{$subModName} ){
				return false;
			}

			return $rtn->subModule->{$subModName};
		}

		return $rtn;
	}

	/**
	 * internaiIdから、モジュールオブジェクトを取得する
	 */
	public function getModuleByInternalId($moduleInternalId, $subModName = null){
		$rtn = null;
		$moduleId = null;
		if( array_key_exists($moduleInternalId, $this->_moduleInternalIdMap) ){
			// キャッシュ済みならそれを返す。
			$moduleId = $this->_moduleInternalIdMap[$moduleInternalId];
		}else{
			//キャッシュされていなければ全量を生成する。
			$this->getAllModuleList();
			if( array_key_exists($moduleInternalId, $this->_moduleInternalIdMap) ){
				// 生成したなかにあれば返す。
				$moduleId = $this->_moduleInternalIdMap[$moduleInternalId];
			}else{
				// なければ、結果 false を記録して false を返す。
				$this->_moduleInternalIdMap[$moduleInternalId] = false;
				return false;
			}
		}
		$rtn = $this->getModule($moduleId, $subModName);
		return $rtn;
	}

	/**
	 * マークダウン処理
	 */
	public function markdown($md, $options = array()){
		$rtn = \Michelf\MarkdownExtra::defaultTransform($md);
		$rtn = preg_replace('/(\r\n|\r|\n)/s', "\n", $rtn);
		if( !strlen(trim($rtn ?? '')) ){
			$rtn = '';
		}
		return $rtn;
	}

	/**
	 * HTMLをビルドする
	 * ビルドしたHTMLは、callback() に文字列として渡されます。
	 * realpathに指定したファイルは自動的に上書きされません。
	 *
	 * @param  object   $data     コンテンツデータ
	 * @param  array   $options  オプション
	 *                             - options.mode = ビルドモード(finalize=製品版ビルド, canvas=編集画面用ビルド)
	 *                             - options.instancePath = インスタンスパス
	 * @return string            source codes
	 */
	public function buildBowl( $data, $options ){
		$buildBowl = new buildBowl($this, $data, $options);
		return $buildBowl->build();
	}

	/**
	 * HTMLをすべてビルドする
	 * ビルドしたHTMLは、callback() に文字列として渡されます。
	 * realpathに指定したファイルは自動的に上書きされません。
	 *
	 * @param  array   $options  オプション
	 *                             - $options['mode'] = ビルドモード(finalize=製品版ビルド, canvas=編集画面用ビルド)
	 *                             - $options['bowlList'] = ボウル名の一覧。data.jsonに含まれていないbowlがある場合、空白の領域としてあわせてビルドされる。
	 * @return array            HTMLs
	 */
	public function buildHtml( $options = array() ){
		$dataJson = file_get_contents($this->realpathDataDir.'/data.json');
		$dataJson = json_decode($dataJson);
		if( !is_object($dataJson) ){
			$dataJson = (object) $dataJson;
		}

		$dataJson->bowl = (property_exists($dataJson, 'bowl') ? $dataJson->bowl : json_decode('{}'));

		if( !array_key_exists('bowlList', $options) || !$options['bowlList']){
			$options['bowlList'] = array();
		}
		if( count($options['bowlList']) ){
			foreach( $options['bowlList'] as $idx=>$row  ){
				if( !isset($dataJson->bowl->{$options['bowlList'][$idx]}) || !$dataJson->bowl->{$options['bowlList'][$idx]} ){
					$tmpBowlVal = array(
						"modId" => "_sys/root",
						"fields" => array(
							"main" => json_decode('{}')
						)
					);
					$dataJson->bowl->{$options['bowlList'][$idx]} = json_decode( json_encode($tmpBowlVal) );
				}
			}
		}

		$htmls = array();
		foreach($dataJson->bowl as $idx=>$row){
			$options['instancePath'] = '/bowl.'.$idx;
			$html = $this->buildBowl($row, $options );
			$htmls[$idx] = $html;
		}
		return $htmls;
	}

	/**
	 * コンテンツをビルドし、更新する
	 *
	 * ビルドしたHTMLは、`pathHtml` のファイルに上書き保存されます。
	 * リソースも合わせて処理されます。
	 *
	 * @return bool result
	 */
	public function updateContents(){
		$broccoli = $this;
		$resourceDb = $broccoli->resourceMgr()->getResourceDb();
		$result = $broccoli->resourceMgr()->save( $resourceDb );

		$htmls = $broccoli->buildHtml( array( 'mode' => 'finalize' ) );

		$fin = $broccoli->options['bindTemplate']($htmls);
		$result = $this->fs->save_file($broccoli->realpathHtml, $fin);
		return $result;
	}

	/**
	 * モジュールのCSSをビルドする
	 */
	public function buildModuleCss(){
		$builder = new buildModuleResources( $this );
		return $builder->buildCss();
	}

	/**
	 * モジュールのJavaScriptをビルドする
	 */
	public function buildModuleJs(){
		$builder = new buildModuleResources( $this );
		return $builder->buildJs();
	}

	/**
	 * ログファイルにメッセージを出力する
	 */
	public function log($msg){
		$this->options['log']($msg);
		return;
	}

	/**
	 * エラーメッセージをブラウザへ送信する
	 */
	public function error($msg){
		array_push($this->errors, $msg);
		// console.error(msg);
		$this->log($msg);
		return;
	}

	/**
	 * 記録されたエラーメッセージを取得する
	 */
	public function get_errors(){
		return $this->errors;
	}
}
