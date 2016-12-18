/**
 * fieldBase.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	this.__fieldId__ = null;
	var Promise = require('es6-promise').Promise;
	var _this = this;
	var $ = require('jquery');
	var utils79 = require('utils79');
	var editorLib = null;
	try {
		if(window.ace){
			editorLib = 'ace';
		}
	} catch (e) {
	}

	/**
	 * データをバインドする (Server Side)
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = '';
		try {
			rtn = utils79.toStr(fieldData);
		} catch (e) {
			rtn = '[error]'
		}
		if( mode == 'canvas' && !rtn.length ){
			rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;white-space:nowrap;">(ダブルクリックしてHTMLコードを編集してください)</span>';
		}

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback(rtn);
		}); });
		return this;
	}

	/**
	 * リソースを加工する (Server Side)
	 */
	this.resourceProcessor = function( path_orig, path_public, resInfo, callback ){
		// ↓デフォルトの処理。オリジナルファイルをそのまま公開パスへ複製する。
		var fsEx = require('fs-extra');
		fsEx.copy( path_orig, path_public, function(err){
			callback(true);
		} );
		return this;
	}

	/**
	 * GPI (Server Side)
	 */
	this.gpi = function(options, callback){
		callback = callback || function(){};
		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback(options);
		}); });
		return this;
	}

}
