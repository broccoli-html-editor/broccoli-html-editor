<?php
/**
 * broccoli-html-editor
 */
namespace broccoliHtmlEditor;

/**
 * classModule.php
 * モジュールを解析・構造化するオブジェクトクラスです。
 * 1つのモジュールを単位として表現します。
 * コンテンツデータは含みません。よって、bind() のような機能は持ちません。
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class classModule{

	/** $broccoli */
	private $broccoli;

	/** $options */
	private $options;

	/** realpath module */
	private $realpath;

	/** values */
	private	$moduleId,
			$subModName,
			$isSingleRootElement,
			$templateFilename,
			$templateType,
			$finalize;

	/**
	 * Constructor
	 */
	public function __construct($broccoli, $moduleId, $options = array()){
		$this->broccoli = $broccoli;
		$this->options = ($options ? $options : array());

		$this->realpath = $this->broccoli->getModuleRealpath($moduleId);
		$this->isSystemModule = $this->broccoli->isSystemMod($moduleId);

		// var_dump('classModTpl -> '.$moduleId);

		$this->isSingleRootElement = false;
		$this->path = null;
		if( !$this->isSystemModule && !is_string(@$options['src']) ){
			$tmpModuleRealpath = $this->broccoli->getModuleRealpath($moduleId);
			if(is_string($tmpModuleRealpath)){
				$this->path = $this->broccoli->fs()->get_realpath( $tmpModuleRealpath.'/' );
			}else{
				$moduleId = '_sys/unknown';
				$this->isSystemModule = true;
			}

		}
		$this->id = $moduleId;
		$this->fields = array();
		$this->templateType = 'broccoli';
		$this->finalize = function($html){ return $html; };

		$this->info = array(
			'name' => null,
			'areaSizeDetection' => 'shallow',
			'enabledParents' => array(),
			'enabledBowls' => array(),
			'interface' => array(),
			'deprecated' => false
		);

		if( @$this->options['topThis'] ){
			$this->topThis = $this->options['topThis'];
			$this->templateType = $this->topThis->templateType;
			$this->info->name = '- ' . $this->topThis->info->name . ' -';
			// $this->nameSpace = $this->options['topThis']->nameSpace;
			if( $options['subModName'] ){
				$this->subModName = $options['subModName'];
				if( $this->topThis->subModule[$this->subModName] ){
					// var_dump($this->topThis->subModule[$this->subModName]);
					$this->fields = $this->topThis->subModule[$this->subModName]->fields;
				}
			}
		}else{
			$this->topThis = $this;
			// $this->nameSpace = array("vars" => array());
		}
	}

	/**
	 * 初期化する
	 */
	public function init(){

		if( $this->realpath === false && !$this->isSystemModule ){
			return false;
		}

		if( $this->moduleId == '_sys/root' ){
			return $this->parseTpl( '{&{"module":{"name":"main"}}&}', $this, $this );
		}else if( $this->moduleId == '_sys/unknown' ){
			return $this->parseTpl( '<div style="background:#f00;padding:10px;color:#fff;text-align:center;border:1px solid #fdd;">[ERROR] 未知のモジュールテンプレートです。<!-- .error --></div>'+"\n", $this, $this );
		}else if( $this->moduleId == '_sys/html' ){
			return $this->parseTpl( '{&{"input":{"type":"html","name":"main"}}&}', $this, $this );
		}else if( is_string(@$this->options['src']) ){
			return $this->parseTpl( $this->options['src'], $this, $this->options['topThis'] );
		}else if( $this->topThis->templateType != 'broccoli' && is_string($this->subModName) ){
			return $this->parseTpl( null, $this, $this->options['topThis'] );
		}else if( $this->path ){
			$tmpTplSrc = null;
			if( is_file( $this->path.'/finalize.php' ) ){
				$tmpRealathFinalizePhp = $this->broccoli->fs()->get_realpath($this->path.'/finalize.php');
				$this->finalize = include($tmpRealathFinalizePhp);
			}
			if( is_file( $this->path.'/template.html' ) ){
				$this->templateFilename = $this->path.'/template.html';
				$this->templateType = 'broccoli';
				$tmpTplSrc = file_get_contents( $this->templateFilename );
			}else if( is_file( $this->path.'/template.html.twig' ) ){
				$this->templateFilename = $this->path.'/template.html.twig';
				$this->templateType = 'twig';
				$tmpTplSrc = file_get_contents( $this->templateFilename );
			}
			if( !is_string($tmpTplSrc) ){
				$tmpTplSrc = '<div style="background:#f00;padding:10px;color:#fff;text-align:center;border:1px solid #fdd;">[ERROR] モジュールテンプレートの読み込みエラーです。<!-- .error --></div>'+"\n";
			}
			$tmpTplSrc = json_decode( json_encode( $tmpTplSrc ) );
			return $this->parseTpl( $tmpTplSrc, $this, $this );
		}

		return true;
	}



	/**
	 * Markdown 文法を処理する
	 */
	private function markdownSync($str){
		if( !is_string($str) ){return $str;}
		// TODO: markdown変換を実装する
		// $marked = require('marked');
		// $marked.setOptions({
		// 	renderer: new marked.Renderer(),
		// 	gfm: true,
		// 	tables: true,
		// 	breaks: false,
		// 	pedantic: false,
		// 	sanitize: false,
		// 	smartLists: true,
		// 	smartypants: false
		// });
		// $str = $marked($str);
		return $str;
	}

	/**
	 * description を正規化する
	 * @param {*} description 
	 */
	private function normalizeDescription($description){
		$description = ($description ? $description : '');
		$description = $this->markdownSync( $description );
		return $description;
	}

	/** 閉じタグを探す */
	private function searchEndTag($src, $fieldType){

		// var rtn = {
		// 	content: '',
		// 	nextSrc: src
		// };
		// var depth = 0;
		// while( 1 ){
		// 	if( !rtn.nextSrc.match(new RegExp('^((?:.|\r|\n)*?)\\{\\&((?:.|\r|\n)*?)\\&\\}((?:.|\r|\n)*)$') ) ){
		// 		break;
		// 	}
		// 	rtn.content += RegExp.$1;
		// 	var fieldSrc = RegExp.$2;
		// 	var field = {};
		// 	try {
		// 		field = JSON.parse( fieldSrc );
		// 	} catch (e) {
		// 		console.error('ERROR: Failed to parse field.', fieldSrc);
		// 		broccoli.log('ERROR: Failed to parse field. '+fieldSrc);
		// 	}
		// 	rtn.nextSrc = RegExp.$3;

		// 	if( field == 'end'+fieldType ){
		// 		if( depth ){
		// 			depth --;
		// 			rtn.content += '{&'+fieldSrc+'&}';
		// 			continue;
		// 		}
		// 		return rtn;
		// 	}else if( field[fieldType] ){
		// 		depth ++;
		// 		rtn.content += '{&'+fieldSrc+'&}';
		// 		continue;
		// 	}else{
		// 		rtn.content += '{&'+fieldSrc+'&}';
		// 		continue;
		// 	}
		// }
		// return rtn;

	}

	/**
	 * テンプレートを解析する
	 */
	private function parseTpl($src, $_this, $_topThis){
		// new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){


		// 	if(src !== null){
		// 		src = JSON.parse( JSON.stringify( src ) );
		// 	}
		// 	_this.template = src;

		// 	if( _this.path && isDirectory( _this.path ) ){
		// 		if( is_file( _this.path+'/info.json' ) ){
		// 			var tmpJson = {};
		// 			try{
		// 				tmpJson = JSON.parse( fs.readFileSync( _this.path+'/info.json' ) );
		// 			}catch(e){
		// 				console.error( 'module info.json parse error: ' + _this.path+'/info.json' );
		// 				broccoli.log( 'module info.json parse error: ' + _this.path+'/info.json' );
		// 			}
		// 			if( tmpJson.name ){
		// 				_this.info.name = tmpJson.name;
		// 			}
		// 			if( tmpJson.areaSizeDetection ){
		// 				_this.info.areaSizeDetection = tmpJson.areaSizeDetection;
		// 			}
		// 			_this.info.enabledParents = broccoli.normalizeEnabledParentsOrChildren(tmpJson.enabledParents, moduleId);
		// 			if( typeof(tmpJson.enabledBowls) == typeof('') ){
		// 				_this.info.enabledBowls = [tmpJson.enabledBowls];
		// 			}else if( typeof(tmpJson.enabledBowls) == typeof([]) ){
		// 				_this.info.enabledBowls = tmpJson.enabledBowls;
		// 			}


		// 			if( tmpJson.interface ){
		// 				if( tmpJson.interface.fields ){
		// 					_this.fields = tmpJson.interface.fields;
		// 					for( var tmpIdx in _this.fields ){
		// 						// name属性を自動補完
		// 						_this.fields[tmpIdx].name = tmpIdx;
		// 					}
		// 				}
		// 				if( tmpJson.interface.subModule ){
		// 					_this.subModule = tmpJson.interface.subModule;
		// 					for( var tmpIdx in _this.subModule ){
		// 						for( var tmpIdx2 in _this.subModule[tmpIdx].fields ){
		// 							// name属性を自動補完
		// 							_this.subModule[tmpIdx].fields[tmpIdx2].name = tmpIdx2;
		// 						}
		// 					}
		// 				}
		// 			}
		// 			if( tmpJson.deprecated ){
		// 				_this.info.deprecated = tmpJson.deprecated;
		// 			}
		// 		}
		// 		_this.deprecated = (_this.info.deprecated||false);
		// 		_this.thumb = null;
		// 		if( is_file( _this.path+'/thumb.png' ) ){
		// 			_this.thumb = (function(){
		// 				var tmpBin = fs.readFileSync( _this.path+'/thumb.png' ).toString();
		// 				var tmpBase64;
		// 				try {
		// 					tmpBase64 = base64_encode( tmpBin );
		// 				} catch (e) {
		// 					var_dump('ERROR: base64_encode() FAILED; -> '+_this.path+'/thumb.png');
		// 					return null;
		// 				}
		// 				return 'data:image/png;base64,'+tmpBase64;
		// 			})();
		// 		}
		// 	}

		// 	if( src ){
		// 		_this.isSingleRootElement = (function(tplSrc){
		// 			// 単一のルート要素を持っているかどうか判定。
		// 			tplSrc = JSON.parse( JSON.stringify(tplSrc) );
		// 			tplSrc = tplSrc.replace( new RegExp('\\<\\!\\-\\-[\\s\\S]*?\\-\\-\\>','g'), '' );
		// 			tplSrc = tplSrc.replace( new RegExp('\\{\\&[\\s\\S]*?\\&\\}','g'), '' );
		// 			tplSrc = tplSrc.replace( new RegExp('\\r\\n|\\r|\\n','g'), '' );
		// 			tplSrc = tplSrc.replace( new RegExp('\\t','g'), '' );
		// 			tplSrc = tplSrc.replace( new RegExp('^[\\s\\r\\n]*'), '' );
		// 			tplSrc = tplSrc.replace( new RegExp('[\\s\\r\\n]*$'), '' );
		// 			if( tplSrc.length && tplSrc.indexOf('<') === 0 && tplSrc.match(new RegExp('\\>$')) ){
		// 				var htmlparser = require('htmlparser');
		// 				var handler = new htmlparser.DefaultHandler(function (error, dom) {
		// 					// var_dump('htmlparser callback');
		// 					if (error){
		// 						// var_dump(error);
		// 					}
		// 				});
		// 				// var_dump('htmlparser after');
		// 				var parser = new htmlparser.Parser(handler);
		// 				parser.parseComplete(tplSrc);
		// 				// var_dump(handler.dom);

		// 				if( handler.dom.length == 1 ){
		// 					return true;
		// 				}
		// 			}
		// 			return false;
		// 		})(src);
		// 	}

		// 	var field = null;

		// 	if( _topThis.templateType != 'broccoli' ){
		// 		// テンプレートエンジン(Twigなど)利用の場合の処理
		// 		if( _this.subModName ){
		// 			_this.fields = _topThis.subModule[_this.subModName].fields;
		// 		}

		// 		it79.ary(
		// 			_this.fields ,
		// 			function( it2, row, tmpFieldName ){
		// 				row.description = normalizeDescription(row.description);
		// 				if( _this.fields[tmpFieldName].fieldType == 'module' ){
		// 					_this.fields[tmpFieldName].enabledChildren = broccoli.normalizeEnabledParentsOrChildren(_this.fields[tmpFieldName].enabledChildren, moduleId);
		// 				}

		// 				if( _this.fields[tmpFieldName].fieldType == 'loop' ){
		// 					_this.subModule = _this.subModule || {};

		// 					_topThis.subModule[tmpFieldName] = broccoli.createModuleInstance( _this.id, {
		// 						"src": '',
		// 						"subModName": tmpFieldName,
		// 						"topThis":_topThis
		// 					} );
		// 					_topThis.subModule[tmpFieldName].init(function(){
		// 						it2.next();
		// 					});
		// 					return;
		// 				}
		// 				it2.next();return;
		// 			} ,
		// 			function(){
		// 				callback(true);
		// 			}
		// 		);
		// 		return;

		// 	}else{
		// 		// Broccoliエンジン利用の処理
		// 		function parseBroccoliTemplate(src, callback){
		// 			if( !src.match(new RegExp('^((?:.|\r|\n)*?)\\{\\&((?:.|\r|\n)*?)\\&\\}((?:.|\r|\n)*)$') ) ){
		// 				callback();
		// 				return;
		// 			}
		// 			field = RegExp.$2;
		// 			src = RegExp.$3;

		// 			try{
		// 				field = JSON.parse( field );
		// 			}catch(e){
		// 				console.error( 'module template parse error: ' + _this.templateFilename );
		// 				broccoli.log( 'module template parse error: ' + _this.templateFilename );
		// 				field = {'input':{
		// 					'type':'html',
		// 					'name':'__error__'
		// 				}};
		// 			}
		// 			try{
		// 				_this.fields[field.input.name].description = normalizeDescription(_this.fields[field.input.name].description);
		// 			}catch(e){
		// 			}

		// 			if( typeof(field) == typeof('') ){
		// 				// end系：無視
		// 				parseBroccoliTemplate( src, function(){
		// 					callback();
		// 				} );
		// 				return;

		// 			}else if( field.input ){
		// 				_this.fields[field.input.name] = field.input;
		// 				_this.fields[field.input.name].fieldType = 'input';

		// 				parseBroccoliTemplate( src, function(){
		// 					callback();
		// 				} );
		// 				return;
		// 			}else if( field.module ){
		// 				_this.fields[field.module.name] = field.module;
		// 				_this.fields[field.module.name].fieldType = 'module';

		// 				_this.fields[field.module.name].enabledChildren = broccoli.normalizeEnabledParentsOrChildren(_this.fields[field.module.name].enabledChildren, moduleId);
	
		// 				parseBroccoliTemplate( src, function(){
		// 					callback();
		// 				} );
		// 				return;
		// 			}else if( field.loop ){
		// 				_this.fields[field.loop.name] = field.loop;
		// 				_this.fields[field.loop.name].fieldType = 'loop';

		// 				var tmpSearchResult = _this.searchEndTag( src, 'loop' );
		// 				src = tmpSearchResult.nextSrc;
		// 				if( typeof(_this.subModule) !== typeof({}) ){
		// 					_this.subModule = {};
		// 				}
		// 				// var_dump(' <------- ');
		// 				// var_dump(field.loop.name);
		// 				// var_dump('on '+_topThis.moduleId);
		// 				// var_dump(tmpSearchResult.content);
		// 				// var_dump(' =======> ');
		// 				_topThis.subModule[field.loop.name] = broccoli.createModuleInstance( _this.id, {
		// 					"src": tmpSearchResult.content,
		// 					"subModName": field.loop.name,
		// 					"topThis":_topThis
		// 				});
		// 				_topThis.subModule[field.loop.name].init(function(){
		// 					parseBroccoliTemplate( src, function(){
		// 						callback();
		// 					} );
		// 				});

		// 				return;

		// 			}else{
		// 				parseBroccoliTemplate( src, function(){
		// 					callback();
		// 				} );
		// 				return;
		// 			}
		// 		}//parseBroccoliTemplate()

		// 		parseBroccoliTemplate( src, function(){
		// 			callback(true);
		// 		} );
		// 		return;
		// 	}
		// 	// var_dump(_this.fields);
		// 	// callback(true);
		// }); }); // Promise
		// return;
	} // parseTpl()


}
