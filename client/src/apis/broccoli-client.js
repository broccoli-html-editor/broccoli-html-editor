/**
 * broccoli-client.js
 */
(function(module){
	var __dirname = (function() {
		if (document.currentScript) {
			return document.currentScript.src;
		} else {
			var scripts = document.getElementsByTagName('script'),
			script = scripts[scripts.length-1];
			if (script.src) {
				return script.src;
			}
		}
	})().replace(/\\/g, '/').replace(/\/[^\/]*\/?$/, '');

	module.exports = function(){
		var _this = this;
		var broccoli = this;
		var it79 = require('iterate79');
		var _ = require('underscore');
		var $ = require('jquery');
		var LangBank = require('langbank');
		this.lb = {};
		var selectedInstance = null;
		var selectedInstanceRegion = [];
		var $canvas;
		var serverConfig; // サーバー側から取得した設定情報
		this.__dirname = __dirname;
		var bootupInfomations;
		var uiState;
		var timer_redraw,
			timer_onPreviewLoad,
			onPreviewLoad_done = false;
		this.utils = new (require('./utils.js'))(_this);
		this.indicator = new (require('./indicator.js'))(_this);

		// リソースファイル(画像など)
		// NOTE: これ↓は、 base64に手動変換したファイルです。
		// NOTE: 本当は ./client/src/resources/ からバインドしたいものです。
		this.images = {
			"clip": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA4ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDE0IDc5LjE1Njc5NywgMjAxNC8wOC8yMC0wOTo1MzowMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowNjBmZmZiYy1jMzE1LTQwMjktYjQzMi1kMTI3YWU5NjFhY2MiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NDM4REMwN0U2MEU4MTFFNEIzRjQ4NDY0Q0I2RDk0NkIiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NDM4REMwN0Q2MEU4MTFFNEIzRjQ4NDY0Q0I2RDk0NkIiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoyNmQ2Mjg4OS03ZjVjLTQxMmEtOTE5NS0xNzFlM2UxYTY1ODEiIHN0UmVmOmRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo2YTY2OTliOC1hOTUyLTExNzctODA3NS1kODY0ZjVlNGViYjUiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4rskV/AAAAY1BMVEW/wcO4ury9v8G2uLq+wMK7vb+8vsDCxMa0trjDxcetr7G5u72wsrSvsbOytLa1t7iusLLExsiztbexs7W1t7mpqqysra/GyMqytLW6vL7ExsesrrDFx8mvsbLBw8XAwsQAAADeORbxAAAAIXRSTlP//////////////////////////////////////////wCfwdAhAAAApElEQVR42mTPWRbCIAwFUAbpBNS2zhN9+1+lSUEB5YOEy0kCAtUKbU+7KEkJgdDXeNsOYS5RNsBKsS9QW6CluN4zakmVbG3uSbbj2jXk6WycKrq4JDwmMwqYnxE7HWtNE2cxXkc0Ihm3ZPQOneV+HyN8HQDXkak4esOJdu8hzdcIBw7DtMRZCc8ps/nHAqdxS/YGBWJY2CQqxMON9Pwf/FtvAQYAY88qLM/CO3kAAAAASUVORK5CYII=",
			"module-default-icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDcuMS1jMDAwIDc5LjljY2M0ZGU5MywgMjAyMi8wMy8xNC0xNDowNzoyMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIzLjMgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NDc1RTU3NTQyRTlGMTFFRDlGMzY5Q0Y1RTZEQ0I1MkIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NDc1RTU3NTUyRTlGMTFFRDlGMzY5Q0Y1RTZEQ0I1MkIiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo0NzVFNTc1MjJFOUYxMUVEOUYzNjlDRjVFNkRDQjUyQiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo0NzVFNTc1MzJFOUYxMUVEOUYzNjlDRjVFNkRDQjUyQiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PpIOiIcAAAK1SURBVHja7JpRbtpAEIbxYvycnqA+Aj1B6AnqnKD4BcRTwwninKD0ASHggXID5wQkN0huwBHyjAXkn2gWWRGmm+K1jTwjETtmYff/dmZ2doWz3+8bdTbVqLkJAAEgAASAABAAAkAACAABIAAEgAAQAAKgfuae+wWO4+QykOl0+huXwPO8b2EYvpp8Jo/TrEp4wGKxuMLlFi8/SRK/diGw2Ww6fLvu9XrPdcwBAYfTY12T4DX92W63y6I7ds5NJOcmwfl83tntdivcvvb7/S+f+WweSdC1SXc2m/3CIDsQdpPVBrMeEES0e9LPJpNJt9ls/sR74WAwWF9kCGBm7yBqRPHNWT7Lg368D0SpWD+D+IDA4dkKMPyLA0Di4dYR3eMaZq3rLM5nTzgkwFar1QUYWg182xCUbfFw4b+ZnSt1yP5pVydgAEJhs7YNQZUlPu3+cPeHj+8REHzHd9sQVFniSQzFObePj7UpAoIqQzybrv6eT2V62xBUSeLfMz2HwdO/2h6DcGplKRQABnbLt7GpeI57Xf3FJu3ZS4b8r5/aP5QOQA8qIG8wrf5woRlcQ5hR/T8ej9u0ceQ+lyiu4koAoFkn1+eBRSYQ0K77mc0PxbzrulQuX5F49NmtVBL8DwjXWcvfMfEU8zbE57oMmkLA/qCtqz/P8x4NxftcLOUqPvdCyAQCZv1Q/Z06+kqLx+sF5fHNRZTCvBIMsyDo6g+2NBUPT+mYnhNWYjOEDD2C+HsNQRcuXP21P25+jtQIoyLEW90OwxMiDodhqtIzqv6SJIngKX9siy/8RAgJcMX1/z28JDp38Bd1LE6lq978AFrcqIgVBqDMo+9KAGiUePRdFQClHX2fMreojqjsxex/Nd38FGWO/Fy+5iYABIAAEAACQAAIAAEgAASAABAAAkAA1NDeBBgAzzq38/jxJwAAAAAASUVORK5CYII=",
		};

		require('px2style/dist/px2style.js');
		this.px2style = window.px2style;

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
			options.elmInstancePathView = options.elmInstancePathView || document.createElement('div');
			options.elmInstanceTreeView = options.elmInstanceTreeView || document.createElement('div');
			options.elmModulePalette = options.elmModulePalette || document.createElement('div');
			options.contents_area_selector = options.contents_area_selector || '.contents';
			options.contents_bowl_name_by = options.contents_bowl_name_by || 'id';
			options.gpiBridge = options.gpiBridge || function(){};
			options.droppedFileOperator = options.droppedFileOperator || {};
			options.onClickContentsLink = options.onClickContentsLink || function(){};
			options.onMessage = options.onMessage || function(){};
			options.onEditWindowOpen = options.onEditWindowOpen || function(){};
			options.onEditWindowClose = options.onEditWindowClose || function(){};
			options.lang = options.lang || 'en';
			options.appearance = options.appearance || 'auto';
			options.clipboard = options.clipboard || {};
			options.clipboard.set = options.clipboard.set || null;
			options.clipboard.get = options.clipboard.get || null;
			options.enableModuleDec = ( typeof(options.enableModuleDec) == typeof(true) ? options.enableModuleDec : true );
			options.enableModuleAnchor = ( typeof(options.enableModuleAnchor) == typeof(true) ? options.enableModuleAnchor : true );
			options.enableInstanceLock = ( typeof(options.enableInstanceLock) == typeof(true) ? options.enableInstanceLock : true );

			this.options = options;

			uiState = 'initialize';

			// 内容を消去
			$(options.elmCanvas).html('');
			$(options.elmInstancePathView).html('...');
			$(options.elmInstanceTreeView).html('...');
			$(options.elmModulePalette).html('...');

			it79.fnc(
				{},
				[
					function(it1, data){
						// リソースファイルの読み込み
						var css = [
							__dirname+'/broccoli.css',
						];
						switch( options.appearance ){
							case 'auto': css.push(__dirname+'/themes/auto.css'); break;
							case 'light': css.push(__dirname+'/themes/lightmode.css'); break;
							case 'dark': css.push(__dirname+'/themes/darkmode.css'); break;
						}
						$('head *[data-broccoli-resource]').remove(); // 一旦削除
						it79.ary(
							css,
							function(it2, row, idx){
								var link = document.createElement('link');
								link.addEventListener('load', function(){
									it2.next();
								});
								$('head').append(link);
								link.rel = 'stylesheet';
								link.href = row;
								link.setAttribute('data-broccoli-resource', true);
							},
							function(){
								it1.next(data);
							}
						);
					} ,
					function(it1, data){
						// DOMの整備
						$canvas = $(options.elmCanvas);
						$canvas
							.addClass('broccoli')
							.addClass(`broccoli--appearance-${broccoli.options.appearance}`)
							.addClass('broccoli--canvas')
							.append( $('<iframe>')
								.css({'border': 'none'})
								.attr({'scrolling': 'no'})
							)
							.append( $('<div class="broccoli__panels">')
							)
						;
						$canvas.find('iframe')
							.on('load', function(){
								var contWin = $canvas.find('iframe').get(0).contentWindow;
								try{
									if(contWin.location.href == 'about:blank'){
										return;
									}
								}catch(e){}
								_this.setUiState();
								onPreviewLoad( callback );
							})
						;
						_this.options.elmPanels = $canvas.find('.broccoli__panels').get(0);

						_this.clipboard = new (require('./clipboard.js'))(_this);
						_this.postMessenger = new (require('./postMessenger.js'))(_this, $canvas.find('iframe').get(0));
						_this.resourceMgr = new (require('./resourceMgr.js'))(_this);
						_this.panels = new (require( './panels.js' ))(_this);
						_this.contextmenu = new (require( './contextmenu.js' ))(_this);
						_this.instancePathView = new (require( './instancePathView.js' ))(_this);
						_this.instanceTreeView = new (require( './instanceTreeView.js' ))(_this);
						_this.insertWindow = new (require( './insertWindow.js' ))(_this);
						_this.editWindow = new (require( './editWindow.js' ))(_this);
						_this.fieldBase = new (require('./fieldBase.js'))(_this);
						_this.valiidator = new (require('./validator.js'))(_this);
						_this.findWindow = new (require( './findWindow.js' ))(_this);
						_this.fieldDefinitions = {};
						function loadFieldDefinition(){
							function loadFieldDefinition(fieldId, mod){
								var rtn = _.defaults( new (mod)(_this), _this.fieldBase );
								rtn.__fieldId__ = fieldId;
								return rtn;
							}
							_this.fieldDefinitions.href = loadFieldDefinition('href', require('./../../../fields/client/app.fields.href.js'));
							_this.fieldDefinitions.html = loadFieldDefinition('html', require('./../../../fields/client/app.fields.html.js'));
							_this.fieldDefinitions.html_attr_text = loadFieldDefinition('html_attr_text', require('./../../../fields/client/app.fields.html_attr_text.js'));
							_this.fieldDefinitions.image = loadFieldDefinition('image', require('./../../../fields/client/app.fields.image.js'));
							_this.fieldDefinitions.file = loadFieldDefinition('file', require('./../../../fields/client/app.fields.file.js'));
							_this.fieldDefinitions.markdown = loadFieldDefinition('markdown', require('./../../../fields/client/app.fields.markdown.js'));
							_this.fieldDefinitions.multitext = loadFieldDefinition('multitext', require('./../../../fields/client/app.fields.multitext.js'));
							_this.fieldDefinitions.script = loadFieldDefinition('script', require('./../../../fields/client/app.fields.script.js'));
							_this.fieldDefinitions.select = loadFieldDefinition('select', require('./../../../fields/client/app.fields.select.js'));
							_this.fieldDefinitions.text = loadFieldDefinition('text', require('./../../../fields/client/app.fields.text.js'));
							_this.fieldDefinitions.color = loadFieldDefinition('color', require('./../../../fields/client/app.fields.color.js'));
							_this.fieldDefinitions.datetime = loadFieldDefinition('datetime', require('./../../../fields/client/app.fields.datetime.js'));

							if( _this.options.customFields ){
								for( var idx in _this.options.customFields ){
									_this.fieldDefinitions[idx] = loadFieldDefinition( idx, _this.options.customFields[idx] );
								}
							}

							return true;
						}
						loadFieldDefinition();

						function bindDropCancel(elm){
							$(elm)
								.on('dragover', function(e){
									e.stopPropagation();
									e.preventDefault();
									return;
								})
								.on('drop', function(e){
									e.stopPropagation();
									e.preventDefault();
									return;
								})
							;
						}
						bindDropCancel($canvas);
						bindDropCancel(options.elmInstancePathView);
						bindDropCancel(options.elmInstanceTreeView);
						bindDropCancel(options.elmModulePalette);

						_this.indicator.putElement($('body'));
						_this.indicator.putElement($canvas);
						_this.indicator.putElement(options.elmInstanceTreeView);

						it1.next(data);
					} ,
					function(it1, data){
						// プログレスを表示
						_this.progress(function(){
							it1.next(data);
						});
					} ,
					function(it1, data){
						_this.progressMessage('Loading data...');
						_this.gpi(
							'getBootupInfomations',
							{} ,
							function(_bootupInfomations){
								bootupInfomations = _bootupInfomations;
								serverConfig = bootupInfomations.conf;

								it1.next(data);
							}
						);
					},
					function(it1, data){
						// language bank
						_this.progressMessage('Setting language...');
						_this.lb = new LangBank(bootupInfomations.languageCsv, function(){
							_this.lb.setLang( options.lang );
							it1.next(data);
						});
					},
					function(it1, data){
						_this.progressMessage('Initializing resource manager...');
						_this.resourceMgr.init(function(){
							it1.next(data);
						});
					} ,
					function(it1, data){
						_this.progressMessage('Initializing content data...');
						_this.contentsSourceData = new (require('./contentsSourceData.js'))(_this);
						_this.contentsSourceData.init(
							function(){
								it1.next(data);
							}
						);
					} ,
					function(it1, data){
						_this.progressMessage('Generating module palette...');
						_this.drawModulePalette(_this.options.elmModulePalette, function(){
							it1.next(data);
						});
					} ,
					function(it1, data){
						_this.progressMessage('Initializing instance tree view...');
						_this.instanceTreeView.init(_this.options.elmInstanceTreeView, function(){
							it1.next(data);
						});
					} ,
					function(it1, data){
						_this.progressMessage('Initializing instance path view...');
						_this.instancePathView.init(_this.options.elmInstancePathView, function(){
							it1.next(data);
						});
					} ,
					function( it1, data ){
						// 編集画面を初期化
						_this.progressMessage('Initializing editor...');
						$canvas.find('iframe')
							.attr({
								'src': $canvas.attr('data-broccoli-preview')
							})
							.css({
								'pointer-events': 'none'
									// 2020-02-24 tomk79
									// これは、Chromium の不具合に対する一時的な対応です。
									// iframeに重なったdiv要素で、dragoverイベントが発火しない不具合が起きています。
									//
									// Issue 923651: Drag over div over iframe does not receive dragover events
									// Sat, Jan 19, 2019, 9:54 PM GMT+9
									// https://bugs.chromium.org/p/chromium/issues/detail?id=923651
									//
									// この問題に対応するため、 iframeに `pointer-events:none` を付加するように変更しました。
									// この変更は、一時的な対応としてリリースされます。
									// Chrome が修正されるのを待ち、ロールバックされるべきです。
							})
						;
						it1.next(data);

					} ,
					function(it1, data){
						// プログレスを消去
						_this.closeProgress(function(){
							it1.next(data);
						});
					} ,
					function(it1, data){
						clearTimeout(timer_onPreviewLoad);
						var timeout = 30;
						timer_onPreviewLoad = setTimeout(function(){
							// 何らかの理由で、 iframeの読み込み完了イベントが発生しなかった場合、
							// 強制的にトリガーする。
							console.error('Loading preview timeout ('+(timeout)+'sec): Force trigger onPreviewLoad();');
							onPreviewLoad();
						}, timeout*1000);
						// callback(); // <- onPreviewLoad() がコールするので、ここでは呼ばない。
						it1.next();
					}
				]
			);
			return this;
		}

		/**
		 * UIの状態をセットする
		 */
		this.setUiState = function( state ){
			uiState = state;
			var $window = $(window);
			var $broccoli = $('.broccoli');
			$window
				.off('copy.broccoli-html-editor')
				.off('cut.broccoli-html-editor')
				.off('paste.broccoli-html-editor')
				.off('keydown.broccoli-html-editor')
			;
			$broccoli
				.off('keydown.broccoli-html-editor')
			;

			if( !uiState ){
				if( this.isProgress() ){
					uiState = 'progress';
				}else if( this.isLightboxOpened() ){
					uiState = 'lightbox';
				}else{
					uiState = 'standby';
				}
			}

			$window.on('keydown.broccoli-html-editor', function(e){
				if( e.keyCode == 27 ){ // ESC
					if( px2style.getOpenedModalCount && px2style.getOpenedModalCount() ){ // px2style のモーダルが開いているとき、このイベントは px2style が処理するため、無視する
						return;
					}
					_this.esc();
				}
			});

			if( uiState == 'standby' ){
				// --------------------------------------
				// 待機画面
				// = ドラッグ・アンド・ドロップする画面
				$window
					.on('copy.broccoli-html-editor', function(e){
						switch(e.target.tagName.toLowerCase()){
							case 'textarea': case 'input': return;break;
						}
						e.stopPropagation();
						e.preventDefault();
						_this.copy(function(){}, e.originalEvent);
						return;
					})
					.on('cut.broccoli-html-editor', function(e){
						switch(e.target.tagName.toLowerCase()){
							case 'textarea': case 'input': return;break;
						}
						e.stopPropagation();
						e.preventDefault();
						_this.cut(function(){}, e.originalEvent);
						return;
					})
					.on('paste.broccoli-html-editor', function(e){
						switch(e.target.tagName.toLowerCase()){
							case 'textarea': case 'input': return;break;
						}
						e.stopPropagation();
						e.preventDefault();
						_this.paste(function(){}, e.originalEvent);
						return;
					})
				;
				$broccoli
					.on('keydown.broccoli-html-editor', function(e){
						switch(e.target.tagName.toLowerCase()){
							case 'textarea': case 'input': return;break;
						}
						var cmdKey = ( e.originalEvent.metaKey || e.originalEvent.ctrlKey );
						var pressedKey = e.originalEvent.key.toLowerCase();
						if(cmdKey){
							if(pressedKey == 'z'){
								e.stopPropagation();
								e.preventDefault();
								_this.historyBack();
								return;
							}else if(pressedKey == 'y'){
								e.stopPropagation();
								e.preventDefault();
								_this.historyGo();
								return;
							}else if(pressedKey == 'a'){
								e.stopPropagation();
								e.preventDefault();
								_this.selectAllInstance();
								return;
							}else if(pressedKey == 'f'){
								e.stopPropagation();
								e.preventDefault();
								_this.find();
								return;
							}
						}
						if(pressedKey == 'delete' || pressedKey == 'backspace'){
							e.stopPropagation();
							e.preventDefault();
							_this.remove();
							return;
						}
						return;
					})
				;

			}else if( uiState == 'lightbox' ){
				// --------------------------------------
				// モーダルウィンドウが開いている状態
				// モジュール説明画面、インスタンス編集画面など。

			}else if( uiState == 'progress' ){
				// --------------------------------------
				// プログレス表示中

			}

			return;
		}

		/**
		 * プレビューがロードされたら実行
		 */
		function onPreviewLoad( callback ){
			callback = callback || function(){};
			if(_this.postMessenger===undefined){return;}// broccoli.init() の実行前
			clearTimeout(timer_onPreviewLoad);

			if( onPreviewLoad_done ){
				// 1度しか実行しない。
				console.error('broccoli: onPreviewLoad(): Skipping because it is already running.');
				return;
			}
			onPreviewLoad_done = true;

			it79.fnc(
				{},
				[
					function(it1, data){
						// プログレスを表示
						_this.progress(function(){
							it1.next(data);
						});
					} ,
					function( it1, data ){
						// postMessageの送受信を行う準備
						_this.progressMessage('Initializing postMessage...');
						_this.postMessenger.init(function(){
							it1.next(data);
						});
					} ,
					function( it1, data ){
						// 編集画面描画
						_this.progressMessage('Drawing the editor...');
						_this.redraw(function(){
							it1.next(data);
						});
					} ,
					function(it1, data){
						// プログレスを消去
						_this.closeProgress(function(){
							it1.next(data);
						});
					} ,
					function(it1, data){
						callback();
						it1.next();
					}
				]
			);
			return;
		}


		/**
		 * アプリケーションの実行モード設定を取得する (同期)
		 * @return string 'web'|'desktop'
		 */
		this.getAppMode = function(){
			var rtn = serverConfig.appMode;
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
		 * 画像のプレースホルダーを取得する
		 * @return string プレースホルダ画像のデータURL
		 */
		this.getNoimagePlaceholder = function(){
			return bootupInfomations.noimagePlaceholder;
		}

		/**
		 * 画面を再描画
		 * @return {[type]} [description]
		 */
		this.redraw = function(callback){
			callback = callback || function(){};
			var resDb;

			it79.fnc(
				{},
				[
					function( it1, data ){
						// タイマー処理
						// ウィンドウサイズの変更などの際に、無駄な再描画連打を減らすため
						clearTimeout( timer_redraw );
						timer_redraw = setTimeout(function(){
							it1.next(data);
						}, 100);
					} ,
					function( it1, data ){
						// 編集パネルを一旦消去
						_this.progressMessage(broccoli.lb.get('ui_message.clearing_edit_panel')); // 編集パネルを消去しています
						_this.panels.clearPanels(function(){
							it1.next(data);
						});
					} ,
					function( it1, data ){
						// リソースを呼び出し
						_this.progressMessage(broccoli.lb.get('ui_message.getting_resources')); // リソースを取得しています
						_this.resourceMgr.getResourceDb(function(rDb){
							resDb = rDb;
							it1.next(data);
						});
					} ,
					function( it1, data ){
						// 編集画面描画
						_this.progressMessage(broccoli.lb.get('ui_message.restructuring_html')); // HTMLを再構成しています
						_this.postMessenger.send(
							'getBowlList',
							{
								'contents_area_selector': _this.options.contents_area_selector ,
								'contents_bowl_name_by': _this.options.contents_bowl_name_by
							},
							function(bowlList){
								if( typeof(bowlList)!==typeof([]) || !bowlList.length ){
									_this.message('FAILED to list bowls.');
									console.error('FAILED to list bowls - - - - - -', 'bowlList',  bowlList);
								}
								var indexOfMain = bowlList.indexOf('main');
								if( typeof(indexOfMain) != typeof(0) || indexOfMain < 0 ){
									_this.message('bowl "main" is NOT found in bowlList.');
								}
								for( var idx in bowlList ){
									_this.contentsSourceData.initBowlData(bowlList[idx]);
								}
								_this.gpi(
									'buildHtml',
									{
										'bowlList': bowlList,
									},
									function(returnData){
										var htmls = returnData.htmls;
										for(var idx in htmls){
											htmls[idx] = (function(src){
												for(var resKey in resDb){
													try {
														src = src.split('{broccoli-html-editor-resource-baser64:{'+resKey+'}}').join(resDb[resKey].base64);
													} catch (e) {
													}
												}

												// PHP文法を無害化
												src = src.replace(/\<\?\=([\s\S]*?)\?\>/g, '<span style="display:inline-block;color:#969800;background-color:#f0f1b3;border:1px solid #969800;font-size:10px;padding:0.2em 1em;max-width:100%;overflow:hidden;white-space:nowrap;">&lt;?= $1 ?&gt;</span>');
												src = src.replace(/\<\?(?:php)?([\s\S]*?)\?\>/g, '<span style="display:inline-block;color:#969800;background-color:#f0f1b3;border:1px solid #969800;font-size:10px;padding:0.2em 1em;max-width:100%;overflow:hidden;white-space:nowrap;">&lt;?php PHP Script ?&gt;</span>');

												return src;
											})(htmls[idx]);
										}

										_this.progressMessage(broccoli.lb.get('ui_message.updating_dom_with_reconstructed_html')); // 再構成したHTMLで画面を更新しています
										_this.postMessenger.send(
											'updateHtml',
											{
												'contents_area_selector': _this.options.contents_area_selector ,
												'contents_bowl_name_by': _this.options.contents_bowl_name_by ,
												'htmls': htmls
											},
											function(){
												it1.next(data);
											}
										);
									}
								);
							}
						);
					} ,
					function( it1, data ){
						// ちょっと間を置く
						setTimeout(function(){
							it1.next(data);
						},100);
					} ,
					function( it1, data ){
						// iframeのサイズ合わせ
						_this.progressMessage(broccoli.lb.get('ui_message.adjusting_ui')); // 画面を調整しています
						$canvas.find('iframe')
							.width( '100%' )
							.attr({'scrolling': 'no'})
						;
						_this.postMessenger.send(
							'getHtmlContentHeightWidth',
							{},
							function(hw){
								$canvas.find('iframe')
									.height( hw.h + 16 )
								;
								it1.next(data);
							}
						);
					} ,
					function( it1, data ){
						// ちょっと間を置く
						setTimeout(function(){
							it1.next(data);
						},100);
					} ,
					function( it1, data ){
						// パネル描画
						_this.progressMessage(broccoli.lb.get('ui_message.drawing_edit_panel')); // 編集パネルを描画しています
						_this.drawPanels( function(){
							it1.next(data);
						} );
					} ,
					function( it1, data ){
						// モジュールパレットのサイズ合わせ
						_this.progressMessage(broccoli.lb.get('ui_message.adjusting_module_palette_size')); // モジュールパレットのサイズを合わせています
						var $elm = $(_this.options.elmModulePalette).find('.broccoli__module-palette-inner');
						var filterHeight = $elm.find('.broccoli__module-palette-filter').outerHeight();
						$elm.find('.broccoli__module-palette-list').css({
							'height': $elm.parent().outerHeight() - filterHeight
						});

						it1.next(data);
					} ,
					function( it1, data ){
						// インスタンスツリービュー描画
						_this.progressMessage(broccoli.lb.get('ui_message.drawing_instance_tree_view')); // インスタンスツリービューを描画しています
						_this.instanceTreeView.update( function(){
							it1.next(data);
						} );
					} ,
					function( it1, data ){
						// インスタンスパスビューを更新
						_this.progressMessage(broccoli.lb.get('ui_message.drawing_instance_path_view')); // インスタンスパスビューを描画しています
						_this.instancePathView.update( function(){
							it1.next(data);
						} );
					} ,
					function(it1, data){
						// 選択状態の復元
						_this.progressMessage(broccoli.lb.get('ui_message.restoring_selection_state')); // 選択状態を復元しています
						if( typeof(selectedInstance) == typeof('') ){
							_this.selectInstance(selectedInstance, function(){
								it1.next(data);
							});
							return;
						}
						it1.next(data);
						return;
					} ,
					function(it1, data){
						_this.progressMessage( broccoli.lb.get('ui_label.finished') ); // 完了
						callback();
						setTimeout(function(){
							_this.closeProgress();
						}, 500);
						it1.next();
					}
				]
			);
			return;
		}

		/**
		 * パネルの位置を合わせる
		 */
		this.adjust = function(){
			this.panels.adjust();
		}

		/**
		 * field定義を取得する
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
		 * GPIから値を得る
		 */
		this.gpi = function(api, options, callback){
			options = options || {};
			options.lang = options.lang || this.options.lang;
			this.options.gpiBridge(api, options, function(data){
				if(typeof(data) === typeof({})){
					if(!data.result || (data.errors && data.errors.length)){
						console.error('Broccoli GPI Error:', api, data);
					}
				}else{
					console.error('Broccoli GPI Type Error:', api, "GPI returns no object value.");
				}
				callback(data);
			});
			return;
		}

		/**
		 * 初期起動時にロードした情報を取得する
		 */
		this.getBootupInfomations = function(){
			return bootupInfomations;
		}

		/**
		 * インスタンスを挿入する
		 */
		this.insertInstance = function( instancePath, callback ){
			callback = callback || function(){};
			if( !instancePath ){
				instancePath = broccoli.getSelectedInstance();
			}
			if( !instancePath ){
				broccoli.message( broccoli.lb.get('ui_message.select_instance') );
				callback(false);
				return;
			}
			drawInsertWindow(
				instancePath,
				function(isInsert){
					broccoli.px2style.closeModal();
					callback(isInsert);
				}
			);
			return;
		}

		/**
		 * インスタンスを編集する
		 */
		this.editInstance = function( instancePath, callback ){
			callback = callback || function(){};
			if( !instancePath ){
				instancePath = broccoli.getSelectedInstance();
			}
			if( !instancePath ){
				broccoli.message( broccoli.lb.get('ui_message.select_instance') );
				callback(false);
				return;
			}
			broccoli.selectInstance(instancePath, function(){
				broccoli.lightbox( function( lbElm ){
					$('.broccoli__lightbox-inner').addClass('broccoli__lightbox-inner--edit-window-mode');
					drawEditWindow( instancePath, lbElm, function(isSave){
						if( !isSave ){
							broccoli.closeLightbox(function(){
								broccoli.closeProgress(function(){

									// 選択中の(編集した)インスタンスにフォーカスを移す
									// (タブキーで操作できるように)
									var selectedInstancePath = broccoli.getSelectedInstance();
									$(broccoli.options.elmPanels).find('[data-broccoli-instance-path="'+(selectedInstancePath)+'"]').trigger('focus');

									callback();
								});
							});
							return;
						}
						it79.fnc({},[
							function(it1, data){
								// プログレスを表示
								broccoli.progress(function(){
									it1.next(data);
								});
							} ,
							function(it1, data){
								// 編集パネルを一旦消去
								_this.panels.clearPanels(function(){
									it1.next(data);
								});
							} ,
							function(it1, data){
								// コンテンツデータを保存
								if( !isSave ){
									it1.next(data);
									return;
								}
								_this.saveContents(function(){
									it1.next(data);
								});
							} ,
							function(it1, data){
								broccoli.closeLightbox(function(){
									it1.next(data);
								});
							} ,
							function(it1, data){
								// 画面を再描画
								_this.redraw(function(){
									it1.next(data);
								});
							} ,
							function(it1, data){
								// プログレスを消去
								broccoli.closeProgress(function(){
									it1.next(data);
								});
							} ,
							function(it1, data){
								// 選択中の(編集した)インスタンスにフォーカスを移す
								// (タブキーで操作できるように)
								var selectedInstancePath = broccoli.getSelectedInstance();
								$(broccoli.options.elmPanels).find('[data-broccoli-instance-path="'+(selectedInstancePath)+'"]').focus();

								it1.next(data);
							},
							function(it1, data){
								callback();
								it1.next(data);
							},
						]);
					} );
				} );
			});
			return;
		} // editInstance()

		/**
		 * インスタンスを選択する
		 */
		this.selectInstance = function( instancePath, callback ){
			callback = callback || function(){};
			var broccoli = this;

			//一旦選択解除
			broccoli.unselectInstance(function(){
				//フォーカスも解除
				broccoli.unfocusInstance(function(){
					selectedInstance = instancePath;
					selectedInstanceRegion = [instancePath];

					broccoli.panels.updateInstanceSelection(function(){
						broccoli.instanceTreeView.updateInstanceSelection(function(){
							broccoli.instancePathView.update(function(){
								callback();
							});
						});
					});
				});
			});
			return;
		}

		/**
		 * すべて選択する
		 */
		this.selectAllInstance = function( callback ){
			callback = callback || function(){};
			var selectedInstancePath = broccoli.getSelectedInstance();
			var firstInstancePath = selectedInstancePath.replace(/\@[0-9]*$/, '@0');

			it79.fnc({}, [
				function(it1){
					broccoli.selectInstance(firstInstancePath, function(){
						it1.next();
					});
				},
				function(it1){
					broccoli.selectInstanceRegion(selectedInstancePath, function(){
						it1.next();
					});
				},
				function(it1){
					var parentInstancePath = broccoli.contentsSourceData.getParentInstancePath(firstInstancePath);
					var fieldName = RegExp.$1;
					var data = broccoli.contentsSourceData.get(parentInstancePath);
					var lastInstanceIdx = data.fields[fieldName].length - 1;
					var lastInstancePath = firstInstancePath.replace(/\@[0-9]*$/, '@'+lastInstanceIdx);
					broccoli.selectInstanceRegion(lastInstancePath, function(){
						it1.next();
					});
				},
				function(){
					callback();
				},
			]);
			return;
		}

		/**
		 * インスタンスを範囲選択する
		 */
		this.selectInstanceRegion = function( instancePathRegionTo, callback ){
			callback = callback || function(){};
			var broccoli = this;
			if( !selectedInstance ){
				// 無選択状態だったら、選択操作に転送する。
				this.selectInstance(instancePathRegionTo, callback);
				return;
			}
			selectedInstance.match(/^([\s\S]*?)([0-9]*)$/, '$1');
			var commonLayer = RegExp.$1;
			var startNumber = RegExp.$2;

			var idx = instancePathRegionTo.indexOf(commonLayer);
			if(idx !== 0){
				// ずれた階層間での範囲選択はできません。
				console.info('Info: It is not possible to select a range between shifted hierarchies.');
				callback(false);
				return;
			}

			var numberTo = instancePathRegionTo.split(commonLayer)[1];
			numberTo.match(/^([0-9]*)/);
			var endNumber = RegExp.$1;

			// 数値にキャスト
			var fromTo = [Number(startNumber), Number(endNumber)].sort();

			selectedInstanceRegion = [];
			for( var i = fromTo[0]; i <= fromTo[1]; i ++ ){
				selectedInstanceRegion.push( commonLayer+i );
			}

			broccoli.panels.updateInstanceSelection(function(){
				broccoli.instanceTreeView.updateInstanceSelection(function(){
					callback();
				});
			});
			return;
		}

		/**
		 * インスタンスが選択状態にあるか調べる
		 */
		this.isInstanceSelected = function(instancePath){
			if(selectedInstance == instancePath){
				return true;
			}
			for(var idx in selectedInstanceRegion){
				if( selectedInstanceRegion[idx] == instancePath ){
					return true;
				}
			}
			return false;
		}

		/**
		 * モジュールインスタンスの選択状態を解除する
		 */
		this.unselectInstance = function(callback){
			callback = callback || function(){};
			selectedInstance = null;
			selectedInstanceRegion = [];
			var broccoli = this;
			broccoli.contextmenu.close(function(){
				broccoli.panels.unselectInstance(function(){
					broccoli.instanceTreeView.unselectInstance(function(){
						broccoli.instancePathView.update(function(){
							callback();
						});
					});
				});
			});
			return;
		}

		/**
		 * モジュールインスタンスにフォーカスする
		 * フォーカス状態の囲みで表現され、画面に収まるようにスクロールする
		 */
		this.focusInstance = function( instancePath, callback ){
			callback = callback || function(){};
			var broccoli = this;

			//一旦フォーカス解除
			broccoli.unfocusInstance(function(){

				//フォーカス
				broccoli.panels.focusInstance(instancePath, function(){

					var $targetElm = $(broccoli.panels.getPanelElement(instancePath));
					if($targetElm.length){
						var minTop = $canvas.scrollTop() + $targetElm.offset().top - 30;
						var topLine = $canvas.scrollTop();
						var targetTop = topLine + $targetElm.offset().top;
						var targetHeight = $targetElm.height();
						var to = targetTop + (targetHeight/2) - ($canvas.height()/2);
						if( to > minTop ){
							to = minTop;
						}
						$canvas.stop().animate({"scrollTop":to} , 'fast' );
					}

					callback();
				});
			});
			return;

		}

		/**
		 * モジュールインスタンスのフォーカス状態を解除する
		 */
		this.unfocusInstance = function(callback){
			callback = callback || function(){};
			this.panels.unfocusInstance(function(){
				callback();
			});
			return;
		}

		/**
		 * 選択されたインスタンスのパスを取得する
		 */
		this.getSelectedInstance = function(){
			return selectedInstance;
		}
		/**
		 * 選択されたインスタンス範囲のパスの一覧を取得する
		 */
		this.getSelectedInstanceRegion = function(){
			return selectedInstanceRegion;
		}

		/**
		 * 選択しているインスタンスをJSON文字列に変換する
		 */
		this.selectedInstanceToJsonString = function(callback){
			callback = callback||function(){};
			var broccoli = this;
			var instancePath = this.getSelectedInstance();
			var instancePathRegion = this.getSelectedInstanceRegion();
			if( typeof(instancePath) !== typeof('') ){
				callback(false);
				return;
			}

			var data = {};
			data.data = [];
			for( var idx = 0; idx<instancePathRegion.length; idx ++ ){
				var instanceData = this.contentsSourceData.get( instancePathRegion[idx] );
				if( !instanceData ){
					continue;
				}
				instanceData = JSON.parse( JSON.stringify(instanceData) );
				delete(instanceData.locked); // NOTE: コピー時に、編集ロック情報は引き継がない。
				data.data.push( instanceData );
			}

			data.resources = {};
			it79.ary(
				data.data,
				function(it1, row1, idx1){
					if( !row1 ){ it1.next(); return; }
					_this.contentsSourceData.extractResourceId(row1, function(resourceIdList){
						it79.ary(
							resourceIdList ,
							function(it2, row2, idx2){
								_this.resourceMgr.getResource(row2, function(resInfo){
									data.resources[row2] = resInfo;
									it2.next();
								});
							} ,
							function(){
								it1.next();
							}
						);

					});
				} ,
				function(){
					data = JSON.stringify( data, null, 1 );
					callback(data);
				}
			);
			return;
		}

		/**
		 * 選択したインスタンスをクリップボードへコピーする
		 */
		this.copy = function(callback, event){
			callback = callback||function(){};
			var instancePath = this.getSelectedInstance();
			if( typeof(instancePath) !== typeof('') ){
				_this.message( broccoli.lb.get('ui_message.copy_with_instance_selected') ); // インスタンスを選択した状態でコピーしてください。
				callback(false);
				return;
			}

			_this.progressMessage(broccoli.lb.get('ui_message.copying')); // コピーしています。

			this.selectedInstanceToJsonString(function(jsonStr){
				if(jsonStr === false){
					_this.message(broccoli.lb.get('ui_message.failed_to_copy_instance')); // インスタンスのコピーに失敗しました。
					_this.closeProgress();
					callback(false);
					return;
				}
				_this.clipboard.set( jsonStr, null, event );
				_this.progressMessage(broccoli.lb.get('ui_message.copied_instance')); // インスタンスをコピーしました。
				_this.message(broccoli.lb.get('ui_message.copied_instance')); // インスタンスをコピーしました。
				_this.closeProgress();
				callback(true);
			});
			return;
		}

		/**
		 * 選択したインスタンスをクリップボードへコピーして削除する
		 */
		this.cut = function(callback, event){
			callback = callback||function(){};
			var instancePath = this.getSelectedInstance();
			if( typeof(instancePath) !== typeof('') ){
				_this.message(broccoli.lb.get('ui_message.cut_with_instance_selected')); // インスタンスを選択した状態でカットしてください。
				callback(false);
				return;
			}

			_this.progressMessage(broccoli.lb.get('ui_message.copying')); // コピーしています。

			_this.contentsSourceData.resourceDbReloadRequest() // 削除したインスタンスにリソースが含まれている可能性があるので、リロードを要求する。

			this.selectedInstanceToJsonString(function(jsonStr){
				if(jsonStr === false){
					_this.message(broccoli.lb.get('ui_message.failed_to_copy_instance')); // インスタンスのコピーに失敗しました。
					_this.closeProgress();
					callback(false);
					return;
				}
				_this.clipboard.set( jsonStr, null, event );

				_this.remove(function(){
					_this.progressMessage(broccoli.lb.get('ui_message.cut_instance')); // インスタンスをコピーしました。
					_this.message(broccoli.lb.get('ui_message.cut_instance')); // インスタンスをカットしました。
					_this.closeProgress();
					callback(true);
				});
			});
			return;
		}

		/**
		 * クリップボードの内容を選択したインスタンスの位置に挿入する
		 */
		this.paste = function(callback, event){
			var broccoli = this;
			callback = callback||function(){};
			var selectedInstance = this.getSelectedInstance();
			if( typeof(selectedInstance) !== typeof('') ){
				_this.message(broccoli.lb.get('ui_message.paste_with_instance_selected')); // インスタンスを選択した状態でペーストしてください。
				callback(false);
				return;
			}

			this.clipboard.get( null, event, function(data){
				try {
					data = JSON.parse( data );
				} catch (e) {
					_this.message(broccoli.lb.get('ui_message.failed_to_decode_clipboard_data')); // クリップボードのデータをデコードできませんでした。
					console.error('FAILED to decode clipboard data.', data);
					callback(false);
					return;
				}

				var isValid = (function(){
					if( !data.data[0] ){
						return false;
					}
					var php = require('phpjs');
					var dataToParent = broccoli.contentsSourceData.get(php.dirname(selectedInstance));
					var modToParent = broccoli.contentsSourceData.getModule(dataToParent.modId);//subModuleの全量を知りたいので、第2引数は渡さない。
					var currentInstanceTo = php.basename(selectedInstance).split('.')[1].split('@');

					var typeTo = 'module';
					if( modToParent.subModule && modToParent.subModule[currentInstanceTo[0]] ){
						typeTo = 'loop';
					}

					var modFrom = broccoli.contentsSourceData.getModule(data.data[0].modId, data.data[0].subModName);
					var typeFrom = 'module';
					if( modFrom.subModName ){
						typeFrom = 'loop';
					}

					if( typeTo != typeFrom ){
						// loopフィールドとmoduleフィールド間の相互のコピペは禁止。
						return false;
					}
					if( typeTo == 'loop' ){
						// loopフィールドの場合、型が一致しないフィールドへのコピペは禁止。
						if( dataToParent.modId != data.data[0].modId || currentInstanceTo[0] != data.data[0].subModName ){
							return false;
						}
					}

					return true;
				})();
				if( !isValid ){
					_this.message(broccoli.lb.get('ui_message.cannot_paste_here')); // ここにはペーストできません。
					callback(false);
					return;
				}

				broccoli.progress(function(){
					it79.ary(
						data.data ,
						function(it1, row1, idx1){
							if( !row1 ){ it1.next(); return; }
							_this.contentsSourceData.duplicateInstance(data.data[idx1], data.resources, {}, function(newData){

								_this.contentsSourceData.addInstance( newData, selectedInstance, function(result){
									// 上から順番に挿入していくので、
									// moveTo を1つインクリメントしなければいけない。
									// (そうしないと、天地逆さまに積み上げられることになる。)
									selectedInstance = _this.incrementInstancePath(selectedInstance);
									it1.next();
								} );

							});

						} ,
						function(){
							_this.saveContents(function(result){
								// 画面を再描画
								_this.redraw(function(){
									_this.selectInstance(selectedInstance, function(){
										_this.message(broccoli.lb.get('ui_message.pasted_instance')); // インスタンスをペーストしました。
										broccoli.closeProgress(function(){
											callback(true);
										});
									});
								});
							});
						}
					);
				});
			} );

			return;
		}


		/**
		 * ESC
		 */
		this.esc = function(callback){
			callback = callback||function(){};
			if( this.contextmenu.isShow() ){
				this.contextmenu.close();
			}else if( this.isLightboxOpened() ){
				this.closeLightbox();
			}else{
				this.unfocusInstance();
				this.unselectInstance();
			}
			callback(true);
			return;
		}

		/**
		 * 選択したインスタンスを削除する
		 */
		this.remove = function(callback){
			callback = callback||function(){};
			var broccoli = this;

			var selectedInstance = _this.getSelectedInstance();
			var selectedInstanceRegion = _this.getSelectedInstanceRegion();

			if( this.isLightboxOpened() ){
				// lightboxを表示中は削除を受け付けない。
				callback(false);
				return;
			}
			if( typeof(selectedInstance) !== typeof('') ){
				_this.message(broccoli.lb.get('ui_message.delete_instance_while_selected')); // message: インスタンスを選択した状態で削除してください。
				callback(false);
				return;
			}
			if( selectedInstance.match(new RegExp('^\\/bowl\\.[^\\/]+$')) ){
				_this.message(broccoli.lb.get('ui_message.root_instance_cannot_be_deleted')); // message: ルートインスタンスを削除することはできません。
				callback(false);
				return;
			}

			if(!selectedInstanceRegion.every(function(instancePath){
				var instanceData = broccoli.contentsSourceData.get(instancePath);
				if( instanceData.locked && instanceData.locked.delete ){
					return false;
				}

				var parentInstanceData = broccoli.contentsSourceData.get(broccoli.contentsSourceData.getParentInstancePath(instancePath));
				if( parentInstanceData.locked && parentInstanceData.locked.children ){
					return false;
				}

				return true;
			})){
				// ロックされたインスタンスが含まれている場合、削除できない。 → 中止
				_this.message(broccoli.lb.get('ui_message.instance_locked.failed_to_delete_instance.locked_instance_contained')); // message: 削除できません。ロックされたインスタンスが含まれています。
				callback(false);
				return;
			}

			selectedInstanceRegion = JSON.parse( JSON.stringify(selectedInstanceRegion) );
			selectedInstanceRegion.reverse(); // 先頭から削除すると添字がリアルタイムに変わってしまうので、逆順に削除する。

			broccoli.contentsSourceData.resourceDbReloadRequest() // 削除したインスタンスにリソースが含まれている可能性があるので、リロードを要求する。

			broccoli.progress(function(){
				it79.ary(
					selectedInstanceRegion,
					function(it1, selectedInstanceRow, idx){
						_this.contentsSourceData.removeInstance(selectedInstanceRow, function(){
							it1.next();
						});
					},
					function(){
						_this.message(broccoli.lb.get('ui_message.delete_instance_done')); // インスタンスを削除しました。
						_this.saveContents(function(result){
							// 画面を再描画
							_this.unselectInstance(function(){
								_this.redraw(function(){
									broccoli.closeProgress(function(){
										callback(true);
									});
								});
							});
						});
					}
				);
			});
			return;
		}

		/**
		 * history: 取り消し (非同期)
		 */
		this.historyBack = function( callback ){
			callback = callback||function(){};
			_this.progress(function(){
				_this.contentsSourceData.historyBack(function(result){
					if(result === false){
						_this.message(broccoli.lb.get('ui_message.cant_go_back_any_further')); // これ以上戻れません。
						_this.closeProgress(function(){
							callback();
						});
						return;
					}

					// 画面を再描画
					_this.redraw(function(){
						_this.closeProgress(function(){
							callback();
						});
					});

				});
			});
			return;
		}

		/**
		 * history: やりなおし (非同期)
		 */
		this.historyGo = function( callback ){
			callback = callback||function(){};
			_this.progress(function(){
				_this.contentsSourceData.historyGo(function(result){
					if(result === false){
						_this.message(broccoli.lb.get('ui_message.cant_go_forward_any_further')); // これ以上進められません。
						_this.closeProgress(function(){
							callback();
						});
						return;
					}

					// 画面を再描画
					_this.redraw(function(){
						_this.closeProgress(function(){
							callback();
						});
					});

				});
			});
			return;
		}

		/**
		 * コンテンツ内を検索する
		 */
		this.find = function(){
			this.findWindow.init();
			return;
		}


		/**
		 * モジュールパレットを描画する
		 * @param  {Element}  targetElm  描画する対象の要素
		 * @param  {Function} callback   callback function.
		 * @return {Object}              this.
		 */
		this.drawModulePalette = function(targetElm, callback){
			require( './drawModulePalette.js' )(_this, targetElm, callback);
			return;
		}

		/**
		 * 編集用UI(Panels)を描画する
		 * @param  {Function} callback    callback function.
		 * @return {Object}               this.
		 */
		this.drawPanels = function(callback){
			this.panels.init(this.options.elmPanels, callback);
			return;
		}

		/**
		 * 挿入ウィンドウを描画する
		 */
		function drawInsertWindow(instancePath, callback){
			$(window).on('beforeunload.broccoli-html-editor', function(e){
				e.preventDefault();
				e.returnValue = '';
			});

			var $lbElm = $('<div>');
			broccoli.px2style.modal({
				'title': broccoli.lb.get('ui_label.insert_module'),
				'body': $lbElm,
				'buttons': [],
				'buttonsSecondary': [
					$('<button class="px2-btn">').text(broccoli.lb.get('ui_label.cancel')).on('click', function(){
						broccoli.px2style.closeModal();
					})
				],
				'onclose': function(){
					$(window).off('beforeunload.broccoli-html-editor');
				},
			});
			broccoli.insertWindow.init(instancePath, $lbElm, callback);
			return;
		}

		/**
		 * 編集ウィンドウを描画する
		 */
		function drawEditWindow(instancePath, elmEditWindow, callback){
			$(window).on('beforeunload.broccoli-html-editor', function(e){
				e.preventDefault();
				e.returnValue = '';
			});
			broccoli.editWindow.init(instancePath, elmEditWindow, function(result){
				$(window).off('beforeunload.broccoli-html-editor');
				callback(result);
			});
			return;
		}

		/**
		 * ライトボックスを表示する
		 */
		this.lightbox = function( callback ){
			callback = callback||function(){};

			var $dom = $('<div>')
				.addClass('broccoli__lightbox-inner-body')
			;

			$('body').find('.broccoli__lightbox').remove(); // 一旦削除
			$('.broccoli *').attr({'tabindex':'-1'});
			$('body')
				.append( $('<div>')
					.addClass(`broccoli`)
					.addClass(`broccoli__lightbox`)
					.addClass(`broccoli--appearance-${broccoli.options.appearance}`)

					// dropイベントをキャンセル
					.on('dragover', function(e){
						e.stopPropagation();
						e.preventDefault();
						return;
					}).on('drop', function(e){
						e.stopPropagation();
						e.preventDefault();
						return;
					})
					.append( $('<div>')
						.addClass('broccoli__lightbox-inner')
						.append( $dom )
					)
				)
			;

			this.setUiState();
			callback( $dom.get(0) );
			return;
		}

		/**
		 * ライトボックスが開いているか確認する
		 */
		this.isLightboxOpened = function(){
			if( $('body').find('.broccoli__lightbox').length ){
				return true;
			}
			return false;
		}

		/**
		 * ライトボックスを閉じる
		 */
		this.closeLightbox = function( callback ){
			callback = callback||function(){};
			$('body').find('.broccoli__lightbox')
				.fadeOut(
					'fast',
					function(){
						$(this).remove();
						$('.broccoli *').removeAttr('tabindex');
						$('.broccoli .broccoli__panel').attr({'tabindex':'1'});
						$('.broccoli .broccoli--instance-tree-view-panel-item').attr({'tabindex':'1'});
						_this.setUiState();
						callback();
					}
				)
			;
			$(window).off('beforeunload.broccoli-html-editor');
			return;
		}

		/**
		 * プログレスを表示する
		 */
		this.progress = function( callback ){
			callback = callback||function(){};
			$('body').find('.broccoli--progress').remove();//一旦削除
			$('body')
				.append( $('<div class="broccoli broccoli--progress">')
					.append( $('<div class="broccoli__progress">')
						.append( $('<div class="broccoli__progress-inner">')
							.append( $('<div class="broccoli__progress-loading-wrap">')
								.append( $('<div class="px2-loading">')
									.append( $('<div class="px2-loading__sign"></div>') )
								)
							)
							.append( $('<div class="broccoli__progress-comment">') )
						)
					)
				)
			;
			var dom = $('body').find('.px2-loading').get(0);
			_this.setUiState();
			callback(dom);
			return;
		}

		/**
		 * プログレス表示中にメッセージを表示する
		 * プログレス表示中でなければ無視する。
		 */
		this.progressMessage = function(str){
			if( !this.isProgress() ){
				this.progress(function(){
					var $userMessage = $('.broccoli__progress-comment');
					$userMessage.text(str);
					_this.setUiState();
				});
				return;
			}
			var $userMessage = $('.broccoli__progress-comment');
			$userMessage.text(str);
			_this.setUiState();
			return;
		}

		/**
		 * プログレス表示中か調べる
		 */
		this.isProgress = function(){
			var $progress = $('body').find('.broccoli__progress');
			if( !$progress.length ){
				return false;
			}
			return true;
		}

		/**
		 * プログレスを閉じる
		 */
		this.closeProgress = function( callback ){
			callback = callback || function(){};
			var $progress = $('body').find('.broccoli__progress');
			if( !$progress.length ){
				_this.setUiState();
				callback();
				return;
			}
			$progress
				.fadeOut(
					'fast',
					function(){
						$(this).remove();
						_this.setUiState();
						callback();
					}
				)
			;
			return;
		}

		/**
		 * ユーザーへのメッセージを表示する
		 * @param  {String}   message  メッセージ
		 * @param  {Function} callback コールバック関数
		 * @return {Object}            this.
		 */
		this.message = function(message, callback){
			callback  = callback||function(){};
			console.info(message);
			this.options.onMessage(message);
			callback();
			return;
		}

		/**
		 * モジュールIDをパースする
		 */
		this.parseModuleId = require('../../../libs/fncs/parseModuleId.js');

		/**
		 * インスタンスパスの末尾の連番を1つ進める
		 */
		this.incrementInstancePath = require('../../../libs/fncs/incrementInstancePath.js');

		/**
		 * バリデーション
		 */
		this.validate = function(attr, val, rules, mod, callback){
			this.valiidator.validate(attr, val, rules, mod, callback);
			return;
		}

		/**
		 * コンテンツデータを保存する
		 */
		this.saveContents = function(callback){
			callback = callback || function(){};
			it79.fnc({},[
				function(it1, data){
					// コンテンツを保存
					_this.progressMessage(broccoli.lb.get('ui_message.saving_content_data')); // コンテンツデータを保存しています
					_this.indicator.saveProgress();
					_this.contentsSourceData.save(function(){
						it1.next(data);
					});
				} ,
				// // ↓画像等のリソースはその都度アップして更新されているので、最後に一括保存は不要。
				// // 　この処理のため、画像点数が増えるほどに挙動が重くなる問題が起きていたので、
				// // 　処理をスキップするように修正した。
				// function(it1, data){
				// 	// リソースを保存
				// 	_this.progressMessage('リソースデータを保存しています...');
				// 	_this.resourceMgr.save(function(){
				// 		it1.next(data);
				// 	});
				// } ,
				function(it1, data){
					// コンテンツを更新
					_this.progressMessage(broccoli.lb.get('ui_message.updating_content')); // コンテンツを更新しています
						// この処理は、サーバーサイドでHTMLやリソースのリビルドを実行しています。
					_this.gpi(
						'updateContents',
						{} ,
						function(result){
							it1.next(data);
						}
					);
				} ,
				function(it1, data){
					_this.progressMessage(broccoli.lb.get('ui_message.content_saved')); // コンテンツを保存しました。
					_this.indicator.saveCompleted();
					callback(true);
					it1.next(data);
				}
			]);
			return;
		}

		/**
		 * Twig テンプレートにデータをバインドする
		 */
		this.bindTwig = function( tpl, data ){
			var rtn = '';
			var Twig, twig;
			try {
				Twig = require('twig'), // Twig module
				twig = Twig.twig;

				rtn = new twig({
					'data': tpl,
					'autoescape': true,
				}).render(data);
			} catch(e) {
				var errorMessage = 'TemplateEngine "Twig" Rendering ERROR.';
				console.error( errorMessage );
				rtn = errorMessage;
			}
			return rtn;
		}

	}

})(module);
