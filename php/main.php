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

		$modules = $this->paths_module_template;
		$rtn = array();

		foreach( $modules as $idx=>$row ){
			$realpath = $row;
			$infoJson = json_decode(file_get_contents( $realpath.'/info.json' ));

			$rtn[$idx] = array(
				'packageId' => $idx,
				'packageName' => ($infoJson->name ? $infoJson->name : $idx),
				'realpath' => $realpath,
				'infoJson' => $infoJson,
				'deprecated' => (@$infoJson->deprecated ? true : false),
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

		// function sortModuleDirectoryNames(dirNames, sortBy){
		// 	if( typeof(sortBy) != typeof([]) ){ return dirNames; }
		// 	dirNames.sort();
		// 	function deleteArrayElm(ary, val){
		// 		for( var i in ary ){
		// 			if( ary[i] === val ){
		// 				ary.splice( i , 1 );
		// 				return true;
		// 			}
		// 		}
		// 		return false;
		// 	}
		// 	function arrayFind(ary, val){
		// 		for( var i in ary ){
		// 			if( ary[i] === val ){return true;}
		// 		}
		// 		return false;
		// 	}

		// 	var rtn = [];
		// 	for( var i in sortBy ){
		// 		if( !arrayFind(dirNames, sortBy[i]) ){continue;}
		// 		rtn.push(sortBy[i]);
		// 		deleteArrayElm(dirNames, sortBy[i]);
		// 	}
		// 	for( var i in dirNames ){
		// 		rtn.push(dirNames[i]);
		// 	}
		// 	return rtn;
		// }

		// パッケージ情報を取得
		$rtn['packageId'] = $packageId;
		$rtn['realpath'] = $this->paths_module_template[$packageId];
		if(is_null($rtn['realpath'])){
			$rtn['packageId'] = false;
			$rtn['realpath'] = false;
			return $rtn;
		}
		$rtn['packageInfo'] = json_decode(file_get_contents( $rtn['realpath'].'/info.json' ));
		if(is_null($rtn['packageInfo'])){
			$rtn['packageInfo'] = array();
		}


		// モジュールカテゴリをリスト化
		$fileList = $this->fs->ls($rtn['realpath']);
		// var_dump($fileList);
		// var_dump($rtn['packageInfo']->sort);
		$rtn['categories'] = array();
		$fileList = sortModuleDirectoryNames($fileList, $rtn['packageInfo']->sort);
		foreach($fileList as $idx=>$row){
			$realpath = $this->fs->get_realpath($rtn['realpath'].'/'.$row);
			if( is_dir($realpath) ){
				$realpath .= '/';
				$rtn['categories'][$row] = array();
				$rtn['categories'][$row]['categoryId'] = $row;
				$rtn['categories'][$row]['categoryInfo'] = json_decode(file_get_contents( $realpath.'/info.json' ));
				if( is_null($rtn['categories'][$row]['categoryInfo']) ){
					$rtn['categories'][$row]['categoryInfo'] = array();
				}
				$rtn['categories'][$row]['categoryName'] = ($rtn['categories'][$row]['categoryInfo']->name ? $rtn['categories'][$row]['categoryInfo']->name : $row);
				$rtn['categories'][$row]['realpath'] = $realpath;
				$rtn['categories'][$row]['deprecated'] = ($rtn['categories'][$row]['categoryInfo']->deprecated ? true : false);
				$rtn['categories'][$row]['modules'] = array();
			}
		}

		// new Promise(function(rlv){rlv();})
		// 	.then(function(){ return new Promise(function(rlv, rjt){
		// 		// 各カテゴリのモジュールをリスト化

		// 		it79.ary(
		// 			$rtn['categories'],
		// 			function( it1, row, idx ){
		// 				// var_dump(row);

		// 				fs.readdir( $rtn['categories'][idx].realpath, function(err, fileList){
		// 					// var_dump(fileList);
		// 					// var_dump(row.categoryInfo.sort);
		// 					fileList = sortModuleDirectoryNames(fileList, row.categoryInfo.sort);
		// 					it79.ary(
		// 						fileList,
		// 						function( it2, row2, idx2 ){
		// 							var realpath = path.resolve($rtn['categories'][idx].realpath, row2);
		// 							if( !fs.statSync(realpath).isDirectory() ){
		// 								it2.next();
		// 								return;
		// 							}

		// 							realpath += '/';
		// 							$rtn['categories'][idx].modules[row2] = {};

		// 							// moduleId
		// 							var moduleId = $rtn['packageId']+':'+$rtn['categories'][idx].categoryId+'/'+row2;
		// 							$rtn['categories'][idx].modules[row2].moduleId = moduleId;

		// 							// info.json
		// 							try {
		// 								$rtn['categories'][idx].modules[row2].moduleInfo = json_decode(file_get_contents( path.resolve( realpath, 'info.json' ) ));
		// 								$rtn['categories'][idx].modules[row2].moduleInfo.enabledParents = broccoli.normalizeEnabledParentsOrChildren($rtn['categories'][idx].modules[row2].moduleInfo.enabledParents, moduleId);
		// 								if( typeof($rtn['categories'][idx].modules[row2].moduleInfo.enabledBowls) == typeof('') ){
		// 									$rtn['categories'][idx].modules[row2].moduleInfo.enabledBowls = [$rtn['categories'][idx].modules[row2].moduleInfo.enabledBowls];
		// 								}
		// 							} catch (e) {
		// 								$rtn['categories'][idx].modules[row2].moduleInfo = {};
		// 							}
		// 							$rtn['categories'][idx].modules[row2].deprecated = ($rtn['categories'][idx].modules[row2].moduleInfo.deprecated||false);

		// 							// clip.json
		// 							try {
		// 								$rtn['categories'][idx].modules[row2].clip = json_decode(file_get_contents( path.resolve( realpath, 'clip.json' ) ));
		// 							} catch (e) {
		// 								$rtn['categories'][idx].modules[row2].clip = false;
		// 							}

		// 							// moduleName
		// 							$rtn['categories'][idx].modules[row2].moduleName = $rtn['categories'][idx].modules[row2].moduleInfo.name||moduleId;

		// 							// realpath
		// 							$rtn['categories'][idx].modules[row2].realpath = realpath;

		// 							// thumb.png
		// 							var realpathThumb = path.resolve( realpath, 'thumb.png' );
		// 							$rtn['categories'][idx].modules[row2].thumb = null;
		// 							try{
		// 								if( isFile(realpathThumb) ){
		// 									$rtn['categories'][idx].modules[row2].thumb = 'data:image/png;base64,'+base64_encode( fs.readFileSync( realpathThumb ) );
		// 								}
		// 							} catch (e) {
		// 								$rtn['categories'][idx].modules[row2].thumb = null;
		// 							}

		// 							// README.md (html)
		// 							var realpathReadme = path.resolve( realpath, 'README' );
		// 							var readme = '';
		// 							try{
		// 								readme = '';
		// 								if( isFile(realpathReadme+'.html') ){
		// 									readme = fs.readFileSync( realpathReadme+'.html' ).toString();
		// 								}else if( isFile(realpathReadme+'.md') ){
		// 									readme = fs.readFileSync( realpathReadme+'.md' ).toString();
		// 									var marked = require('marked');
		// 									marked.setOptions({
		// 										renderer: new marked.Renderer(),
		// 										gfm: true,
		// 										tables: true,
		// 										breaks: false,
		// 										pedantic: false,
		// 										sanitize: false,
		// 										smartLists: true,
		// 										smartypants: false
		// 									});
		// 									readme = marked(readme);
		// 								}
		// 							} catch (e) {
		// 								readme = '';
		// 							}
		// 							$rtn['categories'][idx].modules[row2].readme = readme;

		// 							// pics/
		// 							var realpathPics = path.resolve( realpath, 'pics/' );
		// 							$rtn['categories'][idx].modules[row2].pics = [];
		// 							if( isDir(realpathPics) ){
		// 								var piclist = fs.readdirSync(realpathPics);
		// 								piclist.sort(function(a,b){
		// 									if( a < b ) return -1;
		// 									if( a > b ) return 1;
		// 									return 0;
		// 								});
		// 								for( var picIdx in piclist ){
		// 									var imgPath = '';
		// 									try{
		// 										if( isFile(realpathPics+'/'+piclist[picIdx]) ){
		// 											imgPath = fs.readFileSync( realpathPics+'/'+piclist[picIdx] ).toString('base64');
		// 										}
		// 									} catch (e) {
		// 										imgPath = '';
		// 									}
		// 									// var_dump( imgPath );
		// 									$rtn['categories'][idx].modules[row2].pics.push( 'data:image/png;base64,'+imgPath );
		// 								}
		// 							}

		// 							broccoli.getModule(moduleId, null, function(modInstance){
		// 								$rtn['categories'][idx].modules[row2].moduleInfo.interface = $rtn['categories'][idx].modules[row2].moduleInfo.interface || modInstance.fields;
		// 								it2.next();
		// 							});
		// 							// it2.next();
		// 							return;
		// 						} ,
		// 						function(){
		// 							it1.next();
		// 						}
		// 					);
		// 				} );
		// 			} ,
		// 			function(){
		// 				rlv();
		// 			}
		// 		);

		// 	}); })
		// 	.then(function(){ return new Promise(function(rlv, rjt){
		// 		// 返却
		// 		callback(rtn);
		// 		rlv();
		// 	}); })
		// ;

		return $rtn;
	}

}
