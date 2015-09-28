/**
 * classModule.js
 * モジュールを解析・構造化するオブジェクトクラスです。
 * 1つのモジュールを単位として表現します。
 * コンテンツデータは含みません。よって、bind() のような機能は持ちません。
 */
module.exports = function(broccoli, moduleId, options){
	var _this = this;
	options = options || {};

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var fs = require('fs');

	var rtn = {};

	var realpath = broccoli.getModuleRealpath(moduleId);

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

	this.id = moduleId;
	this.isSingleRootElement = false;
	this.path = null;
	if( !broccoli.isSystemMod(moduleId) && typeof(options.src) !== typeof('') ){
		this.path = fs.realpathSync( broccoli.getModuleRealpath(moduleId) )+'/';
	}
	this.fields = {};
	this.templateType = 'broccoli';

	if(options.subModName){
		this.subModName = options.subModName;
	}
	if( options.topThis ){
		this.topThis = options.topThis;
		this.nameSpace = options.topThis.nameSpace;
	}else{
		this.topThis = this;
		this.nameSpace = {"vars": {}};
	}

	/* 閉じタグを探す */
	function searchEndTag( src, fieldType ){
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

	// /**
	//  * テンプレートに値を挿入して返す
	//  */
	// this.bind = function( fieldData, mode ){
	// 	var src = this.template;
	// 	var field = {};
	// 	var rtn = '';
	//
	// 	if( this.topThis.templateType != 'broccoli' ){
	// 		// テンプレートエンジン利用の場合の処理
	// 		// console.log(this.id + '/' + this.subModName);
	// 		var tplDataObj = {};
	// 		for( var fieldName in this.fields ){
	// 			field = this.fields[fieldName];
	//
	// 			if( field.fieldType == 'input' ){
	// 				// input field
	// 				var tmpVal = '';
	// 				if( broccoli.fieldDefinitions[field.type] ){
	// 					// フィールドタイプ定義を呼び出す
	// 					tmpVal += broccoli.fieldDefinitions[field.type].bind( fieldData[field.name], mode, field );
	// 				}else{
	// 					// ↓未定義のフィールドタイプの場合のデフォルトの挙動
	// 					tmpVal += broccoli.fieldBase.bind( fieldData[field.name], mode, field );
	// 				}
	// 				if( !field.hidden ){//← "hidden": true だったら、非表示(=出力しない)
	// 					tplDataObj[field.name] = tmpVal;
	// 				}
	// 				_this.nameSpace.vars[field.name] = {
	// 					fieldType: "input", type: field.type, val: tmpVal
	// 				}
	//
	// 			}else if( field.fieldType == 'module' ){
	// 				// module field
	// 				tplDataObj[field.name] = fieldData[field.name].join('');
	//
	// 			}else if( field.fieldType == 'loop' ){
	// 				// loop field
	// 				tplDataObj[field.name] = fieldData[field.name];
	//
	// 			}
	// 		}
	//
	// 		// 環境変数登録
	// 		tplDataObj._ENV = {
	// 			"mode": mode
	// 		};
	//
	// 		try {
	// 			rtn = twig({
	// 				data: src
	// 			}).render(tplDataObj);
	// 		} catch (e) {
	// 			console.log( 'TemplateEngine Rendering ERROR.' );
	// 			rtn = '<div class="error">TemplateEngine Rendering ERROR.</div>'
	// 		}
	//
	// 	}else{
	// 		// テンプレートエンジンを利用しない場合の処理
	// 		while( 1 ){
	// 			if( !src.match( new RegExp('^((?:.|\r|\n)*?)\\{\\&((?:.|\r|\n)*?)\\&\\}((?:.|\r|\n)*)$') ) ){
	// 				rtn += src;
	// 				break;
	// 			}
	// 			rtn += RegExp.$1;
	// 			field = RegExp.$2;
	// 			try{
	// 				field = JSON.parse( field );
	// 			}catch(e){
	// 				field = {'input':{
	// 					'type':'html',
	// 					'name':'__error__'
	// 				}};
	// 			}
	// 			src = RegExp.$3;
	//
	// 			if( typeof(field) == typeof('') ){
	// 				// end系：無視
	// 			}else if( field.input ){
	// 				// input field
	// 				var tmpVal = '';
	// 				if( broccoli.fieldDefinitions[field.input.type] ){
	// 					// フィールドタイプ定義を呼び出す
	// 					tmpVal += broccoli.fieldDefinitions[field.input.type].bind( fieldData[field.input.name], mode, field.input );
	// 				}else{
	// 					// ↓未定義のフィールドタイプの場合のデフォルトの挙動
	// 					tmpVal += broccoli.fieldBase.bind( fieldData[field.input.name], mode, field.input );
	// 				}
	// 				if( !field.input.hidden ){//← "hidden": true だったら、非表示(=出力しない)
	// 					rtn += tmpVal;
	// 				}
	// 				_this.nameSpace.vars[field.input.name] = {
	// 					fieldType: "input", type: field.input.type, val: tmpVal
	// 				}
	//
	// 			}else if( field.module ){
	// 				// module field
	// 				rtn += fieldData[field.module.name].join('');
	//
	// 			}else if( field.loop ){
	// 				// loop field
	// 				var tmpSearchResult = searchEndTag( src, 'loop' );
	// 				rtn += fieldData[field.loop.name].join('');
	// 				src = tmpSearchResult.nextSrc;
	//
	// 			}else if( field.if ){
	// 				// if field
	// 				// is_set に指定されたフィールドに値があったら、という評価ロジックを取り急ぎ実装。
	// 				// もうちょっとマシな条件の書き方がありそうな気がするが、あとで考える。
	// 				// → 2015-04-25: cond のルールを追加。
	// 				var tmpSearchResult = searchEndTag( src, 'if' );
	// 				var boolResult = false;
	// 				src = '';
	// 				if( field.if.cond && typeof(field.if.cond) == typeof([]) ){
	// 					// cond に、2次元配列を受け取った場合。
	// 					// 1次元目は or 条件、2次元目は and 条件で評価する。
	// 					for( var condIdx in field.if.cond ){
	// 						var condBool = true;
	// 						for( var condIdx2 in field.if.cond[condIdx] ){
	// 							var tmpCond = field.if.cond[condIdx][condIdx2];
	// 							if( tmpCond.match( new RegExp('^([\\s\\S]*?)\\:([\\s\\S]*)$') ) ){
	// 								var tmpMethod = php.trim(RegExp.$1);
	// 								var tmpValue = php.trim(RegExp.$2);
	//
	// 								if( tmpMethod == 'is_set' ){
	// 									if( !_this.nameSpace.vars[tmpValue] || !php.trim(_this.nameSpace.vars[tmpValue].val).length ){
	// 										condBool = false;
	// 										break;
	// 									}
	// 								}else if( tmpMethod == 'is_mode' ){
	// 									if( tmpValue != mode ){
	// 										condBool = false;
	// 										break;
	// 									}
	// 								}
	// 							}else if( tmpCond.match( new RegExp('^([\\s\\S]*?)(\\!\\=|\\=\\=)([\\s\\S]*)$') ) ){
	// 								var tmpValue = php.trim(RegExp.$1);
	// 								var tmpOpe = php.trim(RegExp.$2);
	// 								var tmpDiff = php.trim(RegExp.$3);
	// 								if( tmpOpe == '==' ){
	// 									if( _this.nameSpace.vars[tmpValue].val != tmpDiff ){
	// 										condBool = false;
	// 										break;
	// 									}
	// 								}else if( tmpOpe == '!=' ){
	// 									if( _this.nameSpace.vars[tmpValue].val == tmpDiff ){
	// 										condBool = false;
	// 										break;
	// 									}
	// 								}
	// 							}
	//
	// 						}
	// 						if( condBool ){
	// 							boolResult = true;
	// 							break;
	// 						}
	// 					}
	// 				}
	// 				if( _this.nameSpace.vars[field.if.is_set] && php.trim(_this.nameSpace.vars[field.if.is_set].val).length ){
	// 					boolResult = true;
	// 				}
	// 				if( boolResult ){
	// 					src += tmpSearchResult.content;
	// 				}
	// 				src += tmpSearchResult.nextSrc;
	//
	// 			}else if( field.echo ){
	// 				// echo field
	// 				if( _this.nameSpace.vars[field.echo.ref] && _this.nameSpace.vars[field.echo.ref].val ){
	// 					rtn += _this.nameSpace.vars[field.echo.ref].val;
	// 				}
	//
	// 			}
	//
	// 		}
	//
	// 	}
	//
	// 	return rtn;
	// } // bind()

	/**
	 * テンプレートを解析する
	 */
	function parseTpl(src, _this, _topThis, callback){
		callback = callback||function(){};
		if(src !== null){
			src = JSON.parse( JSON.stringify( src ) );
			_this.template = src;
		}
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
				_this.thumb = 'data:image/png;base64,'+php.base64_encode( fs.readFileSync( _this.path+'/thumb.png' ) );
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
						if (error){
							// console.log(error);
						}
					});
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

			for( var tmpFieldName in _this.fields ){
				if( _this.fields[tmpFieldName].fieldType == 'loop' ){
					if( typeof(_this.subModule) !== typeof({}) ){
						_this.subModule = {};
					}
					_topThis.subModule[tmpFieldName] = broccoli.createModuleInstance( _this.id, {
						"src": null,
						"subModName": tmpFieldName,
						"topThis":_topThis
					} ).init(function(){});
				}
			}

		}else{
			while( 1 ){
				if( !src.match(new RegExp('^((?:.|\r|\n)*?)\\{\\&((?:.|\r|\n)*?)\\&\\}((?:.|\r|\n)*)$') ) ){
					break;
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
				}else if( field.module ){
					_this.fields[field.module.name] = field.module;
					_this.fields[field.module.name].fieldType = 'module';
				}else if( field.loop ){
					_this.fields[field.loop.name] = field.loop;
					_this.fields[field.loop.name].fieldType = 'loop';
					var tmpSearchResult = searchEndTag( src, 'loop' );
					if( typeof(_this.subModule) !== typeof({}) ){
						_this.subModule = {};
					}
					_topThis.subModule[field.loop.name] = broccoli.createModuleInstance( _this.id, {
						"src": tmpSearchResult.content,
						"subModName": field.loop.name,
						"topThis":_topThis
					}).init(function(){});
					src = tmpSearchResult.nextSrc;
				}else if( field == 'endloop' ){
					// ループ構造の閉じタグ
					// 本来ここは通らないはず。
					// ここを通る場合は、対応する開始タグがない endloop がある場合。
				}else if( field.if ){
					// _this.fields[field.if.name] = field.if;
					// _this.fields[field.if.name].fieldType = 'if';
					// var tmpSearchResult = searchEndTag( src, 'if' );
					// if( typeof(_this.subModule) !== typeof({}) ){
					// 	_this.subModule = {};
					// }
					// _topThis.subModule[field.if.name] = broccoli.createModuleInstance( _this.id, {
					// 	"src": tmpSearchResult.content,
					// 	"subModName": field.if.name,
					// 	"topThis":_topThis
					// }).init(function(){});
					// src = tmpSearchResult.nextSrc;
				}else if( field == 'endif' ){
					// 分岐構造の閉じタグ
					// 本来ここは通らないはず。
					// ここを通る場合は、対応する開始タグがない endloop がある場合。
				}else if( field.echo ){
					// _this.fields[field.echo.name] = field.echo;
					// _this.fields[field.echo.name].fieldType = 'echo';
				}
			}
		}
		// console.log(_this.fields);
		callback(true);
	} // parseTpl()

	/**
	 * 初期化する
	 * @param  {Function} callback callback function.
	 * @return {Object}            this.
	 */
	this.init = function(callback){
		setTimeout(function(){
			callback = callback || function(){};
			if( realpath === false ){
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
