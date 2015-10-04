/**
 * broccoli.js
 */
module.exports = function(paths_module_template, options){
	// if(!window){delete(require.cache[require('path').resolve(__filename)]);}

	var _this = this;
	var path = require('path');
	var fs = require('fs');
	var _ = require('underscore');
	paths_module_template = paths_module_template || {};
	options = options || {};
	options.cd = options.cd || '.';

	for( var i in paths_module_template ){
		paths_module_template[i] = path.resolve( options.cd, paths_module_template[i] )+'/';
	}

	this.paths_module_template = paths_module_template;
	this.options = options;

	this.resourceMgr = new (require('./resourceMgr.js'))(this);
	this.fieldBase = new (require('./fieldBase.js'))(this);
	this.fieldDefinitions = {};
	function loadFieldDefinition(){
		function loadFieldDefinition(mod){
			return _.defaults( new (mod)(_this), _this.fieldBase );
		}
		_this.fieldDefinitions.href = loadFieldDefinition(require(__dirname+'/fields/app.fields.href.js'));
		_this.fieldDefinitions.html = loadFieldDefinition(require(__dirname+'/fields/app.fields.html.js'));
		_this.fieldDefinitions.html_attr_text = loadFieldDefinition(require(__dirname+'/fields/app.fields.html_attr_text.js'));
		_this.fieldDefinitions.image = loadFieldDefinition(require(__dirname+'/fields/app.fields.image.js'));
		_this.fieldDefinitions.markdown = loadFieldDefinition(require(__dirname+'/fields/app.fields.markdown.js'));
		_this.fieldDefinitions.multitext = loadFieldDefinition(require(__dirname+'/fields/app.fields.multitext.js'));
		_this.fieldDefinitions.select = loadFieldDefinition(require(__dirname+'/fields/app.fields.select.js'));
		_this.fieldDefinitions.table = loadFieldDefinition(require(__dirname+'/fields/app.fields.table.js'));
		_this.fieldDefinitions.text = loadFieldDefinition(require(__dirname+'/fields/app.fields.text.js'));
		_this.fieldDefinitions.wysiwyg_rte = loadFieldDefinition(require(__dirname+'/fields/app.fields.wysiwyg_rte.js'));
		_this.fieldDefinitions.wysiwyg_tinymce = loadFieldDefinition(require(__dirname+'/fields/app.fields.wysiwyg_tinymce.js'));

		return true;
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
		require( './getModuleListByPackageId.js' )(this, packageId, callback);
		return this;
	}

	/**
	 * class: モジュール
	 * @param  {String}   moduleId モジュールID
	 * @param  {Object}   options  Options
	 * @param  {Function} callback callback function.
	 * @return {Object}            this
	 */
	this.createModuleInstance = function(moduleId, options, callback){
		var classModule = require( './classModule.js' );
		var rtn = new classModule(this, moduleId, options, callback);
		return rtn;
	}

	/**
	 * HTMLをビルドする
	 * @param  {Object}   data     コンテンツデータ
	 * @param  {Object}   options  オプション
	 *                             - options.mode = ビルドモード(finalize=製品版ビルド, canvas=編集画面用ビルド)
	 *                             - options.realpath = HTMLの出力先
	 *                             - options.realpathJson = data.jsonの保存先
	 *                             - options.resourceDir = リソースディレクトリのパス
	 *                             - options.resourceDist = リソース出力先ディレクトリのパス
	 * @param  {Function} callback callback function.
	 * @return {Object}            this
	 */
	this.buildHtml = function( data, options, callback ){
		this.resourceMgr.init( options.realpath, options.realpathJson, options.resourceDir, options.resourceDist, function(){
			loadFieldDefinition();
			require( __dirname+'/buildHtml.js' )(_this, data, options, callback);
		} );
		return this;
	}

	/**
	 * モジュールパレットを描画する
	 * @param  {Object}   moduleList モジュール一覧。
	 * @param  {Object}   targetElm  描画対象のHTML要素
	 * @param  {Function} callback   callback function.
	 * @return {Object}              this.
	 */
	this.drawModulePalette = function(moduleList, targetElm, callback){
		require( './drawModulePalette.js' )(_this, moduleList, targetElm, callback);
		return this;
	}

	/**
	 * 編集用UI(Panels)を描画する
	 * @param  {Object}   data       フィールドデータ
	 * @param  {Object}   moduleList モジュール一覧。
	 * @param  {Object}   targetElm  描画対象のHTML要素
	 * @param  {Function} callback   callback function.
	 * @return {Object}              this.
	 */
	this.drawPanels = function(data, moduleList, targetElm, callback){
		require( './drawPanels.js' )(_this, data, moduleList, targetElm, callback);
		return this;
	}

}
