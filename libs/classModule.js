/**
 * classModule.js
 * モジュールを解析・構造化するオブジェクトクラスです。
 * 1つのモジュールを単位として表現します。
 * コンテンツデータは含みません。よって、bind() のような機能は持ちません。
 */
module.exports = function(broccoli, moduleId, options){
	delete(require.cache[require('path').resolve(__filename)]);

	var _this = this;
	options = options || {};

	var Promise = require('es6-promise').Promise;
	var it79 = require('iterate79');
	var fs = require('fs');
	var FncsReadme = require('./fncs/readme.js');
	var LangBank = require('langbank');

	var realpath = broccoli.getModuleRealpath(moduleId);
	this.isSystemModule = broccoli.isSystemMod(moduleId);

	function isFile(path){
		if( !fs.existsSync(path) || !fs.statSync(path).isFile() ){
			return false;
		}
		return true;
	}
	function isDirectory(path){
		if( !fs.existsSync(path) || !fs.statSync(path).isDirectory() ){
			return false;
		}
		return true;
	}
	function base64_encode( bin ){
		var base64 = bin.toString('base64');
		return base64;
	}
	function markdownSync(str){
		if( typeof(str) !== typeof('') ){return str;}
		var marked = require('marked');
		marked.setOptions({
			renderer: new marked.Renderer(),
			gfm: true,
			headerIds: false,
			tables: true,
			breaks: false,
			pedantic: false,
			sanitize: false,
			smartLists: true,
			smartypants: false,
			xhtml: true
		});
		str = marked.parse(str);
		return str;
	}

	this.isSubModule = false;
	this.isSingleRootElement = false;
	this.isClipModule = false;
	this.realpath = null;
	if( !this.isSystemModule && typeof(options.src) !== typeof('') ){
		try {
			this.realpath = fs.realpathSync( broccoli.getModuleRealpath(moduleId) )+'/';
		} catch (e) {
			moduleId = '_sys/unknown';
			this.isSystemModule = true;
		}
	}
	this.id = moduleId;
	this.internalId = moduleId;
	this.fields = {};
	this.templateType = 'broccoli';
	this.languageCsv = null;
	this.finalize = function(html, callback){callback(html);return;}

	this.info = {
		name: null,
		areaSizeDetection: 'shallow',
		enabledParents: [],
		enabledBowls: [],
		interface: {},
		hidden: false,
		deprecated: false,
	};

	if(this.isSystemModule){
		if(this.id == '_sys/root'){
			this.info['name'] = broccoli.lb.get('system_module_label.root');
		}else if(this.id == '_sys/unknown'){
			this.info['name'] = broccoli.lb.get('system_module_label.unknown_module');
		}else if(this.id == '_sys/html'){
			this.info['name'] = 'HTML';
		}else if(this.id == '_sys/image'){
			this.info['name'] = broccoli.lb.get('system_module_label.image');
		}
	}

	if( options.topThis ){
		this.topThis = options.topThis;
		this.templateType = this.topThis.templateType;
		this.info.name = this.topThis.info.name;
		this.isSubModule = true;
		if( options.modName ){
			this.info.name = options.modName;
		}
		if( this.topThis.languageCsv ){
			this.languageCsv = this.topThis.languageCsv;
		}
		this.info.name = this.info.name + ' *';
		if( options.subModName ){
			this.subModName = options.subModName;
			if( this.topThis.subModule[this.subModName] ){
				this.fields = this.topThis.subModule[this.subModName].fields;
			}
		}
	}else{
		this.topThis = this;
	}

	/**
	 * description を正規化する
	 * @param {*} description 
	 */
	function normalizeDescription(description){
		description = description || '';
		description = markdownSync( description );
		return description;
	}

	/* 閉じタグを探す */
	this.searchEndTag = function( src, fieldType ){
		var rtn = {
			content: '',
			nextSrc: src
		};
		var depth = 0;
		while( 1 ){
			if( !rtn.nextSrc.match(new RegExp('^((?:.|\r|\n)*?)\\{\\&((?:.|\r|\n)*?)\\&\\}((?:.|\r|\n)*)$') ) ){
				break;
			}
			rtn.content += RegExp.$1;
			var fieldSrc = RegExp.$2;
			var field = {};
			try {
				field = JSON.parse( fieldSrc );
			} catch (e) {
				console.error('ERROR: Failed to parse field.', fieldSrc);
				broccoli.log('ERROR: Failed to parse field. '+fieldSrc);
			}
			rtn.nextSrc = RegExp.$3;

			if( field == 'end'+fieldType ){
				if( depth ){
					depth --;
					rtn.content += '{&'+fieldSrc+'&}';
					continue;
				}
				return rtn;
			}else if( field[fieldType] ){
				depth ++;
				rtn.content += '{&'+fieldSrc+'&}';
				continue;
			}else{
				rtn.content += '{&'+fieldSrc+'&}';
				continue;
			}
		}
		return rtn;
	}

	/**
	 * テンプレートを解析する
	 */
	function parseTpl(src, _this, _topThis, callback){
		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){

			callback = callback||function(){};
			if(src !== null){
				src = JSON.parse( JSON.stringify( src ) );
			}
			_this.template = src;

			if( _this.realpath && isDirectory( _this.realpath ) ){
				if( isFile( _this.realpath+'/info.json' ) ){
					var tmpJson = {};
					try{
						tmpJson = JSON.parse( fs.readFileSync( _this.realpath+'/info.json' ) );
					}catch(e){
						var tmp_targetfile = (_this.realpath+'/info.json').split(/\/+/).reverse().slice(0, 4).reverse().join('/');
						broccoli.error( 'module info.json parse error: ' + tmp_targetfile );
					}
					if( typeof(tmpJson) != typeof({}) || tmpJson === null ){
						var tmp_targetfile = (_this.realpath+'/info.json').split(/\/+/).reverse().slice(0, 4).reverse().join('/');
						broccoli.error( 'module info.json contains a non object or null: ' + tmp_targetfile );
						tmpJson = {};
					}
					if( tmpJson.id ){
						_this.internalId = broccoli.getModuleInternalId(_this.id, tmpJson.id);
					}
					if( tmpJson.name ){
						_this.info.name = tmpJson.name;
					}
					if( tmpJson.areaSizeDetection ){
						_this.info.areaSizeDetection = tmpJson.areaSizeDetection;
					}
					_this.info.enabledParents = broccoli.normalizeEnabledParentsOrChildren(tmpJson.enabledParents, moduleId);
					if( typeof(tmpJson.enabledBowls) == typeof('') ){
						_this.info.enabledBowls = [tmpJson.enabledBowls];
					}else if( typeof(tmpJson.enabledBowls) == typeof([]) ){
						_this.info.enabledBowls = tmpJson.enabledBowls;
					}


					if( tmpJson.interface ){
						if( tmpJson.interface.fields ){
							_this.fields = tmpJson.interface.fields;
							for( var tmpIdx in _this.fields ){

								// name属性を自動補完
								_this.fields[tmpIdx].name = tmpIdx;

								// Multi Language
								_this.fields[tmpIdx].label = findLang('fields.'+tmpIdx+':label', _this.fields[tmpIdx].label);
								_this.fields[tmpIdx].description = findLang('fields.'+tmpIdx+':description', _this.fields[tmpIdx].description);

								_this.fields[tmpIdx] = applyFieldConfig(_this.fields[tmpIdx]);
							}
						}
						if( tmpJson.interface.subModule ){
							_this.subModule = tmpJson.interface.subModule;
							for( var tmpIdx in _this.subModule ){
								for( var tmpIdx2 in _this.subModule[tmpIdx].fields ){

									// name属性を自動補完
									_this.subModule[tmpIdx].fields[tmpIdx2].name = tmpIdx2;

									// Multi Language
									_this.subModule[tmpIdx].fields[tmpIdx2].label = findLang('subModule.'+tmpIdx+'.'+tmpIdx2+':label', _this.subModule[tmpIdx].fields[tmpIdx2].label);
									_this.subModule[tmpIdx].fields[tmpIdx2].description = findLang('subModule.'+tmpIdx+'.'+tmpIdx2+':description', _this.subModule[tmpIdx].fields[tmpIdx2].description);

									_this.subModule[tmpIdx].fields[tmpIdx2] = applyFieldConfig(_this.subModule[tmpIdx].fields[tmpIdx2]);
								}
							}
						}
					}
					if( tmpJson.hidden ){
						_this.info.hidden = tmpJson.hidden;
					}
					if( tmpJson.deprecated ){
						_this.info.deprecated = tmpJson.deprecated;
					}
				}
				_this.hidden = (_this.info.hidden||false);
				_this.deprecated = (_this.info.deprecated||false);
				_this.thumb = null;
				if( isFile( _this.realpath+'/thumb.png' ) ){
					_this.thumb = (function(){
						var tmpBin = fs.readFileSync( _this.realpath+'/thumb.png' ).toString();
						var tmpBase64;
						try {
							tmpBase64 = base64_encode( tmpBin );
						} catch (e) {
							console.log('ERROR: base64_encode() FAILED; -> '+_this.realpath+'/thumb.png');
							return null;
						}
						return 'data:image/png;base64,'+tmpBase64;
					})();
				}
			}

			// Multi Language
			_this.info.name = findLang('name', _this.info.name);

			if( src ){
				_this.isSingleRootElement = (function(tplSrc){
					// 単一のルート要素を持っているかどうか判定。
					tplSrc = JSON.parse( JSON.stringify(tplSrc) );
					tplSrc = tplSrc.replace( new RegExp('\\<\\!\\-\\-[\\s\\S]*?\\-\\-\\>','g'), '' );
					tplSrc = tplSrc.replace( new RegExp('\\{\\&[\\s\\S]*?\\&\\}','g'), '' );
					tplSrc = tplSrc.replace( new RegExp('\\r\\n|\\r|\\n','g'), '' );
					tplSrc = tplSrc.replace( new RegExp('\\t','g'), '' );
					tplSrc = tplSrc.replace( new RegExp('^[\\s\\r\\n]*'), '' );
					tplSrc = tplSrc.replace( new RegExp('[\\s\\r\\n]*$'), '' );
					if( tplSrc.length && tplSrc.indexOf('<') === 0 && tplSrc.match(new RegExp('\\>$')) ){
						var htmlparser = require('htmlparser');
						var handler = new htmlparser.DefaultHandler(function (error, dom) {
							if (error){
								// console.log(error);
							}
						});
						var parser = new htmlparser.Parser(handler);
						parser.parseComplete(tplSrc);

						if( handler.dom.length == 1 ){
							return true;
						}
					}
					return false;
				})(src);
			}

			var field = null;

			if( _topThis.templateType != 'broccoli' ){
				// テンプレートエンジン(Twigなど)利用の場合の処理
				if( _this.subModName ){
					_this.fields = _topThis.subModule[_this.subModName].fields;
				}

				it79.ary(
					_this.fields ,
					function( it2, row, tmpFieldName ){
						row.description = normalizeDescription(row.description);
						if( _this.fields[tmpFieldName].fieldType == 'module' ){
							_this.fields[tmpFieldName].enabledChildren = broccoli.normalizeEnabledParentsOrChildren(_this.fields[tmpFieldName].enabledChildren, moduleId);
						}

						if( _this.fields[tmpFieldName].fieldType == 'loop' ){
							_this.subModule = _this.subModule || {};

							_topThis.subModule[tmpFieldName] = broccoli.createModuleInstance( _this.id, {
								"src": '',
								"subModName": tmpFieldName,
								"modName": (_this.fields[tmpFieldName].label || _this.fields[tmpFieldName].name),
								"topThis":_topThis
							} );
							_topThis.subModule[tmpFieldName].init(function(){
								it2.next();
							});
							return;
						}
						it2.next();return;
					} ,
					function(){
						callback(true);
					}
				);
				return;

			}else{
				// Broccoliエンジン利用の処理
				function parseBroccoliTemplate(src, callback){
					if( !src.match(new RegExp('^((?:.|\r|\n)*?)\\{\\&((?:.|\r|\n)*?)\\&\\}((?:.|\r|\n)*)$') ) ){
						callback();
						return;
					}
					field = RegExp.$2;
					src = RegExp.$3;

					try{
						field = JSON.parse( field );
					}catch(e){
						var tmp_targetfile = _this.templateFilename.split(/\/+/).reverse().slice(0, 4).reverse().join('/');
						broccoli.error( 'module template parse error: ' + tmp_targetfile );
						field = {'input':{
							'type':'html',
							'name':'__error__'
						}};
					}
					try{
						_this.fields[field.input.name].description = normalizeDescription(_this.fields[field.input.name].description);
					}catch(e){
					}

					if( typeof(field) == typeof('') ){
						// end系：無視
						parseBroccoliTemplate( src, function(){
							callback();
						} );
						return;

					}else if( field.input ){
						_this.fields[field.input.name] = field.input;
						_this.fields[field.input.name].fieldType = 'input';
						_this.fields[field.input.name] = applyFieldConfig(_this.fields[field.input.name]);

						parseBroccoliTemplate( src, function(){
							callback();
						} );
						return;
					}else if( field.module ){
						_this.fields[field.module.name] = field.module;
						_this.fields[field.module.name].fieldType = 'module';

						_this.fields[field.module.name].enabledChildren = broccoli.normalizeEnabledParentsOrChildren(_this.fields[field.module.name].enabledChildren, moduleId);
	
						parseBroccoliTemplate( src, function(){
							callback();
						} );
						return;
					}else if( field.loop ){
						_this.fields[field.loop.name] = field.loop;
						_this.fields[field.loop.name].fieldType = 'loop';

						var tmpSearchResult = _this.searchEndTag( src, 'loop' );
						src = tmpSearchResult.nextSrc;
						if( typeof(_this.subModule) !== typeof({}) ){
							_this.subModule = {};
						}
						_topThis.subModule[field.loop.name] = broccoli.createModuleInstance( _this.id, {
							"src": tmpSearchResult.content,
							"subModName": field.loop.name,
							"modName": (field.loop.label || field.loop.name),
							"topThis":_topThis
						});
						_topThis.subModule[field.loop.name].init(function(){
							parseBroccoliTemplate( src, function(){
								callback();
							} );
						});

						return;

					}else{
						parseBroccoliTemplate( src, function(){
							callback();
						} );
						return;
					}
				}//parseBroccoliTemplate()

				parseBroccoliTemplate( src, function(){
					callback(true);
				} );
				return;
			}
		}); }); // Promise
		return;
	}

	/**
	 * 初期化する
	 * @param  {Function} callback callback function.
	 * @return {Object}            this.
	 */
	this.init = function(callback){
		callback = callback || function(){};

		if( realpath === false && !_this.isSystemModule ){
			new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
				callback(false);
			}); });
			return;
		}

		_this.lb = new LangBank(_this.realpath+'language.csv', function(){
			_this.lb.setLang( broccoli.lb.lang );
			if( moduleId == '_sys/root' ){
				parseTpl( '{&{"module":{"name":"main","label":"'+broccoli.lb.get('system_module_label.contents_area')+'"}}&}', _this, _this, callback );
			}else if( moduleId == '_sys/unknown' ){
				parseTpl( '<div style="background:#f00;padding:10px;color:#fff;text-align:center;border:1px solid #fdd;" data-broccoli-error-message="'+broccoli.lb.get('ui_message.unknown_module_template')+'">[ERROR] '+broccoli.lb.get('ui_message.unknown_module_template')+'<!-- .error --></div>'+"\n", _this, _this, callback );
			}else if( moduleId == '_sys/html' ){
				parseTpl( '{&{"input":{"type":"html","name":"main","label":"HTML"}}&}', _this, _this, callback );
			}else if( moduleId == '_sys/image' ){
				parseTpl( '<img src="{&{"input":{"type":"image","name":"src","label":"'+broccoli.lb.get('system_module_label.image')+'"}}&}" alt="{&{"input":{"type":"html_attr_text","name":"alt","label":"'+broccoli.lb.get('system_module_label.image_alt_text')+'","rows":1}}&}" />', _this, _this, callback );
			}else if( typeof(options.src) === typeof('') ){
				parseTpl( options.src, _this, options.topThis, callback );
			}else if( _this.topThis.templateType != 'broccoli' && typeof(_this.subModName) == typeof('') ){
				parseTpl( null, _this, options.topThis, callback );
			}else if( _this.realpath ){
				var tmpTplSrc = null;
				if( isFile( _this.realpath+'finalize.js' ) ){
					var tmpRealathFinalizeJs = require('path').resolve(_this.realpath+'finalize.js');
					delete(require.cache[tmpRealathFinalizeJs]);
					_this.finalize = require(tmpRealathFinalizeJs);
				}
				_this.isClipModule = false;
				if( isFile( _this.realpath+'clip.json' ) ){
					_this.isClipModule = true;
				}

				if( isFile( _this.realpath+'language.csv' ) ){
					_this.languageCsv = fs.readFileSync( _this.realpath+'language.csv' ).toString();
				}

				if( isFile( _this.realpath+'template.html' ) ){
					_this.templateFilename = _this.realpath+'template.html';
					_this.templateType = 'broccoli';
					tmpTplSrc = fs.readFileSync( _this.templateFilename );
				}else if( isFile( _this.realpath+'template.html.twig' ) ){
					_this.templateFilename = _this.realpath+'template.html.twig';
					_this.templateType = 'twig';
					tmpTplSrc = fs.readFileSync( _this.templateFilename );
				}
				if( !tmpTplSrc ){
					tmpTplSrc = '<div style="background:#f00;padding:10px;color:#fff;text-align:center;border:1px solid #fdd;">[ERROR] モジュールテンプレートの読み込みエラーです。<!-- .error --></div>'+"\n";
				}
				tmpTplSrc = JSON.parse( JSON.stringify( tmpTplSrc.toString() ) );
				parseTpl( tmpTplSrc, _this, _this, callback );
			}

		});

		return this;
	}


	/**
	 * クリップモジュールの内容を取得する
	 *
	 * クリップモジュールではない場合は false が返されます。
	 */
	this.getClipContents = function(callback){
		var $realpath_clip = _this.realpath+'clip.json';
		if( !isFile( $realpath_clip ) ){
			callback(false);
			return;
		}
		var rtn = false;
		try{
			var json = fs.readFileSync( $realpath_clip );
			rtn = JSON.parse( json );
		}catch(e){}
		callback(rtn);
		return;
	}

	/**
	 * READMEを取得する
	 */
	this.getReadme = function(callback){
		callback = callback || function(){};

		// README.md (html)
		var readmeHelper = new FncsReadme(broccoli);
		var readme = readmeHelper.get_html(realpath);

		callback(readme);
		return;
	}


	/**
	 * 説明用画像を取得する
	 */
	this.getPics = function(callback){
		callback = callback || function(){};

		var realpathPics = require('path').resolve( realpath, 'pics/' );
		var rtn = [];
		if( isDirectory(realpathPics) ){
			var piclist = fs.readdirSync(realpathPics);
			piclist.sort(function(a,b){
				if( a < b ) return -1;
				if( a > b ) return 1;
				return 0;
			});
			for( var picIdx in piclist ){
				var imgPath = '';
				try{
					if( isFile(realpathPics+'/'+piclist[picIdx]) ){
						imgPath = fs.readFileSync( realpathPics+'/'+piclist[picIdx] ).toString('base64');
					}
				} catch (e) {
					imgPath = '';
				}
				rtn.push( 'data:image/png;base64,'+imgPath );
			}
		}
		callback(rtn);
		return;
	}


	/**
	 * フィールド設定を反映する
	 */
	function applyFieldConfig( $field ){
		if( $field.fieldType != 'input' ){
			return $field;
		}
		var $fieldConf = broccoli.getFieldConfig();
		if( $fieldConf[$field.type] ){
			for( var $key in $fieldConf[$field.type] ){
				if( !$field[$key] ){
					$field[$key] = $fieldConf[$field.type][$key];
				}
			}
		}
		return $field;
	}

	/**
	 * LangBank を検索し、対訳を返す
	 */
	function findLang( $key, $default ){
		var $tmpName = _this.lb.get($key);
		if( $tmpName.length && $tmpName !== '---' ){
			return $tmpName;
		}
		return $default;
	}

	return;
}
