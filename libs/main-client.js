/**
 * broccoli-client.js
 */
module.exports = function(options){
	// if(!window){delete(require.cache[require('path').resolve(__filename)]);}

	var _this = this;
	var _ = require('underscore');
	var $ = require('jquery');

	options = options || {};
	options.elmIframeWindow = options.elmIframeWindow || document.createElement('div');
	options.elmPanels = options.elmPanels || document.createElement('div');
	options.elmModulePalette = options.elmModulePalette || document.createElement('div');
	options.contents_area_selector = options.contents_area_selector || '.contents';
	options.contents_area_name_by = options.contents_area_name_by || 'id';

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
	 * @param  {Function} callback   callback function.
	 * @return {Object}              this.
	 */
	this.drawModulePalette = function(moduleList, callback){
		require( './drawModulePalette.js' )(_this, moduleList, callback);
		return this;
	}

	/**
	 * 編集用UI(Panels)を描画する
	 * @param  {Object}   options     オプション
	 *                                - options.edit = {Function} モジュールインスタンスの編集画面を開く
	 *                                - options.remove = {Function} モジュールインスタンスを削除する
	 *                                - options.drop = {Function} モジュールインスタンスに対するドラッグ＆ドロップ操作
	 * @param  {Function} callback    callback function.
	 * @return {Object}               this.
	 */
	this.drawPanels = function(options, callback){
		require( './drawPanels.js' )(_this, options, callback);
		return this;
	}

}
