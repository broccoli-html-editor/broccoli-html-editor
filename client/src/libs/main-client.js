/**
 * broccoli-client.js
 */
module.exports = function(){
	// if(!window){delete(require.cache[require('path').resolve(__filename)]);}

	var _this = this;
	var it79 = require('iterate79');
	var _ = require('underscore');
	var $ = require('jquery');

	/**
	 * broccoli-client を初期化する
	 * @param  {Object}   options  options.
	 * @param  {Function} callback callback function.
	 * @return {Object}            this.
	 */
	this.init = function(options, callback){
		options = options || {};
		options.elmIframeWindow = options.elmIframeWindow || document.createElement('div');
		options.elmPanels = options.elmPanels || document.createElement('div');
		options.elmModulePalette = options.elmModulePalette || document.createElement('div');
		options.contents_area_selector = options.contents_area_selector || '.contents';
		options.contents_bowl_name_by = options.contents_bowl_name_by || 'id';
		options.gpiBridge = options.gpiBridge || function(){};
		this.options = options;

		this.fieldBase = new (require('./../../../libs/fieldBase.js'))(this);
		this.fieldDefinitions = {};
		function loadFieldDefinition(){
			function loadFieldDefinition(mod){
				return _.defaults( new (mod)(_this), _this.fieldBase );
			}
			_this.fieldDefinitions.href = loadFieldDefinition(require('./../../../libs/fields/app.fields.href.js'));
			_this.fieldDefinitions.html = loadFieldDefinition(require('./../../../libs/fields/app.fields.html.js'));
			_this.fieldDefinitions.html_attr_text = loadFieldDefinition(require('./../../../libs/fields/app.fields.html_attr_text.js'));
			_this.fieldDefinitions.image = loadFieldDefinition(require('./../../../libs/fields/app.fields.image.js'));
			_this.fieldDefinitions.markdown = loadFieldDefinition(require('./../../../libs/fields/app.fields.markdown.js'));
			_this.fieldDefinitions.multitext = loadFieldDefinition(require('./../../../libs/fields/app.fields.multitext.js'));
			_this.fieldDefinitions.select = loadFieldDefinition(require('./../../../libs/fields/app.fields.select.js'));
			_this.fieldDefinitions.table = loadFieldDefinition(require('./../../../libs/fields/app.fields.table.js'));
			_this.fieldDefinitions.text = loadFieldDefinition(require('./../../../libs/fields/app.fields.text.js'));
			_this.fieldDefinitions.wysiwyg_rte = loadFieldDefinition(require('./../../../libs/fields/app.fields.wysiwyg_rte.js'));
			_this.fieldDefinitions.wysiwyg_tinymce = loadFieldDefinition(require('./../../../libs/fields/app.fields.wysiwyg_tinymce.js'));

			return true;
		}
		loadFieldDefinition();

		it79.fnc(
			{},
			[
				function(it1, data){
					_this.contentsSourceData = new (require('./contentsSourceData.js'))(_this).init(
						function(){
							// _this.contentsSourceData.get();
							it1.next(data);
						}
					);
				} ,
				function(it1, data){
					_this.drawModulePalette(function(){
						console.log('broccoli: module palette standby.');
						it1.next(data);
					});
				} ,
				function( it1, data ){
					// 編集画面描画
					_this.gpi(
						'buildHtml',
						{},
						function(htmls){
							// console.log(htmls);
							var $iframeWindow = $(_this.options.elmIframeWindow.document);
							for(var idx in htmls){
								$iframeWindow.find('[data-contents='+idx+']').html(htmls[idx]);
							}

							console.log('broccoli: HTML standby.');
							it1.next(data);
						}
					);
				} ,
				function( it1, data ){
					// パネル描画
					_this.drawPanels( function(){
						console.log('broccoli: draggable panels standby.');
						it1.next(data);
					} );
				} ,
				function(it1, data){
					callback();
					it1.next();
				}
			]
		);
		return this;
	}


	/**
	 * GPIから値を得る
	 */
	this.gpi = function(api, options, callback){
		this.options.gpiBridge(api, options, callback);
		return this;
	}

	/**
	 * インスタンスを編集する
	 * @param  {[type]} instancePath [description]
	 * @return {[type]}              [description]
	 */
	this.editInstance = function( instancePath ){
		console.log("Edit: "+instancePath);
		// this.drawEditWindow();
		this.gpi(
			'getFieldData',
			{
				'instancePath': instancePath
			},
			function(data){
				console.log(data);
			}
		);
		return this;
	}

	/**
	 * インスタンスを選択する
	 * @param  {[type]} instancePath [description]
	 * @return {[type]}              [description]
	 */
	this.selectInstance = function( instancePath ){
		console.log("Select: "+instancePath);
		return this;
	}

	/**
	 * モジュールパレットを描画する
	 * @param  {Object}   moduleList モジュール一覧。
	 * @param  {Function} callback   callback function.
	 * @return {Object}              this.
	 */
	this.drawModulePalette = function(callback){
		require( './drawModulePalette.js' )(_this, callback);
		return this;
	}

	/**
	 * 編集用UI(Panels)を描画する
	 * @param  {Function} callback    callback function.
	 * @return {Object}               this.
	 */
	this.drawPanels = function(callback){
		require( './drawPanels.js' )(_this, callback);
		return this;
	}

	/**
	 * 編集ウィンドウを描画する
	 * @param  {Function} callback    callback function.
	 * @return {Object}               this.
	 */
	this.drawEditWindow = function(instancePath, elmEditWindow, callback){
		require( './drawEditWindow.js' )(_this, instancePath, elmEditWindow, callback);
		return this;
	}

}
