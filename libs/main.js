/**
 * broccoli.js
 */
module.exports = function(paths_module_template, options){
	var _this = this;
	var path = require('path');
	options = options || {};
	options.cd = options.cd || '.';

	for( var i in paths_module_template ){
		paths_module_template[i] = path.resolve( options.cd, paths_module_template[i] )+'/';
	}

	this.paths_module_template = paths_module_template;
	this.options = options;

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

}
