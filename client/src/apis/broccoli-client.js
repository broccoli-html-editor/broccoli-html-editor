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
		// if(!window){delete(require.cache[require('path').resolve(__filename)]);}
		// console.log(__dirname);

		var _this = this;
		var it79 = require('iterate79');
		var _ = require('underscore');
		var $ = require('jquery');
		var LangBank = require('langbank');
		this.lb = {};
		var selectedInstance = null;
		var selectedInstanceRegion = [];
		var $canvas;
		var redrawTimer;
		var serverConfig; // サーバー側から取得した設定情報
		this.__dirname = __dirname;
		var bootupInfomations;

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
			options.onClickContentsLink = options.onClickContentsLink || function(){};
			options.onMessage = options.onMessage || function(){};
			options.lang = options.lang || 'en';
			options.clipboard = options.clipboard || {};
			options.clipboard.set = options.clipboard.set || null;
			options.clipboard.get = options.clipboard.get || null;

			this.options = options;

			$canvas = $(options.elmCanvas);
			$canvas
				.addClass('broccoli')
				.addClass('broccoli--canvas')
				.append( $('<iframe>')
				)
				.append( $('<div class="broccoli--panels">')
				)
			;
			$canvas.find('iframe')
				.bind('load', function(){
					console.log('broccoli: preview loaded');
					onPreviewLoad( callback );
				})
			;
			// this.options.elmIframeWindow = $canvas.find('iframe').get(0).contentWindow;
			this.options.elmPanels = $canvas.find('.broccoli--panels').get(0);
			// this.options.elmInstancePathView = $canvas.find('.broccoli--instance-path-view').get(0);

			this.clipboard = new (require('./clipboard.js'))(this);
			this.postMessenger = new (require('./postMessenger.js'))(this, $canvas.find('iframe').get(0));
			this.resourceMgr = new (require('./resourceMgr.js'))(this);
			this.panels = new (require( './panels.js' ))(this);
			this.instancePathView = new (require( './instancePathView.js' ))(this);
			this.instanceTreeView = new (require( './instanceTreeView.js' ))(this);
			this.editWindow = new (require( './editWindow.js' ))(this);
			this.fieldBase = new (require('./fieldBase.js'))(this);
			this.fieldDefinitions = {};
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
				_this.fieldDefinitions.markdown = loadFieldDefinition('markdown', require('./../../../fields/client/app.fields.markdown.js'));
				_this.fieldDefinitions.multitext = loadFieldDefinition('multitext', require('./../../../fields/client/app.fields.multitext.js'));
				_this.fieldDefinitions.select = loadFieldDefinition('select', require('./../../../fields/client/app.fields.select.js'));
				_this.fieldDefinitions.text = loadFieldDefinition('text', require('./../../../fields/client/app.fields.text.js'));

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
					.bind('dragover', function(e){
						e.stopPropagation();
						e.preventDefault();
						return;
					})
					.bind('drop', function(e){
						// var event = e.originalEvent;
						// var fileInfo = event.dataTransfer.files[0];
						e.stopPropagation();
						e.preventDefault();
						return;
					})
					.bind('copy', function(e){
						switch(e.target.tagName.toLowerCase()){
							case 'textarea': case 'input': return;break;
						}
						e.stopPropagation();
						e.preventDefault();
						_this.copy();
						return;
					})
					.bind('cut', function(e){
						switch(e.target.tagName.toLowerCase()){
							case 'textarea': case 'input': return;break;
						}
						e.stopPropagation();
						e.preventDefault();
						_this.cut();
						return;
					})
					.bind('paste', function(e){
						switch(e.target.tagName.toLowerCase()){
							case 'textarea': case 'input': return;break;
						}
						e.stopPropagation();
						e.preventDefault();
						_this.paste();
						return;
					})
				;
			}
			bindDropCancel($canvas);
			bindDropCancel(options.elmInstancePathView);
			bindDropCancel(options.elmInstanceTreeView);
			bindDropCancel(options.elmModulePalette);

			it79.fnc(
				{},
				[
					function(it1, data){
						var css = [
							__dirname+'/libs/bootstrap/dist/css/bootstrap.css',
							__dirname+'/libs/px2style/dist/styles.css',
							__dirname+'/broccoli.css',
						];
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
							},
							function(){
								it1.next(data);
							}
						);
					} ,
					function(it1, data){
						_this.gpi(
							'getBootupInfomations',
							{} ,
							function(_bootupInfomations){
								bootupInfomations = _bootupInfomations;
								// console.log('=----=----=', bootupInfomations);
								serverConfig = bootupInfomations.conf;

								it1.next(data);
							}
						);
					},
					function(it1, data){
						// language bank
						_this.lb = new LangBank(bootupInfomations.languageCsv, function(){
							console.log('broccoli: set language "'+options.lang+'"');
							_this.lb.setLang( options.lang );
							// console.log( _this.lb.get('ui_label.close') );
							it1.next(data);
						});
					},
					function(it1, data){
						_this.contentsSourceData = new (require('./contentsSourceData.js'))(_this).init(
							function(){
								it1.next(data);
							}
						);
					} ,
					function(it1, data){
						_this.resourceMgr.init(function(){
							it1.next(data);
						});
					} ,
					function(it1, data){
						_this.drawModulePalette(_this.options.elmModulePalette, function(){
							console.log('broccoli: module palette standby.');
							it1.next(data);
						});
					} ,
					function(it1, data){
						_this.instanceTreeView.init(_this.options.elmInstanceTreeView, function(){
							console.log('broccoli: instanceTreeView standby.');
							it1.next(data);
						});
					} ,
					function(it1, data){
						_this.instancePathView.init(_this.options.elmInstancePathView, function(){
							console.log('broccoli: instancePathView standby.');
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
						console.log('broccoli: init done.');
						// callback(); // <- onPreviewLoad() がコールするので、ここでは呼ばない。
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
		function onPreviewLoad( callback ){
			callback = callback || function(){};
			if(_this.postMessenger===undefined){return;}// broccoli.init() の実行前

			it79.fnc(
				{},
				[
					function( it1, data ){
						// postMessageの送受信を行う準備
						_this.postMessenger.init(function(){
							it1.next(data);
						});
					} ,
					function( it1, data ){
						// 編集画面描画
						_this.redraw(function(){
							it1.next(data);
						});
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
						clearTimeout( redrawTimer );
						redrawTimer = setTimeout(function(){
							it1.next(data);
						}, 100);
					} ,
					function( it1, data ){
						// 編集パネルを一旦消去
						_this.panels.clearPanels(function(){
							it1.next(data);
						});
					} ,
					function( it1, data ){
						// リソースを呼び出し
						_this.resourceMgr.getResourceDb(function(rDb){
							resDb = rDb;
							// console.log(resDb);
							it1.next(data);
						});
					} ,
					function( it1, data ){
						// 編集画面描画
						_this.postMessenger.send(
							'getBowlList',
							{
								'contents_area_selector': _this.options.contents_area_selector ,
								'contents_bowl_name_by': _this.options.contents_bowl_name_by
							},
							function(bowlList){
								if( typeof(bowlList)!==typeof([]) || !bowlList.length ){
									_this.message('FAILED to list bowls.');
									console.log('bowlList - - - - - -', bowlList);
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
									{'bowlList': bowlList},
									function(htmls){
										// console.log('htmls - - - - - - - -', htmls);

										for(var idx in htmls){
											htmls[idx] = (function(src){
												for(var resKey in resDb){
													try {
														src = src.replace('{broccoli-html-editor-resource-baser64:{'+resKey+'}}', resDb[resKey].base64);
													} catch (e) {
													}
												}
												return src;
											})(htmls[idx]);
										}
										// console.log(htmls);

										_this.postMessenger.send(
											'updateHtml',
											{
												'contents_area_selector': _this.options.contents_area_selector ,
												'contents_bowl_name_by': _this.options.contents_bowl_name_by ,
												'htmls': htmls
											},
											function(){
												console.log('broccoli: HTML standby.');
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
						$canvas.find('iframe').width( '100%' );
						_this.postMessenger.send(
							'getHtmlContentHeightWidth',
							{},
							function(hw){
								// console.log(height);
								$canvas.find('iframe').height( hw.h + 0 ).width( hw.w + 0 );
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
						_this.drawPanels( function(){
							console.log('broccoli: draggable panels standby.');
							it1.next(data);
						} );
					} ,
					function( it1, data ){
						// モジュールパレットのサイズ合わせ
						var $elm = $(_this.options.elmModulePalette).find('.broccoli--module-palette-inner');
						var filterHeight = $elm.find('.broccoli--module-palette-filter').outerHeight();
						$elm.find('.broccoli--module-palette-list').css({
							'height': $elm.parent().outerHeight() - filterHeight
						});

						it1.next(data);
					} ,
					function( it1, data ){
						// インスタンスツリービュー描画
						_this.instanceTreeView.update( function(){
							console.log('broccoli: instanceTreeView redoraw : done.');
							it1.next(data);
						} );
					} ,
					function( it1, data ){
						// インスタンスパスビューを更新
						_this.instancePathView.update( function(){
							console.log('broccoli: instancePathView redoraw : done.');
							it1.next(data);
						} );
					} ,
					function(it1, data){
						// 選択状態の復元
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
						callback();
						it1.next();
					}
				]
			);
			return this;
		} // redraw()

		/**
		 * field定義を取得する
		 * @param  {[type]} fieldType [description]
		 * @return {[type]}           [description]
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
		} // getFieldDefinition()

		/**
		 * GPIから値を得る
		 */
		this.gpi = function(api, options, callback){
			options = options || {};
			options.lang = options.lang || this.options.lang;
			this.options.gpiBridge(api, options, callback);
			return this;
		} // gpi()

		/**
		 * 初期起動時にロードした情報を取得する
		 */
		this.getBootupInfomations = function(){
			return bootupInfomations;
		}

		/**
		 * インスタンスを編集する
		 * @param  {[type]} instancePath [description]
		 * @return {[type]}              [description]
		 */
		this.editInstance = function( instancePath ){
			console.log("Edit: "+instancePath);
			var broccoli = this;
			broccoli.selectInstance(instancePath, function(){
				broccoli.lightbox( function( lbElm ){
					broccoli.drawEditWindow( instancePath, lbElm, function(isSave, callback){
						callback = callback || function(){};
						// console.log(callback);
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
								// 画面を再描画
								_this.redraw(function(){
									it1.next(data);
								});
							} ,
							function(it1, data){
								broccoli.closeLightbox(function(){
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
								console.log('editInstance done.');
								callback();
								it1.next(data);
							}
						]);
					} );
				} );
			});
			return this;
		} // editInstance()

		/**
		 * インスタンスを選択する
		 */
		this.selectInstance = function( instancePath, callback ){
			console.log("Select: "+instancePath);
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
								// console.log("Selected: "+broccoli.getSelectedInstance());
								callback();
							});
						});
					});
				});
			});
			return this;
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
				return this;
			}
			console.log("Select Region: from "+selectedInstance+" to "+instancePathRegionTo);
			selectedInstance.match(/^([\s\S]*?)([0-9]*)$/, '$1');
			var commonLayer = RegExp.$1;
			var startNumber = RegExp.$2;

			var idx = instancePathRegionTo.indexOf(commonLayer);
			if(idx !== 0){
				// ずれた階層間での範囲選択はできません。
				console.error('ずれた階層間での範囲選択はできません。');
				callback(false);
				return this;
			}

			var numberTo = instancePathRegionTo.split(commonLayer)[1];
			numberTo.match(/^([0-9]*)/);
			var endNumber = RegExp.$1;

			// 数値にキャスト
			var fromTo = [Number(startNumber), Number(endNumber)].sort();
			// console.log(fromTo);

			selectedInstanceRegion = [];
			for( var i = fromTo[0]; i <= fromTo[1]; i ++ ){
				selectedInstanceRegion.push( commonLayer+i );
			}
			// console.log(selectedInstanceRegion);

			broccoli.panels.updateInstanceSelection(function(){
				broccoli.instanceTreeView.updateInstanceSelection(function(){
					// console.log("Selected: "+broccoli.getSelectedInstance());
					callback();
				});
			});
			return this;
		}

		/**
		 * モジュールインスタンスの選択状態を解除する
		 */
		this.unselectInstance = function(callback){
			callback = callback || function(){};
			selectedInstance = null;
			selectedInstanceRegion = [];
			var broccoli = this;
			broccoli.panels.unselectInstance(function(){
				broccoli.instanceTreeView.unselectInstance(function(){
					broccoli.instancePathView.update(function(){
						callback();
					});
				});
			});
			return this;
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
					if($targetElm.size()){
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
			return this;

		}

		/**
		 * モジュールインスタンスのフォーカス状態を解除する
		 */
		this.unfocusInstance = function(callback){
			callback = callback || function(){};
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
			// console.log(instancePath);
			if( typeof(instancePath) !== typeof('') ){
				callback(false);
				return;
			}

			var data = {};
			data.data = [];
			for( var idx = 0; idx<instancePathRegion.length; idx ++ ){
				data.data.push( this.contentsSourceData.get( instancePathRegion[idx] ) );
			}
			data.resources = {};
			it79.ary(
				data.data,
				function(it1, row1, idx1){
					_this.contentsSourceData.extractResourceId(row1, function(resourceIdList){
						// console.log(resourceIdList);
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
					// console.log(data);
					data = JSON.stringify( data, null, 1 );
					callback(data);
				}
			);
			return;
		}

		/**
		 * 選択したインスタンスをクリップボードへコピーする
		 */
		this.copy = function(callback){
			callback = callback||function(){};
			var instancePath = this.getSelectedInstance();
			// console.log(instancePath);
			if( typeof(instancePath) !== typeof('') ){
				_this.message('インスタンスを選択した状態でコピーしてください。');
				callback(false);
				return;
			}

			this.selectedInstanceToJsonString(function(jsonStr){
				if(jsonStr === false){
					_this.message('インスタンスのコピーに失敗しました。');
					callback(false);
					return;
				}
				_this.clipboard.set( jsonStr );
				_this.message('インスタンスをコピーしました。');
				callback(true);
			});
			return;
		}

		/**
		 * 選択したインスタンスをクリップボードへコピーして削除する
		 */
		this.cut = function(callback){
			callback = callback||function(){};
			var instancePath = this.getSelectedInstance();
			// console.log(instancePath);
			if( typeof(instancePath) !== typeof('') ){
				_this.message('インスタンスを選択した状態でカットしてください。');
				callback(false);
				return;
			}

			this.selectedInstanceToJsonString(function(jsonStr){
				if(jsonStr === false){
					_this.message('インスタンスのコピーに失敗しました。');
					callback(false);
					return;
				}
				_this.clipboard.set( jsonStr );

				_this.remove(function(){
					_this.message('インスタンスをカットしました。');
					callback(true);
				});
			});
			return;
		}

		/**
		 * クリップボードの内容を選択したインスタンスの位置に挿入する
		 */
		this.paste = function(callback){
			var broccoli = this;
			callback = callback||function(){};
			var selectedInstance = this.getSelectedInstance();
			if( typeof(selectedInstance) !== typeof('') ){
				console.log(selectedInstance);
				_this.message('インスタンスを選択した状態でペーストしてください。');
				callback(false);
				return;
			}
			// console.log(selectedInstance);

			var data = this.clipboard.get();
			try {
				data = JSON.parse( data );
			} catch (e) {
				_this.message('クリップボードのデータをデコードできませんでした。');
				console.log('FAILED to decode clipboard.', data);
				callback(false);
				return;
			}
			// console.log(data);

			var isValid = (function(){
				var php = require('phpjs');
				var dataToParent = broccoli.contentsSourceData.get(php.dirname(selectedInstance));
				var modToParent = broccoli.contentsSourceData.getModule(dataToParent.modId);//subModuleの全量を知りたいので、第2引数は渡さない。
				var currentInstanceTo = php.basename(selectedInstance).split('.')[1].split('@');
				// console.log(modToParent);
				// console.log(currentInstanceTo);
				// console.log(dataToParent);
				var typeTo = 'module';
				if( modToParent.subModule && modToParent.subModule[currentInstanceTo[0]] ){
					typeTo = 'loop';
				}

				var modFrom = broccoli.contentsSourceData.getModule(data.data[0].modId, data.data[0].subModName);
				// console.log(modFrom);
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
				_this.message('ここにはペーストできません。');
				callback(false);
				return;
			}

			broccoli.progress(function(){
				it79.ary(
					data.data ,
					function(it1, row1, idx1){
						_this.contentsSourceData.duplicateInstance(data.data[idx1], data.resources, {}, function(newData){
							// console.log(newData);

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
									_this.message('インスタンスをペーストしました。');
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
		 * 選択したインスタンスを削除する
		 */
		this.remove = function(callback){
			callback = callback||function(){};
			var broccoli = this;

			var selectedInstance = _this.getSelectedInstance();
			var selectedInstanceRegion = _this.getSelectedInstanceRegion();
			// console.log(selectedInstance);
			if( typeof(selectedInstance) !== typeof('') ){
				_this.message('インスタンスを選択した状態で削除してください。');
				callback(false);
				return;
			}
			if( selectedInstance.match(new RegExp('^\\/bowl\\.[^\\/]+$')) ){
				_this.message('bowlを削除することはできません。');
				callback(false);
				return;
			}
			selectedInstanceRegion = JSON.parse( JSON.stringify(selectedInstanceRegion) );
			selectedInstanceRegion.reverse();//先頭から削除すると添字がリアルタイムに変わってしまうので、逆順に削除する。

			broccoli.progress(function(){
				it79.ary(
					selectedInstanceRegion,
					function(it1, selectedInstanceRow, idx){
						_this.contentsSourceData.removeInstance(selectedInstanceRow, function(){
							console.log(selectedInstanceRow + ' removed.');
							it1.next();
						});
					},
					function(){
						_this.message('インスタンスを削除しました。');
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
						_this.closeProgress(function(){
							callback();
						});
						return;
					}
					_this.saveContents(function(){
						// 画面を再描画
						_this.redraw(function(){
							_this.closeProgress(function(){
								callback();
							});
						});
					});
				});
			});
			return this;
		}

		/**
		 * history: やりなおし (非同期)
		 */
		this.historyGo = function( callback ){
			callback = callback||function(){};
			_this.progress(function(){
				_this.contentsSourceData.historyGo(function(result){
					if(result === false){callback();return;}
					_this.saveContents(function(){
						// 画面を再描画
						_this.redraw(function(){
							_this.closeProgress(function(){
								callback();
							});
						});
					});
				});
			});
			return this;
		}

		/**
		 * モジュールパレットを描画する
		 * @param  {Object}   moduleList モジュール一覧。
		 * @param  {Element}  targetElm  描画する対象の要素
		 * @param  {Function} callback   callback function.
		 * @return {Object}              this.
		 */
		this.drawModulePalette = function(targetElm, callback){
			require( './drawModulePalette.js' )(_this, targetElm, callback);
			return this;
		}

		/**
		 * 編集用UI(Panels)を描画する
		 * @param  {Function} callback    callback function.
		 * @return {Object}               this.
		 */
		this.drawPanels = function(callback){
			this.panels.init(this.options.elmPanels, callback);
			return this;
		}

		/**
		 * 編集ウィンドウを描画する
		 */
		this.drawEditWindow = function(instancePath, elmEditWindow, callback){
			this.editWindow.init(instancePath, elmEditWindow, callback);
			return this;
		}

		/**
		 * ライトボックスを表示する
		 */
		this.lightbox = function( callback ){
			callback = callback||function(){};

			var $dom = $('<div>')
				.addClass('broccoli--lightbox-inner')
			;

			$('body').find('.broccoli--lightbox').remove();//一旦削除
			$('.broccoli *').attr({'tabindex':'-1'});
			$('body')
				.append( $('<div class="broccoli broccoli--lightbox">')
					// dropイベントをキャンセル
					.bind('dragover', function(e){
						e.stopPropagation();
						e.preventDefault();
						return;
					}).bind('drop', function(e){
						e.stopPropagation();
						e.preventDefault();
						return;
					})
					.append( $dom )
				)
			;

			callback( $dom.get(0) );
			return this;
		}

		/**
		 * ライトボックスを閉じる
		 */
		this.closeLightbox = function( callback ){
			callback = callback||function(){};
			$('body').find('.broccoli--lightbox')
				.fadeOut(
					'fast',
					function(){
						$(this).remove();
						$('.broccoli *').removeAttr('tabindex');
						$('.broccoli .broccoli--panel').attr({'tabindex':'1'});
						$('.broccoli .broccoli--instance-tree-view-panel-item').attr({'tabindex':'1'});
						callback();
					}
				)
			;
			return this;
		}

		/**
		 * プログレスを表示する
		 */
		this.progress = function( callback ){
			callback = callback||function(){};
			$('body').find('.broccoli--progress').remove();//一旦削除
			$('body')
				.append( $('<div class="broccoli broccoli--progress">')
					.append( $('<div class="broccoli broccoli--progress-inner">')
						.append( $('<div class="broccoli broccoli--progress-inner2">')
							.append( $('<div class="px2-loading">') )
							.append( $('<div class="broccoli--progress-comment">') )
						)
					)
				)
			;
			var dom = $('body').find('.px2-loading').get(0);
			callback(dom);
			return this;
		}

		/**
		 * プログレス表示中にメッセージを表示する
		 * プログレス表示中でなければ無視する。
		 */
		this.progressMessage = function(str){
			console.log(str);
			var $userMessage = $('.broccoli--progress-comment');
			$userMessage.text(str);
		}

		/**
		 * プログレスを閉じる
		 */
		this.closeProgress = function( callback ){
			callback = callback||function(){};
			var $progress = $('body').find('.broccoli--progress');
			if( !$progress.size() ){
				callback();
				return this;
			}
			$progress
				.fadeOut(
					'fast',
					function(){
						$(this).remove();
						callback();
					}
				)
			;
			return this;
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
			return this;
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
		 * コンテンツデータを保存する
		 */
		this.saveContents = function(callback){
			callback = callback || function(){};
			it79.fnc({},[
				function(it1, data){
					// コンテンツを保存
					_this.progressMessage('コンテンツデータを保存しています...');
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
					_this.progressMessage('コンテンツを更新しています...');
					_this.gpi(
						'updateContents',
						{} ,
						function(result){
							// console.log(result);
							it1.next(data);
						}
					);
				} ,
				function(it1, data){
					// console.log('editInstance done.');
					_this.progressMessage('コンテンツを保存しました。');
					_this.message('コンテンツを保存しました。');
					callback(true);
					it1.next(data);
				}
			]);
			return this;
		}

		/**
		 * ejs テンプレートにデータをバインドする
		 */
		this.bindEjs = function( tpl, data, options ){
			var ejs = require('ejs');
			var rtn = '';
			try {
				var template = ejs.compile(tpl.toString(), options);
				rtn = template(data);
			} catch (e) {
				var errorMessage = 'TemplateEngine "EJS" Rendering ERROR.';
				console.error( errorMessage );
				rtn = errorMessage;
			}

			return rtn;
		}

	}

})(module);
