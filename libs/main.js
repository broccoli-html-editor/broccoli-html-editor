/**
 * broccoli.js
 */
module.exports = function(paths_module_template, options){
	var _this = this;
	var path = require('path');
	var fs = require('fs');
	options = options || {};
	options.cd = options.cd || '.';

	for( var i in paths_module_template ){
		paths_module_template[i] = path.resolve( options.cd, paths_module_template[i] )+'/';
	}

	this.paths_module_template = paths_module_template;
	this.options = options;

	/**
	 * モジュールIDを分解する。
	 * @param  {String} moduleId モジュールID
	 * @return {Object}          分解された情報を格納するオブジェクト、分解に失敗した場合はfalseを返します
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
	 * @param  {String} moduleId モジュールID
	 * @return {Boolean}         システムテンプレートであれば true, 違えば false
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
		require( __dirname+'/getPackageList.js' )(this, callback);
		return this;
	}

	/**
	 * モジュール一覧を取得する
	 * @param  {String}   packageId package ID
	 * @param  {Function} callback  callback function.
	 * @return {Object}             this
	 */
	this.getModuleListByPackageId = function(packageId, callback){
		require( __dirname+'/getModuleListByPackageId.js' )(this, packageId, callback);
		return this;
	}

	/**
	 * class: モジュール
	 * @param  {String} moduleId モジュールID
	 * @param  {Object}   options Options
	 * @param  {Function} callback callback function.
	 * @return {Object}            this
	 */
	this.createModuleInstance = function(moduleId, options, callback){
		var classModule = require( __dirname+'/classModule.js' );
		var rtn = new classModule(this, moduleId, options, callback);
		return rtn;
	}

}
