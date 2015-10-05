/**
 * broccoli-client.js
 */
module.exports = function(options){
	// if(!window){delete(require.cache[require('path').resolve(__filename)]);}

	var _this = this;
	var path = require('path');
	var fs = require('fs');
	var _ = require('underscore');
	options = options || {};

	this.options = options;

	this.fieldBase = new (require('./fieldBase.js'))(this);
	this.fieldDefinitions = {};
	function loadFieldDefinition(){
		function loadFieldDefinition(mod){
			return _.defaults( new (mod)(_this), _this.fieldBase );
		}
		_this.fieldDefinitions.href = loadFieldDefinition(require('./fields/app.fields.href.js'));
		_this.fieldDefinitions.html = loadFieldDefinition(require('./fields/app.fields.html.js'));
		_this.fieldDefinitions.html_attr_text = loadFieldDefinition(require('./fields/app.fields.html_attr_text.js'));
		_this.fieldDefinitions.image = loadFieldDefinition(require('./fields/app.fields.image.js'));
		_this.fieldDefinitions.markdown = loadFieldDefinition(require('./fields/app.fields.markdown.js'));
		_this.fieldDefinitions.multitext = loadFieldDefinition(require('./fields/app.fields.multitext.js'));
		_this.fieldDefinitions.select = loadFieldDefinition(require('./fields/app.fields.select.js'));
		_this.fieldDefinitions.table = loadFieldDefinition(require('./fields/app.fields.table.js'));
		_this.fieldDefinitions.text = loadFieldDefinition(require('./fields/app.fields.text.js'));
		_this.fieldDefinitions.wysiwyg_rte = loadFieldDefinition(require('./fields/app.fields.wysiwyg_rte.js'));
		_this.fieldDefinitions.wysiwyg_tinymce = loadFieldDefinition(require('./fields/app.fields.wysiwyg_tinymce.js'));

		return true;
	}
	loadFieldDefinition();


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
	 * @param  {[type]}   panelsElm   描画対象のHTML要素
	 * @param  {[type]}   contentsElm canvasを展開済みのHTML要素(検索対象になります)
	 * @param  {[type]}   options     オプション
	 *                                - options.edit = {Function} モジュールインスタンスの編集画面を開く
	 *                                - options.remove = {Function} モジュールインスタンスを削除する
	 *                                - options.drop = {Function} モジュールインスタンスに対するドラッグ＆ドロップ操作
	 * @param  {Function} callback    callback function.
	 * @return {Object}               this.
	 */
	this.drawPanels = function(panelsElm, contentsElm, options, callback){
		require( './drawPanels.js' )(_this, panelsElm, contentsElm, options, callback);
		return this;
	}

}
