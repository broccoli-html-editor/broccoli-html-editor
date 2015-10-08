/**
 * broccoli-client.js
 */
module.exports = function(){
	// if(!window){delete(require.cache[require('path').resolve(__filename)]);}

	var _this = this;
	var it79 = require('iterate79');
	var _ = require('underscore');
	var $ = require('jquery');
	var selectedInstance = null;
	var $canvas;

	/**
	 * broccoli-client を初期化する
	 * @param  {Object}   options  options.
	 * @param  {Function} callback callback function.
	 * @return {Object}            this.
	 */
	this.init = function(options, callback){
		options = options || {};
		options.elmCanvas = options.elmCanvas || document.createElement('div');
		options.elmPanels = document.createElement('div');
		options.elmModulePalette = options.elmModulePalette || document.createElement('div');
		options.contents_area_selector = options.contents_area_selector || '.contents';
		options.contents_bowl_name_by = options.contents_bowl_name_by || 'id';
		options.gpiBridge = options.gpiBridge || function(){};
		this.options = options;

		$canvas = $(options.elmCanvas);
		$canvas
			.addClass('broccoli')
			.addClass('broccoli--canvas')
			.append( $('<iframe>')
				.bind('load', function(){
					_this.onPreviewLoad( callback );
				})
			)
			.append( $('<div class="broccoli--panels">')
			)
		;
		this.options.elmIframeWindow = $canvas.find('iframe').get(0).contentWindow;
		this.options.elmPanels = $canvas.find('.broccoli--panels').get(0);

		this.panels = new (require( './panels.js' ))(this);
		this.editWindow = new (require( './editWindow.js' ))(this);
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
					// 編集画面描画ロード
					$canvas.find('iframe')
						.attr({
							'src': $canvas.attr('data-broccoli-preview')
						})
					;
					it1.next(data);

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
	 * プレビューがロードされたら実行
	 * @return {[type]} [description]
	 */
	this.onPreviewLoad = function( callback ){
		callback = callback || function(){};

		it79.fnc(
			{},
			[
				function( it1, data ){
					// 編集画面描画
					_this.options.elmIframeWindow = $canvas.find('iframe').get(0).contentWindow;
					it1.next(data);
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
		this.selectInstance(instancePath);
		console.log("Edit: "+instancePath);
		$canvas.find('.broccoli--editwindow').remove();
		$canvas
			.append( $('<div class="broccoli--edit-window">')
				.append( $('<div class="broccoli--edit-window-inner">')
				)
			)
		;
		this.drawEditWindow( instancePath, $canvas.find('.broccoli--edit-window-inner').get(0), function(){
			$canvas.find('.broccoli--edit-window').remove();
			console.log('editInstance done.');
		} );
		return this;
	}

	/**
	 * インスタンスを選択する
	 */
	this.selectInstance = function( instancePath, callback ){
		console.log("Select: "+instancePath);
		callback = callback || function(){};
		this.unselectInstance();//一旦選択解除
		this.unfocusInstance();//フォーカスも解除
		selectedInstance = instancePath;
		this.panels.selectInstance(instancePath, function(){
			// _this.updateInstancePathView();
			callback();
		});
		return this;
	}

	/**
	 * モジュールインスタンスの選択状態を解除する
	 */
	this.unselectInstance = function(callback){
		callback = callback || function(){};
		selectedInstance = null;
		this.panels.unselectInstance(function(){
			// _this.updateInstancePathView();
			callback();
		});
		return this;
	}

	/**
	 * モジュールインスタンスにフォーカスする
	 * フォーカス状態の囲みで表現され、画面に収まるようにスクロールする
	 */
	this.focusInstance = function( instancePath, callback ){
		callback = callback || function(){};
		this.unfocusInstance();//一旦選択解除
		this.panels.focusInstance(instancePath, function(){
			callback();
		});
		return this;

	}

	/**
	 * モジュールインスタンスのフォーカス状態を解除する
	 */
	this.unfocusInstance = function(callback){
		callback = callback || function(){};
		selectedInstance = null;
		this.panels.unfocusInstance(function(){
			callback();
		});
		return this;
	}

	/**
	 * 選択されたインスタンスのパスを取得する
	 */
	this.getSelectedInstance = function(){
		return selectedInstance;
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
		this.panels.init(callback);
		return this;
	}

	/**
	 * 編集ウィンドウを描画する
	 * @param  {Function} callback    callback function.
	 * @return {Object}               this.
	 */
	this.drawEditWindow = function(instancePath, elmEditWindow, callback){
		this.editWindow.init(instancePath, elmEditWindow, callback);
		return this;
	}

}
