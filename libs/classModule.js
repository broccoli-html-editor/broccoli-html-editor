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

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var fs = require('fs');

	var rtn = {};

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

	// console.log('classModTpl -> '+moduleId);

	this.isSingleRootElement = false;
	this.path = null;
	if( !this.isSystemModule && typeof(options.src) !== typeof('') ){
		try {
			this.path = fs.realpathSync( broccoli.getModuleRealpath(moduleId) )+'/';
		} catch (e) {
			moduleId = '_sys/unknown';
			this.isSystemModule = true;
		}
	}
	this.id = moduleId;
	this.fields = {};
	this.templateType = 'broccoli';

	if(options.subModName){
		this.subModName = options.subModName;
	}
	if( options.topThis ){
		this.topThis = options.topThis;
		// this.nameSpace = options.topThis.nameSpace;
	}else{
		this.topThis = this;
		// this.nameSpace = {"vars": {}};
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
			var field = JSON.parse( fieldSrc );
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
		callback = callback||function(){};
		if(src !== null){
			src = JSON.parse( JSON.stringify( src ) );
		}
		_this.template = src;

		_this.info = {
			name: null,
			areaSizeDetection: 'shallow',
			interface: {}
		};

		if( _this.path && isDirectory( _this.path ) ){
			if( isFile( _this.path+'/info.json' ) ){
				var tmpJson = {};
				try{
					tmpJson = JSON.parse( fs.readFileSync( _this.path+'/info.json' ) );
				}catch(e){
					console.log( 'module info.json parse error: ' + _this.path+'/info.json' );
				}
				if( tmpJson.name ){
					_this.info.name = tmpJson.name;
				}
				if( tmpJson.areaSizeDetection ){
					_this.info.areaSizeDetection = tmpJson.areaSizeDetection;
				}
				if( tmpJson.interface ){
					if( tmpJson.interface.fields ){
						_this.fields = tmpJson.interface.fields;
						for( var tmpIdx in _this.fields ){
							// name属性を自動補完
							_this.fields[tmpIdx].name = tmpIdx;
						}
					}
					if( tmpJson.interface.subModule ){
						_this.subModule = tmpJson.interface.subModule;
						for( var tmpIdx in _this.subModule ){
							for( var tmpIdx2 in _this.subModule[tmpIdx].fields ){
								// name属性を自動補完
								_this.subModule[tmpIdx].fields[tmpIdx2].name = tmpIdx2;
							}
						}
					}
				}
			}
			_this.thumb = null;
			if( isFile( _this.path+'/thumb.png' ) ){
				_this.thumb = (function(){
					var tmpBin = fs.readFileSync( _this.path+'/thumb.png' ).toString();
					var tmpBase64;
					try {
						tmpBase64 = php.base64_encode( tmpBin );
					} catch (e) {
						console.log('ERROR: php.base64_encode() FAILED; -> '+_this.path+'/thumb.png');
						return null;
					}
					return 'data:image/png;base64,'+tmpBase64;
				})();
			}
		}

		if( src ){
			_this.isSingleRootElement = (function(tplSrc){
				// 単一のルート要素を持っているかどうか判定。
				tplSrc = JSON.parse( JSON.stringify(tplSrc) );
				tplSrc = tplSrc.replace( new RegExp('\\<\\!\\-\\-.*?\\-\\-\\>','g'), '' );
				tplSrc = tplSrc.replace( new RegExp('\\{\\&.*?\\&\\}','g'), '' );
				tplSrc = tplSrc.replace( new RegExp('\r\n|\r|\n','g'), '' );
				tplSrc = tplSrc.replace( new RegExp('\t','g'), '' );
				tplSrc = tplSrc.replace( new RegExp('^[\s\r\n]*'), '' );
				tplSrc = tplSrc.replace( new RegExp('[\s\r\n]*$'), '' );
				if( tplSrc.length && tplSrc.indexOf('<') === 0 && tplSrc.match(new RegExp('\\>$')) ){
					var htmlparser = require('htmlparser');
					var handler = new htmlparser.DefaultHandler(function (error, dom) {
						// console.log('htmlparser callback');
						if (error){
							// console.log(error);
						}
					});
					// console.log('htmlparser after');
					var parser = new htmlparser.Parser(handler);
					parser.parseComplete(tplSrc);
					// console.log(handler.dom);

					if( handler.dom.length == 1 ){
						return true;
					}
				}
				return false;
			})(src);
		}

		var field = null;

		if( _topThis.templateType != 'broccoli' ){
			// テンプレートエンジン
			if( _this.subModName ){
				_this.fields = _topThis.subModule[_this.subModName].fields;
			}

			it79.ary(
				_this.fields ,
				function( it2, row, tmpFieldName ){
					if( _this.fields[tmpFieldName].fieldType == 'loop' ){
						_this.subModule = _this.subModule || {};

						_topThis.subModule[tmpFieldName] = broccoli.createModuleInstance( _this.id, {
							"src": '',
							"subModName": tmpFieldName,
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
					console.log( 'module template parse error: ' + _this.templateFilename );
					field = {'input':{
						'type':'html',
						'name':'__error__'
					}};
				}

				if( field.input ){
					_this.fields[field.input.name] = field.input;
					_this.fields[field.input.name].fieldType = 'input';

					parseBroccoliTemplate( src, function(){
						callback();
					} );
					return;
				}else if( field.module ){
					_this.fields[field.module.name] = field.module;
					_this.fields[field.module.name].fieldType = 'module';

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
					// console.log(' <------- ');
					// console.log(field.loop.name);
					// console.log('on '+_topThis.moduleId);
					// console.log(tmpSearchResult.content);
					// console.log(' =======> ');
					_topThis.subModule[field.loop.name] = broccoli.createModuleInstance( _this.id, {
						"src": tmpSearchResult.content,
						"subModName": field.loop.name,
						"topThis":_topThis
					});
					_topThis.subModule[field.loop.name].init(function(){
						parseBroccoliTemplate( src, function(){
							callback();
						} );
					});

					return;
				}else if( field == 'endloop' ){
					// ループ構造の閉じタグ
					// 本来ここは通らないはず。
					// ここを通る場合は、対応する開始タグがない endloop がある場合。

					parseBroccoliTemplate( src, function(){
						callback();
					} );
					return;
				}else if( field.if ){
					// _this.fields[field.if.name] = field.if;
					// _this.fields[field.if.name].fieldType = 'if';
					// var tmpSearchResult = _this.searchEndTag( src, 'if' );
					// if( typeof(_this.subModule) !== typeof({}) ){
					// 	_this.subModule = {};
					// }
					// _topThis.subModule[field.if.name] = broccoli.createModuleInstance( _this.id, {
					// 	"src": tmpSearchResult.content,
					// 	"subModName": field.if.name,
					// 	"topThis":_topThis
					// }).init(function(){});
					// src = tmpSearchResult.nextSrc;

					parseBroccoliTemplate( src, function(){
						callback();
					} );
					return;
				}else if( field == 'endif' ){
					// 分岐構造の閉じタグ
					// 本来ここは通らないはず。
					// ここを通る場合は、対応する開始タグがない endloop がある場合。

					parseBroccoliTemplate( src, function(){
						callback();
					} );
					return;
				}else if( field.echo ){
					// _this.fields[field.echo.name] = field.echo;
					// _this.fields[field.echo.name].fieldType = 'echo';

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
		// console.log(_this.fields);
		// callback(true);
		return;
	} // parseTpl()

	/**
	 * 初期化する
	 * @param  {Function} callback callback function.
	 * @return {Object}            this.
	 */
	this.init = function(callback){
		setTimeout(function(){
			callback = callback || function(){};
			if( realpath === false && !_this.isSystemModule ){
				callback(false); return;
			}

			if( moduleId == '_sys/root' ){
				parseTpl( '{&{"module":{"name":"main"}}&}', _this, _this, callback );
			}else if( moduleId == '_sys/unknown' ){
				parseTpl( '<div style="background:#f00;padding:10px;color:#fff;text-align:center;border:1px solid #fdd;">[ERROR] 未知のモジュールテンプレートです。<!-- .error --></div>', _this, _this, callback );
			}else if( moduleId == '_sys/html' ){
				parseTpl( '{&{"input":{"type":"html","name":"main"}}&}', _this, _this, callback );
			}else if( typeof(options.src) === typeof('') ){
				parseTpl( options.src, _this, options.topThis, callback );
			}else if( _this.topThis.templateType != 'broccoli' && typeof(_this.subModName) == typeof('') ){
				parseTpl( null, _this, options.topThis, callback );
			}else if( _this.path ){
				var tmpTplSrc = null;
				if( isFile( _this.path+'template.html' ) ){
					_this.templateFilename = _this.path+'template.html';
					_this.templateType = 'broccoli';
					tmpTplSrc = fs.readFileSync( _this.templateFilename );
				}else if( isFile( _this.path+'template.html.twig' ) ){
					_this.templateFilename = _this.path+'template.html.twig';
					_this.templateType = 'twig';
					tmpTplSrc = fs.readFileSync( _this.templateFilename );
				}
				if( !tmpTplSrc ){
					tmpTplSrc = '<div style="background:#f00;padding:10px;color:#fff;text-align:center;border:1px solid #fdd;">[ERROR] モジュールテンプレートの読み込みエラーです。<!-- .error --></div>';
				}
				tmpTplSrc = JSON.parse( JSON.stringify( tmpTplSrc.toString() ) );
				parseTpl( tmpTplSrc, _this, _this, callback );
			}

		}, 0);

		return this;
	}

	return;
}
