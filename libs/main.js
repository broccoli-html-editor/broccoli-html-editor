/**
 * broccoli.js
 */
module.exports = function(){
	delete(require.cache[require('path').resolve(__filename)]);

	var _allModuleList, //キャッシュ
		_moduleCollection = {};
	;

	var _this = this;
	var path = require('path');
	var it79 = require('iterate79');
	var fs = require('fs');
	var _ = require('underscore');

	function loadFieldDefinition(){
		function loadFieldDefinition(fieldId, mod){
			var rtn = _.defaults( new (mod)(_this), _this.fieldBase );
			rtn.__fieldId__ = fieldId;
			return rtn;
		}
		_this.fieldDefinitions.href = loadFieldDefinition('href', require('./fields/app.fields.href.js'));
		_this.fieldDefinitions.html = loadFieldDefinition('html', require('./fields/app.fields.html.js'));
		_this.fieldDefinitions.html_attr_text = loadFieldDefinition('html_attr_text', require('./fields/app.fields.html_attr_text.js'));
		_this.fieldDefinitions.image = loadFieldDefinition('image', require('./fields/app.fields.image.js'));
		_this.fieldDefinitions.markdown = loadFieldDefinition('markdown', require('./fields/app.fields.markdown.js'));
		_this.fieldDefinitions.multitext = loadFieldDefinition('multitext', require('./fields/app.fields.multitext.js'));
		_this.fieldDefinitions.select = loadFieldDefinition('select', require('./fields/app.fields.select.js'));
		_this.fieldDefinitions.table = loadFieldDefinition('table', require('./fields/app.fields.table.js'));
		_this.fieldDefinitions.text = loadFieldDefinition('text', require('./fields/app.fields.text.js'));
		_this.fieldDefinitions.wysiwyg_rte = loadFieldDefinition('wysiwyg_rte', require('./fields/app.fields.wysiwyg_rte.js'));
		_this.fieldDefinitions.wysiwyg_tinymce = loadFieldDefinition('wysiwyg_tinymce', require('./fields/app.fields.wysiwyg_tinymce.js'));

		if( _this.options.customFields ){
			for( var idx in _this.options.customFields ){
				_this.fieldDefinitions[idx] = loadFieldDefinition( idx, _this.options.customFields[idx] );
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
		options.paths_module_template = options.paths_module_template || {};
		options.documentRoot = options.documentRoot || '.'; // current directory.
		options.pathHtml = options.pathHtml || null;
		options.pathResourceDir = options.pathResourceDir || null;
		options.realpathDataDir = options.realpathDataDir || null;
		options.bindTemplate = options.bindTemplate || function(htmls, callback){
			var fin = ''; for(var i in htmls){ fin += htmls[i]; } callback(fin);
		};
		if( !options.pathHtml || !options.pathResourceDir || !options.realpathDataDir ){
			// 必須項目
			// console.log(options);
			console.error('[ERROR] options.pathHtml, options.pathResourceDir, and options.realpathDataDir are required.');
			return;
		}

		for( var i in options.paths_module_template ){
			options.paths_module_template[i] = path.resolve( options.documentRoot, options.paths_module_template[i] )+'/';
		}

		this.paths_module_template = options.paths_module_template;
		this.realpathHtml = path.resolve( options.documentRoot, './'+options.pathHtml );
		this.realpathResourceDir = path.resolve( options.documentRoot, './'+options.pathResourceDir );
		this.realpathDataDir = path.resolve( options.realpathDataDir );
		this.options = options;

		this.resourceMgr = new (require('./resourceMgr.js'))(this);
		this.fieldBase = new (require('./fieldBase.js'))(this);
		this.fieldDefinitions = {};

		it79.fnc({},
			[
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
	 * @param  {[type]}   api      [description]
	 * @param  {[type]}   options  [description]
	 * @param  {Function} callback [description]
	 * @return {[type]}            [description]
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
	this.parseModuleId = function(moduleId){
		var rtn = {
			'package': false,
			'category': false,
			'module': false
		};
		if(typeof(moduleId) != typeof('')){
			return false;
		}
		if( !moduleId.match( new RegExp('^([0-9a-zA-Z\\_\\-]+?)\\:([^\\/\\:\\s]*)\\/([^\\/\\:\\s]*)$') ) ){
			return false;
		}
		rtn.package = RegExp.$1;
		rtn.category = RegExp.$2;
		rtn.module = RegExp.$3;
		return rtn;
	}

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
	 * 全モジュールの一覧を取得する
	 * @param  {Function} callback  callback function.
	 * @return {Object}             this
	 */
	this.getAllModuleList = function(callback){
		if(_allModuleList){
			// キャッシュがあればそれを返す
			setTimeout(function(){
				callback(_allModuleList);
			}, 0);
			return;
		}
		require( './getAllModuleList.js' )(this, function(result){
			_allModuleList = result;
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
		// console.log(moduleId);
		// console.log(options);
		var classModule = require( './classModule.js' );
		var rtn = new classModule(this, moduleId, options);
		// console.log(rtn);
		return rtn;
	}

	/**
	 * モジュールオブジェクトを取得する
	 * @param  {String}   moduleId モジュールID
	 * @param  {String}   subModName サブモジュール名
	 * @param  {Function} callback  callback function.
	 * @return {Object}            this
	 */
	this.getModule = function(moduleId, subModName, callback){
		var rtn = _moduleCollection[moduleId];
		if( rtn === false ){
			// 過去に生成を試みて、falseになっていた場合
			callback(false);
			return this;
		}
		if( rtn === undefined ){
			var mod = _this.createModuleInstance(moduleId);
			_moduleCollection[moduleId] = mod;
			if( _moduleCollection[moduleId] === false ){
				// falseの場合、該当するモジュールが定義されていない。
				// 結果を記憶して、falseを返す。
				callback(false);
				return this;
			}

			_moduleCollection[moduleId].init(function(){
				var rtn = _moduleCollection[moduleId];
				if( typeof(subModName) === typeof('') ){
					callback(rtn.subModule[subModName]);
					return;
				}
				callback(rtn);
				return;
			});
			return this;
		}
		if( typeof(subModName) === typeof('') ){
			callback(rtn.subModule[subModName]);
			return this;
		}
		callback(rtn);
		return this;
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
		buildBowl(_this, data, options, callback);
		return this;
	}

	/**
	 * HTMLをすべてビルドする
	 * ビルドしたHTMLは、callback() に文字列として渡されます。
	 * realpathに指定したファイルは自動的に上書きされません。
	 *
	 * @param  {Object}   options  オプション
	 *                             - options.mode = ビルドモード(finalize=製品版ビルド, canvas=編集画面用ビルド)
	 * @param  {Function} callback callback function.
	 * @return {Object}            this
	 */
	this.buildHtml = function( options, callback ){
		var dataJson = fs.readFileSync(this.realpathDataDir+'/data.json');
		dataJson = JSON.parse( dataJson );
		dataJson.bowl = dataJson.bowl||{};

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

}
