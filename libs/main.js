/**
 * broccoli.js
 */
module.exports = function(){
	delete(require.cache[require('path').resolve(__filename)]);

	var _allModuleList, //キャッシュ
		_moduleCollection = {},
		_moduleInternalIdMap = {};
	;

	var _this = this;
	var path = require('path');
	var it79 = require('iterate79');
	var utils79 = require('utils79');
	var fs = require('fs');
	var _ = require('underscore');
	var Promise = require('es6-promise').Promise;
	var LangBank = require('langbank');
	var errors = [];
	this.lb = {};

	function loadFieldDefinition(){
		function loadFieldDefinition(fieldId, mod){
			var rtn = _.defaults( new (mod)(_this), _this.fieldBase );
			rtn.__fieldId__ = fieldId;
			return rtn;
		}
		_this.fieldDefinitions.href = loadFieldDefinition('href', require('../fields/server/app.fields.href.js'));
		_this.fieldDefinitions.html = loadFieldDefinition('html', require('../fields/server/app.fields.html.js'));
		_this.fieldDefinitions.html_attr_text = loadFieldDefinition('html_attr_text', require('../fields/server/app.fields.html_attr_text.js'));
		_this.fieldDefinitions.image = loadFieldDefinition('image', require('../fields/server/app.fields.image.js'));
		_this.fieldDefinitions.file = loadFieldDefinition('file', require('../fields/server/app.fields.file.js'));
		_this.fieldDefinitions.markdown = loadFieldDefinition('markdown', require('../fields/server/app.fields.markdown.js'));
		_this.fieldDefinitions.multitext = loadFieldDefinition('multitext', require('../fields/server/app.fields.multitext.js'));
		_this.fieldDefinitions.script = loadFieldDefinition('script', require('../fields/server/app.fields.script.js'));
		_this.fieldDefinitions.select = loadFieldDefinition('select', require('../fields/server/app.fields.select.js'));
		_this.fieldDefinitions.text = loadFieldDefinition('text', require('../fields/server/app.fields.text.js'));
		_this.fieldDefinitions.color = loadFieldDefinition('color', require('../fields/server/app.fields.color.js'));
		_this.fieldDefinitions.datetime = loadFieldDefinition('datetime', require('../fields/server/app.fields.datetime.js'));

		if( _this.options.customFields ){
			for( var idx in _this.options.customFields ){
				try{
					_this.fieldDefinitions[idx] = loadFieldDefinition( idx, _this.options.customFields[idx] );
				}catch(e){
					console.error(e);
				}
			}
		}

		return true;
	}

	/**
	 * 初期化
	 * @param  {Object} options    options
	 * @param  {Function} callback callback function.
	 * @return {Object}            this
	 */
	this.init = function(options, callback){
		options = options || {};
		options.appMode = options.appMode || 'web'; // web | desktop
		options.paths_module_template = options.paths_module_template || {};
		options.documentRoot = options.documentRoot || '.'; // current directory.
		options.pathHtml = options.pathHtml || null;
		options.pathResourceDir = options.pathResourceDir || null;
		options.realpathDataDir = options.realpathDataDir || null;
		options.bindTemplate = options.bindTemplate || function(htmls, callback){
			var fin = ''; for(var i in htmls){ fin += htmls[i]; } callback(fin);
		};
		options.log = options.log || function(msg){
			console.error(msg);
		};
		options.userStorage = options.userStorage || null;
		if( !options.pathHtml || !options.pathResourceDir || !options.realpathDataDir ){
			// 必須項目
			console.error('[ERROR] options.pathHtml, options.pathResourceDir, and options.realpathDataDir are required.');
			return;
		}

		for( var i in options.paths_module_template ){
			options.paths_module_template[i] = path.resolve( options.documentRoot, utils79.normalize_path( options.paths_module_template[i] ) )+'/';
		}

		options.pathHtml = utils79.normalize_path( path.resolve(options.pathHtml) );
		options.pathResourceDir = utils79.normalize_path( path.resolve(options.pathResourceDir) );

		options.fieldConfig = options.fieldConfig || {};
		options.extra = options.extra || {};

		this.paths_module_template = options.paths_module_template;
		this.realpathHtml = path.resolve( options.documentRoot, './'+options.pathHtml );
		this.realpathResourceDir = path.resolve( options.documentRoot, './'+options.pathResourceDir )+'/';
		this.realpathDataDir = path.resolve( options.realpathDataDir )+'/';
		this.options = options;

		this.resourceMgr = new (require('./resourceMgr.js'))(this);
		this.userStorage = new (require('./userStorage.js'))(this);
		this.fieldBase = new (require('./fieldBase.js'))(this);
		this.fieldDefinitions = {};

		it79.fnc({},
			[
				function(it1, data){
					_this.lb = new LangBank(__dirname+'/../data/language.csv', function(){
						// _this.lb.setLang( 'ja' ); // <- 言語設定はクライアントからオプションで投げられるので、 gpi がセットし直します。
						it1.next(data);
					});
				} ,
				function(it1, data){
					_this.resourceMgr.init( function(){
						it1.next(data);
					} );
				} ,
				function(it1, data){
					loadFieldDefinition();
					it1.next(data);
				} ,
				function(it1, data){
					callback();
					it1.next(data);
				}
			]
		);
		return this;
	}

	/**
	 * 汎用API
	 *
	 * @param  {String}   api      呼び出すAPIの種類
	 * @param  {Object}   options  オプション
	 * @param  {Function} callback コールバック関数
	 * @return {Mixed}             実行したAPIの返却値
	 */
	this.gpi = function(api, options, callback){
		var gpi = require( __dirname+'/gpi.js' );
		gpi(
			this,
			api,
			options,
			function(rtn){
				callback(rtn);
			}
		);
		return this;
	}

	/**
	 * アプリケーションの実行モード設定を取得する (同期)
	 * @return string 'web'|'desktop'
	 */
	this.getAppMode = function(){
		var rtn = this.options.appMode;
		switch(rtn){
			case 'web':
			case 'desktop':
				break;
			default:
				rtn = 'web';
				break;
		}
		return rtn;
	}

	/**
	 * フィールド設定を取得する (同期)
	 * @return object フィールド設定
	 */
	this.getFieldConfig = function(){
		var rtn = this.options.fieldConfig;
		return rtn;
	}

	/**
	 * extraデータを取得する
	 * @return mixed extraデータ
	 */
	this.getExtraData = function(){
		var $rtn = this.options.extra || null;
		return $rtn;
	}

	/**
	 * field定義を取得する
	 * @param  {String} fieldType フィールドの種類(text, html, markdown, multitext, etc...)
	 * @return {Object}           inputフィールドの定義オブジェクト
	 */
	this.getFieldDefinition = function(fieldType){
		var fieldDefinition = this.fieldDefinitions[fieldType];
		if( this.fieldDefinitions[fieldType] ){
			// 定義済みのフィールドを返す
			fieldDefinition = this.fieldDefinitions[fieldType];
		}else{
			// 定義がない場合は、デフォルトのfield定義を返す
			fieldDefinition = this.fieldBase;
		}
		return fieldDefinition;
	}

	/**
	 * モジュールIDを分解する。
	 * @param  {String} moduleId モジュールID
	 * @return {Object}          分解された情報を格納するオブジェクト、分解に失敗した場合はfalseを返します。
	 */
	this.parseModuleId = require('./fncs/parseModuleId.js');

	/**
	 * インスタンスパスの末尾の連番を1つ進める
	 */
	this.incrementInstancePath = require('./fncs/incrementInstancePath.js');

	/**
	 * モジュールの絶対パスを取得する。
	 * @param  {String} moduleId モジュールID
	 * @return {String}          モジュールの絶対パス
	 */
	this.getModuleRealpath = function(moduleId){
		var parsedModuleId = this.parseModuleId(moduleId);
		if(parsedModuleId === false){
			return false;
		}
		if(!this.paths_module_template[parsedModuleId.package]){
			return false;
		}
		var realpath = path.resolve(this.paths_module_template[parsedModuleId.package]);
		if( !fs.existsSync(realpath) || !fs.statSync(realpath).isDirectory() ){
			return false;
		}
		var realpath = path.resolve(
			realpath,
			parsedModuleId.category,
			parsedModuleId.module
		);
		if( !fs.existsSync(realpath) || !fs.statSync(realpath).isDirectory() ){
			return false;
		}

		return realpath+'/';
	}

	/**
	 * システムテンプレートかどうか判断する
	 * @param  {String}  moduleId モジュールID
	 * @return {Boolean}          システムテンプレートであれば true, 違えば false
	 */
	this.isSystemMod = function( moduleId ){
		if(typeof(moduleId) != typeof('')){
			return false;
		}
		if( !moduleId.match(new RegExp('^_sys\\/')) ){
			return false;
		}
		return true;
	}

	/**
	 * パッケージの一覧を取得する
	 * @param  {Function} callback callback function.
	 * @return {Object}            this
	 */
	this.getPackageList = function(callback){
		require( './getPackageList.js' )(this, callback);
		return this;
	}

	/**
	 * モジュール一覧を取得する
	 * @param  {String}   packageId package ID
	 * @param  {Function} callback  callback function.
	 * @return {Object}             this
	 */
	this.getModuleListByPackageId = function(packageId, callback){
		require( './getModuleListByPackageId.js' )(this, packageId, function(result){
			callback(result);
		});
		return this;
	}

	/**
	 * enabledParents または enabledChildren を正規化する
	 * @param {*} enabledParentsOrChildren
	 * @param {*} currentModuleId
	 */
	this.normalizeEnabledParentsOrChildren = function(enabledParentsOrChildren, currentModuleId){
		enabledParentsOrChildren = enabledParentsOrChildren || [];
		if(typeof(enabledParentsOrChildren) == typeof('')){
			enabledParentsOrChildren = [enabledParentsOrChildren];
		}
		for( var idx in enabledParentsOrChildren ){
			enabledParentsOrChildren[idx] = this.completeModuleId( enabledParentsOrChildren[idx], currentModuleId );
		}
		return enabledParentsOrChildren;
	}

	/**
	 * モジュールIDを補完して完成させる
	 * @param {*} targetModuleId
	 * @param {*} currentModuleId
	 */
	this.completeModuleId = function(targetModuleId, currentModuleId){
		currentModuleId = currentModuleId || '';
		currentModuleId.match(/^([\s\S]+)\:([\s\S]+)\/([\s\S]+?)$/);
		var pkgName = RegExp.$1;
		var catName = RegExp.$2;
		var mogName = RegExp.$3;
		if(targetModuleId.match(/^_sys\//)){
			// システムフィールドはそのまま
			return targetModuleId;
		}
		if(!targetModuleId.match(/^[\S]+\:/)){
			targetModuleId = pkgName+':'+targetModuleId;
			return targetModuleId;
		}
		return targetModuleId;
	}


	/**
	 * モジュールの内部IDを補完して完成させる
	 */
	this.getModuleInternalId = function($targetModuleId, $internalIdTemplate){
		var $internalId = $targetModuleId;

		var $tmpParsedModuleInternalIdBefore = this.parseModuleId($targetModuleId);
		var $tmpParsedModuleInternalIdAfter = this.parseModuleId($internalIdTemplate);
		if( typeof($tmpParsedModuleInternalIdAfter['package']) == typeof('') && $tmpParsedModuleInternalIdAfter['package'].length ){
			$tmpParsedModuleInternalIdBefore['package'] = $tmpParsedModuleInternalIdAfter['package'];
		}
		if( typeof($tmpParsedModuleInternalIdAfter['category']) == typeof('') && $tmpParsedModuleInternalIdAfter['category'].length ){
			$tmpParsedModuleInternalIdBefore['category'] = $tmpParsedModuleInternalIdAfter['category'];
		}
		if( typeof($tmpParsedModuleInternalIdAfter['module']) == typeof('') && $tmpParsedModuleInternalIdAfter['module'].length ){
			$tmpParsedModuleInternalIdBefore['module'] = $tmpParsedModuleInternalIdAfter['module'];
		}
		$internalId = $tmpParsedModuleInternalIdBefore['package']+':'+$tmpParsedModuleInternalIdBefore['category']+'/'+$tmpParsedModuleInternalIdBefore['module'];

		return $internalId;
	}

	/**
	 * 全モジュールの一覧を取得する
	 * @param  {Function} callback  callback function.
	 * @return {Object}             this
	 */
	this.getAllModuleList = function(callback){
		if(_allModuleList){
			// キャッシュがあればそれを返す
			callback(_allModuleList);
			return;
		}
		require( './getAllModuleList.js' )(this, function(result){
			_allModuleList = result;
			for(var idx in _allModuleList){
				_moduleInternalIdMap[_allModuleList[idx].internalId] = idx;
			}
			callback(result);
		});
		return this;
	}

	/**
	 * class: モジュール
	 * @param  {String}   moduleId モジュールID
	 * @param  {Object}   options  Options
	 * @return {Object}            this
	 */
	this.createModuleInstance = function(moduleId, options){
		var classModule = require( './classModule.js' );
		var rtn = new classModule(this, moduleId, options);
		return rtn;
	}

	/**
	 * モジュールオブジェクトを取得する
	 * @param  {String}   moduleId モジュールID
	 * @param  {String}   subModName サブモジュール名
	 * @param  {Function} callback  callback function.
	 * @return {Void}            Void
	 */
	this.getModule = function(moduleId, subModName, callback){
		if( !moduleId.length ){
			callback(false);
			return;
		}
		var rtn = _moduleCollection[moduleId];
		if( rtn === false ){
			// 過去に生成を試みて、falseになっていた場合
			new Promise(function(rlv){rlv();})
				.then(function(){ return new Promise(function(rlv, rjt){
					callback(false);
				}); })
			;
			return;
		}
		if( rtn === undefined ){
			var mod = _this.createModuleInstance(moduleId);
			_moduleCollection[moduleId] = mod;
			if( _moduleCollection[moduleId] === false ){
				// falseの場合、該当するモジュールが定義されていない。
				// 結果を記憶して、falseを返す。
				new Promise(function(rlv){rlv();})
					.then(function(){ return new Promise(function(rlv, rjt){
						callback(false);
					}); })
				;
				return;
			}

			_moduleCollection[moduleId].init(function(){
				var rtn = _moduleCollection[moduleId];
				_moduleInternalIdMap[_moduleCollection[moduleId].internalId] = moduleId;
				if( typeof(subModName) === typeof('') ){
					callback(rtn.subModule[subModName]);
					return;
				}
				callback(rtn);
				return;
			});
			return;
		}
		if( typeof(subModName) === typeof('') ){
			if( !rtn.subModule || !rtn.subModule[subModName] ){
				console.error('Undefined subModule "'+subModName+'" was called.');
				new Promise(function(rlv){rlv();})
					.then(function(){ return new Promise(function(rlv, rjt){
						callback(false);
					}); })
				;
				return;
			}
			new Promise(function(rlv){rlv();})
				.then(function(){ return new Promise(function(rlv, rjt){
					callback(rtn.subModule[subModName]);
				}); })
			;
			return;
		}
		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				callback(rtn);
			}); })
		;
		return;
	}

	/**
	 * internalIdから、モジュールオブジェクトを取得する
	 * @param  {String}   moduleInternalId モジュール内部ID
	 * @param  {String}   subModName サブモジュール名
	 * @param  {Function} callback  callback function.
	 * @return {Void}            Void
	 */
	this.getModuleByInternalId = function(moduleInternalId, subModName, callback){
		callback = callback || function(){};
		var moduleId = null;
		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				if( typeof(_moduleInternalIdMap[moduleInternalId]) === typeof('') ){
					// キャッシュ済みならそれを返す。
					moduleId = _moduleInternalIdMap[moduleInternalId];
					rlv();
					return;
				}else{
					//キャッシュされていなければ全量を生成する。
					_this.getAllModuleList(function(){
						if( typeof(_moduleInternalIdMap[moduleInternalId]) === typeof('') ){
							// 生成したなかにあれば返す。
							moduleId = _moduleInternalIdMap[moduleInternalId];
						}else{
							// なければ、結果 false を記録して false を返す。
							_moduleInternalIdMap[moduleInternalId] = false;
							callback(false);
							return;
						}
						rlv();
					});
					return;
				}
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				_this.getModule(moduleId, subModName, function(rtn){
					callback(rtn);
				});
			}); })
		;
		return;
	}

	/**
	 * マークダウン処理
	 */
	this.markdown = function(md, options, callback){
		callback = callback||function(){};
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

		if(typeof(md)===typeof('')){
			md = marked.parse(md);
		}
		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				callback(md);
			}); })
		;
		return;
	}

	/**
	 * HTMLをビルドする
	 * ビルドしたHTMLは、callback() に文字列として渡されます。
	 * realpathに指定したファイルは自動的に上書きされません。
	 *
	 * @param  {Object}   data     コンテンツデータ
	 * @param  {Object}   options  オプション
	 *                             - options.mode = ビルドモード(finalize=製品版ビルド, canvas=編集画面用ビルド)
	 *                             - options.instancePath = インスタンスパス
	 * @param  {Function} callback callback function.
	 * @return {Object}            this
	 */
	this.buildBowl = function( data, options, callback ){
		var buildBowl = require( __dirname+'/buildBowl.js' );
		new buildBowl(_this, data, options, callback);
		return this;
	}

	/**
	 * HTMLをすべてビルドする
	 * ビルドしたHTMLは、callback() に文字列として渡されます。
	 * realpathに指定したファイルは自動的に上書きされません。
	 *
	 * @param  {Object}   options  オプション
	 *                             - options.mode = ビルドモード(finalize=製品版ビルド, canvas=編集画面用ビルド)
	 *                             - options.bowlList = ボウル名の一覧。data.jsonに含まれていないbowlがある場合、空白の領域としてあわせてビルドされる。
	 * @param  {Function} callback callback function.
	 * @return {Object}            this
	 */
	this.buildHtml = function( options, callback ){
		var dataJson = fs.readFileSync(this.realpathDataDir+'/data.json');
		try {
			dataJson = JSON.parse( dataJson );
		} catch (e) {
			console.error('ERROR: Failed to parse data.json.', this.realpathDataDir+'/data.json');
			this.log('ERROR: Failed to parse data.json. '+this.realpathDataDir+'/data.json');
			dataJson = {};
		}
		dataJson.bowl = dataJson.bowl||{};
		options.bowlList = options.bowlList||[];
		if( options.bowlList.length ){
			for( var idx in options.bowlList ){
				dataJson.bowl[options.bowlList[idx]] = dataJson.bowl[options.bowlList[idx]]||{
					"modId": "_sys/root",
					"fields": {
						"main": []
					}
				};
			}
		}

		var htmls = {};
		it79.ary(
			dataJson.bowl,
			function(it1, row, idx){
				options.instancePath = '/bowl.'+idx;
				_this.buildBowl(row, options, function(html){
					htmls[idx] = html;
					it1.next();
				});
			},
			function(){
				callback(htmls);
			}
		);
		return this;
	}

	/**
	 * コンテンツをビルドし、更新する
	 *
	 * ビルドしたHTMLは、`pathHtml` のファイルに上書き保存されます。
	 * リソースも合わせて処理されます。
	 *
	 * @param  {Function} callback callback function.
	 * @return {Object}            this
	 */
	this.updateContents = function( callback ){
		callback = callback || function(){};
		var broccoli = this;
		broccoli.resourceMgr.getResourceDb(
			function(resourceDb){
				broccoli.resourceMgr.save(
					resourceDb ,
					function(result){
						broccoli.buildHtml(
							{
								'mode': 'finalize'
							},
							function(htmls){
								broccoli.options.bindTemplate(htmls, function(fin){
									fs.writeFile(
										broccoli.realpathHtml ,
										fin ,
										function(){
											callback(true);
										}
									);
								});
							}
						);
					}
				);
			}
		);
		return this;
	}

	/**
	 * モジュールのCSSをビルドする
	 */
	this.buildModuleCss = function( callback ){
		var bMR = require( __dirname+'/buildModuleResources.js' );
		var builder = new bMR( _this );
		builder.buildCss(callback);
		return this;
	}

	/**
	 * モジュールのJavaScriptをビルドする
	 */
	this.buildModuleJs = function( callback ){
		var bMR = require( __dirname+'/buildModuleResources.js' );
		var builder = new bMR( _this );
		builder.buildJs(callback);
		return this;
	}

	/**
	 * ログファイルにメッセージを出力する
	 */
	this.log = function(msg){
		this.options.log(msg);
		return;
	}

	/**
	 * エラーメッセージをブラウザへ送信する
	 */
	this.error = function(msg){
		errors.push(msg);
		console.error(msg);
		this.log(msg);
		return;
	}

	/**
	 * 記録されたエラーメッセージを取得する
	 */
	this.get_errors = function(){
		return errors;
	}

}
