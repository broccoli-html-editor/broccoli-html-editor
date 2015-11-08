(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function(window){
	window.Broccoli = require('./libs/broccoli-client.js');
})(window);

},{"./libs/broccoli-client.js":2}],2:[function(require,module,exports){
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
		var selectedInstance = null;
		var $canvas;
		var redrawTimer;
		this.__dirname = __dirname;

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
			this.options = options;

			$canvas = $(options.elmCanvas);
			$canvas
				.addClass('broccoli')
				.addClass('broccoli--canvas')
				.append( $('<iframe>')
					.bind('load', function(){
						onPreviewLoad( callback );
					})
				)
				.append( $('<div class="broccoli--panels">')
				)
				// .append( $('<div class="broccoli--instance-path-view">')
				// )
			;
			// this.options.elmIframeWindow = $canvas.find('iframe').get(0).contentWindow;
			this.options.elmPanels = $canvas.find('.broccoli--panels').get(0);
			// this.options.elmInstancePathView = $canvas.find('.broccoli--instance-path-view').get(0);

			this.postMessenger = new (require('./postMessenger.js'))(this, $canvas.find('iframe').get(0));
			this.resourceMgr = new (require('./resourceMgr.js'))(this);
			this.panels = new (require( './panels.js' ))(this);
			this.instancePathView = new (require( './instancePathView.js' ))(this);
			this.instanceTreeView = new (require( './instanceTreeView.js' ))(this);
			this.editWindow = new (require( './editWindow.js' ))(this);
			this.fieldBase = new (require('./../../../libs/fieldBase.js'))(this);
			this.fieldDefinitions = {};
			function loadFieldDefinition(){
				function loadFieldDefinition(fieldId, mod){
					var rtn = _.defaults( new (mod)(_this), _this.fieldBase );
					rtn.__fieldId__ = fieldId;
					return rtn;
				}
				_this.fieldDefinitions.href = loadFieldDefinition('href', require('./../../../libs/fields/app.fields.href.js'));
				_this.fieldDefinitions.html = loadFieldDefinition('html', require('./../../../libs/fields/app.fields.html.js'));
				_this.fieldDefinitions.html_attr_text = loadFieldDefinition('html_attr_text', require('./../../../libs/fields/app.fields.html_attr_text.js'));
				_this.fieldDefinitions.image = loadFieldDefinition('image', require('./../../../libs/fields/app.fields.image.js'));
				_this.fieldDefinitions.markdown = loadFieldDefinition('markdown', require('./../../../libs/fields/app.fields.markdown.js'));
				_this.fieldDefinitions.multitext = loadFieldDefinition('multitext', require('./../../../libs/fields/app.fields.multitext.js'));
				_this.fieldDefinitions.select = loadFieldDefinition('select', require('./../../../libs/fields/app.fields.select.js'));
				_this.fieldDefinitions.text = loadFieldDefinition('text', require('./../../../libs/fields/app.fields.text.js'));

				if( _this.options.customFields ){
					for( var idx in _this.options.customFields ){
						_this.fieldDefinitions[idx] = loadFieldDefinition( idx, _this.options.customFields[idx] );
					}
				}

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
						_this.resourceMgr.init(function(){
							it1.next(data);
						});
					} ,
					function(it1, data){
						_this.drawModulePalette(function(){
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
						callback();
						it1.next();
					}
				]
			);
			return this;
		}

		/**
		 * 画面を再描画
		 * @return {[type]} [description]
		 */
		this.redraw = function(callback){
			callback = callback || function(){};

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
						// 編集画面描画
						_this.gpi(
							'buildHtml',
							{},
							function(htmls){
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
					} ,
					function( it1, data ){
						// ちょっと間を置く
						setTimeout(function(){
							it1.next(data);
						},100);
					} ,
					function( it1, data ){
						// iframeのサイズ合わせ
						_this.postMessenger.send(
							'getHtmlContentHeight',
							{},
							function(height){
								// console.log(height);
								$canvas.find('iframe').height( height + 16 );
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
						// インスタンスツリービュー描画
						_this.instanceTreeView.update( function(){
							it1.next(data);
						} );
					} ,
					function( it1, data ){
						// インスタンスパスビューを更新
						_this.instancePathView.update( function(){
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
			$canvas.find('.broccoli--lightbox').remove();
			$canvas
				.append( $('<div class="broccoli--lightbox">')
					.append( $('<div class="broccoli--lightbox-inner">')
					)
				)
			;
			this.drawEditWindow( instancePath, $canvas.find('.broccoli--lightbox-inner').get(0), function(){
				$canvas.find('.broccoli--lightbox').fadeOut('fast',function(){$(this).remove();});
				it79.fnc({},[
					function(it1, data){
						// 編集パネルを一旦消去
						_this.panels.clearPanels(function(){
							it1.next(data);
						});
					} ,
					function(it1, data){
						// コンテンツデータを保存
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
						console.log('editInstance done.');
						it1.next(data);
					}
				]);
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
				_this.instancePathView.update(function(){
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
			this.panels.unselectInstance(function(){
				_this.instancePathView.update(function(){
					callback();
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
			var _this = this;
			this.unfocusInstance();//一旦選択解除
			this.panels.focusInstance(instancePath, function(){

				var $targetElm = $(_this.panels.getPanelElement(instancePath));
				if($targetElm.size()){
					var top = $canvas.scrollTop() + $targetElm.offset().top - 30;
					$canvas.stop().animate({"scrollTop":top} , 'fast' );
				}

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
			this.panels.init(this.options.elmPanels, callback);
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

		/**
		 * コンテンツデータを保存する
		 */
		this.saveContents = function(callback){
			callback = callback || function(){};
			it79.fnc({},[
				function(it1, data){
					// コンテンツを保存
					_this.contentsSourceData.save(function(){
						it1.next(data);
					});
				} ,
				function(it1, data){
					// リソースを保存
					_this.resourceMgr.save(function(){
						it1.next(data);
					});
				} ,
				function(it1, data){
					// console.log('editInstance done.');
					callback();
					it1.next(data);
				}
			]);
			return this;
		}

	}
})(module);

},{"./../../../libs/fieldBase.js":12,"./../../../libs/fields/app.fields.href.js":13,"./../../../libs/fields/app.fields.html.js":14,"./../../../libs/fields/app.fields.html_attr_text.js":15,"./../../../libs/fields/app.fields.image.js":16,"./../../../libs/fields/app.fields.markdown.js":17,"./../../../libs/fields/app.fields.multitext.js":18,"./../../../libs/fields/app.fields.select.js":19,"./../../../libs/fields/app.fields.text.js":20,"./contentsSourceData.js":3,"./drawModulePalette.js":4,"./editWindow.js":5,"./instancePathView.js":7,"./instanceTreeView.js":8,"./panels.js":9,"./postMessenger.js":10,"./resourceMgr.js":11,"iterate79":24,"jquery":25,"underscore":30}],3:[function(require,module,exports){
/**
 * contentsSourceData.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);

	var _this = this;
	this.broccoli = broccoli;

	var _ = require('underscore');
	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');

	var _contentsSourceData; // <= data.jsonの中身
	var _modTpls; // <- module の一覧

	/**
	 * 初期化
	 */
	this.init = function( callback ){
		_this.history = new (require('./history.js'))(broccoli);
		it79.fnc(
			{},
			[
				function(it1, data){
					// モジュール一覧を取得
					broccoli.gpi('getAllModuleList',{},function(list){
						_modTpls = list;
						it1.next(data);
					});
				} ,
				function(it1, data){
					// コンテンツデータを取得
					broccoli.gpi(
						'getContentsDataJson',
						{},
						function(contentsData){
							_contentsSourceData = contentsData;
							// console.log(_contentsSourceData);
							_contentsSourceData.bowl = _contentsSourceData.bowl||{};
							_this.initBowlData('main');
							// console.log(_contentsSourceData);
							it1.next(data);
						}
					);
				} ,
				function(it1, data){
					// ヒストリーマネージャーの初期化
					_this.history.init(
						_contentsSourceData,
						function(){
							it1.next(data);
						}
					);
				} ,
				function(it1, data){
					// console.log(_contentsSourceData);
					callback();
				}
			]
		);

		return this;
	}// init()

	/**
	 * データを取得する (同期)
	 */
	this.get = function( containerInstancePath, data ){
		data = data || _contentsSourceData;

		if( containerInstancePath === undefined || !containerInstancePath.length ){
			return data;
		}
		var aryPath = this.parseInstancePath( containerInstancePath );
		if( !aryPath.length ){
			return data;
		}

		var cur = aryPath.shift();
		var idx = null;
		var tmpSplit = cur.split('@');
		cur = tmpSplit[0];
		if( tmpSplit.length >=2 ){
			idx = Number(tmpSplit[1]);
		}
		var tmpCur = cur.split('.');
		var container = tmpCur[0];
		var fieldName = tmpCur[1];
		var modTpl = _this.getModule( data.modId, data.subModName );

		if( container == 'bowl' ){
			return this.get( aryPath, data.bowl[fieldName] );
		}

		if( !aryPath.length ){
			// ここが最後のインスタンスだったら
			if( !data.fields ){
				data.fields = {};
			}
			if( !data.fields[fieldName] ){
				data.fields[fieldName] = [];
			}
			if( modTpl.fields[fieldName].fieldType == 'input'){
				return data.fields[fieldName];
			}else if( modTpl.fields[fieldName].fieldType == 'module'){
				data.fields[fieldName] = data.fields[fieldName]||[];
				return data.fields[fieldName][idx];
			}else if( modTpl.fields[fieldName].fieldType == 'loop'){
				data.fields[fieldName] = data.fields[fieldName]||[];
				return data.fields[fieldName][idx];
			}else if( modTpl.fields[fieldName].fieldType == 'if'){
			}else if( modTpl.fields[fieldName].fieldType == 'echo'){
			}
		}else{
			// もっと深かったら
			if( modTpl.fields[fieldName].fieldType == 'input'){
				return this.get( aryPath, data.fields[fieldName] );
			}else if( modTpl.fields[fieldName].fieldType == 'module'){
				return this.get( aryPath, data.fields[fieldName][idx] );
			}else if( modTpl.fields[fieldName].fieldType == 'loop'){
				return this.get( aryPath, data.fields[fieldName][idx] );
			}else if( modTpl.fields[fieldName].fieldType == 'if'){
			}else if( modTpl.fields[fieldName].fieldType == 'echo'){
			}
		}
		return false;
	}

	/**
	 * 指定したインスタンスパスの子ノードの一覧を取得 (非同期)
	 */
	this.getChildren = function( containerInstancePath, callback ){
		callback = callback|| function(){};
		var current = this.get(containerInstancePath);
		var modTpl = _this.getModule( current.modId, current.subModName );
		var targetFieldNames = {};
		for( var fieldName in modTpl.fields ){
			switch( modTpl.fields[fieldName].fieldType ){
				case 'module':
				case 'loop':
					targetFieldNames[fieldName] = modTpl.fields[fieldName].fieldType;
					break;
			}
		}
		var rtn = [];
		for( var fieldName in targetFieldNames ){
			for( var idx in current.fields[fieldName] ){
				rtn.push(containerInstancePath+'/fields.'+fieldName+'@'+idx);
			}
		}
		callback(rtn);
		return this;
	}

	/**
	 * インスタンスを追加する (非同期)
	 */
	this.addInstance = function( modId, containerInstancePath, cb, subModName ){
		// console.log( '開発中: '+modId+': '+containerInstancePath );
		cb = cb||function(){};

		var newData = {};
		if( typeof(modId) === typeof('') ){
			newData = new (function(){
				this.modId = modId ,
				this.fields = {}
				if( typeof(subModName) === typeof('') ){
					this.subModName = subModName;
				}
			})(modId, subModName);
			var modTpl = _this.getModule( newData.modId, subModName );

			// 初期データ追加
			var fieldList = _.keys( modTpl.fields );
			for( var idx in fieldList ){
				var fieldName = fieldList[idx];
				if( modTpl.fields[fieldName].fieldType == 'input' ){
					newData.fields[fieldName] = broccoli.getFieldDefinition(modTpl.fields[fieldName].type).normalizeData('');
				}else if( modTpl.fields[fieldName].fieldType == 'module' ){
					newData.fields[fieldName] = [];
				}else if( modTpl.fields[fieldName].fieldType == 'loop' ){
					newData.fields[fieldName] = [];
				}else if( modTpl.fields[fieldName].fieldType == 'if' ){
				}else if( modTpl.fields[fieldName].fieldType == 'echo' ){
				}
			}
		}else{
			newData = JSON.parse( JSON.stringify(modId) );
		}

		var containerInstancePath = this.parseInstancePath( containerInstancePath );
		// console.log( containerInstancePath );

		function set_r( aryPath, data, newData ){
			// console.log( data );
			var cur = aryPath.shift();
			var idx = null;
			var tmpSplit = cur.split('@');
			cur = tmpSplit[0];
			if( tmpSplit.length >=2 ){
				idx = Number(tmpSplit[1]);
				// console.log(idx);
			}
			var tmpCur = cur.split('.');
			var container = tmpCur[0];
			var fieldName = tmpCur[1];
			var modTpl = _this.getModule( data.modId, data.subModName );

			if( container == 'bowl' ){
				// ルート要素だったらスキップして次へ
				return set_r( aryPath, data.bowl[fieldName], newData );
			}

			if( !aryPath.length ){
				// ここが最後のインスタンスだったら
				if( !data.fields ){
					data.fields = {};
				}
				if( !data.fields[fieldName] ){
					data.fields[fieldName] = [];
				}
				if( modTpl.fields[fieldName].fieldType == 'input'){
					data.fields[fieldName] = newData;
				}else if( modTpl.fields[fieldName].fieldType == 'module'){
					data.fields[fieldName] = data.fields[fieldName]||[];
					data.fields[fieldName].splice( idx, 0, newData);
				}else if( modTpl.fields[fieldName].fieldType == 'loop'){
					data.fields[fieldName] = data.fields[fieldName]||[];
					data.fields[fieldName].splice( idx, 0, newData);
				}else if( modTpl.fields[fieldName].fieldType == 'if'){
				}else if( modTpl.fields[fieldName].fieldType == 'echo'){
				}
				return true;
			}else{
				// もっと深かったら
				if( modTpl.fields[fieldName].fieldType == 'input'){
					return set_r( aryPath, data.fields[fieldName], newData );
				}else if( modTpl.fields[fieldName].fieldType == 'module'){
					return set_r( aryPath, data.fields[fieldName][idx], newData );
				}else if( modTpl.fields[fieldName].fieldType == 'loop'){
					return set_r( aryPath, data.fields[fieldName][idx], newData );
				}else if( modTpl.fields[fieldName].fieldType == 'if'){
				}else if( modTpl.fields[fieldName].fieldType == 'echo'){
				}
			}

		} // set_r()

		set_r( containerInstancePath, _contentsSourceData, newData );

		cb();

		return this;
	}// addInstance()

	/**
	 * インスタンスを更新する
	 */
	this.updateInstance = function( newData, containerInstancePath, cb ){
		// console.log( '開発中: '+containerInstancePath );
		cb = cb||function(){};

		var containerInstancePath = this.parseInstancePath( containerInstancePath );
		// console.log( containerInstancePath );

		function set_r( aryPath, data, newData ){
			// console.log( data );
			var cur = aryPath.shift();
			var idx = null;
			var tmpSplit = cur.split('@');
			cur = tmpSplit[0];
			if( tmpSplit.length >=2 ){
				idx = Number(tmpSplit[1]);
				// console.log(idx);
			}
			var tmpCur = cur.split('.');
			var container = tmpCur[0];
			var fieldName = tmpCur[1];
			var modTpl = _this.getModule( data.modId, data.subModName );

			if( container == 'bowl' ){
				// ルート要素だったら
				if(!aryPath.length){
					// 対象がルート要素だったら
					return;
				}
				// スキップして次へ
				return set_r( aryPath, data.bowl[fieldName], newData );
			}

			if( !aryPath.length ){
				// ここが最後のインスタンスだったら
				if( !data.fields ){
					data.fields = {};
				}
				if( !data.fields[fieldName] ){
					data.fields[fieldName] = [];
				}
				if( modTpl.fields[fieldName].fieldType == 'input'){
					data.fields[fieldName] = newData;
				}else if( modTpl.fields[fieldName].fieldType == 'module'){
					data.fields[fieldName] = data.fields[fieldName]||[];
					data.fields[fieldName][idx] = newData;
				}else if( modTpl.fields[fieldName].fieldType == 'loop'){
					data.fields[fieldName] = data.fields[fieldName]||[];
					data.fields[fieldName][idx] = newData;
				}else if( modTpl.fields[fieldName].fieldType == 'if'){
				}else if( modTpl.fields[fieldName].fieldType == 'echo'){
				}
				return;
			}else{
				// もっと深かったら
				if( modTpl.fields[fieldName].fieldType == 'input'){
					return set_r( aryPath, data.fields[fieldName], newData );
				}else if( modTpl.fields[fieldName].fieldType == 'module'){
					return set_r( aryPath, data.fields[fieldName][idx], newData );
				}else if( modTpl.fields[fieldName].fieldType == 'loop'){
					return set_r( aryPath, data.fields[fieldName][idx], newData );
				}else if( modTpl.fields[fieldName].fieldType == 'if'){
				}else if( modTpl.fields[fieldName].fieldType == 'echo'){
				}
				return;
			}

			return;
		}

		set_r( containerInstancePath, _contentsSourceData, newData );

		cb();

		return this;
	}// updateInstance()

	/**
	 * インスタンスを移動する
	 */
	this.moveInstanceTo = function( fromContainerInstancePath, toContainerInstancePath, cb ){
		cb = cb||function(){};

		function parseInstancePath(path){
			function parsePath( path ){
				function escapeRegExp(str) {
					if( typeof(str) !== typeof('') ){return str;}
					return str.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1");
				}
				var rtn = {};
				rtn.path = path;
				rtn.basename = php.basename( rtn.path );
				rtn.dirname = php.dirname( rtn.path );
				rtn.ext = rtn.basename.replace( new RegExp('^.*\\.'), '' );
				rtn.basenameExtless = rtn.basename.replace( new RegExp('\\.'+escapeRegExp(rtn.ext)+'$'), '' );
				return rtn;
			}
			var rtn = {};
			rtn = parsePath( path );
			var basenameParse = rtn.basename.split('@');
			rtn.container = rtn.dirname+'/'+basenameParse[0];
			rtn.num = Number(basenameParse[1]);
			return rtn;
		}

		var fromParsed = parseInstancePath(fromContainerInstancePath);
		var toParsed = parseInstancePath(toContainerInstancePath);

		var dataFrom = this.get( fromContainerInstancePath );
		dataFrom = JSON.parse(JSON.stringify( dataFrom ));//←オブジェクトのdeepcopy

		if( fromParsed.container == toParsed.container ){
			// 同じ箱の中での並び替え
			if( fromParsed.num == toParsed.num ){
				// to と from が一緒だったら何もしない。
				cb();
				return this;
			}
			if( fromParsed.num < toParsed.num ){
				// 上から1つ以上下へ
				toContainerInstancePath = toParsed.container + '@' + ( toParsed.num-1 );
			}
			this.removeInstance(fromContainerInstancePath);
			this.addInstance( dataFrom.modId, toContainerInstancePath );
			this.updateInstance( dataFrom, toContainerInstancePath );
			cb();
		}else if( toParsed.path.indexOf(fromParsed.path) === 0 ){
			console.log('自分の子階層へ移動することはできません。');
			cb();
		}else if( fromParsed.path.indexOf(toParsed.container) === 0 ){
			this.removeInstance(fromParsed.path);
			this.addInstance( dataFrom.modId, toContainerInstancePath );
			this.updateInstance( dataFrom, toContainerInstancePath );
			cb();
		}else{
			// まったく関連しない箱への移動
			this.addInstance( dataFrom.modId, toContainerInstancePath );
			this.updateInstance( dataFrom, toContainerInstancePath );
			this.removeInstance(fromContainerInstancePath);
			cb();
		}

		return this;
	}

	/**
	 * インスタンスを複製する(非同期)
	 *
	 * このメソッドは、インスタンスパスではなく、インスタンスの実体を受け取ります。
	 */
	this.duplicateInstance = function( objInstance, callback ){
		callback = callback || function(){};
		var newData = JSON.parse( JSON.stringify( objInstance ) );
		var modTpl = _this.getModule( objInstance.modId, objInstance.subModName );

		// 初期データ追加
		var fieldList = _.keys( modTpl.fields );
		for( var idx in fieldList ){
			var fieldName = fieldList[idx];
			if( modTpl.fields[fieldName].fieldType == 'input' ){
				newData.fields[fieldName] = broccoli.getFieldDefinition(modTpl.fields[fieldName].type).duplicateData( objInstance.fields[fieldName] );
			}else if( modTpl.fields[fieldName].fieldType == 'module' ){
				for( var idx in objInstance.fields[fieldName] ){
					newData.fields[fieldName][idx] = this.duplicateInstance( objInstance.fields[fieldName][idx] );
				}
			}else if( modTpl.fields[fieldName].fieldType == 'loop' ){
				for( var idx in objInstance.fields[fieldName] ){
					newData.fields[fieldName][idx] = this.duplicateInstance( objInstance.fields[fieldName][idx] );
				}
			}else if( modTpl.fields[fieldName].fieldType == 'if' ){
			}else if( modTpl.fields[fieldName].fieldType == 'echo' ){
			}
		}

		// setTimeout( function(){ cb(newData); }, 0 );
		callback(newData);
		return this;
	}

	/**
	 * インスタンスを削除する(非同期)
	 */
	this.removeInstance = function( containerInstancePath, cb ){
		cb = cb||function(){};

		var containerInstancePath = this.parseInstancePath( containerInstancePath );

		function remove_r( aryPath, data ){
			if( !aryPath.length ){
				return false;
			}
			var cur = aryPath.shift();
			var idx = null;
			var tmpSplit = cur.split('@');
			cur = tmpSplit[0];
			if( tmpSplit.length >=2 ){
				idx = Number(tmpSplit[1]);
			}
			var tmpCur = cur.split('.');
			var container = tmpCur[0];
			var fieldName = tmpCur[1];
			var modTpl = _this.getModule( data.modId, data.subModName );

			if( container == 'bowl' ){
				// ルート要素だったらスキップして次へ
				return remove_r( aryPath, data.bowl[fieldName] );
			}

			if( !aryPath.length ){
				// ここが最後のインスタンスだったら
				if( !data.fields ){
					data.fields = {};
				}
				if( !data.fields[fieldName] ){
					data.fields[fieldName] = [];
				}
				if( modTpl.fields[fieldName].fieldType == 'input'){
					delete data.fields[fieldName];
				}else if( modTpl.fields[fieldName].fieldType == 'module'){
					data.fields[fieldName].splice(idx, 1);
				}else if( modTpl.fields[fieldName].fieldType == 'loop'){
					data.fields[fieldName].splice(idx, 1);
				}else if( modTpl.fields[fieldName].fieldType == 'if'){
				}else if( modTpl.fields[fieldName].fieldType == 'echo'){
				}
				return true;
			}else{
				// もっと深かったら
				if( modTpl.fields[fieldName].fieldType == 'input'){
					return remove_r( aryPath, data.fields[fieldName] );
				}else if( modTpl.fields[fieldName].fieldType == 'module'){
					return remove_r( aryPath, data.fields[fieldName][idx] );
				}else if( modTpl.fields[fieldName].fieldType == 'loop'){
					return remove_r( aryPath, data.fields[fieldName][idx] );
				}else if( modTpl.fields[fieldName].fieldType == 'if'){
				}else if( modTpl.fields[fieldName].fieldType == 'echo'){
				}
			}
			return true;
		}

		remove_r( containerInstancePath, _contentsSourceData );

		cb();

		return this;
	}// removeInstance()

	/**
	 * インスタンスのパスを解析する(同期)
	 */
	this.parseInstancePath = function( containerInstancePath ){
		if( typeof(containerInstancePath) === typeof([]) ){
			return containerInstancePath;
		}
		// console.log(containerInstancePath);
		containerInstancePath = containerInstancePath||'';
		if( !containerInstancePath ){ containerInstancePath = '/fields.main'; }
		containerInstancePath = containerInstancePath.replace( new RegExp('^\\/*'), '' );
		containerInstancePath = containerInstancePath.replace( new RegExp('\\/*$'), '' );
		containerInstancePath = containerInstancePath.split('/');
		// console.log(containerInstancePath);
		return containerInstancePath;
	}

	/**
	 * bowl別のコンテンツデータを初期化する
	 */
	this.initBowlData = function( bowlName ){
		bowlName = bowlName||'main';
		if( _contentsSourceData.bowl[bowlName] ){
			return true;
		}
		_contentsSourceData.bowl[bowlName] = _contentsSourceData.bowl[bowlName]||{
			'modId':'_sys/root',
			'fields':{}
		};
		return true;
	}

	/**
	 * bowl別のコンテンツデータを取得
	 */
	this.getBowlData = function( bowlName ){
		bowlName = bowlName||'main';
		if( !_contentsSourceData.bowl[bowlName] ){
			return false;
		}
		return _contentsSourceData.bowl[bowlName];
	}

	/**
	 * bowl別のコンテンツデータをセット
	 */
	this.setBowlData = function( bowlName, data ){
		bowlName = bowlName||'main';
		_contentsSourceData.bowl[bowlName] = data;
		return;
	}

	/**
	 * bowlの一覧を取得
	 */
	this.getBowlList = function(){
		var rtn = [];
		for(var bowlName in _contentsSourceData.bowl){
			rtn.push(bowlName);
		}
		return rtn;
	}

	/**
	 * モジュールを取得
	 */
	this.getModule = function( modId, subModName ){
		var rtn = _modTpls[modId];
		if( typeof( rtn ) !== typeof({}) ){
			return false;
		}
		if( typeof(subModName) === typeof('') ){
			// console.log(subModName);
			// console.log(rtn.subModule[subModName]);
			return rtn.subModule[subModName];
		}
		return rtn;
	}

	/**
	 * すべてのモジュールを取得
	 */
	this.getAllModules = function(){
		return _modTpls;
	}

	/**
	 * history: 取り消し (非同期)
	 */
	this.historyBack = function( cb ){
		cb = cb || function(){};
		var data = this.history.back();
		if( data === false ){
			cb(false);
			return this;
		}
		_contentsSourceData = data;
		cb(true);
		return this;
	}

	/**
	 * history: やりなおし (非同期)
	 */
	this.historyGo = function( cb ){
		cb = cb || function(){};
		var data = this.history.go();
		if( data === false ){
			cb(false);
			return this;
		}
		_contentsSourceData = data;
		cb(true);
		return this;
	}

	/**
	 * データを保存する(非同期)
	 */
	this.save = function(callback){
		var _this = this;
		callback = callback||function(){};
		it79.fnc(
			{},
			[
				function( it1, data ){
					broccoli.gpi(
						'saveContentsData',
						{
							'data': _contentsSourceData
						},
						function(){
							it1.next(data);
						}
					);
				} ,
				function( it1, data ){
					// 履歴に追加
					_this.history.put( _contentsSourceData, function(){
						it1.next(data);
					} );
				} ,
				function( it1, data ){
					callback();
					it1.next(data);
				}
			]
		);
		return this;
	}

}

},{"./history.js":6,"iterate79":24,"path":22,"phpjs":28,"underscore":30}],4:[function(require,module,exports){
/**
 * drawModulePalette.js
 */
module.exports = function(broccoli, callback){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ callback(); return false; } // client side only
	var targetElm = broccoli.options.elmModulePalette;
	// console.log(moduleList);
	// console.log(targetElm);

	var _this = this;
	callback = callback || function(){};
	var moduleList = {};

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var twig = require('twig');
	var $ = require('jquery');

	// カテゴリの階層を描画
	function drawCategories(categories, $ul, callback){
		it79.ary(
			categories ,
			function(it1, category, categoryId){
				var $liCat = $('<li>');
				var $ulMod = $('<ul>');
				$liCat.append( $('<a>')
					.text(category.categoryName)
					.attr({'href':'javascript:;'})
					.click(function(){
						$(this).toggleClass('broccoli--module-palette__closed');
						$ulMod.toggle(100)
					})
				);
				$ul.append( $liCat );

				drawModules(
					category.modules,
					$ulMod,
					function(){
						$liCat.append($ulMod);
						it1.next();
					}
				);
			} ,
			function(){
				callback();
			}
		);
		return;
	}

	// モジュールの階層を描画
	function drawModules(modules, $ul, callback){
		it79.ary(
			modules ,
			function(it1, module, moduleId){
				var $liMod = $('<li>');
				$liMod.append( $('<button>')
					.html((function(d){
						var rtn = '';
						var label = d.moduleName;
						var thumb = null;
						if(d.thumb){
							thumb = d.thumb;
						}
						if(thumb){
							rtn += '<img src="'+php.htmlspecialchars( thumb )+'" alt="'+php.htmlspecialchars( label )+'" style="width:40px; margin-right:5px;" />';
						}
						rtn += php.htmlspecialchars( label );
						return rtn;
					})(module))
					.attr({
						'title': module.moduleName,
						'data-id': module.moduleId,
						'draggable': true //←HTML5のAPI http://www.htmq.com/dnd/
					})
					.on('dragstart', function(e){
						// px.message( $(this).data('id') );
						event.dataTransfer.setData('method', 'add' );
						event.dataTransfer.setData('modId', $(this).attr('data-id') );
					})
				);
				$ul.append( $liMod );

				it1.next();
			} ,
			function(){
				callback();
			}
		);
		return;
	}

	it79.fnc(
		{},
		[
			function(it1, data){
				broccoli.gpi('getModulePackageList',{},function(list){
					moduleList = list;
					it1.next(data);
				});
			} ,
			function(it1, data){
				$(targetElm)
					.html('loading...')
					.removeClass('broccoli').addClass('broccoli')
					.removeClass('broccoli--module-palette').addClass('broccoli--module-palette')
				;
				data.$ul = $('<ul>');
				it1.next(data);
			} ,
			function(it1, data){
				// パッケージの階層を描画
				it79.ary(
					moduleList ,
					function(it2, pkg, packageId){
						var $li = $('<li>');
						var $ulCat = $('<ul>');
						$li.append( $('<a>')
							.text( pkg.packageName )
							.attr({'href':'javascript:;'})
							.click(function(){
								$(this).toggleClass('broccoli--module-palette__closed');
								$ulCat.toggle(100)
							})
						);

						drawCategories(
							pkg.categories,
							$ulCat,
							function(){
								$li.append($ulCat);
								data.$ul.append( $li );
								it2.next();
							}
						);
					} ,
					function(){
						it1.next(data);
					}
				);
			} ,
			function(it1, data){
				$(targetElm).html('').append(data.$ul);

				callback();
				it1.next(data);
			}
		]
	);

	return;
}

},{"iterate79":24,"jquery":25,"path":22,"phpjs":28,"twig":29}],5:[function(require,module,exports){
/**
 * editWindow.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ callback(); return false; }

	var _this = this;

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var $ = require('jquery');

	var $editWindow;
	var tplFrame = '';
	tplFrame += '<div class="broccoli--edit-window">';
	tplFrame += '	<form action="javascript:;">';
	tplFrame += '		<h2 class="broccoli--edit-window-module-name">---</h2>';
	tplFrame += '		<div class="broccoli--edit-window-fields">';
	tplFrame += '		</div>';
	tplFrame += '		<div class="broccoli--edit-window-builtin-fields">';
	tplFrame += '			<div class="form-group">';
	tplFrame += '				<label for="broccoli--edit-window-builtin-anchor-field">アンカー</label>';
	tplFrame += '				<input type="text" class="form-control" id="broccoli--edit-window-builtin-anchor-field" placeholder="">';
	tplFrame += '			</div>';
	tplFrame += '			<div class="form-group">';
	tplFrame += '				<label for="broccoli--edit-window-builtin-dec-field">埋め込みコメント入力欄</label>';
	tplFrame += '				<textarea class="form-control" id="broccoli--edit-window-builtin-dec-field" placeholder=""></textarea>';
	tplFrame += '			</div>';
	tplFrame += '		</div>';
	tplFrame += '		<div class="broccoli--edit-window-form-buttons">';
	tplFrame += '			<div class="btn-group btn-group-justified" role="group">';
	tplFrame += '				<div class="btn-group">';
	tplFrame += '					<button disabled="disabled" type="submit" class="btn btn-primary btn-lg">OK</button>';
	tplFrame += '				</div>';
	tplFrame += '			</div>';
	tplFrame += '			<div class="btn-group" role="group" style="margin-top:20px;">';
	tplFrame += '				<div class="btn-group">';
	tplFrame += '					<button disabled="disabled" type="button" class="btn btn-danger btn-sm broccoli--edit-window-btn-remove">このモジュールを削除する</button>';
	tplFrame += '				</div>';
	tplFrame += '			</div>';
	tplFrame += '		</div>';
	tplFrame += '	</form>';
	tplFrame += '</div>';

	var tplField = '';
	tplField += '<div class="broccoli--edit-window-field">';
	tplField += '	<h3>---</h3>';
	tplField += '	<div class="broccoli--edit-window-field-content">';
	tplField += '	</div>';
	tplField += '</div>';


	/**
	 * 初期化
	 * @param  {[type]}   instancePath  [description]
	 * @param  {[type]}   elmEditWindow [description]
	 * @param  {Function} callback      [description]
	 * @return {[type]}                 [description]
	 */
	this.init = function(instancePath, elmEditWindow, callback){
		callback = callback || function(){};

		var data = broccoli.contentsSourceData.get(instancePath);
		// console.log( data );
		var mod = broccoli.contentsSourceData.getModule(data.modId, data.subModName);
		// console.log( data.modId, data.subModName );
		// console.log( mod );

		var $fields = $('<div>');
		$editWindow = $(elmEditWindow);
		$editWindow.append(tplFrame);
		$editWindow.find('.broccoli--edit-window-module-name').text(mod.info.name||mod.id);
		$editWindow.find('.broccoli--edit-window-fields').append($fields);

		it79.ary(
			mod.fields,
			function(it1, field, fieldName){
				// console.log(fieldName);
				var $field = $(tplField)
					.attr({
						'data-broccoli-edit-window-field-name': field.name ,
						'data-broccoli-edit-window-field-type': field.fieldType
					})
				;
				$field.find('>h3')
					.text((field.label||field.name)+' ')
					.append( $('<small>')
						.text((field.fieldType=='input' ? field.type : field.fieldType))
					)
				;
				$fields.append($field);

				// console.log( broccoli.fieldDefinitions );
				var elmFieldContent = $field.find('.broccoli--edit-window-field-content').get(0);
				switch( field.fieldType ){
					case 'input':
						var fieldDefinition = broccoli.getFieldDefinition(field.type);
						fieldDefinition.mkEditor(mod.fields[field.name], data.fields[field.name], elmFieldContent, function(){
							it1.next();
						})
						break;
					default:
						$(elmFieldContent)
							.append(
								'<p>'+php.htmlspecialchars( (typeof(field.fieldType)===typeof('') ? field.fieldType : '') )+'</p>'
							)
						;
						it1.next();
						break;
				}
				return;
			},
			function(){

				$editWindow.find('#broccoli--edit-window-builtin-anchor-field')
					.val(data.anchor)
				;
				$editWindow.find('#broccoli--edit-window-builtin-dec-field')
					.val(data.dec)
				;
				$editWindow.find('.broccoli--edit-window-form-buttons button')
					.removeAttr('disabled')
				;
				$editWindow.find('form')
					.removeAttr('disabled')
					.bind('submit', function(){
						// 編集内容を保存する
						// console.log( data );
						// console.log( mod );

						it79.ary(
							mod.fields,
							function(it2, field2, fieldName2){
								var $dom = $editWindow.find('[data-broccoli-edit-window-field-name='+field2.name+']');
								if( $dom.attr('data-broccoli-edit-window-field-type') != 'input' ){
									it2.next();return;
								}
								var fieldDefinition = broccoli.getFieldDefinition(field2.type);
								fieldDefinition.saveEditorContent($dom.get(0), data.fields[fieldName2], mod.fields[fieldName2], function(result){
									data.fields[fieldName2] = result;
									it2.next();
								});
								return;
							},
							function(){
								it79.fnc(data,
									[
										function(it2, data){
											data.anchor = $editWindow.find('#broccoli--edit-window-builtin-anchor-field').val();
											data.dec = $editWindow.find('#broccoli--edit-window-builtin-dec-field').val();

											it2.next(data);
										} ,
										function(it2, data){
											// クライアントサイドにあるメモリ上のcontentsSourceDataに反映する。
											// この時点で、まだサーバー側には送られていない。
											// サーバー側に送るのは、callback() の先の仕事。
											broccoli.contentsSourceData.updateInstance(data, instancePath, function(){
												it2.next(data);
											});
										} ,
										// function(it2, data){
										// 	// リソースマネージャーのデータを更新
										// 	broccoli.resourceMgr.init(function(){
										// 		it2.next(data);
										// 	});
										// } ,
										function(it2, data){
											callback();
											it2.next(data);
										}
									]
								);
							}
						);


					})
				;
				$editWindow.find('button.broccoli--edit-window-btn-remove')
					.bind('click', function(){
						if( !confirm('このモジュールを削除します。よろしいですか？') ){
							return;
						}
						broccoli.contentsSourceData.removeInstance(instancePath, function(){
							callback();
						});
					})
				;
			}
		);
		return this;
	}

	return;
}

},{"iterate79":24,"jquery":25,"path":22,"phpjs":28}],6:[function(require,module,exports){
/**
 * history.js
 */
module.exports = function(broccoli){

	var historyDataArray = [];
	var historyIdx = 0;

	/**
	 * ヒストリーを初期化する
	 */
	this.init = function( data, callback ){
		callback = callback||function(){};

		historyDataArray = [];
		historyIdx = 0;
		this.put(data, function(){
			setTimeout( callback, 0 );
		});
		return this;
	}

	/**
	 * ヒストリーに歴史を追加する
	 */
	this.put = function( data, callback ){
		callback = callback||function(){};

		historyDataArray.splice(0, historyIdx, JSON.stringify(data));
		historyIdx = 0;

		// console.log(historyDataArray);
		setTimeout( callback, 0 );
		return this;
	}

	/**
	 * 1つ前のデータを得る
	 */
	this.back = function(){
		historyIdx ++;
		if( historyIdx >= historyDataArray.length || historyIdx < 0 ){
			historyIdx --;
			return false;
		}
		return JSON.parse( historyDataArray[historyIdx] );
	}

	/**
	 * 1つ次のデータを得る
	 */
	this.go = function(){
		historyIdx --;
		if( historyIdx >= historyDataArray.length || historyIdx < 0 ){
			historyIdx ++;
			return false;
		}
		return JSON.parse( historyDataArray[historyIdx] );
	}

}

},{}],7:[function(require,module,exports){
/**
 * instancePathView.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ callback(); return false; }

	var _this = this;

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var twig = require('twig');
	var $ = require('jquery');

	var $instancePathView;


	/**
	 * インスタンスパスビューを更新する
	 */
	this.update = function(callback){
		callback = callback||function(){};
		var selectedInstance = broccoli.getSelectedInstance();
		if( selectedInstance === null ){
			$instancePathView.text('-');
			callback();
			return this;
		}
		var instPath = selectedInstance.split('/');
		var timer;

		// console.log(instPath);

		var $ul = $('<ul>');
		var instPathMemo = [];
		for( var idx in instPath ){
			instPathMemo.push(instPath[idx]);
			if( instPathMemo.length <= 1 ){ continue; }
			var contData = broccoli.contentsSourceData.get(instPathMemo.join('/'));
			var mod = broccoli.contentsSourceData.getModule(contData.modId, contData.subModName);
			var label = mod && mod.info.name||mod.id;
			if(instPathMemo.length==2){
				// bowl自体だったら
				label = instPathMemo[instPathMemo.length-1];
			}
			if( mod.subModName ){
				// サブモジュールだったら
				label = '@'+mod.subModName;
			}
			$ul.append( $('<li>')
				.append( $('<a href="javascript:;">')
					.attr({
						'data-broccoli-instance-path': instPathMemo.join('/')
					})
					.bind('dblclick', function(e){
						clearTimeout(timer);
						var instancePath = $(this).attr('data-broccoli-instance-path');
						broccoli.editInstance( instancePath );
					} )
					.bind('click', function(e){
						var dataPath = $(this).attr('data-broccoli-instance-path');
						timer = setTimeout(function(){
							broccoli.selectInstance( dataPath );
						}, 20);
						return false;
					} )
					.text(label)
				)
			);
		}
		$instancePathView.html('').append($ul).show();

		broccoli.contentsSourceData.getChildren( selectedInstance, function(children){
			if(children.length){
				var $ulChildren = $('<ul class="broccoli--instance-path-view-children">');
				for(var child in children){
					var contData = broccoli.contentsSourceData.get(children[child]);
					var mod = broccoli.contentsSourceData.getModule(contData.modId, contData.subModName);
					var label = mod && mod.info.name||mod.id;
					if( mod.subModName ){
						// サブモジュールだったら
						label = '@'+mod.subModName;
					}
					$ulChildren.append( $('<li>')
						.append( $('<a href="javascript:;">')
							.attr({
								'data-broccoli-instance-path': children[child]
							})
							.bind('mouseover', function(e){
								var dataPath = $(this).attr('data-broccoli-instance-path');
								broccoli.focusInstance( dataPath );
							} )
							.bind('mouseout', function(e){
								broccoli.unfocusInstance();
							} )
							.bind('dblclick', function(e){
								var dataPath = $(this).attr('data-broccoli-instance-path');
								clearTimeout(timer);
								broccoli.selectInstance( dataPath );
								broccoli.editInstance( dataPath );
							} )
							.bind('click', function(e){
								broccoli.unfocusInstance();
								var dataPath = $(this).attr('data-broccoli-instance-path');
								timer = setTimeout(function(){
									broccoli.selectInstance( dataPath );
								}, 20);
								return false;
							} )
							.text(label)
						)
					);
				}
				$ul.find('li:last-child').append($ulChildren);
			}
		} );

		callback();
		return this;
	}


	/**
	 * 初期化する
	 * @param  {Object} domElm     DOM Element of instance path view container.
	 * @param  {Function} callback callback function.
	 * @return {Object}            this
	 */
	this.init = function(domElm, callback){
		$instancePathView = $(domElm)
			.addClass('broccoli')
			.addClass('broccoli--instance-path-view')
		;
		// console.log(domElm);
		// console.log($instancePathView);

		it79.fnc(
			{},
			[
				function( it1, data ){
					$instancePathView.html('initialize...');
					it1.next(data);
				} ,
				function( it1, data ){
					_this.update(function(){
						it1.next(data);
					});
				} ,
				function( it1, data ){
					callback();
					it1.next(data);
				}
			]
		);
		return this;
	}

	return;
}

},{"iterate79":24,"jquery":25,"path":22,"phpjs":28,"twig":29}],8:[function(require,module,exports){
/**
 * instanceTreeView.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ callback(); return false; }

	var _this = this;

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var twig = require('twig');
	var $ = require('jquery');

	var $instanceTreeView;


	/**
	 * インスタンスツリービューを更新する
	 */
	this.update = function(callback){
		callback = callback||function(){};
		if(!$instanceTreeView){
			callback();
			return this;
		}
		$instanceTreeView.html('...');
		var $ul = $('<ul>')
			// .css({
			// 	"border":"1px solid #666"
			// })
		;

		var data = broccoli.contentsSourceData.get();
		// console.log(data);

		function buildInstance(data, parentInstancePath, subModName, callback){
			callback = callback||function(){};
			// console.log(data);
			var mod = broccoli.contentsSourceData.getModule(data.modId, subModName);
			// console.log(mod);
			var $ul = $('<ul>')
				.addClass('broccoli--instance-tree-view-fields')
				.css({
					"border":"1px solid #eee"
				})
			;

			it79.ary(
				mod.fields,
				function(it1, row, idx){
					var $li = $('<li>')
						.text(idx)
					;

					if(row.fieldType == 'input'){
						$ul.append($li);
						it1.next();
						return;
					}else if(row.fieldType == 'module'){

						it79.ary(
							data.fields[idx] ,
							function(it2, row2, idx2){
								var instancePath = parentInstancePath+'/fields.'+idx+'@'+idx2;
								buildInstance(
									row2,
									instancePath,
									null,
									function($fieldsUl){
										$li.append($fieldsUl);
										it2.next();
									}
								);
								return;
							} ,
							function(){
								var instancePath = parentInstancePath+'/fields.'+idx+'@'+(data.fields[idx].length);

								var $appender = $('<div>')
									.text('(+) ここにモジュールをドラッグしてください。')
									.attr({
										'data-broccoli-instance-path':instancePath,
										'data-broccoli-is-appender':'yes',
										'data-broccoli-is-instance-tree-view': 'yes',
										'draggable': false
									})
									.bind('mouseover', function(e){
										e.stopPropagation();
										var $this = $(this);
										var instancePath = $this.attr('data-broccoli-instance-path');
										broccoli.focusInstance( instancePath );
									})
									.append( $('<div>')
										.addClass('broccoli--panel-drop-to-insert-here')
									)
								;
								broccoli.panels.setPanelEventHandlers( $appender );
								$li.append( $appender );
								$ul.append( $li );
								it1.next();
							}
						);
						return;
					}else if(row.fieldType == 'loop'){
						it79.ary(
							data.fields[idx] ,
							function(it2, row2, idx2){
								var instancePath = parentInstancePath+'/fields.'+idx+'@'+idx2;
								buildInstance(
									row2,
									instancePath,
									row.name,
									function($fieldsUl){
										$li.append($fieldsUl);
										it2.next();
									}
								);
								return;
							} ,
							function(){
								var instancePath = parentInstancePath+'/fields.'+idx+'@'+(data.fields[idx].length);

								var $appender = $('<div>')
									.text('ここをダブルクリックして配列要素を追加してください。')
									.attr({
										'data-broccoli-instance-path':instancePath,
										'data-broccoli-mod-id': mod.id,
										'data-broccoli-sub-mod-name': row.name,
										'data-broccoli-is-appender':'yes',
										'data-broccoli-is-instance-tree-view': 'yes',
										'draggable': false
									})
									.bind('mouseover', function(e){
										e.stopPropagation();
										var $this = $(this);
										var instancePath = $this.attr('data-broccoli-instance-path');
										broccoli.focusInstance( instancePath );
									})
									.append( $('<div>')
										.addClass('broccoli--panel-drop-to-insert-here')
									)
								;
								broccoli.panels.setPanelEventHandlers( $appender );
								$li.append( $appender );
								$ul.append($li);
								it1.next();
							}
						);
						return;
					}
					it1.next();
					return;
				} ,
				function(){
					var $rtn = $('<div>')
						.text( mod.info.name||mod.id )
						.css({
							// "border":"1px solid #666"
						})
						.attr({
							'data-broccoli-instance-path': parentInstancePath,
							'data-broccoli-is-instance-tree-view': 'yes',
							'draggable': true
						})
						// .bind('dragover', function(e){
						// 	e.stopPropagation();
						// 	var instancePath = $this.attr('data-broccoli-instance-path');
						// 	// if( $this.attr('data-broccoli-is-appender') == 'yes' ){
						// 	// 	instancePath = php.dirname(instancePath);
						// 	// }
						// 	broccoli.focusInstance( instancePath );
						// })
						.bind('mouseover', function(e){
							e.stopPropagation();
							var $this = $(this);
							var instancePath = $this.attr('data-broccoli-instance-path');
							// if( $this.attr('data-broccoli-is-appender') == 'yes' ){
							// 	instancePath = php.dirname(instancePath);
							// }
							broccoli.focusInstance( instancePath );
						})
						.append( $('<div>')
							.addClass('broccoli--panel-drop-to-insert-here')
						)
						.append( $('<ul>')
						)
					;
					broccoli.panels.setPanelEventHandlers($rtn);
					$rtn.find('>ul').append($ul);
					callback($rtn);
				}
			);

			return;
		}

		it79.ary(
			data.bowl,
			function(it1, row, idx){
				// console.log(idx);
				var $bowl = $('<li>')
					.text('bowl.'+idx)
					.attr({
						'data-broccoli-instance-path':'/bowl.'+idx
					})
					.bind('mouseover',function(e){
						var instancePath = $(this).attr('data-broccoli-instance-path');
						broccoli.focusInstance(instancePath);
						e.stopPropagation();
					})
					.bind('mouseout',function(e){
						broccoli.unfocusInstance();
						e.stopPropagation();
					})
					.bind('click',function(e){
						var instancePath = $(this).attr('data-broccoli-instance-path');
						broccoli.selectInstance(instancePath);
						e.stopPropagation();
					})
				;
				buildInstance(
					row,
					'/bowl.'+idx,
					null,
					function($elm){
						$bowl.append($elm);
						$ul.append($bowl);
						it1.next();
					}
				);
			},
			function(){
				$instanceTreeView.html('').append($ul);
				callback();
			}
		);

		return this;
	}


	/**
	 * 初期化する
	 * @param  {Object} domElm     DOM Element of instance path view container.
	 * @param  {Function} callback callback function.
	 * @return {Object}            this
	 */
	this.init = function(domElm, callback){
		$instanceTreeView = $(domElm)
			.addClass('broccoli')
			.addClass('broccoli--instance-tree-view')
		;

		it79.fnc(
			{},
			[
				function( it1, data ){
					$instanceTreeView.html('initialize...');
					it1.next(data);
				} ,
				function( it1, data ){
					callback();
					it1.next(data);
				}
			]
		);
		return this;
	}

	return;
}

},{"iterate79":24,"jquery":25,"path":22,"phpjs":28,"twig":29}],9:[function(require,module,exports){
/**
 * panels.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ callback(); return false; }

	var _this = this;

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var twig = require('twig');
	var $ = require('jquery');

	var $panels;
	var $contentsElements;

	var selectedInstance;
	var focusedInstance;

	/**
	 * 各パネルを描画する
	 */
	function drawPanel(idx, domElm){
		function calcHeight($me, idx){//パネルの高さを計算する
			var $nextElm = (function(){
				var instancePath = domElm.instancePath;
				if( instancePath.match( /\@[0-9]*$/ ) ){
					var instancePathNext = instancePath.replace( /([0-9]*)$/, '' );
					instancePathNext += php.intval(RegExp.$1) + 1;
					// console.log("from: "+ instancePath);
					// console.log("to: "+instancePathNext);
					$nextElm = $contentsElements[instancePathNext];
					return $nextElm;
				}
				return null;
			})();
			if( !$nextElm ){
				return $me.outerHeight;
			}
			var rtn = ($nextElm.offsetTop - $me.offsetTop);
			if( $me.outerHeight > rtn ){
				return $me.outerHeight;
			}
			return rtn;
		}
		var $this = domElm;
		var $panel = $('<div>');
		var isAppender = $this.isAppender;
		$panels.append($panel);
		$panel
			.css({
				'width': $this.outerWidth,
				'height': calcHeight($this, idx),
				'position': 'absolute',
				'left': $this.offsetLeft,
				'top': $this.offsetTop
			})
			.addClass('broccoli--panel')
			.attr({
				'data-broccoli-instance-path': $this.instancePath,
				'data-broccoli-is-appender': 'no',
				'data-broccoli-mod-id': $this.modId,
				'data-broccoli-sub-mod-name': $this.subModName,
				'draggable': (isAppender ? false : true) // <- HTML5のAPI http://www.htmq.com/dnd/
			})
			.append( $('<div>')
				.addClass('broccoli--panel-drop-to-insert-here')
			)
		;
		_this.setPanelEventHandlers($panel);
		if( !isAppender ){
			$panel
				.append( $('<div>')
					.addClass('broccoli--panel-module-name')
					.text($this.modName)
				)
			;
		}
		if( isAppender ){
			$panel
				.attr({
					'data-broccoli-is-appender': 'yes'
				})
			;
		}

	}

	/**
	 * パネルにイベントハンドラをセットする
	 *
	 * @param  {[type]} $panel [description]
	 * @return {[type]}        [description]
	 */
	this.setPanelEventHandlers = function($panel){
		$panel
			.bind('click', function(e){
				e.stopPropagation();
				var $this = $(this);
				var instancePath = $this.attr('data-broccoli-instance-path');
				if( $this.attr('data-broccoli-is-appender') == 'yes' ){
					instancePath = php.dirname(instancePath);
				}
				broccoli.selectInstance( instancePath );
			})
			.bind('dblclick', function(e){
				e.stopPropagation();
				var $this = $(this);
				var instancePath = $this.attr('data-broccoli-instance-path');

				if( $this.attr('data-broccoli-sub-mod-name') && $this.attr('data-broccoli-is-appender') == 'yes' ){
					// alert('開発中: loopモジュールの繰り返し要素を増やします。');
					var modId = $(this).attr("data-broccoli-mod-id");
					var subModName = $(this).attr("data-broccoli-sub-mod-name");
					broccoli.contentsSourceData.addInstance( modId, instancePath, function(){
						broccoli.saveContents(function(){
							broccoli.redraw();
						});
					}, subModName );
					e.preventDefault();
					return;
				}

				if( $this.attr('data-broccoli-is-appender') == 'yes' ){
					instancePath = php.dirname(instancePath);
				}
				broccoli.editInstance( instancePath );
			})

			.bind('dragleave', function(e){
				e.stopPropagation();
				e.preventDefault();
				$(this).removeClass('broccoli--panel__drag-entered');
			})
			.bind('dragover', function(e){
				e.stopPropagation();
				e.preventDefault();
				$(this).addClass('broccoli--panel__drag-entered');
				var instancePath = $(this).attr('data-broccoli-instance-path');
				if( $(this).attr('data-broccoli-is-instance-tree-view') == 'yes' ){
					if(focusedInstance != instancePath){
						// if( $this.attr('data-broccoli-is-appender') == 'yes' ){
						// 	instancePath = php.dirname(instancePath);
						// }
						dragOvered = instancePath;
						broccoli.focusInstance( instancePath );
					}
				}
			})
			.bind('dragstart', function(e){
				e.stopPropagation();
				event.dataTransfer.setData("method", 'moveTo' );
				event.dataTransfer.setData("data-broccoli-instance-path", $(this).attr('data-broccoli-instance-path') );
				var subModName = $(this).attr('data-broccoli-sub-mod-name');
				if( typeof(subModName) === typeof('') && subModName.length ){
					event.dataTransfer.setData("data-broccoli-sub-mod-name", subModName );
				}
			})
			.bind('drop', function(e){
				e.stopPropagation();
				$(this).removeClass('broccoli--panel__drag-entered');
				var method = event.dataTransfer.getData("method");
				// options.drop($(this).attr('data-broccoli-instance-path'), method);
				// console.log(method);
				if( method === 'moveTo' ){
					var moveFrom = event.dataTransfer.getData("data-broccoli-instance-path");
					var moveTo = $(this).attr('data-broccoli-instance-path');
					if( moveFrom === moveTo ){
						// 移動元と移動先が同一の場合、キャンセルとみなす
						$(this).removeClass('cont_instanceCtrlPanel-dragentered');
						return;
					}
					broccoli.contentsSourceData.moveInstanceTo( moveFrom, moveTo, function(){
						// コンテンツを保存
						broccoli.contentsSourceData.save(function(){
							// alert('インスタンスを移動しました。');
							broccoli.redraw();
						});
					} );
					return;
				}
				if( method !== 'add' ){
					alert('追加するモジュールをドラッグしてください。ここに移動することはできません。');
					return;
				}
				var modId = event.dataTransfer.getData("modId");
				// console.log(modId);
				broccoli.contentsSourceData.addInstance( modId, $(this).attr('data-broccoli-instance-path'), function(){
					// コンテンツを保存
					broccoli.contentsSourceData.save(function(){
						// alert('インスタンスを追加しました。');
						broccoli.redraw();
					});
				} );
				return;
			})
		;
		return $panel;
	}

	/**
	 * 初期化する
	 * @param  {Object} domElm     DOM Element of instance path view container.
	 * @param  {Function} callback [description]
	 * @return {[type]}            [description]
	 */
	this.init = function(domElm, callback){
		$panels = $(domElm);
		it79.fnc(
			{},
			[
				function( it1, data ){
					broccoli.postMessenger.send(
						'getAllInstance',
						{},
						function(_contentsElements){
							// console.log(_contentsElements);
							$contentsElements = _contentsElements;
							it1.next(data);
						}
					);
				} ,
				function( it1, data ){
					$panels
						.html('')
						.removeClass('broccoli')
						.addClass('broccoli')
					;
					it1.next(data);
				} ,
				function( it1, data ){
					// console.log($contentsElements.size());
					for( var idx in $contentsElements ){
						drawPanel(idx, $contentsElements[idx]);
					}
					// $contentsElements.each(drawPanel);
					it1.next(data);
				} ,
				function( it1, data ){
					callback();
					it1.next(data);
				}
			]
		);
	}

	/**
	 * インスタンスを選択する
	 * @param  {[type]} instancePath [description]
	 * @return {[type]}              [description]
	 */
	this.selectInstance = function( instancePath, callback ){
		callback = callback || function(){};
		$panels.find('[data-broccoli-instance-path]')
			.filter(function (index) {
				return $(this).attr("data-broccoli-instance-path") == instancePath;
			})
			.addClass('broccoli--panel__selected')
		;
		// this.updateInstancePathView();
		callback();
		return this;
	}

	/**
	 * モジュールインスタンスの選択状態を解除する
	 */
	this.unselectInstance = function(callback){
		callback = callback || function(){};
		$panels.find('[data-broccoli-instance-path]')
			.removeClass('broccoli--panel__selected')
		;
		// this.updateInstancePathView();
		callback();
		return this;
	}

	/**
	 * モジュールインスタンスにフォーカスする
	 * フォーカス状態の囲みで表現され、画面に収まるようにスクロールする
	 */
	this.focusInstance = function( instancePath, callback ){
		callback = callback || function(){};
		focusedInstance = instancePath;
		$panels.find('[data-broccoli-instance-path]')
			.filter(function (index) {
				return $(this).attr("data-broccoli-instance-path") == instancePath;
			})
			.addClass('broccoli--panel__focused')
		;
		callback();
		return this;

	}

	/**
	 * モジュールインスタンスのフォーカス状態を解除する
	 */
	this.unfocusInstance = function(callback){
		callback = callback || function(){};
		selectedInstance = null;
		focusedInstance = null;

		$panels.find('.broccoli--panel__focused')
			.removeClass('broccoli--panel__focused')
		;
		callback();
		return this;
	}

	/**
	 * 指定したInstancePathのパネルの要素を得る
	 */
	this.getPanelElement = function(instancePath){
		var $rtn = $panels.find('[data-broccoli-instance-path="'+php.htmlspecialchars(instancePath)+'"]');
		return $rtn.get(0);
	}

	/**
	 * パネルを消去する
	 */
	this.clearPanels = function(callback){
		callback = callback || function(){};
		if($panels){
			$panels.html('');
		}
		callback();
		return this;
	}

	return;
}

},{"iterate79":24,"jquery":25,"path":22,"phpjs":28,"twig":29}],10:[function(require,module,exports){
/**
 * postMessenger.js
 * iframeに展開されるプレビューHTMLとの通信を仲介します。
 */

module.exports = function(broccoli, iframe){

	var __dirname = broccoli.__dirname;
	// console.log(__dirname);
	var callbackMemory = {};

	function createUUID(){
		return "uuid-"+((new Date).getTime().toString(16)+Math.floor(1E7*Math.random()).toString(16));
	}
	function getTargetOrigin(iframe){
		var url = $(iframe).attr('src');
		// console.log(url);
		var parser = document.createElement('a');
		parser.href=url;
		// console.log(parser);
		return parser.protocol+'//'+parser.host
	}

	/**
	 * 初期化
	 */
	this.init = function(callback){
		console.info('postMessenger.init() called');

		var targetWindowOrigin = getTargetOrigin(iframe);
		// console.log(targetWindowOrigin);

		var win = $(iframe).get(0).contentWindow;
		win.postMessage({'scriptUrl':__dirname+'/broccoli-preview-contents.js'}, targetWindowOrigin);
		callback();
		return this;
	}

	/**
	 * メッセージを送る
	 */
	this.send = function(api, options, callback){
		callback = callback||function(){};

		var callbackId = createUUID();
		// console.log(callbackId);

		callbackMemory[callbackId] = callback;

		var message = {
			'api': api,
			'callback': callbackId,
			'options': options
		};
		// console.log(callbackMemory);

		var win = $(iframe).get(0).contentWindow;
		var targetWindowOrigin = getTargetOrigin(iframe);
		win.postMessage(message, targetWindowOrigin);

		// callback();//TODO: 仮実装。本当は、iframe側からコールバックされる。
		return this;
	}

	/**
	 * メッセージを受信する
	 */
	window.addEventListener('message',function(event){
		var data=event.data;
		// console.log(event);
		// console.log(callbackMemory);

		if(data.api == 'unselectInstance'){
			broccoli.unselectInstance();
			return;

		}else if(data.api == 'unfocusInstance'){
			broccoli.unfocusInstance();
			return;

		}else{
			if(!callbackMemory[data.api]){return;}
			callbackMemory[data.api](data.options);
			callbackMemory[data.api] = undefined;
			delete callbackMemory[data.api];
		}

	});

	return;
}

},{}],11:[function(require,module,exports){
/**
 * resourceMgr.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var _this = this;
	var _resourceDb = {};

	/**
	 * initialize resource Manager
	 */
	this.init = function( callback ){
		loadResourceList( function(){
			callback();
		} );
		return this;
	}

	/**
	 * Loading resource list
	 */
	function loadResourceList( callback ){
		_resourceDb = {};
		it79.fnc({},
			[
				function(it1, data){
					broccoli.gpi(
						'resourceMgr.getResourceDb',
						{} ,
						function(resourceDb){
							// console.log('Getting resourceDb.');
							// console.log(resourceDb);
							_resourceDb = resourceDb;
							callback();
						}
					);
				}
			]
		);
		return;
	}

	/**
	 * save resources
	 * @param  {Function} cb Callback function.
	 * @return {boolean}     Always true.
	 */
	this.save = function( callback ){
		// console.log('resourceDb save method: called.');
		callback = callback || function(){};
		it79.fnc({}, [
			function(it1, data){
				broccoli.gpi(
					'resourceMgr.save',
					{'resourceDb': _resourceDb} ,
					function(rtn){
						// console.log('resourceDb save method: done.');
						loadResourceList(function(){
							callback(rtn);
						});
					}
				);
			}
		]);
		return this;
	}

	/**
	 * add resource
	 * リソースの登録を行い、resKeyを生成して返す。
	 */
	this.addResource = function(callback){
		callback = callback || function(){};
		it79.fnc({}, [
			function(it1, data){
				broccoli.gpi(
					'resourceMgr.addResource',
					{} ,
					function(newResKey){
						// console.log('New Resource Key is created on resourceDb: '+newResKey);
						_resourceDb[newResKey] = {};//予約
						callback(newResKey);
					}
				);
			}
		]);
		return this;
	}

	/**
	 * get resource DB
	 */
	this.getResourceDb = function( callback ){
		callback = callback || function(){};
		callback(_resourceDb);
		return this;
	}

	/**
	 * get resource
	 */
	this.getResource = function( resKey, callback ){
		callback = callback || function(){};
		it79.fnc({}, [
			function(it1, data){
				broccoli.gpi(
					'resourceMgr.getResource',
					{'resKey': resKey} ,
					function(resInfo){
						if(resInfo.size === undefined){
							callback(false);
							return ;
						}
						_resourceDb[resKey] = resInfo;
						callback(resInfo);
					}
				);
			}
		]);
		return this;
	}

	/**
	 * duplicate resource
	 * @return 複製された新しいリソースのキー
	 */
	this.duplicateResource = function( resKey, callback ){
		callback = callback || function(){};
		callback( newResKey );
		return this;
	}

	/**
	 * update resource
	 * @param  {string} resKey  Resource Key
	 * @param  {object} resInfo Resource Information.
	 * <dl>
	 * <dt>ext</dt><dd>ファイル拡張子名。</dd>
	 * <dt>type</dt><dd>mimeタイプ。</dd>
	 * <dt>base64</dt><dd>ファイルのBase64エンコードされた値</dd>
	 * <dt>publicFilename</dt><dd>公開時のファイル名</dd>
	 * <dt>isPrivateMaterial</dt><dd>非公開ファイル。</dd>
	 * </dl>
	 * @return {boolean}        always true.
	 */
	this.updateResource = function( resKey, resInfo, callback ){
		callback = callback || function(){};
		it79.fnc({},
			[
				function(it1, data){
					broccoli.gpi(
						'resourceMgr.updateResource',
						{
							'resKey': resKey,
							'resInfo': resInfo
						} ,
						function(rtn){
							// console.log(rtn);
							if(_resourceDb[resKey]){
								callback(true);
								return;
							}
							callback(false);
							return;
						}
					);
				}
			]
		);
		return this;
	}

	/**
	 * Reset bin from base64
	 */
	this.resetBinFromBase64 = function( resKey, callback ){
		callback = callback || function(){};
		it79.fnc({},
			[
				function(it1, data){
					broccoli.gpi(
						'resourceMgr.resetBinFromBase64',
						{'resKey': resKey} ,
						function(rtn){
							// console.log(rtn);
							callback(rtn);
						}
					);
				}
			]
		);
		return this;
	}

	/**
	 * Reset base64 from bin
	 */
	this.resetBase64FromBin = function( resKey, callback ){
		callback = callback || function(){};
		var _this = this;
		it79.fnc({},
			[
				function(it1, data){
					broccoli.gpi(
						'resourceMgr.resetBase64FromBin',
						{'resKey': resKey} ,
						function(rtn){
							// console.log(rtn);
							// console.log(_resourceDb[resKey]);
							_this.getResource(resKey, function(resInfo){
								// console.log(resInfo);
								_resourceDb[resKey] = resInfo;
								callback(rtn);
							});
						}
					);
				}
			]
		);
		return this;
	}

	/**
	 * get resource public path
	 */
	this.getResourcePublicPath = function( resKey, callback ){
		callback = callback || function(){};
		// _resourceDb = {};
		it79.fnc({},
			[
				function(it1, data){
					broccoli.gpi(
						'resourceMgr.getResourcePublicPath',
						{'resKey': resKey} ,
						function(rtn){
							// console.log('Getting resourceDb.');
							callback(rtn);
						}
					);
				}
			]
		);
		return this;
	}

	/**
	 * get resource public path
	 */
	this.getResourceOriginalRealpath = function( resKey, callback ){
		callback = callback || function(){};
		// _resourceDb = {};
		it79.fnc({},
			[
				function(it1, data){
					broccoli.gpi(
						'resourceMgr.getResourceOriginalRealpath',
						{'resKey': resKey} ,
						function(rtn){
							// console.log('Getting resourceDb.');
							callback(rtn);
						}
					);
				}
			]
		);
		return this;
	}

	/**
	 * remove resource
	 */
	this.removeResource = function( resKey, callback ){
		callback = callback || function(){};
		// _resourceDb = {};
		it79.fnc({},
			[
				function(it1, data){
					broccoli.gpi(
						'resourceMgr.removeResource',
						{'resKey': resKey} ,
						function(rtn){
							// console.log('Getting resourceDb.');
							callback(rtn);
						}
					);
				}
			]
		);
		return this;
	}

}

},{"iterate79":24,"path":22,"phpjs":28}],12:[function(require,module,exports){
/**
 * fieldBase.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	this.__fieldId__ = null;
	var $ = require('jquery');

	/**
	 * データをバインドする (Server Side)
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = '';
		try {
			if( typeof(fieldData) === typeof([]) ){
				rtn += fieldData.join('');
			}else{
				rtn += fieldData;
			}
		} catch (e) {
			rtn += '[error]'
		}
		if( mode == 'canvas' && !rtn.length ){
			rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;white-space:nowrap;">(ダブルクリックしてHTMLコードを編集してください)</span>';
		}
		setTimeout(function(){ callback(rtn); }, 0);
		return this;
	}

	/**
	 * プレビュー用の簡易なHTMLを生成する (Server Side/Client Side)
	 */
	this.mkPreviewHtml = function( fieldData, mod, callback ){
		// InstanceTreeViewで利用する
		var rtn = this.bind(fieldData, 'finalize', mod);
		var $rtn = $('<div>').append(rtn);
		$rtn.find('*').each(function(){
			$(this)
				.removeAttr('style') //スタイル削除しちゃう
			;
		});
		$rtn.find('style').remove(); // styleタグも削除しちゃう

		callback( $rtn.html() );
		return this;
	}

	/**
	 * データを正規化する (Server Side/Client Side)
	 * このメソッドは、同期的に振る舞います。
	 */
	this.normalizeData = function( fieldData, mode ){
		// 編集画面用にデータを初期化。
		var rtn = fieldData;
		return rtn;
	}

	/**
	 * エディタUIを生成 (Client Side)
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var rows = 12;
		if( mod.rows ){
			rows = mod.rows;
		}
		var rtn = $('<div>')
			.append($('<textarea>')
				.attr({
					"name":mod.name,
					"rows":rows
				})
				.val(data)
				.css({'width':'100%','height':'auto'})
		);

		$(elm).html(rtn);
		setTimeout(function(){
			// px.textEditor.attachTextEditor(
			// 	$dom.find('textarea').get(0),
			// 	'html'
			// );
			// $dom.find('.CodeMirror').css({
			// 	'border': '1px solid #ccc',
			// 	'border-radius': '3px'
			// });

			callback();
		}, 0);
		return this;
	}

	/**
	 * データを複製する (Client Side)
	 */
	this.duplicateData = function( data, callback ){
		data = JSON.parse( JSON.stringify( data ) );
		callback(data);
		return this;
	}

	/**
	 * エディタUIで編集した内容を保存 (Client Side)
	 */
	this.saveEditorContent = function( elm, data, mod, callback ){
		var src = $(elm).find('textarea').val();
		src = JSON.parse( JSON.stringify(src) );
		callback(src);
		return this;
	}

	/**
	 * GPI (Server Side)
	 */
	this.gpi = function(options, callback){
		callback = callback || function(){};
		callback(options);
		return this;
	}

	/**
	 * GPIを呼び出す (Cliend Side)
	 */
	this.callGpi = function(options, callback){
		callback = callback || function(){};
		broccoli.gpi(
			'fieldGpi',
			{
				'__fieldId__': this.__fieldId__,
				'options': options
			},
			function(result){
				// console.log(result);
				callback(result);
			}
		);
		return this;
	}

}

},{"jquery":25}],13:[function(require,module,exports){
module.exports = function(broccoli){
	var php = require('phpjs');

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = ''
		if(typeof(fieldData)===typeof('')){
			rtn = php.htmlspecialchars( fieldData ); // ←HTML特殊文字変換
			// rtn = rtn.replace(new RegExp('\r\n|\r|\n','g'), '<br />'); // ← 属性値などに使うので、改行コードは改行コードのままじゃないとマズイ。
		}
		if( mode == 'canvas' && !rtn.length ){
			rtn = '';
		}
		setTimeout(function(){ callback(rtn); }, 0);
		return;
	}

	/**
	 * エディタUIを生成
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var $input = $('<input>')
			.attr({
				"name":mod.name
			})
			.val(data)
			.css({'width':'100%','height':'auto'})
		;
		var rtn = $('<div>')
			.append( $input )
		;
		$(elm).html(rtn);
		setTimeout(function(){ callback(); }, 0);
		return;
	}

	/**
	 * エディタUIで編集した内容を保存
	 */
	this.saveEditorContent = function( elm, data, mod, callback ){
		var $dom = $(elm);
		var src = $dom.find('input').val();
		src = JSON.parse( JSON.stringify(src) );
		callback(src);
		return;
	}

}

},{"phpjs":28}],14:[function(require,module,exports){
module.exports = function(broccoli){
}

},{}],15:[function(require,module,exports){
module.exports = function(broccoli){
	var php = require('phpjs');

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = ''
		if(typeof(fieldData)===typeof('')){
			rtn = php.htmlspecialchars( fieldData ); // ←HTML特殊文字変換
			// rtn = rtn.replace(new RegExp('\r\n|\r|\n','g'), '<br />'); // ← 属性値などに使うので、改行コードは改行コードのままじゃないとマズイ。
		}
		if( mode == 'canvas' && !rtn.length ){
			rtn = '(ダブルクリックしてテキストを編集してください)';
		}
		setTimeout(function(){
			// px.textEditor.attachTextEditor(
			// 	$dom.find('textarea').get(0),
			// 	'text'
			// );
			// $dom.find('.CodeMirror').css({
			// 	'border': '1px solid #ccc',
			// 	'border-radius': '3px'
			// });
			callback(rtn);
		}, 0);
		return;
	}

}

},{"phpjs":28}],16:[function(require,module,exports){
module.exports = function(broccoli){

	var it79 = require('iterate79');
	var php = require('phpjs');
	var _resMgr = broccoli.resourceMgr;
	var _imgDummy = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAHgCAMAAABOyeNrAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAE5QTFRFenp6uLi4j4+Po6OjlpaWwsLCbW1tPT09xcXFra2tcHBwXFxcvr6+gYGBUlJSdHR0qqqqR0dHsbGxmZmZiIiInJychYWFzMzMMzMzZmZmDbCo0wAAHGlJREFUeNrsnYmSo7wORtnXhOwhvP+LTiDYeGNJd2ZqICdV91b19xucUU5hI8mS18jPQ37Q0H6reRgBDbDQAAsNsDAMGmChARYaYGEYNMBCAyy0rwULc6D9DQ2w0AALDbDQAAsjoAEWGmChARaGQQMsNMBC+16wMAcasUI0wEIDLAyDBlhogIUGWBgGDbDQAAsNsDAM2ifBwhxoxArRAAsNsDAMGmChARYaYGEYNMBCAyw0wMIwaJ8EC3OgEStEAyw0wMIwaICFBlhogIVh0AALDbDQAAvDoH0SLMyBRqwQDbDQAAvDoAEWGmChARaGQQMsNMBCAywMg/ZJsDAHGrFCNMBCAywMgwZYaICFBlgYBg2w0AALDbAwDNonwcIcaMQK0QALDbAwDBpgoQEWGmBhGDTAQgMsNMDCMGifBAtzoBErRAMsNMDCMGiAhQZYaICFYdAACw2w0AALw6B9EizMgUasEA2w0AALw6ABFhpgoQEWhkEDLDTAQgMsDIP2SbAwBxqxQjTAQgMsDIMGWGiAhQZYGAYNsNAACw2wMAzaJ8HCHGjECtEACw2wMAwaYKEBFhpgYRg0wEL761oS7QEL7fPaMeOJhfZZrYief2XHX4OFKb9cS9NBS5rmcK7DtKwLYoVov9FOYV37Taclx6w+P3m413FYnwAL7RdaGudFkdfP/xYFZz+IssxrHqVf5ylgof1mJ1RXz8XQ99PHOcueC6GXnZ/jqrrOS8BC+4l2SNr/D/MOgtp7RHW3X7/V++5v/ykBFtq72m1X1+cnWmHdrXm+/zi8wNrXt8fj4j/S8LmHByy097Swvl1v9bndqFetcK/L5rzr3gtbsOJLq3klYKEt1bwWpEMdtstgvW+KunNklvW9Cepru0I+wSpr7/fzAtZXaWXdPoyu9e21nWoecdiNivOmyfzktcfyghSw0N7SvDputZahxH9uqh6X11qYP8E61tnRryNy3tEWa4XXa/6uDp6aV/t5XOeXU+O99uzP3fujqC+XoCG7Ae2NnZVf5mW3gwpakB6PKo+9xovj5LnTCtp3wah9N8xJm0F7R7s/Ebq0zoMgey54h6ZdEjsH6HPhS/z6GD6XxuefwWtZBCy0WS1pgUnzvI69Vjueny9/7S4qfz2cYv855Ob7UdJ0O3sPsNAWaIdzH2Gu6jJuX9N20fPl79yUjzx+gXXUrs0BC22BlmR+EHQRZi9/pI92K/Wk61xnfhfEaRfE69+LQvKDbFBLu0Bg1HLURZj7cdHOC9tYTvF8ONXhvdu3AxbaUs3z6zp8onX2m861IP3oT70+X3d+i949zy/NzP2q+x2w0IR2r+9NFwg810mrtT6q/ol1jg5tKKdacr9DG6iOAQutOTQdMW0I+bkMRk+6vHbcvXMtDOP2u2Y+qSZqn27PT/FjsPhpNqKllycHYbtDD7rnVPwoXjlV+y4y+Mb90iKvxedIrPDbtTwuruGToY6jV/JeG2Fu2ujyO56v4FKrnwSwvlvz6nYrHrQZVV3QJn1S1UaYu0Dg4vs90TQ+V8D6bi2IhebvOi2s06q+vAPWPswMqnY3j6Xwy7Uwf6Q3f3dMnvv2a9M/woK66CLMS0BoXwK1T3z3yMdCu9enPDueaz9pM2G6CPNzG56/Isxz9zt5vknVbxNoAGsjWlHnedJ624/NsXOJtmA90nsXYZ689uTl5sbqUpBBitY/dOq6+y39rDlk5/TxuMTLXAsXm6r0Exmk/Egb0cK6++tWt7ss/x72kZzJawOLKj86fOb7AdZWtKa+tH+FrefpGraBwLlrI+slsI34kPOOpmvnNv5yeh27WXRtoT+r7hXZDWgun7lfh0Hsv1EnJpZUZWFJ2gzaiJZ4ee6lb1wbCKqu5GOhfVBrerBI9EP7rBYP8UDAQvucdn+BFQIW2ke1asiNASy0dzTPC8JuwcsvkWeP6wPPAWChvaFdjTyYXWSGo28yT3QiWOQBFtqgHSIzD6ZF62r4x+VaOHK/tI1QN+S8o4ngclC7P4E+LhdnJlz3S4Jjv7knVoj2el7E9dgnTNVr+0dW7vJyDRHqBLDQWqz8euKjQXTqxZNxvyaIjcccYH29Fihbdv8W7Nv67Vcl81g7WN+vhRoH1d0g8whYaE2kZK1XyrhSJopGyrViLZTSwaSqzsI9YKHJA1xxF5BWx93Ff1I8WmkvHV5URTZVPwv4ANbGNPm8ujvyHPoMLF91lfZb9Ft7VtXamx0DMkjRWu0qHleNc1xH1j1xwLbrXQtq8nuQ/CKDlB9kS1rS79vjamRcUPul4QIdeXf0TuS8owmtf+pk44WK2hVS1xyuVN/7fb9CfpoNaWUPxltdcK5j5+oJQqP1Wv9GeH/v2kw7AV1+5rsA1oa03o0epz90UNRBQ9oMmuPH7L1Ub14r1sIi/eR34QfZjta71k/vXttHe5oHYKE5tEQEmd+9tk/3uwDWd2qNNz1uL1fC+fulRT4EfES6H0vhF2plm8cy7XXsoznz/edfJWYUAHdqiWTA+h7tJDIOggVgVTP3u75OV6hLZqSuhYD1PZonHQL7iXG9233yfp5yvmLY5B8GZfq77Ml535SmpFhV4+N6f9T4/YwEvmgYlyuJWqPfpQniOCVWuE2wWu/nz8A6WBUh/WGcJ5UZKAvA2ihYdZ7OgJU47udItery/cSok5Lu54JSPuougLUlrds9nf3BTzUF1t6+X+ROjblZ10aO76JnlSaAtSHt/MplyZQzM45xwWjtGD2BIY/6v5VuTSLdz7w2Cc7GuUTA2hpYteQjcI/zxp86mZZqJR1Xg08gHbLhh2sTO6s0vwLW9sASsZfWk+kYVwwNu8z7hVqdUbk23oZxR5n6Lq8MMkf+H3usFWonz5sC6zBkuDiPxJdDgT5zDu+VaiW13nGVPcx1dNdfWwbmWWoJJWCtS+viLP4UWPu2w3P/M1euca7lTARtwqum+VpCQ7vsZcObonVg9Qll9ea/DbD+D00USqimwXpUsTg06Bh3tpaz0Xkj8+y8eBiGB89xtPD9fxshnf9Bq+Ru5uYcF4roctMEhqPUkejnL5j3pNS17dEeKfXQdUAhVrhOrRxOMsyBJX1Sud3xRlR+LBfMGxreA7Xqu1Ka5sdZpYD1f4FVOxuB1wpYcgOf2+N8kaUwP2+h9XxutWDkEBhgbQKsYBYssfEWQ5Vx95GiRI55PcOTPlS6FYfADqTNbAmseB6sZKeRpeZtuQoVufdY/cKXHQbNN48WAtaGwBrWwlGwGhHbeaV8qve7mGlbI/OmuVnR6CGL0bzqywDW1sAK5sEaYn+Fcb+yVvJfJuYVXB3VcZXxsAOsjYCVqUcaJsEa0hUq436h40lk3S8VDzZfz1Xwf+haAKz/G6xQPdIwDZZ8NYwrp39qePI45k1yefHf+7cB1v8D1lU73meDVTkOp9ZmsrB428u8sXkHz3rxN09l87P+E+0UHZPxca8TgeK1zOo6f5A5x0pKi8DDT/X7CT0eOcw1VOoO/qYNAOsfaGkRKhvlcbDu2io2jNs7wBpeDXP9fgcZHvIc36UMtZQ9wFqxVlz0DfU4WJX2SjcDljj4bL1H7gfXeWl8F6WwzAtfwFqtpuY17WfAEmvhYQlYSbAzyervFqhRGfkDJ42aDJPtG8BatXZR808OM2B56qNtEqxGa+xV6PfTo37n8/F2Pusdm/xDA1jr1grjJN8kWCd1LRwHq7LSO42N+jWuJz/R37cBYP1lLdV+43AaLK0ByQhYdnqnKNig1vbLJ7AKDw1grVLT/NmBeXpqCixP5oC6wTqN9V+KzVIgo/2/wvKf2ACwPq2lxSXT3sRqNV6TeZNgnYbjfTZYVj+SXXSQ5UL81Gph6UArvp/+kV0A67Pay7dwVbX+9+3PV+2SKbBErM/T5nAeZO5TWwLl6L35/fTecHV+L/+dXQjpfFQLHZ4lEQLMx6sflLKaRyAKajty2bXzDaX8BeXbn7PqQul53v35v6L8t3YBrI9qeyNbT9EuYhsf2demEqxkuMEoWF3C1DCvdHqG/5NdAOuz2s6RodBraTlePE2CJY6BNaNgHV+tk5R55c7rDlib1W6ODIWbCN31gGTJBFiFXExdYJ0DRyg78Q1HKWBtT9MLEGtaLl0P/gRY/YIZO8DKvZFDEjIe7crlAqxtaDtHkGUnKnyKVPPbOFgCvsIGa3zevVlJErA2p0WOYvyRTGMRJ+SDcbAa+2zgLFiD06EnC7A2p2kFiHXNV9yl3ihYwu+lZIbeZ8GSBY76vD/A2p7mqzXNdK19mtyVYwxusMRaOMwRDlyOzhuKSgsnwNqmFjkqhUaKOyB0lUdTwaosR2oo3VTj87avhrk8E/8fgAUS72je7TY3Ti1AbGg7QYDV/E2GdB7qXl98zr1nfTpG6Z3+J1sB1nLtdNuJwj9T4y6OYvwXJR3GVRNGA+tmFghdBNZ/pgHWY2kZx3xhrnjhyFAohnSsRvyhHtzSwPLMQxKA9dhsGcchce44d61SgNjUMm17no+AZa2FgLVJLS0uWgw4mbv2MnhBTa2vwa77SS2wImMtBKwNatfQTFm5zl3rKsZfaKnJp9goN6SDpfi9AGuT2j7M3Ol109dmMovB1ESp7FI/B2+Apfq9hmsBazOuhZ2ZXnfzFl0byseTpYmcd08v92KAFelpMDVgbajWws4qdd4svd9VbtUt7Si0i1agygDLWAsBa2uuBbUo9Tv3y8RuzNYSUc9B7T1pgiWapZYrBgucrH5XVmeiPmlz+f1EdQ+HJtNhRBJVaYZ0TL9Xj91MSOd/0wBL1xz9rqLD2/erHLWrKoGHUAKlE4AJVqrV93cdsACsNWneb/pdqZpvZShIbYjo3YYnkQmW6vfqwMq99AFYq9WK3/S7UrW746jXXYkXaqkungOsRl0L/6esBcD6kZYpL4HlL+5XORrdVlYgRxwIa2yw+nS/LFmrTQHL5YH6Ub8rTcsdjW5ztfqVthc72WAF/6Q8GmD9I83lgfrR/TxHvXXPPrDar715ZoHVKKX8AWv9mssD9ZP7ael+urZTx6m1aPRgUXy8rtmmgKVr4k3t1/fLHSXOcmP7rvhJ5QnprdgUsHRNNsX67f3MtVDRbqp2ijcKFjjNe6B+cr+k1rP1FM3XMygkWOWWbApYCzxQ5rhDtOB+Rz1DQdUa7doIsL5Bc3mgtHFJW1evmb9foD+eVM0on30ErG/QXB4oOU5EqIP5+yW1lq2narF+bdfYMg6aB2CtU0uL5oceKOHlGiLU6fy8obYWalqjX+tllyLdmO2/B6z2SET4Qw/UK/Ehtkv2T93vqj2eNC3Y/irwLWD1VJx+6IGyiqtfFsybqY8nXUsBayOa8E3+xAN1skr2ZzJCPXW/0NESPHR2kgCs1WrydPH8tam2Fh6ivLZryy6aV1sLde0CWBvRBC1LCmcMB06TwLfTlJfPu1PWQkNLNw/WtzgU+he624JrhQfKOAHdHalI35n37jiU32krzlogVmhoPS27Bdcm7iY0fnR6c97KcSi/kkczAGsTmuGvXOKBMtrW/GBe39EkN/2OzccmwfL2QbTfG+OOy4vsX93n6t//LndX9T7AWqVWeme5zy7UcVcjtWCBB+r1Uhfuf/z9TsNaCFhr/scZ7a66bttyXKanFizwQHWr2K++ny+drYC12n9cGTga9HnDuNDZ833KA1V3L4G/+X6vlJgMsFb7D/HuI61HB7/31dGZ6x0P1E++30H6FgBrhf+Qg1UaxnxmNY61cGoOtdfSr77fTfgWAGtt/xCroa35KR9694ZgwRxqryUy1r4w5z21veO+V3a5VxI3WbLRSA592wMFOt8SK7RLw/jRQY7zrM7xvpYcOjmH970eqK8HK8pc3nFHiY+d0O5aFb1FHqhZf/seiDYHltM7ro67yQN7lr/yMx6oJohlu1TA2gpYB7U+qLNHe5KJBJhe0JJDl3ig2nS/sXF9VmkAROsH6+R5iubLqrNj10o69J2Tv9AD9VoLneOGrNIjEK0crO4N0Fc0VwM3/VpBx1RnrrFrz+LpZo/Ts0oTwFozWOLoVTVo2il297W943T/cKyFM/OKBC4rWys4G759wFovWENxULXEq5oJ4772bIBVKGvhzLxJbXZ3ezhLKvtXwFovWEPlDLWBrXqKfRlYrs5cy5OZr6Fd/PYARGvOeS+1HknLMekzGoZ3xuPy0taFfgxspK8OOK06VqiAFc40cHMVJRrO5gT1gsbdL02Unm2xdfTVCT0g2hRYan3QxtHATXMKiEwZKSWxfAeYnbeHMLSTJ+LwCkRbA0urD5pZy6N+sF5kvzTmI+u+YN5mJF3iUqRAtEGwwpkGbsO1RW30r2k/Mt1vfl5HRmodFqTSbA6szKoPOlk++xq7IJJF++fnDay+OqJFBBBtCiwza32yfHYSKTmk9vIYLJi3Ml4CTwCzTbBEM0k19XesfHYgN9y5fr/S2tCPz+vjWlg9WIfomMyBpVXUeI1zl89W3+Py9PFuXWR5JP4+1JcBmDWC9Yq/HWfBuhnl9IZooLI8JloSfG7VdZmpi3y47UItmRnXwlpz3mXeejQT0hGbHn8cEzOYF9pJfV5tPffk59W0N5ba7hgkYLLOWGEYG00/JsASy5hSH1TLCr0a5Tx2zgDxzn7uGXkLDXCsHyz1CZMdZsDy7PqgMhPGChHHkTttODLKiD6sR10AHOsHS3MW+TNgnewONT1r2c5KPBjzjx+MbiSPxoIyBY7Vg5Vo/u1wGiyzgZaSFao/rIJyYl5fz7Qq7WyYEjjWn48VOPIxR8EyGmgpWaFaMG96XjWn2Sq0/YSyAo4tgCWid/2S5k2CZTSTVLJCh6pYs10j5Fp48myqGuDYSgZpj1TvdNglU2CJsLM33C8dOQk935nLLolcpMCxHbD6tbDIx4+1D2AV2lqopvtZJ6Fn6yLrn3OQAMemwOqjd5c0Gz19nEiwUpnPIO9X2MvjzLxJ7Sr6AByfBOsfTdfHjtzjek9BUsrCQ9a4WrZ5P1odasSB52r597sYnokTSKwxVtgVcfTGx/UhwEi888XpBFiB3aEmfLunVqEdiQCENYJ1uCkhFPc4T55w6KnJJ8Dqn09qhxpXA7eZ7xereQuAsEawIrW03si4nXCFp7nR6N0GS2ug1Q9yNXCb/n6BmrcACOsGK67GxkXSFV7FRudcG6yrXR/U1cBt+vs19SWgANFGwHLtnbToXXfaT/WTOsFSm0k2qjdCb+A28/2IBm4IrDpPpqN31ZC16SejYIX2nm1nL4/8wBsHq3MPhPl4C2+FvrviWz+OguUNa6G428fKZ6OtBqwueS4Xe6dwMnrXlfdIfUfdPRUs8Xw7UT7768Gq5bHicDJ6V8lMc5FP6gLrbh/rmnVpoP1jsP76dGHPxK3WMoKNcYWKXSD2+sM4GdJ5PNSKjw9Donz298QKQ5Glfq4nOrjrIcDQOhGogSWeT4cflM9G2xZYz2Ut2alNTkeid73LMjdLd+hgRXZ90O9t4Pb1YMl6j3E1Hr3rt2Cn2CjnoYN1sOuDzpfPRtsqWDINqt08jUTvMj2VJq6cYJlZ64/Z8tlo6wHr1ETns1/vzsfIWwaWdJbm6Uj0bsh593SXqgFWZNUHFe+VET/wqsGq7rlx1mrsWu0oaiALdTiid4pfdNh0HZ1gibVQ+X5j5bP50VcEVmGfjPGbJWDJIzWBPUesHGlu3xO1/iQGWOL5VA7fz1k+mx94TWAV7s6T9yVgCbf64IKXc9wV5LqHYqxcaoIVmLVAXOWz+YHXBJaXj7UyDRaAJXGxmxv1Dvez6TTt+muZYCVGg+dHz1p45QduVpnz7k00yXWWxdbWrCGdaijKYYZlTlITVdXMkI7t9+q0+EJ90NXGCtWDU7t7UT4/yiNsvwCsIY/GPPxwGzZJWpyxVSywGjuonfIDrxasQGtnKkaVYuO0SxaAJQI2L0epushagZxE5hxbYAm/F723tgDWXR7uvGrj5JY8GgNLezr5iqNUnSMfS4eJTzZYAb23NgOWOPeXWe26E3/Mi9R7nDRNjDbrg3p2Oow4thNbYDV0iNgMWD0PvqM82qFdtLLbYaxvl34/2SVOr2h8kul+jUmWWbyo26s3/JibAKvQs9H1cdFz1zVezsMAa2gTp9fOy8W6OWhpbleS5IfbFlhG0TN9XDJyRs8JVjJUYdcK+XvC1apopxiwtg1WOhqMWdDCUtX0uoxqvfVUrIXq/UrA2jZY/Q9c/Q4sz6rLGCjX9m7PRrufB1grBGv5JZHeEX7hdKWKind3hRkrIyzz8rUr9zvWesiZn3BTscLfgmX3k9Qdpd1Orfdn6PfrkpqzoOGHAywTrENkPKt20UEucf4QjAnNSXr3BB0itgtWv0xd35vEGbT275Xmo3o1vFFC1AE/0veA1W/Dz78FS6nBLuPRobw2Mxrd8CNtPx8rG+lB8w5YRrnr0MrlCo1J+JG2D1ZoJv/2gw77feO1n/I0A5Zd7tpX80+bRq9+xY/0HWDthy1Sl4hVRtHtfNY3T8F+FCxnuWsZj26fUWq6X8qP9D2pycd6wcdo5ebNlLuW8WhxOPX2cpryI30RWEm2hCy9+aSn+dIdc+wHd1afO4NrYQtgvXVJFS8iS22XGzmzG9Q5pNMhezlKyVv/wtTkyl/2zBquvc2CJQscSUcpP9LXgfVI74vIGg5EnIdSfaNziOKQxYkf5FvBejxOZsjPD8N71H3Ocg8Wn3Swwsk52lfDhX270DYLVls5Yf8CySvLUh8nE/ju74DVJLRIAqyZRry5PKL8BlhogDWniZNgJWAB1kcnKcT2HbAA66OTxH2wD7AA66OThD1KgEXO+0dvfe6rEb3+jofaRJicWOHnwKoBC7A+M4mvlQcBLMD6zCQHcVoQsADr7Yur8XGhXm8dsABr6cWpF/uj4/aSJBWsG8YHrJmLD0Es8t4d46pMnpuXYOUR3ZcBa+7ivXIu3h5XxsPS91Jy74ShAWvBxbvhXLw1zlNLpGFowHrn4mCouGCMGxoLBBj668F6/xKJT5SqOVpK/l+AeQnp/IBF5Vhz8Wri3GglPwIMjfaTIHQwne9eYGi0n2U3RBNY+RVGRftp2szoMyuLMCraL/Kx9js3VglGRftVol8SWcftj1eMivZbsNpa7UqhmfPtilHRPpaaXHZ1scoKo6J9FCw0tOaf5byjof2V1GQ0NMBCAyw0wEIDLIyABlhogIUGWBgGDbDQVgIW5kAjVogGWGiAhWHQAAsNsNAAC8OgARYaYKEBFoZB+yRYmAONWCEaYKEBFoZBAyw0wEIDLAyDBlhogIUGWBgG7ZNgYQ40YoVogIUGWBgGDbDQAAsNsDAMGmChARYaYGEYtE+ChTnQiBWiARYaYGEYNMBCAyw0wMIwaICFBlhogIVh0D4JFuZAI1aIBlhogIVh0AALDbDQAAvDoAEWGmChARaGQfskWJgDjVghGmChARaGQQMsNMBCAywMgwZYaICFBlgYBu2TYGEONGKFaICFBlgYBg2w0AALDbAwDBpgoQEWGmBhGLRPgoU50IgVogEWGmBhGDTAQgMsNMDCMGiAhQZYaICFYdA+CRbmQCNWiAZYaICFYdAACw2w0AALw6ABFhpgoQEWhkH7JFiYA41YIRpgoQEWhkEDLDTAQgMsDIMGWGiAhQZYGAbtk2BhDjRihWiAhQZYGAYNsNAACw2wMAwaYKEBFhpgYRi0D2p/BBgAdvm9Pq2H7sMAAAAASUVORK5CYII=';
	var _this = this;

	/**
	 * パスから拡張子を取り出して返す
	 */
	function getExtension(path){
		var ext = path.replace( new RegExp('^.*?\.([a-zA-Z0-9\_\-]+)$'), '$1' );
		ext = ext.toLowerCase();
		return ext;
	}

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = {}
		if( typeof(fieldData) === typeof({}) ){
			rtn = fieldData;
		}
		it79.fnc(
			{},
			[
				function(it1, data){
					_resMgr.getResource( rtn.resKey, function(res){
						if( mode == 'finalize' ){
							_resMgr.getResourcePublicPath( rtn.resKey, function(publicPath){
								rtn.path = publicPath;
								it1.next(data);
							} );
							return;
						}else if( mode == 'canvas' ){
							rtn.path = 'data:'+res.type+';base64,' + res.base64;

							if( !res.base64 ){
								// ↓ ダミーの Sample Image
								rtn.path = _imgDummy;
							}
							it1.next(data);
							return;
						}
						it1.next(data);
						return;
					} );
				},
				// function(it1, data){
				// 	it1.next();
				// },
				function(it1, data){
					callback(rtn.path);
					it1.next();
				}
			]
		);
		return;
	}

	/**
	 * プレビュー用の簡易なHTMLを生成する
	 */
	this.mkPreviewHtml = function( fieldData, mod, callback ){
		var rtn = {}
		if( typeof(fieldData) === typeof({}) ){
			rtn = fieldData;
		}
		_resMgr.getResource( rtn.resKey, function(res){
			rtn.path = 'data:'+res.type+';base64,' + res.base64;
			if( !res.base64 ){
				// ↓ ダミーの Sample Image
				rtn.path = _imgDummy;
			}
			rtn = $('<img src="'+rtn.path+'" />');
			rtn.css({
				'max-width': 200,
				'max-height': 200
			});

			callback( rtn.get(0).outerHTML );
		} );
		return;
	}

	/**
	 * データを正規化する
	 */
	this.normalizeData = function( fieldData, mode ){
		var rtn = fieldData;
		if( typeof(fieldData) !== typeof({}) ){
			rtn = {
				"resKey":'',
				"path":'about:blank'
			};
		}
		return rtn;
	}

	/**
	 * エディタUIを生成
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var rtn = $('<div>');
		if( typeof(data) !== typeof({}) ){ data = {}; }
		if( typeof(data.resKey) !== typeof('') ){
			data.resKey = '';
		}
		// if( typeof(data.original) !== typeof({}) ){ data.original = {}; }
		_resMgr.getResource( data.resKey, function(res){
			// console.log(res);
			var path = 'data:'+res.type+';base64,' + res.base64;
			if( !res.base64 ){
				// ↓ ダミーの Sample Image
				path = _imgDummy;
			}

			var $img = $('<img>');
			rtn.append( $img
				.attr({
					"src": path ,
					"data-size": res.size ,
					"data-extension": res.ext,
					"data-mime-type": res.type,
					"data-base64": res.base64
				})
				.css({
					'min-width':'100px',
					'max-width':'100%',
					'min-height':'100px',
					'max-height':'200px'
				})
			);
			rtn.append( $('<input>')
				.attr({
					"name":mod.name ,
					"type":"file",
					"webkitfile":"webkitfile"
				})
				.css({'width':'100%'})
				.bind('change', function(e){
					// console.log(e.target.files);
					var fileInfo = e.target.files[0];

					function readSelectedLocalFile(fileInfo, callback){
						var reader = new FileReader();
						reader.onload = function(evt) {
							callback( evt.target.result );
						}
						reader.readAsDataURL(fileInfo);
					}

					var realpathSelected = $(this).val();
					if( realpathSelected ){
						readSelectedLocalFile(fileInfo, function(dataUri){
							$img
								.attr({
									"src": dataUri ,
									"data-size": fileInfo.size ,
									"data-extension": getExtension( fileInfo.name ),
									"data-mime-type": fileInfo.type ,
									"data-base64": (function(dataUri){
										dataUri = dataUri.replace(new RegExp('^data\\:[^\\;]*\\;base64\\,'), '');
										// console.log(dataUri);
										return dataUri;
									})(dataUri)
								})
							;
						});
					}

					// _this.callGpi(
					// 	{
					// 		'fileInfo': fileInfo
					// 	},
					// 	function(result){
					// 		console.log(result);
					// 	}
					// );

				})
			);
			rtn.append(
				$('<div>')
					.append( $('<span>')
						.text('出力ファイル名(拡張子を含まない):')
					)
					.append( $('<input>')
						.attr({
							"name":mod.name+'-publicFilename' ,
							"type":"text",
							"placeholder": "output file name"
						})
						.val( (typeof(res.publicFilename)==typeof('') ? res.publicFilename : '') )
					)
			);
			$(elm).html(rtn);

			setTimeout(function(){ callback(); }, 0);
		} );
		return;
	}

	/**
	 * データを複製する
	 */
	this.duplicateData = function( data, callback ){
		data = JSON.parse( JSON.stringify( data ) );
		it79.fnc(
			data,
			[
				function(it1, data){
					_resMgr.duplicateResource( data.resKey, function(newResKey){
						data.resKey = newResKey;
						it1.next(data);
					} );
				} ,
				function(it1, data){
					_resMgr.getResourcePublicPath( data.resKey, function(publicPath){
						data.path = publicPath;
						it1.next(data);
					} );
				} ,
				function(it1, data){
					callback(data);
					it1.next(data);
				}
			]
		);
		return;
	}

	/**
	 * エディタUIで編集した内容を保存
	 */
	this.saveEditorContent = function( elm, data, mod, callback ){
		var resInfo,
			realpathSelected;
		var $dom = $(elm);
		if( typeof(data) !== typeof({}) ){
			data = {};
		}
		if( typeof(data.resKey) !== typeof('') ){
			data.resKey = '';
		}

		it79.fnc(
			data,
			[
				function(it1, data){
					// console.log('saving image field data.');
					_resMgr.getResource(data.resKey, function(result){
						// console.log(result);
						if( result === false ){
							// console.log('result is false');
							_resMgr.addResource(function(newResKey){
								// console.log('new Resource Key is: '+newResKey);
								data.resKey = newResKey;
								// console.log(data.resKey);
								it1.next(data);
							});
							return;
						}
						it1.next(data);
						return;
					});
				} ,
				function(it1, data){
					_resMgr.getResource(data.resKey, function(res){
						// console.log(res);
						resInfo = res;
						it1.next(data);
					});
					return;
				} ,
				function(it1, data){
					realpathSelected = $dom.find('input[type=file]').val();
					if( realpathSelected ){
						resInfo.ext = $dom.find('img').attr('data-extension');
						resInfo.type = $dom.find('img').attr('data-mime-type');
						resInfo.size = $dom.find('img').attr('data-size');
						resInfo.base64 = $dom.find('img').attr('data-base64');
					}
					resInfo.isPrivateMaterial = false;
					resInfo.publicFilename = $dom.find('input[name='+mod.name+'-publicFilename]').val();

					_resMgr.updateResource( data.resKey, resInfo, function(result){
						_resMgr.getResourcePublicPath( data.resKey, function(publicPath){
							data.path = publicPath;
							it1.next(data);
						} );
					} );
					return;

				} ,
				function(it1, data){
					callback(data);
					it1.next(data);
				}
			]
		);
		return;
	}// this.saveEditorContent()

}

},{"iterate79":24,"phpjs":28}],17:[function(require,module,exports){
module.exports = function(broccoli){

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = ''
		var marked = require('marked');
		marked.setOptions({
			renderer: new marked.Renderer(),
			gfm: true,
			tables: true,
			breaks: false,
			pedantic: false,
			sanitize: false,
			smartLists: true,
			smartypants: false
		});

		if(typeof(fieldData)===typeof('')){
			rtn = marked(fieldData);
		}
		if( mode == 'canvas' && !rtn.length ){
			rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;white-space:nowrap;">(ダブルクリックしてマークダウンを編集してください)</span>';
		}
		setTimeout(function(){
			// px.textEditor.attachTextEditor(
			// 	$dom.find('textarea').get(0),
			// 	'md'
			// );
			// $dom.find('.CodeMirror').css({
			// 	'border': '1px solid #ccc',
			// 	'border-radius': '3px'
			// });

			callback(rtn);
		}, 0);
		return;
	}

}

},{"marked":26}],18:[function(require,module,exports){
module.exports = function(broccoli){
	var php = require('phpjs');

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = ''
		if(typeof(fieldData)===typeof({}) && typeof(fieldData.src)===typeof('')){
			switch( fieldData.editor ){
				case 'text':
					rtn = php.htmlspecialchars( fieldData.src ); // ←HTML特殊文字変換
					rtn = rtn.replace(new RegExp('\r\n|\r|\n','g'), '<br />'); // ← 改行コードは改行タグに変換
					break;
				case 'markdown':
					var marked = require('marked');
					marked.setOptions({
						renderer: new marked.Renderer(),
						gfm: true,
						tables: true,
						breaks: false,
						pedantic: false,
						sanitize: false,
						smartLists: true,
						smartypants: false
					});
					rtn = marked(fieldData.src);
					break;
				case 'html':
				default:
					rtn = fieldData.src;
					break;
			}
		}
		if( mode == 'canvas' && !rtn.length ){
			rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;white-space:nowrap;">(ダブルクリックしてテキストを編集してください)</span>';
		}
		setTimeout(function(){ callback(rtn); }, 0);
		return;
	}

	/**
	 * データを正規化する
	 */
	this.normalizeData = function( fieldData, mode ){
		// 編集画面用にデータを初期化。
		var rtn = {};
		if( typeof(fieldData) === typeof({}) ){
			rtn = fieldData;
		}else if( typeof(fieldData) === typeof('') ){
			rtn.src = fieldData;
			rtn.editor = 'markdown';
		}
		rtn.src = rtn.src||'';
		rtn.editor = rtn.editor||'';
		return rtn;
	}

	/**
	 * エディタUIを生成
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		if(typeof(data) !== typeof({})){ data = {'src':''+data,'editor':'markdown'}; }
		var rows = 12;
		if( mod.rows ){
			rows = mod.rows;
		}
		var rtn = $('<div>')
			.append($('<textarea>')
				.attr({
					"name":mod.name,
					"rows":rows
				})
				.css({'width':'100%','height':'auto'})
			)
			.append($('<ul class="horizontal">')
				.append($('<li class="horizontal-li"><label><input type="radio" name="editor-'+php.htmlspecialchars(mod.name)+'" value="" /> HTML</label></li>'))
				.append($('<li class="horizontal-li"><label><input type="radio" name="editor-'+php.htmlspecialchars(mod.name)+'" value="text" /> テキスト</label></li>'))
				.append($('<li class="horizontal-li"><label><input type="radio" name="editor-'+php.htmlspecialchars(mod.name)+'" value="markdown" /> Markdown</label></li>'))
			)
		;
		rtn.find('textarea').val(data.src);
		rtn.find('input[type=radio][name=editor-'+mod.name+'][value="'+data.editor+'"]').attr({'checked':'checked'});

		$(elm).html(rtn);
		setTimeout(function(){
			// px.textEditor.attachTextEditor(
			// 	$dom.find('textarea').get(0),
			// 	'md'
			// );
			// $dom.find('.CodeMirror').css({
			// 	'border': '1px solid #ccc',
			// 	'border-radius': '3px'
			// });

			callback();
		}, 0);
		return;
	}

	/**
	 * エディタUIで編集した内容を保存
	 */
	this.saveEditorContent = function( elm, data, mod, callback ){
		var $dom = $(elm);
		// console.log($dom.html());
		if(typeof(data) !== typeof({})){
			data = {};
		}
		data.src = $dom.find('textarea').val();
		data.src = JSON.parse( JSON.stringify(data.src) );
		data.editor = $dom.find('input[type=radio][name=editor-'+mod.name+']:checked').val();

		setTimeout(function(){
			callback(data);
		}, 0);
		return;
	}

}

},{"marked":26,"phpjs":28}],19:[function(require,module,exports){
module.exports = function(broccoli){

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = ''
		if( typeof(fieldData) === typeof([]) ){
			rtn += fieldData.join('');
		}else{
			rtn += fieldData;
		}
		if( !rtn.length && mod.options ){
			var isHit = false;
			for( var idx in mod.options ){
				if( rtn == mod.options[idx].value ){
					isHit = true;
					break;
				}
			}
			if( !isHit ){
				// 選択値が空白で、空白の選択肢がなければ、1件目のオプションを選ぶ。
				for( var idx in mod.options ){
					rtn = mod.options[idx].value;
					break;
				}
			}
		}
		if( mode == 'canvas' && !rtn.length ){
			// rtn = '(ダブルクリックして選択してください)';
				// ↑未選択時のダミー文はなしにした。
				// 　クラス名の modifier 部分の拡張などに使用する場合に、
				// 　クラス名とダミー文が合体して存在しないクラス名になってしまうので。
		}
		setTimeout(function(){ callback(rtn); }, 0);
		return;
	}

	/**
	 * エディタUIを生成
	 */
	this.mkEditor = function( mod, data, elm, callback ){

		var $select = $('<select>')
			.attr({
				"name":mod.name
			})
			.css({'max-width':'100%'})
		;
		if( mod.options ){
			for( var idx in mod.options ){
				var $option = $('<option>')
					.attr({
						'value':mod.options[idx].value
					})
					.text(mod.options[idx].label)
				;
				if( data==mod.options[idx].value ){
					$option.attr({
						'selected': 'selected'
					});
				}
				$select.append( $option );
			}
		}
		var rtn = $('<div>')
			.append( $select )
		;
		$(elm).html(rtn);

		setTimeout(function(){
			callback();
		}, 0);
		return;
	}

	/**
	 * エディタUIで編集した内容を保存
	 */
	this.saveEditorContent = function( elm, data, mod, callback ){
		var $dom = $(elm);
		var src = $dom.find('select').val();
		src = JSON.parse( JSON.stringify(src) );
		callback(src);
		return;
	}

}

},{}],20:[function(require,module,exports){
module.exports = function(broccoli){
	var php = require('phpjs');

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = ''
		if(typeof(fieldData)===typeof('')){
			rtn = php.htmlspecialchars( fieldData ); // ←HTML特殊文字変換
			rtn = rtn.replace(new RegExp('\r\n|\r|\n','g'), '<br />'); // ← 改行コードは改行タグに変換
		}
		if( mode == 'canvas' && !rtn.length ){
			rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;white-space:nowrap;">(ダブルクリックしてテキストを編集してください)</span>';
		}
		setTimeout(function(){
			callback(rtn);
		}, 0);
		return;
	}

}

},{"phpjs":28}],21:[function(require,module,exports){

},{}],22:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require("oMfpAn"))
},{"oMfpAn":23}],23:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],24:[function(require,module,exports){
/**
 * node-iterate79
 */
(function(exports){

	/**
	 * 配列の直列処理
	 */
	exports.ary = function(ary, fnc, fncComplete){
		return new (function( ary, fnc, fncComplete ){
			this.idx = -1;
			this.idxs = [];
			for( var i in ary ){
				this.idxs.push(i);
			}
			this.ary = ary||[];
			this.fnc = fnc||function(){};
			this.fncComplete = fncComplete||function(){};

			this.next = function(){
				if( this.idx+1 >= this.idxs.length ){
					this.fncComplete();
					return this;
				}
				this.idx ++;
				this.fnc( this, this.ary[this.idxs[this.idx]], this.idxs[this.idx] );
				return this;
			}
			this.next();
		})(ary, fnc, fncComplete);
	}

	/**
	 * 関数の直列処理
	 */
	exports.fnc = function(aryFuncs){
		var mode = 'explicit';
		var defaultArg = undefined;
		if( arguments.length >= 2 ){
			mode = 'implicit';
			defaultArg = arguments[0];
			aryFuncs = arguments[arguments.length-1];
		}


		function iterator( aryFuncs ){
			aryFuncs = aryFuncs||[];

			var idx = 0;
			var funcs = aryFuncs;
			var isStarted = false;//2重起動防止

			this.start = function(arg){
				if(isStarted){return this;}
				isStarted = true;
				return this.next(arg);
			}

			this.next = function(arg){
				arg = arg||{};
				if(funcs.length <= idx){return this;}
				(funcs[idx++])(this, arg);
				return this;
			};
		}
		var rtn = new iterator(aryFuncs);
		if( mode == 'implicit' ){
			return rtn.start(defaultArg);
		}
		return rtn;
	}


})(exports);

},{}],25:[function(require,module,exports){
/*!
 * jQuery JavaScript Library v2.1.4
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2014 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2015-04-28T16:01Z
 */

(function( global, factory ) {

	if ( typeof module === "object" && typeof module.exports === "object" ) {
		// For CommonJS and CommonJS-like environments where a proper `window`
		// is present, execute the factory and get jQuery.
		// For environments that do not have a `window` with a `document`
		// (such as Node.js), expose a factory as module.exports.
		// This accentuates the need for the creation of a real `window`.
		// e.g. var jQuery = require("jquery")(window);
		// See ticket #14549 for more info.
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document ) {
					throw new Error( "jQuery requires a window with a document" );
				}
				return factory( w );
			};
	} else {
		factory( global );
	}

// Pass this if window is not defined yet
}(typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

// Support: Firefox 18+
// Can't be in strict mode, several libs including ASP.NET trace
// the stack via arguments.caller.callee and Firefox dies if
// you try to trace through "use strict" call chains. (#13335)
//

var arr = [];

var slice = arr.slice;

var concat = arr.concat;

var push = arr.push;

var indexOf = arr.indexOf;

var class2type = {};

var toString = class2type.toString;

var hasOwn = class2type.hasOwnProperty;

var support = {};



var
	// Use the correct document accordingly with window argument (sandbox)
	document = window.document,

	version = "2.1.4",

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {
		// The jQuery object is actually just the init constructor 'enhanced'
		// Need init if jQuery is called (just allow error to be thrown if not included)
		return new jQuery.fn.init( selector, context );
	},

	// Support: Android<4.1
	// Make sure we trim BOM and NBSP
	rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

	// Matches dashed string for camelizing
	rmsPrefix = /^-ms-/,
	rdashAlpha = /-([\da-z])/gi,

	// Used by jQuery.camelCase as callback to replace()
	fcamelCase = function( all, letter ) {
		return letter.toUpperCase();
	};

jQuery.fn = jQuery.prototype = {
	// The current version of jQuery being used
	jquery: version,

	constructor: jQuery,

	// Start with an empty selector
	selector: "",

	// The default length of a jQuery object is 0
	length: 0,

	toArray: function() {
		return slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {
		return num != null ?

			// Return just the one element from the set
			( num < 0 ? this[ num + this.length ] : this[ num ] ) :

			// Return all the elements in a clean array
			slice.call( this );
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;
		ret.context = this.context;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	// (You can seed the arguments with an array of args, but this is
	// only used internally.)
	each: function( callback, args ) {
		return jQuery.each( this, callback, args );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map(this, function( elem, i ) {
			return callback.call( elem, i, elem );
		}));
	},

	slice: function() {
		return this.pushStack( slice.apply( this, arguments ) );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	eq: function( i ) {
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[j] ] : [] );
	},

	end: function() {
		return this.prevObject || this.constructor(null);
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: push,
	sort: arr.sort,
	splice: arr.splice
};

jQuery.extend = jQuery.fn.extend = function() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;

		// Skip the boolean and the target
		target = arguments[ i ] || {};
		i++;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	// Extend jQuery itself if only one argument is passed
	if ( i === length ) {
		target = this;
		i--;
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && jQuery.isArray(src) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend({
	// Unique for each copy of jQuery on the page
	expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

	// Assume jQuery is ready without the ready module
	isReady: true,

	error: function( msg ) {
		throw new Error( msg );
	},

	noop: function() {},

	isFunction: function( obj ) {
		return jQuery.type(obj) === "function";
	},

	isArray: Array.isArray,

	isWindow: function( obj ) {
		return obj != null && obj === obj.window;
	},

	isNumeric: function( obj ) {
		// parseFloat NaNs numeric-cast false positives (null|true|false|"")
		// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
		// subtraction forces infinities to NaN
		// adding 1 corrects loss of precision from parseFloat (#15100)
		return !jQuery.isArray( obj ) && (obj - parseFloat( obj ) + 1) >= 0;
	},

	isPlainObject: function( obj ) {
		// Not plain objects:
		// - Any object or value whose internal [[Class]] property is not "[object Object]"
		// - DOM nodes
		// - window
		if ( jQuery.type( obj ) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
			return false;
		}

		if ( obj.constructor &&
				!hasOwn.call( obj.constructor.prototype, "isPrototypeOf" ) ) {
			return false;
		}

		// If the function hasn't returned already, we're confident that
		// |obj| is a plain object, created by {} or constructed with new Object
		return true;
	},

	isEmptyObject: function( obj ) {
		var name;
		for ( name in obj ) {
			return false;
		}
		return true;
	},

	type: function( obj ) {
		if ( obj == null ) {
			return obj + "";
		}
		// Support: Android<4.0, iOS<6 (functionish RegExp)
		return typeof obj === "object" || typeof obj === "function" ?
			class2type[ toString.call(obj) ] || "object" :
			typeof obj;
	},

	// Evaluates a script in a global context
	globalEval: function( code ) {
		var script,
			indirect = eval;

		code = jQuery.trim( code );

		if ( code ) {
			// If the code includes a valid, prologue position
			// strict mode pragma, execute code by injecting a
			// script tag into the document.
			if ( code.indexOf("use strict") === 1 ) {
				script = document.createElement("script");
				script.text = code;
				document.head.appendChild( script ).parentNode.removeChild( script );
			} else {
			// Otherwise, avoid the DOM node creation, insertion
			// and removal by using an indirect global eval
				indirect( code );
			}
		}
	},

	// Convert dashed to camelCase; used by the css and data modules
	// Support: IE9-11+
	// Microsoft forgot to hump their vendor prefix (#9572)
	camelCase: function( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	},

	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	},

	// args is for internal usage only
	each: function( obj, callback, args ) {
		var value,
			i = 0,
			length = obj.length,
			isArray = isArraylike( obj );

		if ( args ) {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			}

		// A special, fast, case for the most common use of each
		} else {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			}
		}

		return obj;
	},

	// Support: Android<4.1
	trim: function( text ) {
		return text == null ?
			"" :
			( text + "" ).replace( rtrim, "" );
	},

	// results is for internal usage only
	makeArray: function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArraylike( Object(arr) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				push.call( ret, arr );
			}
		}

		return ret;
	},

	inArray: function( elem, arr, i ) {
		return arr == null ? -1 : indexOf.call( arr, elem, i );
	},

	merge: function( first, second ) {
		var len = +second.length,
			j = 0,
			i = first.length;

		for ( ; j < len; j++ ) {
			first[ i++ ] = second[ j ];
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, invert ) {
		var callbackInverse,
			matches = [],
			i = 0,
			length = elems.length,
			callbackExpect = !invert;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			callbackInverse = !callback( elems[ i ], i );
			if ( callbackInverse !== callbackExpect ) {
				matches.push( elems[ i ] );
			}
		}

		return matches;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var value,
			i = 0,
			length = elems.length,
			isArray = isArraylike( elems ),
			ret = [];

		// Go through the array, translating each of the items to their new values
		if ( isArray ) {
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}

		// Go through every key on the object,
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}
		}

		// Flatten any nested arrays
		return concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// Bind a function to a context, optionally partially applying any
	// arguments.
	proxy: function( fn, context ) {
		var tmp, args, proxy;

		if ( typeof context === "string" ) {
			tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		if ( !jQuery.isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
		args = slice.call( arguments, 2 );
		proxy = function() {
			return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
		};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		proxy.guid = fn.guid = fn.guid || jQuery.guid++;

		return proxy;
	},

	now: Date.now,

	// jQuery.support is not used in Core but other projects attach their
	// properties to it so it needs to exist.
	support: support
});

// Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

function isArraylike( obj ) {

	// Support: iOS 8.2 (not reproducible in simulator)
	// `in` check used to prevent JIT error (gh-2145)
	// hasOwn isn't used here due to false negatives
	// regarding Nodelist length in IE
	var length = "length" in obj && obj.length,
		type = jQuery.type( obj );

	if ( type === "function" || jQuery.isWindow( obj ) ) {
		return false;
	}

	if ( obj.nodeType === 1 && length ) {
		return true;
	}

	return type === "array" || length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj;
}
var Sizzle =
/*!
 * Sizzle CSS Selector Engine v2.2.0-pre
 * http://sizzlejs.com/
 *
 * Copyright 2008, 2014 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2014-12-16
 */
(function( window ) {

var i,
	support,
	Expr,
	getText,
	isXML,
	tokenize,
	compile,
	select,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + 1 * new Date(),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// General-purpose constants
	MAX_NEGATIVE = 1 << 31,

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf as it's faster than native
	// http://jsperf.com/thor-indexof-vs-for/5
	indexOf = function( list, elem ) {
		var i = 0,
			len = list.length;
		for ( ; i < len; i++ ) {
			if ( list[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",
	// http://www.w3.org/TR/css3-syntax/#characters
	characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

	// Loosely modeled on CSS identifier characters
	// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
	// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = characterEncoding.replace( "w", "w#" ),

	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + characterEncoding + ")(?:" + whitespace +
		// Operator (capture 2)
		"*([*^$|!~]?=)" + whitespace +
		// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
		"*\\]",

	pseudos = ":(" + characterEncoding + ")(?:\\((" +
		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
		// 1. quoted (capture 3; capture 4 or capture 5)
		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
		// 2. simple (capture 6)
		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
		// 3. anything else (capture 2)
		".*" +
		")\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rwhitespace = new RegExp( whitespace + "+", "g" ),
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + characterEncoding + ")" ),
		"CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
		"TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,
	rescape = /'|\\/g,

	// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox<24
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			high < 0 ?
				// BMP codepoint
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	},

	// Used for iframes
	// See setDocument()
	// Removing the function wrapper causes a "Permission Denied"
	// error in IE
	unloadHandler = function() {
		setDocument();
	};

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var match, elem, m, nodeType,
		// QSA vars
		i, groups, old, nid, newContext, newSelector;

	if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
		setDocument( context );
	}

	context = context || document;
	results = results || [];
	nodeType = context.nodeType;

	if ( typeof selector !== "string" || !selector ||
		nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

		return results;
	}

	if ( !seed && documentIsHTML ) {

		// Try to shortcut find operations when possible (e.g., not under DocumentFragment)
		if ( nodeType !== 11 && (match = rquickExpr.exec( selector )) ) {
			// Speed-up: Sizzle("#ID")
			if ( (m = match[1]) ) {
				if ( nodeType === 9 ) {
					elem = context.getElementById( m );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document (jQuery #6963)
					if ( elem && elem.parentNode ) {
						// Handle the case where IE, Opera, and Webkit return items
						// by name instead of ID
						if ( elem.id === m ) {
							results.push( elem );
							return results;
						}
					} else {
						return results;
					}
				} else {
					// Context is not a document
					if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
						contains( context, elem ) && elem.id === m ) {
						results.push( elem );
						return results;
					}
				}

			// Speed-up: Sizzle("TAG")
			} else if ( match[2] ) {
				push.apply( results, context.getElementsByTagName( selector ) );
				return results;

			// Speed-up: Sizzle(".CLASS")
			} else if ( (m = match[3]) && support.getElementsByClassName ) {
				push.apply( results, context.getElementsByClassName( m ) );
				return results;
			}
		}

		// QSA path
		if ( support.qsa && (!rbuggyQSA || !rbuggyQSA.test( selector )) ) {
			nid = old = expando;
			newContext = context;
			newSelector = nodeType !== 1 && selector;

			// qSA works strangely on Element-rooted queries
			// We can work around this by specifying an extra ID on the root
			// and working up from there (Thanks to Andrew Dupont for the technique)
			// IE 8 doesn't work on object elements
			if ( nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
				groups = tokenize( selector );

				if ( (old = context.getAttribute("id")) ) {
					nid = old.replace( rescape, "\\$&" );
				} else {
					context.setAttribute( "id", nid );
				}
				nid = "[id='" + nid + "'] ";

				i = groups.length;
				while ( i-- ) {
					groups[i] = nid + toSelector( groups[i] );
				}
				newContext = rsibling.test( selector ) && testContext( context.parentNode ) || context;
				newSelector = groups.join(",");
			}

			if ( newSelector ) {
				try {
					push.apply( results,
						newContext.querySelectorAll( newSelector )
					);
					return results;
				} catch(qsaError) {
				} finally {
					if ( !old ) {
						context.removeAttribute("id");
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key + " " ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */
function assert( fn ) {
	var div = document.createElement("div");

	try {
		return !!fn( div );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( div.parentNode ) {
			div.parentNode.removeChild( div );
		}
		// release memory in IE
		div = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = attrs.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			( ~b.sourceIndex || MAX_NEGATIVE ) -
			( ~a.sourceIndex || MAX_NEGATIVE );

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== "undefined" && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare, parent,
		doc = node ? node.ownerDocument || node : preferredDoc;

	// If no document and documentElement is available, return
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Set our document
	document = doc;
	docElem = doc.documentElement;
	parent = doc.defaultView;

	// Support: IE>8
	// If iframe document is assigned to "document" variable and if iframe has been reloaded,
	// IE will throw "permission denied" error when accessing "document" variable, see jQuery #13936
	// IE6-8 do not support the defaultView property so parent will be undefined
	if ( parent && parent !== parent.top ) {
		// IE11 does not have attachEvent, so all must suffer
		if ( parent.addEventListener ) {
			parent.addEventListener( "unload", unloadHandler, false );
		} else if ( parent.attachEvent ) {
			parent.attachEvent( "onunload", unloadHandler );
		}
	}

	/* Support tests
	---------------------------------------------------------------------- */
	documentIsHTML = !isXML( doc );

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties
	// (excepting IE8 booleans)
	support.attributes = assert(function( div ) {
		div.className = "i";
		return !div.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( div ) {
		div.appendChild( doc.createComment("") );
		return !div.getElementsByTagName("*").length;
	});

	// Support: IE<9
	support.getElementsByClassName = rnative.test( doc.getElementsByClassName );

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( div ) {
		docElem.appendChild( div ).id = expando;
		return !doc.getElementsByName || !doc.getElementsByName( expando ).length;
	});

	// ID find and filter
	if ( support.getById ) {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var m = context.getElementById( id );
				// Check parentNode to catch when Blackberry 4.6 returns
				// nodes that are no longer in the document #6963
				return m && m.parentNode ? [ m ] : [];
			}
		};
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
	} else {
		// Support: IE6/7
		// getElementById is not reliable as a find shortcut
		delete Expr.find["ID"];

		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== "undefined" ) {
				return context.getElementsByTagName( tag );

			// DocumentFragment nodes don't have gEBTN
			} else if ( support.qsa ) {
				return context.querySelectorAll( tag );
			}
		} :

		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See http://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( doc.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( div ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// http://bugs.jquery.com/ticket/12359
			docElem.appendChild( div ).innerHTML = "<a id='" + expando + "'></a>" +
				"<select id='" + expando + "-\f]' msallowcapture=''>" +
				"<option selected=''></option></select>";

			// Support: IE8, Opera 11-12.16
			// Nothing should be selected when empty strings follow ^= or $= or *=
			// The test attribute must be unknown in Opera but "safe" for WinRT
			// http://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
			if ( div.querySelectorAll("[msallowcapture^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !div.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Support: Chrome<29, Android<4.2+, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.7+
			if ( !div.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
				rbuggyQSA.push("~=");
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}

			// Support: Safari 8+, iOS 8+
			// https://bugs.webkit.org/show_bug.cgi?id=136851
			// In-page `selector#id sibing-combinator selector` fails
			if ( !div.querySelectorAll( "a#" + expando + "+*" ).length ) {
				rbuggyQSA.push(".#.+[+~]");
			}
		});

		assert(function( div ) {
			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = doc.createElement("input");
			input.setAttribute( "type", "hidden" );
			div.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( div.querySelectorAll("[name=d]").length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":enabled").length ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			div.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( div ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( div, "div" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( div, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully does not implement inclusive descendent
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			// Choose the first element that is related to our preferred document
			if ( a === doc || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === doc || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			return a === doc ? -1 :
				b === doc ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return doc;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch (e) {}
	}

	return Sizzle( expr, document, null, [ elem ] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null;
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[6] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] ) {
				match[2] = match[4] || match[5] || "";

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, outerCache, node, diff, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) {
										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {
							// Seek `elem` from a previously-cached index
							outerCache = parent[ expando ] || (parent[ expando ] = {});
							cache = outerCache[ type ] || [];
							nodeIndex = cache[0] === dirruns && cache[1];
							diff = cache[0] === dirruns && cache[2];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									outerCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						// Use previously-cached element index if available
						} else if ( useCache && (cache = (elem[ expando ] || (elem[ expando ] = {}))[ type ]) && cache[0] === dirruns ) {
							diff = cache[1];

						// xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
						} else {
							// Use the same loop as above to seek `elem` from the start
							while ( (node = ++nodeIndex && node && node[ dir ] ||
								(diff = nodeIndex = 0) || start.pop()) ) {

								if ( ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) && ++diff ) {
									// Cache the index of each encountered element
									if ( useCache ) {
										(node[ expando ] || (node[ expando ] = {}))[ type ] = [ dirruns, diff ];
									}

									if ( node === elem ) {
										break;
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					// Don't keep the element (issue #299)
					input[0] = null;
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			text = text.replace( runescape, funescape );
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": function( elem ) {
			return elem.disabled === false;
		},

		"disabled": function( elem ) {
			return elem.disabled === true;
		},

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( (tokens = []) );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
};

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		checkNonElements = base && dir === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});
						if ( (oldCache = outerCache[ dir ]) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
						} else {
							// Reuse newcache so results back-propagate to previous elements
							outerCache[ dir ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								return true;
							}
						}
					}
				}
			}
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
			// Avoid hanging onto element (issue #299)
			checkContext = null;
			return ret;
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context !== document && context;
			}

			// Add elements passing elementMatchers directly to results
			// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context, xml ) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// Apply set filters to unmatched elements
			matchedCount += i;
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {
			match = tokenize( selector );
		}
		i = match.length;
		while ( i-- ) {
			cached = matcherFromTokens( match[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

		// Save selector and tokenization
		cached.selector = selector;
	}
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.select = function( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize( (selector = compiled.selector || selector) );

	results = results || [];

	// Try to minimize operations if there is no seed and only one group
	if ( match.length === 1 ) {

		// Take a shortcut and set the context if the root selector is an ID
		tokens = match[0] = match[0].slice( 0 );
		if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
				support.getById && context.nodeType === 9 && documentIsHTML &&
				Expr.relative[ tokens[1].type ] ) {

			context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
			if ( !context ) {
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
		}

		// Fetch a seed set for right-to-left matching
		i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
		while ( i-- ) {
			token = tokens[i];

			// Abort if we hit a combinator
			if ( Expr.relative[ (type = token.type) ] ) {
				break;
			}
			if ( (find = Expr.find[ type ]) ) {
				// Search, expanding context for leading sibling combinators
				if ( (seed = find(
					token.matches[0].replace( runescape, funescape ),
					rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
				)) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					selector = seed.length && toSelector( tokens );
					if ( !selector ) {
						push.apply( results, seed );
						return results;
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		context,
		!documentIsHTML,
		results,
		rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( div1 ) {
	// Should return 1, but returns 4 (following)
	return div1.compareDocumentPosition( document.createElement("div") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( div ) {
	div.innerHTML = "<a href='#'></a>";
	return div.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( div ) {
	div.innerHTML = "<input/>";
	div.firstChild.setAttribute( "value", "" );
	return div.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( div ) {
	return div.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}

return Sizzle;

})( window );



jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;
jQuery.expr[":"] = jQuery.expr.pseudos;
jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;



var rneedsContext = jQuery.expr.match.needsContext;

var rsingleTag = (/^<(\w+)\s*\/?>(?:<\/\1>|)$/);



var risSimple = /^.[^:#\[\.,]*$/;

// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {
	if ( jQuery.isFunction( qualifier ) ) {
		return jQuery.grep( elements, function( elem, i ) {
			/* jshint -W018 */
			return !!qualifier.call( elem, i, elem ) !== not;
		});

	}

	if ( qualifier.nodeType ) {
		return jQuery.grep( elements, function( elem ) {
			return ( elem === qualifier ) !== not;
		});

	}

	if ( typeof qualifier === "string" ) {
		if ( risSimple.test( qualifier ) ) {
			return jQuery.filter( qualifier, elements, not );
		}

		qualifier = jQuery.filter( qualifier, elements );
	}

	return jQuery.grep( elements, function( elem ) {
		return ( indexOf.call( qualifier, elem ) >= 0 ) !== not;
	});
}

jQuery.filter = function( expr, elems, not ) {
	var elem = elems[ 0 ];

	if ( not ) {
		expr = ":not(" + expr + ")";
	}

	return elems.length === 1 && elem.nodeType === 1 ?
		jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [] :
		jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
			return elem.nodeType === 1;
		}));
};

jQuery.fn.extend({
	find: function( selector ) {
		var i,
			len = this.length,
			ret = [],
			self = this;

		if ( typeof selector !== "string" ) {
			return this.pushStack( jQuery( selector ).filter(function() {
				for ( i = 0; i < len; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			}) );
		}

		for ( i = 0; i < len; i++ ) {
			jQuery.find( selector, self[ i ], ret );
		}

		// Needed because $( selector, context ) becomes $( context ).find( selector )
		ret = this.pushStack( len > 1 ? jQuery.unique( ret ) : ret );
		ret.selector = this.selector ? this.selector + " " + selector : selector;
		return ret;
	},
	filter: function( selector ) {
		return this.pushStack( winnow(this, selector || [], false) );
	},
	not: function( selector ) {
		return this.pushStack( winnow(this, selector || [], true) );
	},
	is: function( selector ) {
		return !!winnow(
			this,

			// If this is a positional/relative selector, check membership in the returned set
			// so $("p:first").is("p:last") won't return true for a doc with two "p".
			typeof selector === "string" && rneedsContext.test( selector ) ?
				jQuery( selector ) :
				selector || [],
			false
		).length;
	}
});


// Initialize a jQuery object


// A central reference to the root jQuery(document)
var rootjQuery,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)
	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,

	init = jQuery.fn.init = function( selector, context ) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			if ( selector[0] === "<" && selector[ selector.length - 1 ] === ">" && selector.length >= 3 ) {
				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && (match[1] || !context) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[1] ) {
					context = context instanceof jQuery ? context[0] : context;

					// Option to run scripts is true for back-compat
					// Intentionally let the error be thrown if parseHTML is not present
					jQuery.merge( this, jQuery.parseHTML(
						match[1],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					// HANDLE: $(html, props)
					if ( rsingleTag.test( match[1] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {
							// Properties of context are called as methods if possible
							if ( jQuery.isFunction( this[ match ] ) ) {
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
				} else {
					elem = document.getElementById( match[2] );

					// Support: Blackberry 4.6
					// gEBID returns nodes no longer in the document (#6963)
					if ( elem && elem.parentNode ) {
						// Inject the element directly into the jQuery object
						this.length = 1;
						this[0] = elem;
					}

					this.context = document;
					this.selector = selector;
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || rootjQuery ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
		} else if ( selector.nodeType ) {
			this.context = this[0] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( jQuery.isFunction( selector ) ) {
			return typeof rootjQuery.ready !== "undefined" ?
				rootjQuery.ready( selector ) :
				// Execute immediately if ready is not present
				selector( jQuery );
		}

		if ( selector.selector !== undefined ) {
			this.selector = selector.selector;
			this.context = selector.context;
		}

		return jQuery.makeArray( selector, this );
	};

// Give the init function the jQuery prototype for later instantiation
init.prototype = jQuery.fn;

// Initialize central reference
rootjQuery = jQuery( document );


var rparentsprev = /^(?:parents|prev(?:Until|All))/,
	// Methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.extend({
	dir: function( elem, dir, until ) {
		var matched = [],
			truncate = until !== undefined;

		while ( (elem = elem[ dir ]) && elem.nodeType !== 9 ) {
			if ( elem.nodeType === 1 ) {
				if ( truncate && jQuery( elem ).is( until ) ) {
					break;
				}
				matched.push( elem );
			}
		}
		return matched;
	},

	sibling: function( n, elem ) {
		var matched = [];

		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				matched.push( n );
			}
		}

		return matched;
	}
});

jQuery.fn.extend({
	has: function( target ) {
		var targets = jQuery( target, this ),
			l = targets.length;

		return this.filter(function() {
			var i = 0;
			for ( ; i < l; i++ ) {
				if ( jQuery.contains( this, targets[i] ) ) {
					return true;
				}
			}
		});
	},

	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			matched = [],
			pos = rneedsContext.test( selectors ) || typeof selectors !== "string" ?
				jQuery( selectors, context || this.context ) :
				0;

		for ( ; i < l; i++ ) {
			for ( cur = this[i]; cur && cur !== context; cur = cur.parentNode ) {
				// Always skip document fragments
				if ( cur.nodeType < 11 && (pos ?
					pos.index(cur) > -1 :

					// Don't pass non-elements to Sizzle
					cur.nodeType === 1 &&
						jQuery.find.matchesSelector(cur, selectors)) ) {

					matched.push( cur );
					break;
				}
			}
		}

		return this.pushStack( matched.length > 1 ? jQuery.unique( matched ) : matched );
	},

	// Determine the position of an element within the set
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
		}

		// Index in selector
		if ( typeof elem === "string" ) {
			return indexOf.call( jQuery( elem ), this[ 0 ] );
		}

		// Locate the position of the desired element
		return indexOf.call( this,

			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[ 0 ] : elem
		);
	},

	add: function( selector, context ) {
		return this.pushStack(
			jQuery.unique(
				jQuery.merge( this.get(), jQuery( selector, context ) )
			)
		);
	},

	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter(selector)
		);
	}
});

function sibling( cur, dir ) {
	while ( (cur = cur[dir]) && cur.nodeType !== 1 ) {}
	return cur;
}

jQuery.each({
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return jQuery.dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	nextAll: function( elem ) {
		return jQuery.dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return jQuery.dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return jQuery.sibling( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function( elem ) {
		return jQuery.sibling( elem.firstChild );
	},
	contents: function( elem ) {
		return elem.contentDocument || jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var matched = jQuery.map( this, fn, until );

		if ( name.slice( -5 ) !== "Until" ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			matched = jQuery.filter( selector, matched );
		}

		if ( this.length > 1 ) {
			// Remove duplicates
			if ( !guaranteedUnique[ name ] ) {
				jQuery.unique( matched );
			}

			// Reverse order for parents* and prev-derivatives
			if ( rparentsprev.test( name ) ) {
				matched.reverse();
			}
		}

		return this.pushStack( matched );
	};
});
var rnotwhite = (/\S+/g);



// String to Object options format cache
var optionsCache = {};

// Convert String-formatted options into Object-formatted ones and store in cache
function createOptions( options ) {
	var object = optionsCache[ options ] = {};
	jQuery.each( options.match( rnotwhite ) || [], function( _, flag ) {
		object[ flag ] = true;
	});
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		( optionsCache[ options ] || createOptions( options ) ) :
		jQuery.extend( {}, options );

	var // Last fire value (for non-forgettable lists)
		memory,
		// Flag to know if list was already fired
		fired,
		// Flag to know if list is currently firing
		firing,
		// First callback to fire (used internally by add and fireWith)
		firingStart,
		// End of the loop when firing
		firingLength,
		// Index of currently firing callback (modified by remove if needed)
		firingIndex,
		// Actual callback list
		list = [],
		// Stack of fire calls for repeatable lists
		stack = !options.once && [],
		// Fire callbacks
		fire = function( data ) {
			memory = options.memory && data;
			fired = true;
			firingIndex = firingStart || 0;
			firingStart = 0;
			firingLength = list.length;
			firing = true;
			for ( ; list && firingIndex < firingLength; firingIndex++ ) {
				if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
					memory = false; // To prevent further calls using add
					break;
				}
			}
			firing = false;
			if ( list ) {
				if ( stack ) {
					if ( stack.length ) {
						fire( stack.shift() );
					}
				} else if ( memory ) {
					list = [];
				} else {
					self.disable();
				}
			}
		},
		// Actual Callbacks object
		self = {
			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {
					// First, we save the current length
					var start = list.length;
					(function add( args ) {
						jQuery.each( args, function( _, arg ) {
							var type = jQuery.type( arg );
							if ( type === "function" ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && type !== "string" ) {
								// Inspect recursively
								add( arg );
							}
						});
					})( arguments );
					// Do we need to add the callbacks to the
					// current firing batch?
					if ( firing ) {
						firingLength = list.length;
					// With memory, if we're not firing then
					// we should call right away
					} else if ( memory ) {
						firingStart = start;
						fire( memory );
					}
				}
				return this;
			},
			// Remove a callback from the list
			remove: function() {
				if ( list ) {
					jQuery.each( arguments, function( _, arg ) {
						var index;
						while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
							list.splice( index, 1 );
							// Handle firing indexes
							if ( firing ) {
								if ( index <= firingLength ) {
									firingLength--;
								}
								if ( index <= firingIndex ) {
									firingIndex--;
								}
							}
						}
					});
				}
				return this;
			},
			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
			has: function( fn ) {
				return fn ? jQuery.inArray( fn, list ) > -1 : !!( list && list.length );
			},
			// Remove all callbacks from the list
			empty: function() {
				list = [];
				firingLength = 0;
				return this;
			},
			// Have the list do nothing anymore
			disable: function() {
				list = stack = memory = undefined;
				return this;
			},
			// Is it disabled?
			disabled: function() {
				return !list;
			},
			// Lock the list in its current state
			lock: function() {
				stack = undefined;
				if ( !memory ) {
					self.disable();
				}
				return this;
			},
			// Is it locked?
			locked: function() {
				return !stack;
			},
			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				if ( list && ( !fired || stack ) ) {
					args = args || [];
					args = [ context, args.slice ? args.slice() : args ];
					if ( firing ) {
						stack.push( args );
					} else {
						fire( args );
					}
				}
				return this;
			},
			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},
			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!fired;
			}
		};

	return self;
};


jQuery.extend({

	Deferred: function( func ) {
		var tuples = [
				// action, add listener, listener list, final state
				[ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
				[ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
				[ "notify", "progress", jQuery.Callbacks("memory") ]
			],
			state = "pending",
			promise = {
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				then: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;
					return jQuery.Deferred(function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {
							var fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];
							// deferred[ done | fail | progress ] for forwarding actions to newDefer
							deferred[ tuple[1] ](function() {
								var returned = fn && fn.apply( this, arguments );
								if ( returned && jQuery.isFunction( returned.promise ) ) {
									returned.promise()
										.done( newDefer.resolve )
										.fail( newDefer.reject )
										.progress( newDefer.notify );
								} else {
									newDefer[ tuple[ 0 ] + "With" ]( this === promise ? newDefer.promise() : this, fn ? [ returned ] : arguments );
								}
							});
						});
						fns = null;
					}).promise();
				},
				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Keep pipe for back-compat
		promise.pipe = promise.then;

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ],
				stateString = tuple[ 3 ];

			// promise[ done | fail | progress ] = list.add
			promise[ tuple[1] ] = list.add;

			// Handle state
			if ( stateString ) {
				list.add(function() {
					// state = [ resolved | rejected ]
					state = stateString;

				// [ reject_list | resolve_list ].disable; progress_list.lock
				}, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
			}

			// deferred[ resolve | reject | notify ]
			deferred[ tuple[0] ] = function() {
				deferred[ tuple[0] + "With" ]( this === deferred ? promise : this, arguments );
				return this;
			};
			deferred[ tuple[0] + "With" ] = list.fireWith;
		});

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( subordinate /* , ..., subordinateN */ ) {
		var i = 0,
			resolveValues = slice.call( arguments ),
			length = resolveValues.length,

			// the count of uncompleted subordinates
			remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

			// the master Deferred. If resolveValues consist of only a single Deferred, just use that.
			deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

			// Update function for both resolve and progress values
			updateFunc = function( i, contexts, values ) {
				return function( value ) {
					contexts[ i ] = this;
					values[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
					if ( values === progressValues ) {
						deferred.notifyWith( contexts, values );
					} else if ( !( --remaining ) ) {
						deferred.resolveWith( contexts, values );
					}
				};
			},

			progressValues, progressContexts, resolveContexts;

		// Add listeners to Deferred subordinates; treat others as resolved
		if ( length > 1 ) {
			progressValues = new Array( length );
			progressContexts = new Array( length );
			resolveContexts = new Array( length );
			for ( ; i < length; i++ ) {
				if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
					resolveValues[ i ].promise()
						.done( updateFunc( i, resolveContexts, resolveValues ) )
						.fail( deferred.reject )
						.progress( updateFunc( i, progressContexts, progressValues ) );
				} else {
					--remaining;
				}
			}
		}

		// If we're not waiting on anything, resolve the master
		if ( !remaining ) {
			deferred.resolveWith( resolveContexts, resolveValues );
		}

		return deferred.promise();
	}
});


// The deferred used on DOM ready
var readyList;

jQuery.fn.ready = function( fn ) {
	// Add the callback
	jQuery.ready.promise().done( fn );

	return this;
};

jQuery.extend({
	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Hold (or release) the ready event
	holdReady: function( hold ) {
		if ( hold ) {
			jQuery.readyWait++;
		} else {
			jQuery.ready( true );
		}
	},

	// Handle when the DOM is ready
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );

		// Trigger any bound ready events
		if ( jQuery.fn.triggerHandler ) {
			jQuery( document ).triggerHandler( "ready" );
			jQuery( document ).off( "ready" );
		}
	}
});

/**
 * The ready event handler and self cleanup method
 */
function completed() {
	document.removeEventListener( "DOMContentLoaded", completed, false );
	window.removeEventListener( "load", completed, false );
	jQuery.ready();
}

jQuery.ready.promise = function( obj ) {
	if ( !readyList ) {

		readyList = jQuery.Deferred();

		// Catch cases where $(document).ready() is called after the browser event has already occurred.
		// We once tried to use readyState "interactive" here, but it caused issues like the one
		// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
		if ( document.readyState === "complete" ) {
			// Handle it asynchronously to allow scripts the opportunity to delay ready
			setTimeout( jQuery.ready );

		} else {

			// Use the handy event callback
			document.addEventListener( "DOMContentLoaded", completed, false );

			// A fallback to window.onload, that will always work
			window.addEventListener( "load", completed, false );
		}
	}
	return readyList.promise( obj );
};

// Kick off the DOM ready check even if the user does not
jQuery.ready.promise();




// Multifunctional method to get and set values of a collection
// The value/s can optionally be executed if it's a function
var access = jQuery.access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
	var i = 0,
		len = elems.length,
		bulk = key == null;

	// Sets many values
	if ( jQuery.type( key ) === "object" ) {
		chainable = true;
		for ( i in key ) {
			jQuery.access( elems, fn, i, key[i], true, emptyGet, raw );
		}

	// Sets one value
	} else if ( value !== undefined ) {
		chainable = true;

		if ( !jQuery.isFunction( value ) ) {
			raw = true;
		}

		if ( bulk ) {
			// Bulk operations run against the entire set
			if ( raw ) {
				fn.call( elems, value );
				fn = null;

			// ...except when executing function values
			} else {
				bulk = fn;
				fn = function( elem, key, value ) {
					return bulk.call( jQuery( elem ), value );
				};
			}
		}

		if ( fn ) {
			for ( ; i < len; i++ ) {
				fn( elems[i], key, raw ? value : value.call( elems[i], i, fn( elems[i], key ) ) );
			}
		}
	}

	return chainable ?
		elems :

		// Gets
		bulk ?
			fn.call( elems ) :
			len ? fn( elems[0], key ) : emptyGet;
};


/**
 * Determines whether an object can have data
 */
jQuery.acceptData = function( owner ) {
	// Accepts only:
	//  - Node
	//    - Node.ELEMENT_NODE
	//    - Node.DOCUMENT_NODE
	//  - Object
	//    - Any
	/* jshint -W018 */
	return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
};


function Data() {
	// Support: Android<4,
	// Old WebKit does not have Object.preventExtensions/freeze method,
	// return new empty object instead with no [[set]] accessor
	Object.defineProperty( this.cache = {}, 0, {
		get: function() {
			return {};
		}
	});

	this.expando = jQuery.expando + Data.uid++;
}

Data.uid = 1;
Data.accepts = jQuery.acceptData;

Data.prototype = {
	key: function( owner ) {
		// We can accept data for non-element nodes in modern browsers,
		// but we should not, see #8335.
		// Always return the key for a frozen object.
		if ( !Data.accepts( owner ) ) {
			return 0;
		}

		var descriptor = {},
			// Check if the owner object already has a cache key
			unlock = owner[ this.expando ];

		// If not, create one
		if ( !unlock ) {
			unlock = Data.uid++;

			// Secure it in a non-enumerable, non-writable property
			try {
				descriptor[ this.expando ] = { value: unlock };
				Object.defineProperties( owner, descriptor );

			// Support: Android<4
			// Fallback to a less secure definition
			} catch ( e ) {
				descriptor[ this.expando ] = unlock;
				jQuery.extend( owner, descriptor );
			}
		}

		// Ensure the cache object
		if ( !this.cache[ unlock ] ) {
			this.cache[ unlock ] = {};
		}

		return unlock;
	},
	set: function( owner, data, value ) {
		var prop,
			// There may be an unlock assigned to this node,
			// if there is no entry for this "owner", create one inline
			// and set the unlock as though an owner entry had always existed
			unlock = this.key( owner ),
			cache = this.cache[ unlock ];

		// Handle: [ owner, key, value ] args
		if ( typeof data === "string" ) {
			cache[ data ] = value;

		// Handle: [ owner, { properties } ] args
		} else {
			// Fresh assignments by object are shallow copied
			if ( jQuery.isEmptyObject( cache ) ) {
				jQuery.extend( this.cache[ unlock ], data );
			// Otherwise, copy the properties one-by-one to the cache object
			} else {
				for ( prop in data ) {
					cache[ prop ] = data[ prop ];
				}
			}
		}
		return cache;
	},
	get: function( owner, key ) {
		// Either a valid cache is found, or will be created.
		// New caches will be created and the unlock returned,
		// allowing direct access to the newly created
		// empty data object. A valid owner object must be provided.
		var cache = this.cache[ this.key( owner ) ];

		return key === undefined ?
			cache : cache[ key ];
	},
	access: function( owner, key, value ) {
		var stored;
		// In cases where either:
		//
		//   1. No key was specified
		//   2. A string key was specified, but no value provided
		//
		// Take the "read" path and allow the get method to determine
		// which value to return, respectively either:
		//
		//   1. The entire cache object
		//   2. The data stored at the key
		//
		if ( key === undefined ||
				((key && typeof key === "string") && value === undefined) ) {

			stored = this.get( owner, key );

			return stored !== undefined ?
				stored : this.get( owner, jQuery.camelCase(key) );
		}

		// [*]When the key is not a string, or both a key and value
		// are specified, set or extend (existing objects) with either:
		//
		//   1. An object of properties
		//   2. A key and value
		//
		this.set( owner, key, value );

		// Since the "set" path can have two possible entry points
		// return the expected data based on which path was taken[*]
		return value !== undefined ? value : key;
	},
	remove: function( owner, key ) {
		var i, name, camel,
			unlock = this.key( owner ),
			cache = this.cache[ unlock ];

		if ( key === undefined ) {
			this.cache[ unlock ] = {};

		} else {
			// Support array or space separated string of keys
			if ( jQuery.isArray( key ) ) {
				// If "name" is an array of keys...
				// When data is initially created, via ("key", "val") signature,
				// keys will be converted to camelCase.
				// Since there is no way to tell _how_ a key was added, remove
				// both plain key and camelCase key. #12786
				// This will only penalize the array argument path.
				name = key.concat( key.map( jQuery.camelCase ) );
			} else {
				camel = jQuery.camelCase( key );
				// Try the string as a key before any manipulation
				if ( key in cache ) {
					name = [ key, camel ];
				} else {
					// If a key with the spaces exists, use it.
					// Otherwise, create an array by matching non-whitespace
					name = camel;
					name = name in cache ?
						[ name ] : ( name.match( rnotwhite ) || [] );
				}
			}

			i = name.length;
			while ( i-- ) {
				delete cache[ name[ i ] ];
			}
		}
	},
	hasData: function( owner ) {
		return !jQuery.isEmptyObject(
			this.cache[ owner[ this.expando ] ] || {}
		);
	},
	discard: function( owner ) {
		if ( owner[ this.expando ] ) {
			delete this.cache[ owner[ this.expando ] ];
		}
	}
};
var data_priv = new Data();

var data_user = new Data();



//	Implementation Summary
//
//	1. Enforce API surface and semantic compatibility with 1.9.x branch
//	2. Improve the module's maintainability by reducing the storage
//		paths to a single mechanism.
//	3. Use the same single mechanism to support "private" and "user" data.
//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
//	5. Avoid exposing implementation details on user objects (eg. expando properties)
//	6. Provide a clear path for implementation upgrade to WeakMap in 2014

var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
	rmultiDash = /([A-Z])/g;

function dataAttr( elem, key, data ) {
	var name;

	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {
		name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();
		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = data === "true" ? true :
					data === "false" ? false :
					data === "null" ? null :
					// Only convert to a number if it doesn't change the string
					+data + "" === data ? +data :
					rbrace.test( data ) ? jQuery.parseJSON( data ) :
					data;
			} catch( e ) {}

			// Make sure we set the data so it isn't changed later
			data_user.set( elem, key, data );
		} else {
			data = undefined;
		}
	}
	return data;
}

jQuery.extend({
	hasData: function( elem ) {
		return data_user.hasData( elem ) || data_priv.hasData( elem );
	},

	data: function( elem, name, data ) {
		return data_user.access( elem, name, data );
	},

	removeData: function( elem, name ) {
		data_user.remove( elem, name );
	},

	// TODO: Now that all calls to _data and _removeData have been replaced
	// with direct calls to data_priv methods, these can be deprecated.
	_data: function( elem, name, data ) {
		return data_priv.access( elem, name, data );
	},

	_removeData: function( elem, name ) {
		data_priv.remove( elem, name );
	}
});

jQuery.fn.extend({
	data: function( key, value ) {
		var i, name, data,
			elem = this[ 0 ],
			attrs = elem && elem.attributes;

		// Gets all values
		if ( key === undefined ) {
			if ( this.length ) {
				data = data_user.get( elem );

				if ( elem.nodeType === 1 && !data_priv.get( elem, "hasDataAttrs" ) ) {
					i = attrs.length;
					while ( i-- ) {

						// Support: IE11+
						// The attrs elements can be null (#14894)
						if ( attrs[ i ] ) {
							name = attrs[ i ].name;
							if ( name.indexOf( "data-" ) === 0 ) {
								name = jQuery.camelCase( name.slice(5) );
								dataAttr( elem, name, data[ name ] );
							}
						}
					}
					data_priv.set( elem, "hasDataAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {
			return this.each(function() {
				data_user.set( this, key );
			});
		}

		return access( this, function( value ) {
			var data,
				camelKey = jQuery.camelCase( key );

			// The calling jQuery object (element matches) is not empty
			// (and therefore has an element appears at this[ 0 ]) and the
			// `value` parameter was not undefined. An empty jQuery object
			// will result in `undefined` for elem = this[ 0 ] which will
			// throw an exception if an attempt to read a data cache is made.
			if ( elem && value === undefined ) {
				// Attempt to get data from the cache
				// with the key as-is
				data = data_user.get( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				// Attempt to get data from the cache
				// with the key camelized
				data = data_user.get( elem, camelKey );
				if ( data !== undefined ) {
					return data;
				}

				// Attempt to "discover" the data in
				// HTML5 custom data-* attrs
				data = dataAttr( elem, camelKey, undefined );
				if ( data !== undefined ) {
					return data;
				}

				// We tried really hard, but the data doesn't exist.
				return;
			}

			// Set the data...
			this.each(function() {
				// First, attempt to store a copy or reference of any
				// data that might've been store with a camelCased key.
				var data = data_user.get( this, camelKey );

				// For HTML5 data-* attribute interop, we have to
				// store property names with dashes in a camelCase form.
				// This might not apply to all properties...*
				data_user.set( this, camelKey, value );

				// *... In the case of properties that might _actually_
				// have dashes, we need to also store a copy of that
				// unchanged property.
				if ( key.indexOf("-") !== -1 && data !== undefined ) {
					data_user.set( this, key, value );
				}
			});
		}, null, value, arguments.length > 1, null, true );
	},

	removeData: function( key ) {
		return this.each(function() {
			data_user.remove( this, key );
		});
	}
});


jQuery.extend({
	queue: function( elem, type, data ) {
		var queue;

		if ( elem ) {
			type = ( type || "fx" ) + "queue";
			queue = data_priv.get( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !queue || jQuery.isArray( data ) ) {
					queue = data_priv.access( elem, type, jQuery.makeArray(data) );
				} else {
					queue.push( data );
				}
			}
			return queue || [];
		}
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			// Clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
		}

		if ( !startLength && hooks ) {
			hooks.empty.fire();
		}
	},

	// Not public - generate a queueHooks object, or return the current one
	_queueHooks: function( elem, type ) {
		var key = type + "queueHooks";
		return data_priv.get( elem, key ) || data_priv.access( elem, key, {
			empty: jQuery.Callbacks("once memory").add(function() {
				data_priv.remove( elem, [ type + "queue", key ] );
			})
		});
	}
});

jQuery.fn.extend({
	queue: function( type, data ) {
		var setter = 2;

		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {
			return jQuery.queue( this[0], type );
		}

		return data === undefined ?
			this :
			this.each(function() {
				var queue = jQuery.queue( this, type, data );

				// Ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[0] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			});
	},
	dequeue: function( type ) {
		return this.each(function() {
			jQuery.dequeue( this, type );
		});
	},
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},
	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, obj ) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while ( i-- ) {
			tmp = data_priv.get( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
});
var pnum = (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source;

var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

var isHidden = function( elem, el ) {
		// isHidden might be called from jQuery#filter function;
		// in that case, element will be second argument
		elem = el || elem;
		return jQuery.css( elem, "display" ) === "none" || !jQuery.contains( elem.ownerDocument, elem );
	};

var rcheckableType = (/^(?:checkbox|radio)$/i);



(function() {
	var fragment = document.createDocumentFragment(),
		div = fragment.appendChild( document.createElement( "div" ) ),
		input = document.createElement( "input" );

	// Support: Safari<=5.1
	// Check state lost if the name is set (#11217)
	// Support: Windows Web Apps (WWA)
	// `name` and `type` must use .setAttribute for WWA (#14901)
	input.setAttribute( "type", "radio" );
	input.setAttribute( "checked", "checked" );
	input.setAttribute( "name", "t" );

	div.appendChild( input );

	// Support: Safari<=5.1, Android<4.2
	// Older WebKit doesn't clone checked state correctly in fragments
	support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: IE<=11+
	// Make sure textarea (and checkbox) defaultValue is properly cloned
	div.innerHTML = "<textarea>x</textarea>";
	support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;
})();
var strundefined = typeof undefined;



support.focusinBubbles = "onfocusin" in window;


var
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|pointer|contextmenu)|click/,
	rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

function safeActiveElement() {
	try {
		return document.activeElement;
	} catch ( err ) { }
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	global: {},

	add: function( elem, types, handler, data, selector ) {

		var handleObjIn, eventHandle, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = data_priv.get( elem );

		// Don't attach events to noData or text/comment nodes (but allow plain objects)
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		if ( !(events = elemData.events) ) {
			events = elemData.events = {};
		}
		if ( !(eventHandle = elemData.handle) ) {
			eventHandle = elemData.handle = function( e ) {
				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== strundefined && jQuery.event.triggered !== e.type ?
					jQuery.event.dispatch.apply( elem, arguments ) : undefined;
			};
		}

		// Handle multiple events separated by a space
		types = ( types || "" ).match( rnotwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// There *must* be a type, no attaching namespace-only handlers
			if ( !type ) {
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend({
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join(".")
			}, handleObjIn );

			// Init the event handler queue if we're the first
			if ( !(handlers = events[ type ]) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener if the special events handler returns false
				if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle, false );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

	},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {

		var j, origCount, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = data_priv.hasData( elem ) && data_priv.get( elem );

		if ( !elemData || !(events = elemData.events) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( rnotwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[2] && new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			delete elemData.handle;
			data_priv.remove( elem, "events" );
		}
	},

	trigger: function( event, data, elem, onlyHandlers ) {

		var i, cur, tmp, bubbleType, ontype, handle, special,
			eventPath = [ elem || document ],
			type = hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split(".") : [];

		cur = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf(".") >= 0 ) {
			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split(".");
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf(":") < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join(".");
		event.namespace_re = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === (elem.ownerDocument || document) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( (cur = eventPath[i++]) && !event.isPropagationStopped() ) {

			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = ( data_priv.get( cur, "events" ) || {} )[ event.type ] && data_priv.get( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && handle.apply && jQuery.acceptData( cur ) ) {
				event.result = handle.apply( cur, data );
				if ( event.result === false ) {
					event.preventDefault();
				}
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( (!special._default || special._default.apply( eventPath.pop(), data ) === false) &&
				jQuery.acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name name as the event.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && jQuery.isFunction( elem[ type ] ) && !jQuery.isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;
					elem[ type ]();
					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	dispatch: function( event ) {

		// Make a writable jQuery.Event from the native event object
		event = jQuery.event.fix( event );

		var i, j, ret, matched, handleObj,
			handlerQueue = [],
			args = slice.call( arguments ),
			handlers = ( data_priv.get( this, "events" ) || {} )[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[0] = event;
		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( (matched = handlerQueue[ i++ ]) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
			while ( (handleObj = matched.handlers[ j++ ]) && !event.isImmediatePropagationStopped() ) {

				// Triggered event must either 1) have no namespace, or 2) have namespace(s)
				// a subset or equal to those in the bound event (both can have no namespace).
				if ( !event.namespace_re || event.namespace_re.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
							.apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( (event.result = ret) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function( event, handlers ) {
		var i, matches, sel, handleObj,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		// Black-hole SVG <use> instance trees (#13180)
		// Avoid non-left-click bubbling in Firefox (#3861)
		if ( delegateCount && cur.nodeType && (!event.button || event.type !== "click") ) {

			for ( ; cur !== this; cur = cur.parentNode || this ) {

				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.disabled !== true || event.type !== "click" ) {
					matches = [];
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matches[ sel ] === undefined ) {
							matches[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) >= 0 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matches[ sel ] ) {
							matches.push( handleObj );
						}
					}
					if ( matches.length ) {
						handlerQueue.push({ elem: cur, handlers: matches });
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		if ( delegateCount < handlers.length ) {
			handlerQueue.push({ elem: this, handlers: handlers.slice( delegateCount ) });
		}

		return handlerQueue;
	},

	// Includes some event props shared by KeyEvent and MouseEvent
	props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

	fixHooks: {},

	keyHooks: {
		props: "char charCode key keyCode".split(" "),
		filter: function( event, original ) {

			// Add which for key events
			if ( event.which == null ) {
				event.which = original.charCode != null ? original.charCode : original.keyCode;
			}

			return event;
		}
	},

	mouseHooks: {
		props: "button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
		filter: function( event, original ) {
			var eventDoc, doc, body,
				button = original.button;

			// Calculate pageX/Y if missing and clientX/Y available
			if ( event.pageX == null && original.clientX != null ) {
				eventDoc = event.target.ownerDocument || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
				event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
			}

			// Add which for click: 1 === left; 2 === middle; 3 === right
			// Note: button is not normalized, so don't use it
			if ( !event.which && button !== undefined ) {
				event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
			}

			return event;
		}
	},

	fix: function( event ) {
		if ( event[ jQuery.expando ] ) {
			return event;
		}

		// Create a writable copy of the event object and normalize some properties
		var i, prop, copy,
			type = event.type,
			originalEvent = event,
			fixHook = this.fixHooks[ type ];

		if ( !fixHook ) {
			this.fixHooks[ type ] = fixHook =
				rmouseEvent.test( type ) ? this.mouseHooks :
				rkeyEvent.test( type ) ? this.keyHooks :
				{};
		}
		copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

		event = new jQuery.Event( originalEvent );

		i = copy.length;
		while ( i-- ) {
			prop = copy[ i ];
			event[ prop ] = originalEvent[ prop ];
		}

		// Support: Cordova 2.5 (WebKit) (#13255)
		// All events should have a target; Cordova deviceready doesn't
		if ( !event.target ) {
			event.target = document;
		}

		// Support: Safari 6.0+, Chrome<28
		// Target should not be a text node (#504, #13143)
		if ( event.target.nodeType === 3 ) {
			event.target = event.target.parentNode;
		}

		return fixHook.filter ? fixHook.filter( event, originalEvent ) : event;
	},

	special: {
		load: {
			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		focus: {
			// Fire native event if possible so blur/focus sequence is correct
			trigger: function() {
				if ( this !== safeActiveElement() && this.focus ) {
					this.focus();
					return false;
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function() {
				if ( this === safeActiveElement() && this.blur ) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},
		click: {
			// For checkbox, fire native event so checked state will be right
			trigger: function() {
				if ( this.type === "checkbox" && this.click && jQuery.nodeName( this, "input" ) ) {
					this.click();
					return false;
				}
			},

			// For cross-browser consistency, don't fire native .click() on links
			_default: function( event ) {
				return jQuery.nodeName( event.target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Support: Firefox 20+
				// Firefox doesn't alert if the returnValue field is not set.
				if ( event.result !== undefined && event.originalEvent ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	},

	simulate: function( type, elem, event, bubble ) {
		// Piggyback on a donor event to simulate a different one.
		// Fake originalEvent to avoid donor's stopPropagation, but if the
		// simulated event prevents default then we do the same on the donor.
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true,
				originalEvent: {}
			}
		);
		if ( bubble ) {
			jQuery.event.trigger( e, null, elem );
		} else {
			jQuery.event.dispatch.call( elem, e );
		}
		if ( e.isDefaultPrevented() ) {
			event.preventDefault();
		}
	}
};

jQuery.removeEvent = function( elem, type, handle ) {
	if ( elem.removeEventListener ) {
		elem.removeEventListener( type, handle, false );
	}
};

jQuery.Event = function( src, props ) {
	// Allow instantiation without the 'new' keyword
	if ( !(this instanceof jQuery.Event) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = src.defaultPrevented ||
				src.defaultPrevented === undefined &&
				// Support: Android<4.0
				src.returnValue === false ?
			returnTrue :
			returnFalse;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || jQuery.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,

	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;

		if ( e && e.preventDefault ) {
			e.preventDefault();
		}
	},
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;

		if ( e && e.stopPropagation ) {
			e.stopPropagation();
		}
	},
	stopImmediatePropagation: function() {
		var e = this.originalEvent;

		this.isImmediatePropagationStopped = returnTrue;

		if ( e && e.stopImmediatePropagation ) {
			e.stopImmediatePropagation();
		}

		this.stopPropagation();
	}
};

// Create mouseenter/leave events using mouseover/out and event-time checks
// Support: Chrome 15+
jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout",
	pointerenter: "pointerover",
	pointerleave: "pointerout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mousenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
});

// Support: Firefox, Chrome, Safari
// Create "bubbling" focus and blur events
if ( !support.focusinBubbles ) {
	jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler on the document while someone wants focusin/focusout
		var handler = function( event ) {
				jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
			};

		jQuery.event.special[ fix ] = {
			setup: function() {
				var doc = this.ownerDocument || this,
					attaches = data_priv.access( doc, fix );

				if ( !attaches ) {
					doc.addEventListener( orig, handler, true );
				}
				data_priv.access( doc, fix, ( attaches || 0 ) + 1 );
			},
			teardown: function() {
				var doc = this.ownerDocument || this,
					attaches = data_priv.access( doc, fix ) - 1;

				if ( !attaches ) {
					doc.removeEventListener( orig, handler, true );
					data_priv.remove( doc, fix );

				} else {
					data_priv.access( doc, fix, attaches );
				}
			}
		};
	});
}

jQuery.fn.extend({

	on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
		var origFn, type;

		// Types can be a map of types/handlers
		if ( typeof types === "object" ) {
			// ( types-Object, selector, data )
			if ( typeof selector !== "string" ) {
				// ( types-Object, data )
				data = data || selector;
				selector = undefined;
			}
			for ( type in types ) {
				this.on( type, selector, data, types[ type ], one );
			}
			return this;
		}

		if ( data == null && fn == null ) {
			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
			if ( typeof selector === "string" ) {
				// ( types, selector, fn )
				fn = data;
				data = undefined;
			} else {
				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
		if ( fn === false ) {
			fn = returnFalse;
		} else if ( !fn ) {
			return this;
		}

		if ( one === 1 ) {
			origFn = fn;
			fn = function( event ) {
				// Can use an empty set, since event contains the info
				jQuery().off( event );
				return origFn.apply( this, arguments );
			};
			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return this.each( function() {
			jQuery.event.add( this, types, fn, data, selector );
		});
	},
	one: function( types, selector, data, fn ) {
		return this.on( types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {
			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {
			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {
			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each(function() {
			jQuery.event.remove( this, types, fn, selector );
		});
	},

	trigger: function( type, data ) {
		return this.each(function() {
			jQuery.event.trigger( type, data, this );
		});
	},
	triggerHandler: function( type, data ) {
		var elem = this[0];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
});


var
	rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
	rtagName = /<([\w:]+)/,
	rhtml = /<|&#?\w+;/,
	rnoInnerhtml = /<(?:script|style|link)/i,
	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rscriptType = /^$|\/(?:java|ecma)script/i,
	rscriptTypeMasked = /^true\/(.*)/,
	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,

	// We have to close these tags to support XHTML (#13200)
	wrapMap = {

		// Support: IE9
		option: [ 1, "<select multiple='multiple'>", "</select>" ],

		thead: [ 1, "<table>", "</table>" ],
		col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

		_default: [ 0, "", "" ]
	};

// Support: IE9
wrapMap.optgroup = wrapMap.option;

wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

// Support: 1.x compatibility
// Manipulating tables requires a tbody
function manipulationTarget( elem, content ) {
	return jQuery.nodeName( elem, "table" ) &&
		jQuery.nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ?

		elem.getElementsByTagName("tbody")[0] ||
			elem.appendChild( elem.ownerDocument.createElement("tbody") ) :
		elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
	elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {
	var match = rscriptTypeMasked.exec( elem.type );

	if ( match ) {
		elem.type = match[ 1 ];
	} else {
		elem.removeAttribute("type");
	}

	return elem;
}

// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
	var i = 0,
		l = elems.length;

	for ( ; i < l; i++ ) {
		data_priv.set(
			elems[ i ], "globalEval", !refElements || data_priv.get( refElements[ i ], "globalEval" )
		);
	}
}

function cloneCopyEvent( src, dest ) {
	var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;

	if ( dest.nodeType !== 1 ) {
		return;
	}

	// 1. Copy private data: events, handlers, etc.
	if ( data_priv.hasData( src ) ) {
		pdataOld = data_priv.access( src );
		pdataCur = data_priv.set( dest, pdataOld );
		events = pdataOld.events;

		if ( events ) {
			delete pdataCur.handle;
			pdataCur.events = {};

			for ( type in events ) {
				for ( i = 0, l = events[ type ].length; i < l; i++ ) {
					jQuery.event.add( dest, type, events[ type ][ i ] );
				}
			}
		}
	}

	// 2. Copy user data
	if ( data_user.hasData( src ) ) {
		udataOld = data_user.access( src );
		udataCur = jQuery.extend( {}, udataOld );

		data_user.set( dest, udataCur );
	}
}

function getAll( context, tag ) {
	var ret = context.getElementsByTagName ? context.getElementsByTagName( tag || "*" ) :
			context.querySelectorAll ? context.querySelectorAll( tag || "*" ) :
			[];

	return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
		jQuery.merge( [ context ], ret ) :
		ret;
}

// Fix IE bugs, see support tests
function fixInput( src, dest ) {
	var nodeName = dest.nodeName.toLowerCase();

	// Fails to persist the checked state of a cloned checkbox or radio button.
	if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
		dest.checked = src.checked;

	// Fails to return the selected option to the default selected state when cloning options
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}
}

jQuery.extend({
	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var i, l, srcElements, destElements,
			clone = elem.cloneNode( true ),
			inPage = jQuery.contains( elem.ownerDocument, elem );

		// Fix IE cloning issues
		if ( !support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) &&
				!jQuery.isXMLDoc( elem ) ) {

			// We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
			destElements = getAll( clone );
			srcElements = getAll( elem );

			for ( i = 0, l = srcElements.length; i < l; i++ ) {
				fixInput( srcElements[ i ], destElements[ i ] );
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			if ( deepDataAndEvents ) {
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0, l = srcElements.length; i < l; i++ ) {
					cloneCopyEvent( srcElements[ i ], destElements[ i ] );
				}
			} else {
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		// Return the cloned set
		return clone;
	},

	buildFragment: function( elems, context, scripts, selection ) {
		var elem, tmp, tag, wrap, contains, j,
			fragment = context.createDocumentFragment(),
			nodes = [],
			i = 0,
			l = elems.length;

		for ( ; i < l; i++ ) {
			elem = elems[ i ];

			if ( elem || elem === 0 ) {

				// Add nodes directly
				if ( jQuery.type( elem ) === "object" ) {
					// Support: QtWebKit, PhantomJS
					// push.apply(_, arraylike) throws on ancient WebKit
					jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

				// Convert non-html into a text node
				} else if ( !rhtml.test( elem ) ) {
					nodes.push( context.createTextNode( elem ) );

				// Convert html into DOM nodes
				} else {
					tmp = tmp || fragment.appendChild( context.createElement("div") );

					// Deserialize a standard representation
					tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
					wrap = wrapMap[ tag ] || wrapMap._default;
					tmp.innerHTML = wrap[ 1 ] + elem.replace( rxhtmlTag, "<$1></$2>" ) + wrap[ 2 ];

					// Descend through wrappers to the right content
					j = wrap[ 0 ];
					while ( j-- ) {
						tmp = tmp.lastChild;
					}

					// Support: QtWebKit, PhantomJS
					// push.apply(_, arraylike) throws on ancient WebKit
					jQuery.merge( nodes, tmp.childNodes );

					// Remember the top-level container
					tmp = fragment.firstChild;

					// Ensure the created nodes are orphaned (#12392)
					tmp.textContent = "";
				}
			}
		}

		// Remove wrapper from fragment
		fragment.textContent = "";

		i = 0;
		while ( (elem = nodes[ i++ ]) ) {

			// #4087 - If origin and destination elements are the same, and this is
			// that element, do not do anything
			if ( selection && jQuery.inArray( elem, selection ) !== -1 ) {
				continue;
			}

			contains = jQuery.contains( elem.ownerDocument, elem );

			// Append to fragment
			tmp = getAll( fragment.appendChild( elem ), "script" );

			// Preserve script evaluation history
			if ( contains ) {
				setGlobalEval( tmp );
			}

			// Capture executables
			if ( scripts ) {
				j = 0;
				while ( (elem = tmp[ j++ ]) ) {
					if ( rscriptType.test( elem.type || "" ) ) {
						scripts.push( elem );
					}
				}
			}
		}

		return fragment;
	},

	cleanData: function( elems ) {
		var data, elem, type, key,
			special = jQuery.event.special,
			i = 0;

		for ( ; (elem = elems[ i ]) !== undefined; i++ ) {
			if ( jQuery.acceptData( elem ) ) {
				key = elem[ data_priv.expando ];

				if ( key && (data = data_priv.cache[ key ]) ) {
					if ( data.events ) {
						for ( type in data.events ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}
					if ( data_priv.cache[ key ] ) {
						// Discard any remaining `private` data
						delete data_priv.cache[ key ];
					}
				}
			}
			// Discard any remaining `user` data
			delete data_user.cache[ elem[ data_user.expando ] ];
		}
	}
});

jQuery.fn.extend({
	text: function( value ) {
		return access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().each(function() {
					if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
						this.textContent = value;
					}
				});
		}, null, value, arguments.length );
	},

	append: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.appendChild( elem );
			}
		});
	},

	prepend: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.insertBefore( elem, target.firstChild );
			}
		});
	},

	before: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this );
			}
		});
	},

	after: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		});
	},

	remove: function( selector, keepData /* Internal Use Only */ ) {
		var elem,
			elems = selector ? jQuery.filter( selector, this ) : this,
			i = 0;

		for ( ; (elem = elems[i]) != null; i++ ) {
			if ( !keepData && elem.nodeType === 1 ) {
				jQuery.cleanData( getAll( elem ) );
			}

			if ( elem.parentNode ) {
				if ( keepData && jQuery.contains( elem.ownerDocument, elem ) ) {
					setGlobalEval( getAll( elem, "script" ) );
				}
				elem.parentNode.removeChild( elem );
			}
		}

		return this;
	},

	empty: function() {
		var elem,
			i = 0;

		for ( ; (elem = this[i]) != null; i++ ) {
			if ( elem.nodeType === 1 ) {

				// Prevent memory leaks
				jQuery.cleanData( getAll( elem, false ) );

				// Remove any remaining nodes
				elem.textContent = "";
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map(function() {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		});
	},

	html: function( value ) {
		return access( this, function( value ) {
			var elem = this[ 0 ] || {},
				i = 0,
				l = this.length;

			if ( value === undefined && elem.nodeType === 1 ) {
				return elem.innerHTML;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

				value = value.replace( rxhtmlTag, "<$1></$2>" );

				try {
					for ( ; i < l; i++ ) {
						elem = this[ i ] || {};

						// Remove element nodes and prevent memory leaks
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch( e ) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function() {
		var arg = arguments[ 0 ];

		// Make the changes, replacing each context element with the new content
		this.domManip( arguments, function( elem ) {
			arg = this.parentNode;

			jQuery.cleanData( getAll( this ) );

			if ( arg ) {
				arg.replaceChild( elem, this );
			}
		});

		// Force removal if there was no new content (e.g., from empty arguments)
		return arg && (arg.length || arg.nodeType) ? this : this.remove();
	},

	detach: function( selector ) {
		return this.remove( selector, true );
	},

	domManip: function( args, callback ) {

		// Flatten any nested arrays
		args = concat.apply( [], args );

		var fragment, first, scripts, hasScripts, node, doc,
			i = 0,
			l = this.length,
			set = this,
			iNoClone = l - 1,
			value = args[ 0 ],
			isFunction = jQuery.isFunction( value );

		// We can't cloneNode fragments that contain checked, in WebKit
		if ( isFunction ||
				( l > 1 && typeof value === "string" &&
					!support.checkClone && rchecked.test( value ) ) ) {
			return this.each(function( index ) {
				var self = set.eq( index );
				if ( isFunction ) {
					args[ 0 ] = value.call( this, index, self.html() );
				}
				self.domManip( args, callback );
			});
		}

		if ( l ) {
			fragment = jQuery.buildFragment( args, this[ 0 ].ownerDocument, false, this );
			first = fragment.firstChild;

			if ( fragment.childNodes.length === 1 ) {
				fragment = first;
			}

			if ( first ) {
				scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
				hasScripts = scripts.length;

				// Use the original fragment for the last item instead of the first because it can end up
				// being emptied incorrectly in certain situations (#8070).
				for ( ; i < l; i++ ) {
					node = fragment;

					if ( i !== iNoClone ) {
						node = jQuery.clone( node, true, true );

						// Keep references to cloned scripts for later restoration
						if ( hasScripts ) {
							// Support: QtWebKit
							// jQuery.merge because push.apply(_, arraylike) throws
							jQuery.merge( scripts, getAll( node, "script" ) );
						}
					}

					callback.call( this[ i ], node, i );
				}

				if ( hasScripts ) {
					doc = scripts[ scripts.length - 1 ].ownerDocument;

					// Reenable scripts
					jQuery.map( scripts, restoreScript );

					// Evaluate executable scripts on first document insertion
					for ( i = 0; i < hasScripts; i++ ) {
						node = scripts[ i ];
						if ( rscriptType.test( node.type || "" ) &&
							!data_priv.access( node, "globalEval" ) && jQuery.contains( doc, node ) ) {

							if ( node.src ) {
								// Optional AJAX dependency, but won't run scripts if not present
								if ( jQuery._evalUrl ) {
									jQuery._evalUrl( node.src );
								}
							} else {
								jQuery.globalEval( node.textContent.replace( rcleanScript, "" ) );
							}
						}
					}
				}
			}
		}

		return this;
	}
});

jQuery.each({
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var elems,
			ret = [],
			insert = jQuery( selector ),
			last = insert.length - 1,
			i = 0;

		for ( ; i <= last; i++ ) {
			elems = i === last ? this : this.clone( true );
			jQuery( insert[ i ] )[ original ]( elems );

			// Support: QtWebKit
			// .get() because push.apply(_, arraylike) throws
			push.apply( ret, elems.get() );
		}

		return this.pushStack( ret );
	};
});


var iframe,
	elemdisplay = {};

/**
 * Retrieve the actual display of a element
 * @param {String} name nodeName of the element
 * @param {Object} doc Document object
 */
// Called only from within defaultDisplay
function actualDisplay( name, doc ) {
	var style,
		elem = jQuery( doc.createElement( name ) ).appendTo( doc.body ),

		// getDefaultComputedStyle might be reliably used only on attached element
		display = window.getDefaultComputedStyle && ( style = window.getDefaultComputedStyle( elem[ 0 ] ) ) ?

			// Use of this method is a temporary fix (more like optimization) until something better comes along,
			// since it was removed from specification and supported only in FF
			style.display : jQuery.css( elem[ 0 ], "display" );

	// We don't have any data stored on the element,
	// so use "detach" method as fast way to get rid of the element
	elem.detach();

	return display;
}

/**
 * Try to determine the default display value of an element
 * @param {String} nodeName
 */
function defaultDisplay( nodeName ) {
	var doc = document,
		display = elemdisplay[ nodeName ];

	if ( !display ) {
		display = actualDisplay( nodeName, doc );

		// If the simple way fails, read from inside an iframe
		if ( display === "none" || !display ) {

			// Use the already-created iframe if possible
			iframe = (iframe || jQuery( "<iframe frameborder='0' width='0' height='0'/>" )).appendTo( doc.documentElement );

			// Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
			doc = iframe[ 0 ].contentDocument;

			// Support: IE
			doc.write();
			doc.close();

			display = actualDisplay( nodeName, doc );
			iframe.detach();
		}

		// Store the correct default display
		elemdisplay[ nodeName ] = display;
	}

	return display;
}
var rmargin = (/^margin/);

var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );

var getStyles = function( elem ) {
		// Support: IE<=11+, Firefox<=30+ (#15098, #14150)
		// IE throws on elements created in popups
		// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
		if ( elem.ownerDocument.defaultView.opener ) {
			return elem.ownerDocument.defaultView.getComputedStyle( elem, null );
		}

		return window.getComputedStyle( elem, null );
	};



function curCSS( elem, name, computed ) {
	var width, minWidth, maxWidth, ret,
		style = elem.style;

	computed = computed || getStyles( elem );

	// Support: IE9
	// getPropertyValue is only needed for .css('filter') (#12537)
	if ( computed ) {
		ret = computed.getPropertyValue( name ) || computed[ name ];
	}

	if ( computed ) {

		if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
			ret = jQuery.style( elem, name );
		}

		// Support: iOS < 6
		// A tribute to the "awesome hack by Dean Edwards"
		// iOS < 6 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
		// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
		if ( rnumnonpx.test( ret ) && rmargin.test( name ) ) {

			// Remember the original values
			width = style.width;
			minWidth = style.minWidth;
			maxWidth = style.maxWidth;

			// Put in the new values to get a computed value out
			style.minWidth = style.maxWidth = style.width = ret;
			ret = computed.width;

			// Revert the changed values
			style.width = width;
			style.minWidth = minWidth;
			style.maxWidth = maxWidth;
		}
	}

	return ret !== undefined ?
		// Support: IE
		// IE returns zIndex value as an integer.
		ret + "" :
		ret;
}


function addGetHookIf( conditionFn, hookFn ) {
	// Define the hook, we'll check on the first run if it's really needed.
	return {
		get: function() {
			if ( conditionFn() ) {
				// Hook not needed (or it's not possible to use it due
				// to missing dependency), remove it.
				delete this.get;
				return;
			}

			// Hook needed; redefine it so that the support test is not executed again.
			return (this.get = hookFn).apply( this, arguments );
		}
	};
}


(function() {
	var pixelPositionVal, boxSizingReliableVal,
		docElem = document.documentElement,
		container = document.createElement( "div" ),
		div = document.createElement( "div" );

	if ( !div.style ) {
		return;
	}

	// Support: IE9-11+
	// Style of cloned element affects source element cloned (#8908)
	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	container.style.cssText = "border:0;width:0;height:0;top:0;left:-9999px;margin-top:1px;" +
		"position:absolute";
	container.appendChild( div );

	// Executing both pixelPosition & boxSizingReliable tests require only one layout
	// so they're executed at the same time to save the second computation.
	function computePixelPositionAndBoxSizingReliable() {
		div.style.cssText =
			// Support: Firefox<29, Android 2.3
			// Vendor-prefix box-sizing
			"-webkit-box-sizing:border-box;-moz-box-sizing:border-box;" +
			"box-sizing:border-box;display:block;margin-top:1%;top:1%;" +
			"border:1px;padding:1px;width:4px;position:absolute";
		div.innerHTML = "";
		docElem.appendChild( container );

		var divStyle = window.getComputedStyle( div, null );
		pixelPositionVal = divStyle.top !== "1%";
		boxSizingReliableVal = divStyle.width === "4px";

		docElem.removeChild( container );
	}

	// Support: node.js jsdom
	// Don't assume that getComputedStyle is a property of the global object
	if ( window.getComputedStyle ) {
		jQuery.extend( support, {
			pixelPosition: function() {

				// This test is executed only once but we still do memoizing
				// since we can use the boxSizingReliable pre-computing.
				// No need to check if the test was already performed, though.
				computePixelPositionAndBoxSizingReliable();
				return pixelPositionVal;
			},
			boxSizingReliable: function() {
				if ( boxSizingReliableVal == null ) {
					computePixelPositionAndBoxSizingReliable();
				}
				return boxSizingReliableVal;
			},
			reliableMarginRight: function() {

				// Support: Android 2.3
				// Check if div with explicit width and no margin-right incorrectly
				// gets computed margin-right based on width of container. (#3333)
				// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
				// This support function is only executed once so no memoizing is needed.
				var ret,
					marginDiv = div.appendChild( document.createElement( "div" ) );

				// Reset CSS: box-sizing; display; margin; border; padding
				marginDiv.style.cssText = div.style.cssText =
					// Support: Firefox<29, Android 2.3
					// Vendor-prefix box-sizing
					"-webkit-box-sizing:content-box;-moz-box-sizing:content-box;" +
					"box-sizing:content-box;display:block;margin:0;border:0;padding:0";
				marginDiv.style.marginRight = marginDiv.style.width = "0";
				div.style.width = "1px";
				docElem.appendChild( container );

				ret = !parseFloat( window.getComputedStyle( marginDiv, null ).marginRight );

				docElem.removeChild( container );
				div.removeChild( marginDiv );

				return ret;
			}
		});
	}
})();


// A method for quickly swapping in/out CSS properties to get correct calculations.
jQuery.swap = function( elem, options, callback, args ) {
	var ret, name,
		old = {};

	// Remember the old values, and insert the new ones
	for ( name in options ) {
		old[ name ] = elem.style[ name ];
		elem.style[ name ] = options[ name ];
	}

	ret = callback.apply( elem, args || [] );

	// Revert the old values
	for ( name in options ) {
		elem.style[ name ] = old[ name ];
	}

	return ret;
};


var
	// Swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
	// See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rnumsplit = new RegExp( "^(" + pnum + ")(.*)$", "i" ),
	rrelNum = new RegExp( "^([+-])=(" + pnum + ")", "i" ),

	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: "0",
		fontWeight: "400"
	},

	cssPrefixes = [ "Webkit", "O", "Moz", "ms" ];

// Return a css property mapped to a potentially vendor prefixed property
function vendorPropName( style, name ) {

	// Shortcut for names that are not vendor prefixed
	if ( name in style ) {
		return name;
	}

	// Check for vendor prefixed names
	var capName = name[0].toUpperCase() + name.slice(1),
		origName = name,
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in style ) {
			return name;
		}
	}

	return origName;
}

function setPositiveNumber( elem, value, subtract ) {
	var matches = rnumsplit.exec( value );
	return matches ?
		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 1 ] - ( subtract || 0 ) ) + ( matches[ 2 ] || "px" ) :
		value;
}

function augmentWidthOrHeight( elem, name, extra, isBorderBox, styles ) {
	var i = extra === ( isBorderBox ? "border" : "content" ) ?
		// If we already have the right measurement, avoid augmentation
		4 :
		// Otherwise initialize for horizontal or vertical properties
		name === "width" ? 1 : 0,

		val = 0;

	for ( ; i < 4; i += 2 ) {
		// Both box models exclude margin, so add it if we want it
		if ( extra === "margin" ) {
			val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
		}

		if ( isBorderBox ) {
			// border-box includes padding, so remove it if we want content
			if ( extra === "content" ) {
				val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// At this point, extra isn't border nor margin, so remove border
			if ( extra !== "margin" ) {
				val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		} else {
			// At this point, extra isn't content, so add padding
			val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// At this point, extra isn't content nor padding, so add border
			if ( extra !== "padding" ) {
				val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	return val;
}

function getWidthOrHeight( elem, name, extra ) {

	// Start with offset property, which is equivalent to the border-box value
	var valueIsBorderBox = true,
		val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
		styles = getStyles( elem ),
		isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

	// Some non-html elements return undefined for offsetWidth, so check for null/undefined
	// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
	// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
	if ( val <= 0 || val == null ) {
		// Fall back to computed then uncomputed css if necessary
		val = curCSS( elem, name, styles );
		if ( val < 0 || val == null ) {
			val = elem.style[ name ];
		}

		// Computed unit is not pixels. Stop here and return.
		if ( rnumnonpx.test(val) ) {
			return val;
		}

		// Check for style in case a browser which returns unreliable values
		// for getComputedStyle silently falls back to the reliable elem.style
		valueIsBorderBox = isBorderBox &&
			( support.boxSizingReliable() || val === elem.style[ name ] );

		// Normalize "", auto, and prepare for extra
		val = parseFloat( val ) || 0;
	}

	// Use the active box-sizing model to add/subtract irrelevant styles
	return ( val +
		augmentWidthOrHeight(
			elem,
			name,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox,
			styles
		)
	) + "px";
}

function showHide( elements, show ) {
	var display, elem, hidden,
		values = [],
		index = 0,
		length = elements.length;

	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}

		values[ index ] = data_priv.get( elem, "olddisplay" );
		display = elem.style.display;
		if ( show ) {
			// Reset the inline display of this element to learn if it is
			// being hidden by cascaded rules or not
			if ( !values[ index ] && display === "none" ) {
				elem.style.display = "";
			}

			// Set elements which have been overridden with display: none
			// in a stylesheet to whatever the default browser style is
			// for such an element
			if ( elem.style.display === "" && isHidden( elem ) ) {
				values[ index ] = data_priv.access( elem, "olddisplay", defaultDisplay(elem.nodeName) );
			}
		} else {
			hidden = isHidden( elem );

			if ( display !== "none" || !hidden ) {
				data_priv.set( elem, "olddisplay", hidden ? display : jQuery.css( elem, "display" ) );
			}
		}
	}

	// Set the display of most of the elements in a second loop
	// to avoid the constant reflow
	for ( index = 0; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}
		if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
			elem.style.display = show ? values[ index ] || "" : "none";
		}
	}

	return elements;
}

jQuery.extend({

	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {

					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Don't automatically add "px" to these possibly-unitless properties
	cssNumber: {
		"columnCount": true,
		"fillOpacity": true,
		"flexGrow": true,
		"flexShrink": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"order": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {
		"float": "cssFloat"
	},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {

		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = jQuery.camelCase( name ),
			style = elem.style;

		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( style, origName ) );

		// Gets hook for the prefixed version, then unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// Convert "+=" or "-=" to relative numbers (#7345)
			if ( type === "string" && (ret = rrelNum.exec( value )) ) {
				value = ( ret[1] + 1 ) * ret[2] + parseFloat( jQuery.css( elem, name ) );
				// Fixes bug #9237
				type = "number";
			}

			// Make sure that null and NaN values aren't set (#7116)
			if ( value == null || value !== value ) {
				return;
			}

			// If a number, add 'px' to the (except for certain CSS properties)
			if ( type === "number" && !jQuery.cssNumber[ origName ] ) {
				value += "px";
			}

			// Support: IE9-11+
			// background-* props affect original clone's values
			if ( !support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0 ) {
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value, extra )) !== undefined ) {
				style[ name ] = value;
			}

		} else {
			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra, styles ) {
		var val, num, hooks,
			origName = jQuery.camelCase( name );

		// Make sure that we're working with the right name
		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( elem.style, origName ) );

		// Try prefixed name followed by the unprefixed name
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name, styles );
		}

		// Convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Make numeric if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {
			num = parseFloat( val );
			return extra === true || jQuery.isNumeric( num ) ? num || 0 : val;
		}
		return val;
	}
});

jQuery.each([ "height", "width" ], function( i, name ) {
	jQuery.cssHooks[ name ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {

				// Certain elements can have dimension info if we invisibly show them
				// but it must have a current display style that would benefit
				return rdisplayswap.test( jQuery.css( elem, "display" ) ) && elem.offsetWidth === 0 ?
					jQuery.swap( elem, cssShow, function() {
						return getWidthOrHeight( elem, name, extra );
					}) :
					getWidthOrHeight( elem, name, extra );
			}
		},

		set: function( elem, value, extra ) {
			var styles = extra && getStyles( elem );
			return setPositiveNumber( elem, value, extra ?
				augmentWidthOrHeight(
					elem,
					name,
					extra,
					jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
					styles
				) : 0
			);
		}
	};
});

// Support: Android 2.3
jQuery.cssHooks.marginRight = addGetHookIf( support.reliableMarginRight,
	function( elem, computed ) {
		if ( computed ) {
			return jQuery.swap( elem, { "display": "inline-block" },
				curCSS, [ elem, "marginRight" ] );
		}
	}
);

// These hooks are used by animate to expand properties
jQuery.each({
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i = 0,
				expanded = {},

				// Assumes a single number if not a string
				parts = typeof value === "string" ? value.split(" ") : [ value ];

			for ( ; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( !rmargin.test( prefix ) ) {
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
});

jQuery.fn.extend({
	css: function( name, value ) {
		return access( this, function( elem, name, value ) {
			var styles, len,
				map = {},
				i = 0;

			if ( jQuery.isArray( name ) ) {
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	},
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state ) {
		if ( typeof state === "boolean" ) {
			return state ? this.show() : this.hide();
		}

		return this.each(function() {
			if ( isHidden( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		});
	}
});


function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || "swing";
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			if ( tween.elem[ tween.prop ] != null &&
				(!tween.elem.style || tween.elem.style[ tween.prop ] == null) ) {
				return tween.elem[ tween.prop ];
			}

			// Passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails.
			// Simple values such as "10px" are parsed to Float;
			// complex values such as "rotate(1rad)" are returned as-is.
			result = jQuery.css( tween.elem, tween.prop, "" );
			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {
			// Use step hook for back compat.
			// Use cssHook if its there.
			// Use .style if available and use plain properties where available.
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.style && ( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null || jQuery.cssHooks[ tween.prop ] ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Support: IE9
// Panic based approach to setting things on disconnected nodes
Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p * Math.PI ) / 2;
	}
};

jQuery.fx = Tween.prototype.init;

// Back Compat <1.8 extension point
jQuery.fx.step = {};




var
	fxNow, timerId,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rfxnum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" ),
	rrun = /queueHooks$/,
	animationPrefilters = [ defaultPrefilter ],
	tweeners = {
		"*": [ function( prop, value ) {
			var tween = this.createTween( prop, value ),
				target = tween.cur(),
				parts = rfxnum.exec( value ),
				unit = parts && parts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

				// Starting value computation is required for potential unit mismatches
				start = ( jQuery.cssNumber[ prop ] || unit !== "px" && +target ) &&
					rfxnum.exec( jQuery.css( tween.elem, prop ) ),
				scale = 1,
				maxIterations = 20;

			if ( start && start[ 3 ] !== unit ) {
				// Trust units reported by jQuery.css
				unit = unit || start[ 3 ];

				// Make sure we update the tween properties later on
				parts = parts || [];

				// Iteratively approximate from a nonzero starting point
				start = +target || 1;

				do {
					// If previous iteration zeroed out, double until we get *something*.
					// Use string for doubling so we don't accidentally see scale as unchanged below
					scale = scale || ".5";

					// Adjust and apply
					start = start / scale;
					jQuery.style( tween.elem, prop, start + unit );

				// Update scale, tolerating zero or NaN from tween.cur(),
				// break the loop if scale is unchanged or perfect, or if we've just had enough
				} while ( scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations );
			}

			// Update tween properties
			if ( parts ) {
				start = tween.start = +start || +target || 0;
				tween.unit = unit;
				// If a +=/-= token was provided, we're doing a relative animation
				tween.end = parts[ 1 ] ?
					start + ( parts[ 1 ] + 1 ) * parts[ 2 ] :
					+parts[ 2 ];
			}

			return tween;
		} ]
	};

// Animations created synchronously will run synchronously
function createFxNow() {
	setTimeout(function() {
		fxNow = undefined;
	});
	return ( fxNow = jQuery.now() );
}

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		i = 0,
		attrs = { height: type };

	// If we include width, step value is 1 to do all cssExpand values,
	// otherwise step value is 2 to skip over Left and Right
	includeWidth = includeWidth ? 1 : 0;
	for ( ; i < 4 ; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

function createTween( value, prop, animation ) {
	var tween,
		collection = ( tweeners[ prop ] || [] ).concat( tweeners[ "*" ] ),
		index = 0,
		length = collection.length;
	for ( ; index < length; index++ ) {
		if ( (tween = collection[ index ].call( animation, prop, value )) ) {

			// We're done with this property
			return tween;
		}
	}
}

function defaultPrefilter( elem, props, opts ) {
	/* jshint validthis: true */
	var prop, value, toggle, tween, hooks, oldfire, display, checkDisplay,
		anim = this,
		orig = {},
		style = elem.style,
		hidden = elem.nodeType && isHidden( elem ),
		dataShow = data_priv.get( elem, "fxshow" );

	// Handle queue: false promises
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always(function() {
			// Ensure the complete handler is called before this completes
			anim.always(function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			});
		});
	}

	// Height/width overflow pass
	if ( elem.nodeType === 1 && ( "height" in props || "width" in props ) ) {
		// Make sure that nothing sneaks out
		// Record all 3 overflow attributes because IE9-10 do not
		// change the overflow attribute when overflowX and
		// overflowY are set to the same value
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Set display property to inline-block for height/width
		// animations on inline elements that are having width/height animated
		display = jQuery.css( elem, "display" );

		// Test default display if display is currently "none"
		checkDisplay = display === "none" ?
			data_priv.get( elem, "olddisplay" ) || defaultDisplay( elem.nodeName ) : display;

		if ( checkDisplay === "inline" && jQuery.css( elem, "float" ) === "none" ) {
			style.display = "inline-block";
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		anim.always(function() {
			style.overflow = opts.overflow[ 0 ];
			style.overflowX = opts.overflow[ 1 ];
			style.overflowY = opts.overflow[ 2 ];
		});
	}

	// show/hide pass
	for ( prop in props ) {
		value = props[ prop ];
		if ( rfxtypes.exec( value ) ) {
			delete props[ prop ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {

				// If there is dataShow left over from a stopped hide or show and we are going to proceed with show, we should pretend to be hidden
				if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
					hidden = true;
				} else {
					continue;
				}
			}
			orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );

		// Any non-fx value stops us from restoring the original display value
		} else {
			display = undefined;
		}
	}

	if ( !jQuery.isEmptyObject( orig ) ) {
		if ( dataShow ) {
			if ( "hidden" in dataShow ) {
				hidden = dataShow.hidden;
			}
		} else {
			dataShow = data_priv.access( elem, "fxshow", {} );
		}

		// Store state if its toggle - enables .stop().toggle() to "reverse"
		if ( toggle ) {
			dataShow.hidden = !hidden;
		}
		if ( hidden ) {
			jQuery( elem ).show();
		} else {
			anim.done(function() {
				jQuery( elem ).hide();
			});
		}
		anim.done(function() {
			var prop;

			data_priv.remove( elem, "fxshow" );
			for ( prop in orig ) {
				jQuery.style( elem, prop, orig[ prop ] );
			}
		});
		for ( prop in orig ) {
			tween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );

			if ( !( prop in dataShow ) ) {
				dataShow[ prop ] = tween.start;
				if ( hidden ) {
					tween.end = tween.start;
					tween.start = prop === "width" || prop === "height" ? 1 : 0;
				}
			}
		}

	// If this is a noop like .hide().hide(), restore an overwritten display value
	} else if ( (display === "none" ? defaultDisplay( elem.nodeName ) : display) === "inline" ) {
		style.display = display;
	}
}

function propFilter( props, specialEasing ) {
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = jQuery.camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( jQuery.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// Not quite $.extend, this won't overwrite existing keys.
			// Reusing 'index' because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

function Animation( elem, properties, options ) {
	var result,
		stopped,
		index = 0,
		length = animationPrefilters.length,
		deferred = jQuery.Deferred().always( function() {
			// Don't match elem in the :animated selector
			delete tick.elem;
		}),
		tick = function() {
			if ( stopped ) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),
				// Support: Android 2.3
				// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length ; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ]);

			if ( percent < 1 && length ) {
				return remaining;
			} else {
				deferred.resolveWith( elem, [ animation ] );
				return false;
			}
		},
		animation = deferred.promise({
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, { specialEasing: {} }, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,
					// If we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {
					return this;
				}
				stopped = true;
				for ( ; index < length ; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// Resolve when we played the last frame; otherwise, reject
				if ( gotoEnd ) {
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		}),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length ; index++ ) {
		result = animationPrefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			return result;
		}
	}

	jQuery.map( props, createTween, animation );

	if ( jQuery.isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		})
	);

	// attach callbacks from options
	return animation.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );
}

jQuery.Animation = jQuery.extend( Animation, {

	tweener: function( props, callback ) {
		if ( jQuery.isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.split(" ");
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length ; index++ ) {
			prop = props[ index ];
			tweeners[ prop ] = tweeners[ prop ] || [];
			tweeners[ prop ].unshift( callback );
		}
	},

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			animationPrefilters.unshift( callback );
		} else {
			animationPrefilters.push( callback );
		}
	}
});

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			jQuery.isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
	};

	opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
		opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;

	// Normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( jQuery.isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.fn.extend({
	fadeTo: function( speed, to, easing, callback ) {

		// Show any hidden elements after setting opacity to 0
		return this.filter( isHidden ).css( "opacity", 0 ).show()

			// Animate to the value specified
			.end().animate({ opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {
				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

				// Empty animations, or finishing resolves immediately
				if ( empty || data_priv.get( this, "finish" ) ) {
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each(function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = data_priv.get( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && (type == null || timers[ index ].queue === type) ) {
					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// Start the next in the queue if the last step wasn't forced.
			// Timers currently will call their complete callbacks, which
			// will dequeue but only if they were gotoEnd.
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		});
	},
	finish: function( type ) {
		if ( type !== false ) {
			type = type || "fx";
		}
		return this.each(function() {
			var index,
				data = data_priv.get( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// Enable finishing flag on private data
			data.finish = true;

			// Empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.stop ) {
				hooks.stop.call( this, true );
			}

			// Look for any active animations, and finish them
			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// Look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {
				if ( queue[ index ] && queue[ index ].finish ) {
					queue[ index ].finish.call( this );
				}
			}

			// Turn off finishing flag
			delete data.finish;
		});
	}
});

jQuery.each([ "toggle", "show", "hide" ], function( i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
});

// Generate shortcuts for custom animations
jQuery.each({
	slideDown: genFx("show"),
	slideUp: genFx("hide"),
	slideToggle: genFx("toggle"),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
});

jQuery.timers = [];
jQuery.fx.tick = function() {
	var timer,
		i = 0,
		timers = jQuery.timers;

	fxNow = jQuery.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];
		// Checks the timer has not already been removed
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	jQuery.timers.push( timer );
	if ( timer() ) {
		jQuery.fx.start();
	} else {
		jQuery.timers.pop();
	}
};

jQuery.fx.interval = 13;

jQuery.fx.start = function() {
	if ( !timerId ) {
		timerId = setInterval( jQuery.fx.tick, jQuery.fx.interval );
	}
};

jQuery.fx.stop = function() {
	clearInterval( timerId );
	timerId = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,
	// Default speed
	_default: 400
};


// Based off of the plugin by Clint Helfers, with permission.
// http://blindsignals.com/index.php/2009/07/jquery-delay/
jQuery.fn.delay = function( time, type ) {
	time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
	type = type || "fx";

	return this.queue( type, function( next, hooks ) {
		var timeout = setTimeout( next, time );
		hooks.stop = function() {
			clearTimeout( timeout );
		};
	});
};


(function() {
	var input = document.createElement( "input" ),
		select = document.createElement( "select" ),
		opt = select.appendChild( document.createElement( "option" ) );

	input.type = "checkbox";

	// Support: iOS<=5.1, Android<=4.2+
	// Default value for a checkbox should be "on"
	support.checkOn = input.value !== "";

	// Support: IE<=11+
	// Must access selectedIndex to make default options select
	support.optSelected = opt.selected;

	// Support: Android<=2.3
	// Options inside disabled selects are incorrectly marked as disabled
	select.disabled = true;
	support.optDisabled = !opt.disabled;

	// Support: IE<=11+
	// An input loses its value after becoming a radio
	input = document.createElement( "input" );
	input.value = "t";
	input.type = "radio";
	support.radioValue = input.value === "t";
})();


var nodeHook, boolHook,
	attrHandle = jQuery.expr.attrHandle;

jQuery.fn.extend({
	attr: function( name, value ) {
		return access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each(function() {
			jQuery.removeAttr( this, name );
		});
	}
});

jQuery.extend({
	attr: function( elem, name, value ) {
		var hooks, ret,
			nType = elem.nodeType;

		// don't get/set attributes on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === strundefined ) {
			return jQuery.prop( elem, name, value );
		}

		// All attributes are lowercase
		// Grab necessary hook if one is defined
		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
			name = name.toLowerCase();
			hooks = jQuery.attrHooks[ name ] ||
				( jQuery.expr.match.bool.test( name ) ? boolHook : nodeHook );
		}

		if ( value !== undefined ) {

			if ( value === null ) {
				jQuery.removeAttr( elem, name );

			} else if ( hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
				return ret;

			} else {
				elem.setAttribute( name, value + "" );
				return value;
			}

		} else if ( hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
			return ret;

		} else {
			ret = jQuery.find.attr( elem, name );

			// Non-existent attributes return null, we normalize to undefined
			return ret == null ?
				undefined :
				ret;
		}
	},

	removeAttr: function( elem, value ) {
		var name, propName,
			i = 0,
			attrNames = value && value.match( rnotwhite );

		if ( attrNames && elem.nodeType === 1 ) {
			while ( (name = attrNames[i++]) ) {
				propName = jQuery.propFix[ name ] || name;

				// Boolean attributes get special treatment (#10870)
				if ( jQuery.expr.match.bool.test( name ) ) {
					// Set corresponding property to false
					elem[ propName ] = false;
				}

				elem.removeAttribute( name );
			}
		}
	},

	attrHooks: {
		type: {
			set: function( elem, value ) {
				if ( !support.radioValue && value === "radio" &&
					jQuery.nodeName( elem, "input" ) ) {
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		}
	}
});

// Hooks for boolean attributes
boolHook = {
	set: function( elem, value, name ) {
		if ( value === false ) {
			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else {
			elem.setAttribute( name, name );
		}
		return name;
	}
};
jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {
	var getter = attrHandle[ name ] || jQuery.find.attr;

	attrHandle[ name ] = function( elem, name, isXML ) {
		var ret, handle;
		if ( !isXML ) {
			// Avoid an infinite loop by temporarily removing this function from the getter
			handle = attrHandle[ name ];
			attrHandle[ name ] = ret;
			ret = getter( elem, name, isXML ) != null ?
				name.toLowerCase() :
				null;
			attrHandle[ name ] = handle;
		}
		return ret;
	};
});




var rfocusable = /^(?:input|select|textarea|button)$/i;

jQuery.fn.extend({
	prop: function( name, value ) {
		return access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		return this.each(function() {
			delete this[ jQuery.propFix[ name ] || name ];
		});
	}
});

jQuery.extend({
	propFix: {
		"for": "htmlFor",
		"class": "className"
	},

	prop: function( elem, name, value ) {
		var ret, hooks, notxml,
			nType = elem.nodeType;

		// Don't get/set properties on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

		if ( notxml ) {
			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			return hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ?
				ret :
				( elem[ name ] = value );

		} else {
			return hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ?
				ret :
				elem[ name ];
		}
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {
				return elem.hasAttribute( "tabindex" ) || rfocusable.test( elem.nodeName ) || elem.href ?
					elem.tabIndex :
					-1;
			}
		}
	}
});

if ( !support.optSelected ) {
	jQuery.propHooks.selected = {
		get: function( elem ) {
			var parent = elem.parentNode;
			if ( parent && parent.parentNode ) {
				parent.parentNode.selectedIndex;
			}
			return null;
		}
	};
}

jQuery.each([
	"tabIndex",
	"readOnly",
	"maxLength",
	"cellSpacing",
	"cellPadding",
	"rowSpan",
	"colSpan",
	"useMap",
	"frameBorder",
	"contentEditable"
], function() {
	jQuery.propFix[ this.toLowerCase() ] = this;
});




var rclass = /[\t\r\n\f]/g;

jQuery.fn.extend({
	addClass: function( value ) {
		var classes, elem, cur, clazz, j, finalValue,
			proceed = typeof value === "string" && value,
			i = 0,
			len = this.length;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).addClass( value.call( this, j, this.className ) );
			});
		}

		if ( proceed ) {
			// The disjunction here is for better compressibility (see removeClass)
			classes = ( value || "" ).match( rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					" "
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}

					// only assign if different to avoid unneeded rendering.
					finalValue = jQuery.trim( cur );
					if ( elem.className !== finalValue ) {
						elem.className = finalValue;
					}
				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var classes, elem, cur, clazz, j, finalValue,
			proceed = arguments.length === 0 || typeof value === "string" && value,
			i = 0,
			len = this.length;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).removeClass( value.call( this, j, this.className ) );
			});
		}
		if ( proceed ) {
			classes = ( value || "" ).match( rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					""
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						// Remove *all* instances
						while ( cur.indexOf( " " + clazz + " " ) >= 0 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = value ? jQuery.trim( cur ) : "";
					if ( elem.className !== finalValue ) {
						elem.className = finalValue;
					}
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value;

		if ( typeof stateVal === "boolean" && type === "string" ) {
			return stateVal ? this.addClass( value ) : this.removeClass( value );
		}

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( i ) {
				jQuery( this ).toggleClass( value.call(this, i, this.className, stateVal), stateVal );
			});
		}

		return this.each(function() {
			if ( type === "string" ) {
				// Toggle individual class names
				var className,
					i = 0,
					self = jQuery( this ),
					classNames = value.match( rnotwhite ) || [];

				while ( (className = classNames[ i++ ]) ) {
					// Check each className given, space separated list
					if ( self.hasClass( className ) ) {
						self.removeClass( className );
					} else {
						self.addClass( className );
					}
				}

			// Toggle whole class name
			} else if ( type === strundefined || type === "boolean" ) {
				if ( this.className ) {
					// store className if set
					data_priv.set( this, "__className__", this.className );
				}

				// If the element has a class name or if we're passed `false`,
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
				this.className = this.className || value === false ? "" : data_priv.get( this, "__className__" ) || "";
			}
		});
	},

	hasClass: function( selector ) {
		var className = " " + selector + " ",
			i = 0,
			l = this.length;
		for ( ; i < l; i++ ) {
			if ( this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) >= 0 ) {
				return true;
			}
		}

		return false;
	}
});




var rreturn = /\r/g;

jQuery.fn.extend({
	val: function( value ) {
		var hooks, ret, isFunction,
			elem = this[0];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.type ] || jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
					return ret;
				}

				ret = elem.value;

				return typeof ret === "string" ?
					// Handle most common string cases
					ret.replace(rreturn, "") :
					// Handle cases where value is null/undef or number
					ret == null ? "" : ret;
			}

			return;
		}

		isFunction = jQuery.isFunction( value );

		return this.each(function( i ) {
			var val;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( isFunction ) {
				val = value.call( this, i, jQuery( this ).val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";

			} else if ( typeof val === "number" ) {
				val += "";

			} else if ( jQuery.isArray( val ) ) {
				val = jQuery.map( val, function( value ) {
					return value == null ? "" : value + "";
				});
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !("set" in hooks) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		});
	}
});

jQuery.extend({
	valHooks: {
		option: {
			get: function( elem ) {
				var val = jQuery.find.attr( elem, "value" );
				return val != null ?
					val :
					// Support: IE10-11+
					// option.text throws exceptions (#14686, #14858)
					jQuery.trim( jQuery.text( elem ) );
			}
		},
		select: {
			get: function( elem ) {
				var value, option,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one" || index < 0,
					values = one ? null : [],
					max = one ? index + 1 : options.length,
					i = index < 0 ?
						max :
						one ? index : 0;

				// Loop through all the selected options
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// IE6-9 doesn't update selected after form reset (#2551)
					if ( ( option.selected || i === index ) &&
							// Don't return options that are disabled or in a disabled optgroup
							( support.optDisabled ? !option.disabled : option.getAttribute( "disabled" ) === null ) &&
							( !option.parentNode.disabled || !jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray( value ),
					i = options.length;

				while ( i-- ) {
					option = options[ i ];
					if ( (option.selected = jQuery.inArray( option.value, values ) >= 0) ) {
						optionSet = true;
					}
				}

				// Force browsers to behave consistently when non-matching value is set
				if ( !optionSet ) {
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	}
});

// Radios and checkboxes getter/setter
jQuery.each([ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = {
		set: function( elem, value ) {
			if ( jQuery.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery(elem).val(), value ) >= 0 );
			}
		}
	};
	if ( !support.checkOn ) {
		jQuery.valHooks[ this ].get = function( elem ) {
			return elem.getAttribute("value") === null ? "on" : elem.value;
		};
	}
});




// Return jQuery for attributes-only inclusion


jQuery.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup error contextmenu").split(" "), function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( data, fn ) {
		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};
});

jQuery.fn.extend({
	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	},

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {
		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ? this.off( selector, "**" ) : this.off( types, selector || "**", fn );
	}
});


var nonce = jQuery.now();

var rquery = (/\?/);



// Support: Android 2.3
// Workaround failure to string-cast null input
jQuery.parseJSON = function( data ) {
	return JSON.parse( data + "" );
};


// Cross-browser xml parsing
jQuery.parseXML = function( data ) {
	var xml, tmp;
	if ( !data || typeof data !== "string" ) {
		return null;
	}

	// Support: IE9
	try {
		tmp = new DOMParser();
		xml = tmp.parseFromString( data, "text/xml" );
	} catch ( e ) {
		xml = undefined;
	}

	if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
		jQuery.error( "Invalid XML: " + data );
	}
	return xml;
};


var
	rhash = /#.*$/,
	rts = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,
	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,
	rurl = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat( "*" ),

	// Document location
	ajaxLocation = window.location.href,

	// Segment location into parts
	ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [];

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( rnotwhite ) || [];

		if ( jQuery.isFunction( func ) ) {
			// For each dataType in the dataTypeExpression
			while ( (dataType = dataTypes[i++]) ) {
				// Prepend if requested
				if ( dataType[0] === "+" ) {
					dataType = dataType.slice( 1 ) || "*";
					(structure[ dataType ] = structure[ dataType ] || []).unshift( func );

				// Otherwise append
				} else {
					(structure[ dataType ] = structure[ dataType ] || []).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if ( typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[ dataTypeOrTransport ] ) {
				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {
				return !( selected = dataTypeOrTransport );
			}
		});
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var key, deep,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || (deep = {}) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}

	return target;
}

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {

	var ct, type, finalDataType, firstDataType,
		contents = s.contents,
		dataTypes = s.dataTypes;

	// Remove auto dataType and get content-type in the process
	while ( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {
		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[0] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}
		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {
	var conv2, current, conv, tmp, prev,
		converters = {},
		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while ( current ) {

		if ( s.responseFields[ current ] ) {
			jqXHR[ s.responseFields[ current ] ] = response;
		}

		// Apply the dataFilter if provided
		if ( !prev && isSuccess && s.dataFilter ) {
			response = s.dataFilter( response, s.dataType );
		}

		prev = current;
		current = dataTypes.shift();

		if ( current ) {

		// There's only work to do if current dataType is non-auto
			if ( current === "*" ) {

				current = prev;

			// Convert response if prev dataType is non-auto and differs from current
			} else if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split( " " );
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {
								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.unshift( tmp[ 1 ] );
								}
								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s[ "throws" ] ) {
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return { state: "parsererror", error: conv ? e : "No conversion from " + prev + " to " + current };
						}
					}
				}
			}
		}
	}

	return { state: "success", data: response };
}

jQuery.extend({

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: ajaxLocation,
		type: "GET",
		isLocal: rlocalProtocol.test( ajaxLocParts[ 1 ] ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /xml/,
			html: /html/,
			json: /json/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": jQuery.parseJSON,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var transport,
			// URL without anti-cache param
			cacheURL,
			// Response headers
			responseHeadersString,
			responseHeaders,
			// timeout handle
			timeoutTimer,
			// Cross-domain detection vars
			parts,
			// To know if global events are to be dispatched
			fireGlobals,
			// Loop variable
			i,
			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),
			// Callbacks context
			callbackContext = s.context || s,
			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context && ( callbackContext.nodeType || callbackContext.jquery ) ?
				jQuery( callbackContext ) :
				jQuery.event,
			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks("once memory"),
			// Status-dependent callbacks
			statusCode = s.statusCode || {},
			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},
			// The jqXHR state
			state = 0,
			// Default abort message
			strAbort = "canceled",
			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( state === 2 ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while ( (match = rheaders.exec( responseHeadersString )) ) {
								responseHeaders[ match[1].toLowerCase() ] = match[ 2 ];
							}
						}
						match = responseHeaders[ key.toLowerCase() ];
					}
					return match == null ? null : match;
				},

				// Raw string
				getAllResponseHeaders: function() {
					return state === 2 ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function( name, value ) {
					var lname = name.toLowerCase();
					if ( !state ) {
						name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( !state ) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function( map ) {
					var code;
					if ( map ) {
						if ( state < 2 ) {
							for ( code in map ) {
								// Lazy-add the new callback in a way that preserves old ones
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						} else {
							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						}
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					var finalText = statusText || strAbort;
					if ( transport ) {
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR ).complete = completeDeferred.add;
		jqXHR.success = jqXHR.done;
		jqXHR.error = jqXHR.fail;

		// Remove hash character (#7531: and string promotion)
		// Add protocol if not provided (prefilters might expect it)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || ajaxLocation ) + "" ).replace( rhash, "" )
			.replace( rprotocol, ajaxLocParts[ 1 ] + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().match( rnotwhite ) || [ "" ];

		// A cross-domain request is in order when we have a protocol:host:port mismatch
		if ( s.crossDomain == null ) {
			parts = rurl.exec( s.url.toLowerCase() );
			s.crossDomain = !!( parts &&
				( parts[ 1 ] !== ajaxLocParts[ 1 ] || parts[ 2 ] !== ajaxLocParts[ 2 ] ||
					( parts[ 3 ] || ( parts[ 1 ] === "http:" ? "80" : "443" ) ) !==
						( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ? "80" : "443" ) ) )
			);
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( state === 2 ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
		fireGlobals = jQuery.event && s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger("ajaxStart");
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		cacheURL = s.url;

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// If data is available, append data to url
			if ( s.data ) {
				cacheURL = ( s.url += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data );
				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add anti-cache in url if needed
			if ( s.cache === false ) {
				s.url = rts.test( cacheURL ) ?

					// If there is already a '_' parameter, set its value
					cacheURL.replace( rts, "$1_=" + nonce++ ) :

					// Otherwise add one to the end
					cacheURL + ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + nonce++;
			}
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			if ( jQuery.lastModified[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[0] ] ?
				s.accepts[ s.dataTypes[0] ] + ( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend && ( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {
			// Abort if not done already and return
			return jqXHR.abort();
		}

		// Aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		for ( i in { success: 1, error: 1, complete: 1 } ) {
			jqXHR[ i ]( s[ i ] );
		}

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}
			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = setTimeout(function() {
					jqXHR.abort("timeout");
				}, s.timeout );
			}

			try {
				state = 1;
				transport.send( requestHeaders, done );
			} catch ( e ) {
				// Propagate exception as error if not done
				if ( state < 2 ) {
					done( -1, e );
				// Simply rethrow otherwise
				} else {
					throw e;
				}
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Called once
			if ( state === 2 ) {
				return;
			}

			// State is "done" now
			state = 2;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Determine if successful
			isSuccess = status >= 200 && status < 300 || status === 304;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// Convert no matter what (that way responseXXX fields are always set)
			response = ajaxConvert( s, response, jqXHR, isSuccess );

			// If successful, handle type chaining
			if ( isSuccess ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {
					modified = jqXHR.getResponseHeader("Last-Modified");
					if ( modified ) {
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader("etag");
					if ( modified ) {
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 || s.type === "HEAD" ) {
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
			} else {
				// Extract error from statusText and normalize for non-aborts
				error = statusText;
				if ( status || !statusText ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger("ajaxStop");
				}
			}
		}

		return jqXHR;
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	},

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	}
});

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {
		// Shift arguments if data argument was omitted
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		return jQuery.ajax({
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		});
	};
});


jQuery._evalUrl = function( url ) {
	return jQuery.ajax({
		url: url,
		type: "GET",
		dataType: "script",
		async: false,
		global: false,
		"throws": true
	});
};


jQuery.fn.extend({
	wrapAll: function( html ) {
		var wrap;

		if ( jQuery.isFunction( html ) ) {
			return this.each(function( i ) {
				jQuery( this ).wrapAll( html.call(this, i) );
			});
		}

		if ( this[ 0 ] ) {

			// The elements to wrap the target around
			wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

			if ( this[ 0 ].parentNode ) {
				wrap.insertBefore( this[ 0 ] );
			}

			wrap.map(function() {
				var elem = this;

				while ( elem.firstElementChild ) {
					elem = elem.firstElementChild;
				}

				return elem;
			}).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function( i ) {
				jQuery( this ).wrapInner( html.call(this, i) );
			});
		}

		return this.each(function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		});
	},

	wrap: function( html ) {
		var isFunction = jQuery.isFunction( html );

		return this.each(function( i ) {
			jQuery( this ).wrapAll( isFunction ? html.call(this, i) : html );
		});
	},

	unwrap: function() {
		return this.parent().each(function() {
			if ( !jQuery.nodeName( this, "body" ) ) {
				jQuery( this ).replaceWith( this.childNodes );
			}
		}).end();
	}
});


jQuery.expr.filters.hidden = function( elem ) {
	// Support: Opera <= 12.12
	// Opera reports offsetWidths and offsetHeights less than zero on some elements
	return elem.offsetWidth <= 0 && elem.offsetHeight <= 0;
};
jQuery.expr.filters.visible = function( elem ) {
	return !jQuery.expr.filters.hidden( elem );
};




var r20 = /%20/g,
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

function buildParams( prefix, obj, traditional, add ) {
	var name;

	if ( jQuery.isArray( obj ) ) {
		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {
				// Treat each array item as a scalar.
				add( prefix, v );

			} else {
				// Item is non-scalar (array or object), encode its numeric index.
				buildParams( prefix + "[" + ( typeof v === "object" ? i : "" ) + "]", v, traditional, add );
			}
		});

	} else if ( !traditional && jQuery.type( obj ) === "object" ) {
		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {
		// Serialize scalar item.
		add( prefix, obj );
	}
}

// Serialize an array of form elements or a set of
// key/values into a query string
jQuery.param = function( a, traditional ) {
	var prefix,
		s = [],
		add = function( key, value ) {
			// If value is a function, invoke it and return its value
			value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
			s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
		};

	// Set traditional to true for jQuery <= 1.3.2 behavior.
	if ( traditional === undefined ) {
		traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
	}

	// If an array was passed in, assume that it is an array of form elements.
	if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {
		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		});

	} else {
		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" ).replace( r20, "+" );
};

jQuery.fn.extend({
	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function() {
		return this.map(function() {
			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		})
		.filter(function() {
			var type = this.type;

			// Use .is( ":disabled" ) so that fieldset[disabled] works
			return this.name && !jQuery( this ).is( ":disabled" ) &&
				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
				( this.checked || !rcheckableType.test( type ) );
		})
		.map(function( i, elem ) {
			var val = jQuery( this ).val();

			return val == null ?
				null :
				jQuery.isArray( val ) ?
					jQuery.map( val, function( val ) {
						return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
					}) :
					{ name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		}).get();
	}
});


jQuery.ajaxSettings.xhr = function() {
	try {
		return new XMLHttpRequest();
	} catch( e ) {}
};

var xhrId = 0,
	xhrCallbacks = {},
	xhrSuccessStatus = {
		// file protocol always yields status code 0, assume 200
		0: 200,
		// Support: IE9
		// #1450: sometimes IE returns 1223 when it should be 204
		1223: 204
	},
	xhrSupported = jQuery.ajaxSettings.xhr();

// Support: IE9
// Open requests must be manually aborted on unload (#5280)
// See https://support.microsoft.com/kb/2856746 for more info
if ( window.attachEvent ) {
	window.attachEvent( "onunload", function() {
		for ( var key in xhrCallbacks ) {
			xhrCallbacks[ key ]();
		}
	});
}

support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
support.ajax = xhrSupported = !!xhrSupported;

jQuery.ajaxTransport(function( options ) {
	var callback;

	// Cross domain only allowed if supported through XMLHttpRequest
	if ( support.cors || xhrSupported && !options.crossDomain ) {
		return {
			send: function( headers, complete ) {
				var i,
					xhr = options.xhr(),
					id = ++xhrId;

				xhr.open( options.type, options.url, options.async, options.username, options.password );

				// Apply custom fields if provided
				if ( options.xhrFields ) {
					for ( i in options.xhrFields ) {
						xhr[ i ] = options.xhrFields[ i ];
					}
				}

				// Override mime type if needed
				if ( options.mimeType && xhr.overrideMimeType ) {
					xhr.overrideMimeType( options.mimeType );
				}

				// X-Requested-With header
				// For cross-domain requests, seeing as conditions for a preflight are
				// akin to a jigsaw puzzle, we simply never set it to be sure.
				// (it can always be set on a per-request basis or even using ajaxSetup)
				// For same-domain requests, won't change header if already provided.
				if ( !options.crossDomain && !headers["X-Requested-With"] ) {
					headers["X-Requested-With"] = "XMLHttpRequest";
				}

				// Set headers
				for ( i in headers ) {
					xhr.setRequestHeader( i, headers[ i ] );
				}

				// Callback
				callback = function( type ) {
					return function() {
						if ( callback ) {
							delete xhrCallbacks[ id ];
							callback = xhr.onload = xhr.onerror = null;

							if ( type === "abort" ) {
								xhr.abort();
							} else if ( type === "error" ) {
								complete(
									// file: protocol always yields status 0; see #8605, #14207
									xhr.status,
									xhr.statusText
								);
							} else {
								complete(
									xhrSuccessStatus[ xhr.status ] || xhr.status,
									xhr.statusText,
									// Support: IE9
									// Accessing binary-data responseText throws an exception
									// (#11426)
									typeof xhr.responseText === "string" ? {
										text: xhr.responseText
									} : undefined,
									xhr.getAllResponseHeaders()
								);
							}
						}
					};
				};

				// Listen to events
				xhr.onload = callback();
				xhr.onerror = callback("error");

				// Create the abort callback
				callback = xhrCallbacks[ id ] = callback("abort");

				try {
					// Do send the request (this may raise an exception)
					xhr.send( options.hasContent && options.data || null );
				} catch ( e ) {
					// #14683: Only rethrow if this hasn't been notified as an error yet
					if ( callback ) {
						throw e;
					}
				}
			},

			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
});




// Install script dataType
jQuery.ajaxSetup({
	accepts: {
		script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /(?:java|ecma)script/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
});

// Handle cache's special case and crossDomain
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
	}
});

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function( s ) {
	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {
		var script, callback;
		return {
			send: function( _, complete ) {
				script = jQuery("<script>").prop({
					async: true,
					charset: s.scriptCharset,
					src: s.url
				}).on(
					"load error",
					callback = function( evt ) {
						script.remove();
						callback = null;
						if ( evt ) {
							complete( evt.type === "error" ? 404 : 200, evt.type );
						}
					}
				);
				document.head.appendChild( script[ 0 ] );
			},
			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
});




var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup({
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce++ ) );
		this[ callback ] = true;
		return callback;
	}
});

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" && !( s.contentType || "" ).indexOf("application/x-www-form-urlencoded") && rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {
			s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters["script json"] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always(function() {
			// Restore preexisting value
			window[ callbackName ] = overwritten;

			// Save back as free
			if ( s[ callbackName ] ) {
				// make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && jQuery.isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		});

		// Delegate to script
		return "script";
	}
});




// data: string of html
// context (optional): If specified, the fragment will be created in this context, defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
jQuery.parseHTML = function( data, context, keepScripts ) {
	if ( !data || typeof data !== "string" ) {
		return null;
	}
	if ( typeof context === "boolean" ) {
		keepScripts = context;
		context = false;
	}
	context = context || document;

	var parsed = rsingleTag.exec( data ),
		scripts = !keepScripts && [];

	// Single tag
	if ( parsed ) {
		return [ context.createElement( parsed[1] ) ];
	}

	parsed = jQuery.buildFragment( [ data ], context, scripts );

	if ( scripts && scripts.length ) {
		jQuery( scripts ).remove();
	}

	return jQuery.merge( [], parsed.childNodes );
};


// Keep a copy of the old load method
var _load = jQuery.fn.load;

/**
 * Load a url into a page
 */
jQuery.fn.load = function( url, params, callback ) {
	if ( typeof url !== "string" && _load ) {
		return _load.apply( this, arguments );
	}

	var selector, type, response,
		self = this,
		off = url.indexOf(" ");

	if ( off >= 0 ) {
		selector = jQuery.trim( url.slice( off ) );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( jQuery.isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax({
			url: url,

			// if "type" variable is undefined, then "GET" method will be used
			type: type,
			dataType: "html",
			data: params
		}).done(function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery("<div>").append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		}).complete( callback && function( jqXHR, status ) {
			self.each( callback, response || [ jqXHR.responseText, status, jqXHR ] );
		});
	}

	return this;
};




// Attach a bunch of functions for handling common AJAX events
jQuery.each( [ "ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend" ], function( i, type ) {
	jQuery.fn[ type ] = function( fn ) {
		return this.on( type, fn );
	};
});




jQuery.expr.filters.animated = function( elem ) {
	return jQuery.grep(jQuery.timers, function( fn ) {
		return elem === fn.elem;
	}).length;
};




var docElem = window.document.documentElement;

/**
 * Gets a window from an element
 */
function getWindow( elem ) {
	return jQuery.isWindow( elem ) ? elem : elem.nodeType === 9 && elem.defaultView;
}

jQuery.offset = {
	setOffset: function( elem, options, i ) {
		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
			position = jQuery.css( elem, "position" ),
			curElem = jQuery( elem ),
			props = {};

		// Set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		curOffset = curElem.offset();
		curCSSTop = jQuery.css( elem, "top" );
		curCSSLeft = jQuery.css( elem, "left" );
		calculatePosition = ( position === "absolute" || position === "fixed" ) &&
			( curCSSTop + curCSSLeft ).indexOf("auto") > -1;

		// Need to be able to calculate position if either
		// top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;

		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( jQuery.isFunction( options ) ) {
			options = options.call( elem, i, curOffset );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );

		} else {
			curElem.css( props );
		}
	}
};

jQuery.fn.extend({
	offset: function( options ) {
		if ( arguments.length ) {
			return options === undefined ?
				this :
				this.each(function( i ) {
					jQuery.offset.setOffset( this, options, i );
				});
		}

		var docElem, win,
			elem = this[ 0 ],
			box = { top: 0, left: 0 },
			doc = elem && elem.ownerDocument;

		if ( !doc ) {
			return;
		}

		docElem = doc.documentElement;

		// Make sure it's not a disconnected DOM node
		if ( !jQuery.contains( docElem, elem ) ) {
			return box;
		}

		// Support: BlackBerry 5, iOS 3 (original iPhone)
		// If we don't have gBCR, just use 0,0 rather than error
		if ( typeof elem.getBoundingClientRect !== strundefined ) {
			box = elem.getBoundingClientRect();
		}
		win = getWindow( doc );
		return {
			top: box.top + win.pageYOffset - docElem.clientTop,
			left: box.left + win.pageXOffset - docElem.clientLeft
		};
	},

	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset,
			elem = this[ 0 ],
			parentOffset = { top: 0, left: 0 };

		// Fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is its only offset parent
		if ( jQuery.css( elem, "position" ) === "fixed" ) {
			// Assume getBoundingClientRect is there when computed position is fixed
			offset = elem.getBoundingClientRect();

		} else {
			// Get *real* offsetParent
			offsetParent = this.offsetParent();

			// Get correct offsets
			offset = this.offset();
			if ( !jQuery.nodeName( offsetParent[ 0 ], "html" ) ) {
				parentOffset = offsetParent.offset();
			}

			// Add offsetParent borders
			parentOffset.top += jQuery.css( offsetParent[ 0 ], "borderTopWidth", true );
			parentOffset.left += jQuery.css( offsetParent[ 0 ], "borderLeftWidth", true );
		}

		// Subtract parent offsets and element margins
		return {
			top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
		};
	},

	offsetParent: function() {
		return this.map(function() {
			var offsetParent = this.offsetParent || docElem;

			while ( offsetParent && ( !jQuery.nodeName( offsetParent, "html" ) && jQuery.css( offsetParent, "position" ) === "static" ) ) {
				offsetParent = offsetParent.offsetParent;
			}

			return offsetParent || docElem;
		});
	}
});

// Create scrollLeft and scrollTop methods
jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function( method, prop ) {
	var top = "pageYOffset" === prop;

	jQuery.fn[ method ] = function( val ) {
		return access( this, function( elem, method, val ) {
			var win = getWindow( elem );

			if ( val === undefined ) {
				return win ? win[ prop ] : elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : window.pageXOffset,
					top ? val : window.pageYOffset
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length, null );
	};
});

// Support: Safari<7+, Chrome<37+
// Add the top/left cssHooks using jQuery.fn.position
// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
// Blink bug: https://code.google.com/p/chromium/issues/detail?id=229280
// getComputedStyle returns percent when specified for top/left/bottom/right;
// rather than make the css module depend on the offset module, just check for it here
jQuery.each( [ "top", "left" ], function( i, prop ) {
	jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
		function( elem, computed ) {
			if ( computed ) {
				computed = curCSS( elem, prop );
				// If curCSS returns percentage, fallback to offset
				return rnumnonpx.test( computed ) ?
					jQuery( elem ).position()[ prop ] + "px" :
					computed;
			}
		}
	);
});


// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name }, function( defaultExtra, funcName ) {
		// Margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return access( this, function( elem, type, value ) {
				var doc;

				if ( jQuery.isWindow( elem ) ) {
					// As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
					// isn't a whole lot we can do. See pull request at this URL for discussion:
					// https://github.com/jquery/jquery/pull/764
					return elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
					// whichever is greatest
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?
					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable, null );
		};
	});
});


// The number of elements contained in the matched element set
jQuery.fn.size = function() {
	return this.length;
};

jQuery.fn.andSelf = jQuery.fn.addBack;




// Register as a named AMD module, since jQuery can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase jquery is used because AMD module names are
// derived from file names, and jQuery is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of jQuery, it will work.

// Note that for maximum portability, libraries that are not jQuery should
// declare themselves as anonymous modules, and avoid setting a global if an
// AMD loader is present. jQuery is a special case. For more information, see
// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon

if ( typeof define === "function" && define.amd ) {
	define( "jquery", [], function() {
		return jQuery;
	});
}




var
	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$;

jQuery.noConflict = function( deep ) {
	if ( window.$ === jQuery ) {
		window.$ = _$;
	}

	if ( deep && window.jQuery === jQuery ) {
		window.jQuery = _jQuery;
	}

	return jQuery;
};

// Expose jQuery and $ identifiers, even in AMD
// (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
// and CommonJS for browser emulators (#13566)
if ( typeof noGlobal === strundefined ) {
	window.jQuery = window.$ = jQuery;
}




return jQuery;

}));

},{}],26:[function(require,module,exports){
(function (global){
/**
 * marked - a markdown parser
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

;(function() {

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
  nptable: noop,
  lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
  blockquote: /^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,
  list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: /^ *(?:comment *(?:\n|\s*$)|closed *(?:\n{2,}|\s*$)|closing *(?:\n{2,}|\s*$))/,
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  table: noop,
  paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
  text: /^[^\n]+/
};

block.bullet = /(?:[*+-]|\d+\.)/;
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
block.item = replace(block.item, 'gm')
  (/bull/g, block.bullet)
  ();

block.list = replace(block.list)
  (/bull/g, block.bullet)
  ('hr', '\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))')
  ('def', '\\n+(?=' + block.def.source + ')')
  ();

block.blockquote = replace(block.blockquote)
  ('def', block.def)
  ();

block._tag = '(?!(?:'
  + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
  + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
  + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b';

block.html = replace(block.html)
  ('comment', /<!--[\s\S]*?-->/)
  ('closed', /<(tag)[\s\S]+?<\/\1>/)
  ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
  (/tag/g, block._tag)
  ();

block.paragraph = replace(block.paragraph)
  ('hr', block.hr)
  ('heading', block.heading)
  ('lheading', block.lheading)
  ('blockquote', block.blockquote)
  ('tag', '<' + block._tag)
  ('def', block.def)
  ();

/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/,
  paragraph: /^/,
  heading: /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/
});

block.gfm.paragraph = replace(block.paragraph)
  ('(?!', '(?!'
    + block.gfm.fences.source.replace('\\1', '\\2') + '|'
    + block.list.source.replace('\\1', '\\3') + '|')
  ();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
  table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
});

/**
 * Block Lexer
 */

function Lexer(options) {
  this.tokens = [];
  this.tokens.links = {};
  this.options = options || marked.defaults;
  this.rules = block.normal;

  if (this.options.gfm) {
    if (this.options.tables) {
      this.rules = block.tables;
    } else {
      this.rules = block.gfm;
    }
  }
}

/**
 * Expose Block Rules
 */

Lexer.rules = block;

/**
 * Static Lex Method
 */

Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

/**
 * Preprocessing
 */

Lexer.prototype.lex = function(src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  return this.token(src, true);
};

/**
 * Lexing
 */

Lexer.prototype.token = function(src, top, bq) {
  var src = src.replace(/^ +$/gm, '')
    , next
    , loose
    , cap
    , bull
    , b
    , item
    , space
    , i
    , l;

  while (src) {
    // newline
    if (cap = this.rules.newline.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      cap = cap[0].replace(/^ {4}/gm, '');
      this.tokens.push({
        type: 'code',
        text: !this.options.pedantic
          ? cap.replace(/\n+$/, '')
          : cap
      });
      continue;
    }

    // fences (gfm)
    if (cap = this.rules.fences.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'code',
        lang: cap[2],
        text: cap[3] || ''
      });
      continue;
    }

    // heading
    if (cap = this.rules.heading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // table no leading pipe (gfm)
    if (top && (cap = this.rules.nptable.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i].split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // lheading
    if (cap = this.rules.lheading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[2] === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // hr
    if (cap = this.rules.hr.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (cap = this.rules.blockquote.exec(src)) {
      src = src.substring(cap[0].length);

      this.tokens.push({
        type: 'blockquote_start'
      });

      cap = cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(cap, top, true);

      this.tokens.push({
        type: 'blockquote_end'
      });

      continue;
    }

    // list
    if (cap = this.rules.list.exec(src)) {
      src = src.substring(cap[0].length);
      bull = cap[2];

      this.tokens.push({
        type: 'list_start',
        ordered: bull.length > 1
      });

      // Get each top-level item.
      cap = cap[0].match(this.rules.item);

      next = false;
      l = cap.length;
      i = 0;

      for (; i < l; i++) {
        item = cap[i];

        // Remove the list item's bullet
        // so it is seen as the next token.
        space = item.length;
        item = item.replace(/^ *([*+-]|\d+\.) +/, '');

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !this.options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether the next list item belongs here.
        // Backpedal if it does not belong in this list.
        if (this.options.smartLists && i !== l - 1) {
          b = block.bullet.exec(cap[i + 1])[0];
          if (bull !== b && !(bull.length > 1 && b.length > 1)) {
            src = cap.slice(i + 1).join('\n') + src;
            i = l - 1;
          }
        }

        // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        loose = next || /\n\n(?!\s*$)/.test(item);
        if (i !== l - 1) {
          next = item.charAt(item.length - 1) === '\n';
          if (!loose) loose = next;
        }

        this.tokens.push({
          type: loose
            ? 'loose_item_start'
            : 'list_item_start'
        });

        // Recurse.
        this.token(item, false, bq);

        this.tokens.push({
          type: 'list_item_end'
        });
      }

      this.tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (cap = this.rules.html.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: !this.options.sanitizer
          && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
        text: cap[0]
      });
      continue;
    }

    // def
    if ((!bq && top) && (cap = this.rules.def.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.links[cap[1].toLowerCase()] = {
        href: cap[2],
        title: cap[3]
      };
      continue;
    }

    // table (gfm)
    if (top && (cap = this.rules.table.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i]
          .replace(/^ *\| *| *\| *$/g, '')
          .split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // top-level paragraph
    if (top && (cap = this.rules.paragraph.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'paragraph',
        text: cap[1].charAt(cap[1].length - 1) === '\n'
          ? cap[1].slice(0, -1)
          : cap[1]
      });
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return this.tokens;
};

/**
 * Inline-Level Grammar
 */

var inline = {
  escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
  autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
  url: noop,
  tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
  link: /^!?\[(inside)\]\(href\)/,
  reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
  strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
  em: /^\b_((?:[^_]|__)+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
  code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
  br: /^ {2,}\n(?!\s*$)/,
  del: noop,
  text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
};

inline._inside = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;
inline._href = /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

inline.link = replace(inline.link)
  ('inside', inline._inside)
  ('href', inline._href)
  ();

inline.reflink = replace(inline.reflink)
  ('inside', inline._inside)
  ();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
  escape: replace(inline.escape)('])', '~|])')(),
  url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
  del: /^~~(?=\S)([\s\S]*?\S)~~/,
  text: replace(inline.text)
    (']|', '~]|')
    ('|', '|https?://|')
    ()
});

/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
  br: replace(inline.br)('{2,}', '*')(),
  text: replace(inline.gfm.text)('{2,}', '*')()
});

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, options) {
  this.options = options || marked.defaults;
  this.links = links;
  this.rules = inline.normal;
  this.renderer = this.options.renderer || new Renderer;
  this.renderer.options = this.options;

  if (!this.links) {
    throw new
      Error('Tokens array requires a `links` property.');
  }

  if (this.options.gfm) {
    if (this.options.breaks) {
      this.rules = inline.breaks;
    } else {
      this.rules = inline.gfm;
    }
  } else if (this.options.pedantic) {
    this.rules = inline.pedantic;
  }
}

/**
 * Expose Inline Rules
 */

InlineLexer.rules = inline;

/**
 * Static Lexing/Compiling Method
 */

InlineLexer.output = function(src, links, options) {
  var inline = new InlineLexer(links, options);
  return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.output = function(src) {
  var out = ''
    , link
    , text
    , href
    , cap;

  while (src) {
    // escape
    if (cap = this.rules.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += cap[1];
      continue;
    }

    // autolink
    if (cap = this.rules.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = cap[1].charAt(6) === ':'
          ? this.mangle(cap[1].substring(7))
          : this.mangle(cap[1]);
        href = this.mangle('mailto:') + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }
      out += this.renderer.link(href, null, text);
      continue;
    }

    // url (gfm)
    if (!this.inLink && (cap = this.rules.url.exec(src))) {
      src = src.substring(cap[0].length);
      text = escape(cap[1]);
      href = text;
      out += this.renderer.link(href, null, text);
      continue;
    }

    // tag
    if (cap = this.rules.tag.exec(src)) {
      if (!this.inLink && /^<a /i.test(cap[0])) {
        this.inLink = true;
      } else if (this.inLink && /^<\/a>/i.test(cap[0])) {
        this.inLink = false;
      }
      src = src.substring(cap[0].length);
      out += this.options.sanitize
        ? this.options.sanitizer
          ? this.options.sanitizer(cap[0])
          : escape(cap[0])
        : cap[0]
      continue;
    }

    // link
    if (cap = this.rules.link.exec(src)) {
      src = src.substring(cap[0].length);
      this.inLink = true;
      out += this.outputLink(cap, {
        href: cap[2],
        title: cap[3]
      });
      this.inLink = false;
      continue;
    }

    // reflink, nolink
    if ((cap = this.rules.reflink.exec(src))
        || (cap = this.rules.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = this.links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0].charAt(0);
        src = cap[0].substring(1) + src;
        continue;
      }
      this.inLink = true;
      out += this.outputLink(cap, link);
      this.inLink = false;
      continue;
    }

    // strong
    if (cap = this.rules.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.strong(this.output(cap[2] || cap[1]));
      continue;
    }

    // em
    if (cap = this.rules.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.em(this.output(cap[2] || cap[1]));
      continue;
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.codespan(escape(cap[2], true));
      continue;
    }

    // br
    if (cap = this.rules.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.br();
      continue;
    }

    // del (gfm)
    if (cap = this.rules.del.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.del(this.output(cap[1]));
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.text(escape(this.smartypants(cap[0])));
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return out;
};

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
  var href = escape(link.href)
    , title = link.title ? escape(link.title) : null;

  return cap[0].charAt(0) !== '!'
    ? this.renderer.link(href, title, this.output(cap[1]))
    : this.renderer.image(href, title, escape(cap[1]));
};

/**
 * Smartypants Transformations
 */

InlineLexer.prototype.smartypants = function(text) {
  if (!this.options.smartypants) return text;
  return text
    // em-dashes
    .replace(/---/g, '\u2014')
    // en-dashes
    .replace(/--/g, '\u2013')
    // opening singles
    .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
    // closing singles & apostrophes
    .replace(/'/g, '\u2019')
    // opening doubles
    .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
    // closing doubles
    .replace(/"/g, '\u201d')
    // ellipses
    .replace(/\.{3}/g, '\u2026');
};

/**
 * Mangle Links
 */

InlineLexer.prototype.mangle = function(text) {
  if (!this.options.mangle) return text;
  var out = ''
    , l = text.length
    , i = 0
    , ch;

  for (; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

/**
 * Renderer
 */

function Renderer(options) {
  this.options = options || {};
}

Renderer.prototype.code = function(code, lang, escaped) {
  if (this.options.highlight) {
    var out = this.options.highlight(code, lang);
    if (out != null && out !== code) {
      escaped = true;
      code = out;
    }
  }

  if (!lang) {
    return '<pre><code>'
      + (escaped ? code : escape(code, true))
      + '\n</code></pre>';
  }

  return '<pre><code class="'
    + this.options.langPrefix
    + escape(lang, true)
    + '">'
    + (escaped ? code : escape(code, true))
    + '\n</code></pre>\n';
};

Renderer.prototype.blockquote = function(quote) {
  return '<blockquote>\n' + quote + '</blockquote>\n';
};

Renderer.prototype.html = function(html) {
  return html;
};

Renderer.prototype.heading = function(text, level, raw) {
  return '<h'
    + level
    + ' id="'
    + this.options.headerPrefix
    + raw.toLowerCase().replace(/[^\w]+/g, '-')
    + '">'
    + text
    + '</h'
    + level
    + '>\n';
};

Renderer.prototype.hr = function() {
  return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
};

Renderer.prototype.list = function(body, ordered) {
  var type = ordered ? 'ol' : 'ul';
  return '<' + type + '>\n' + body + '</' + type + '>\n';
};

Renderer.prototype.listitem = function(text) {
  return '<li>' + text + '</li>\n';
};

Renderer.prototype.paragraph = function(text) {
  return '<p>' + text + '</p>\n';
};

Renderer.prototype.table = function(header, body) {
  return '<table>\n'
    + '<thead>\n'
    + header
    + '</thead>\n'
    + '<tbody>\n'
    + body
    + '</tbody>\n'
    + '</table>\n';
};

Renderer.prototype.tablerow = function(content) {
  return '<tr>\n' + content + '</tr>\n';
};

Renderer.prototype.tablecell = function(content, flags) {
  var type = flags.header ? 'th' : 'td';
  var tag = flags.align
    ? '<' + type + ' style="text-align:' + flags.align + '">'
    : '<' + type + '>';
  return tag + content + '</' + type + '>\n';
};

// span level renderer
Renderer.prototype.strong = function(text) {
  return '<strong>' + text + '</strong>';
};

Renderer.prototype.em = function(text) {
  return '<em>' + text + '</em>';
};

Renderer.prototype.codespan = function(text) {
  return '<code>' + text + '</code>';
};

Renderer.prototype.br = function() {
  return this.options.xhtml ? '<br/>' : '<br>';
};

Renderer.prototype.del = function(text) {
  return '<del>' + text + '</del>';
};

Renderer.prototype.link = function(href, title, text) {
  if (this.options.sanitize) {
    try {
      var prot = decodeURIComponent(unescape(href))
        .replace(/[^\w:]/g, '')
        .toLowerCase();
    } catch (e) {
      return '';
    }
    if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0) {
      return '';
    }
  }
  var out = '<a href="' + href + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += '>' + text + '</a>';
  return out;
};

Renderer.prototype.image = function(href, title, text) {
  var out = '<img src="' + href + '" alt="' + text + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += this.options.xhtml ? '/>' : '>';
  return out;
};

Renderer.prototype.text = function(text) {
  return text;
};

/**
 * Parsing & Compiling
 */

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
  this.options.renderer = this.options.renderer || new Renderer;
  this.renderer = this.options.renderer;
  this.renderer.options = this.options;
}

/**
 * Static Parse Method
 */

Parser.parse = function(src, options, renderer) {
  var parser = new Parser(options, renderer);
  return parser.parse(src);
};

/**
 * Parse Loop
 */

Parser.prototype.parse = function(src) {
  this.inline = new InlineLexer(src.links, this.options, this.renderer);
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

/**
 * Next Token
 */

Parser.prototype.next = function() {
  return this.token = this.tokens.pop();
};

/**
 * Preview Next Token
 */

Parser.prototype.peek = function() {
  return this.tokens[this.tokens.length - 1] || 0;
};

/**
 * Parse Text Tokens
 */

Parser.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return this.inline.output(body);
};

/**
 * Parse Current Token
 */

Parser.prototype.tok = function() {
  switch (this.token.type) {
    case 'space': {
      return '';
    }
    case 'hr': {
      return this.renderer.hr();
    }
    case 'heading': {
      return this.renderer.heading(
        this.inline.output(this.token.text),
        this.token.depth,
        this.token.text);
    }
    case 'code': {
      return this.renderer.code(this.token.text,
        this.token.lang,
        this.token.escaped);
    }
    case 'table': {
      var header = ''
        , body = ''
        , i
        , row
        , cell
        , flags
        , j;

      // header
      cell = '';
      for (i = 0; i < this.token.header.length; i++) {
        flags = { header: true, align: this.token.align[i] };
        cell += this.renderer.tablecell(
          this.inline.output(this.token.header[i]),
          { header: true, align: this.token.align[i] }
        );
      }
      header += this.renderer.tablerow(cell);

      for (i = 0; i < this.token.cells.length; i++) {
        row = this.token.cells[i];

        cell = '';
        for (j = 0; j < row.length; j++) {
          cell += this.renderer.tablecell(
            this.inline.output(row[j]),
            { header: false, align: this.token.align[j] }
          );
        }

        body += this.renderer.tablerow(cell);
      }
      return this.renderer.table(header, body);
    }
    case 'blockquote_start': {
      var body = '';

      while (this.next().type !== 'blockquote_end') {
        body += this.tok();
      }

      return this.renderer.blockquote(body);
    }
    case 'list_start': {
      var body = ''
        , ordered = this.token.ordered;

      while (this.next().type !== 'list_end') {
        body += this.tok();
      }

      return this.renderer.list(body, ordered);
    }
    case 'list_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.token.type === 'text'
          ? this.parseText()
          : this.tok();
      }

      return this.renderer.listitem(body);
    }
    case 'loose_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.tok();
      }

      return this.renderer.listitem(body);
    }
    case 'html': {
      var html = !this.token.pre && !this.options.pedantic
        ? this.inline.output(this.token.text)
        : this.token.text;
      return this.renderer.html(html);
    }
    case 'paragraph': {
      return this.renderer.paragraph(this.inline.output(this.token.text));
    }
    case 'text': {
      return this.renderer.paragraph(this.parseText());
    }
  }
};

/**
 * Helpers
 */

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function unescape(html) {
  return html.replace(/&([#\w]+);/g, function(_, n) {
    n = n.toLowerCase();
    if (n === 'colon') return ':';
    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x'
        ? String.fromCharCode(parseInt(n.substring(2), 16))
        : String.fromCharCode(+n.substring(1));
    }
    return '';
  });
}

function replace(regex, opt) {
  regex = regex.source;
  opt = opt || '';
  return function self(name, val) {
    if (!name) return new RegExp(regex, opt);
    val = val.source || val;
    val = val.replace(/(^|[^\[])\^/g, '$1');
    regex = regex.replace(name, val);
    return self;
  };
}

function noop() {}
noop.exec = noop;

function merge(obj) {
  var i = 1
    , target
    , key;

  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}


/**
 * Marked
 */

function marked(src, opt, callback) {
  if (callback || typeof opt === 'function') {
    if (!callback) {
      callback = opt;
      opt = null;
    }

    opt = merge({}, marked.defaults, opt || {});

    var highlight = opt.highlight
      , tokens
      , pending
      , i = 0;

    try {
      tokens = Lexer.lex(src, opt)
    } catch (e) {
      return callback(e);
    }

    pending = tokens.length;

    var done = function(err) {
      if (err) {
        opt.highlight = highlight;
        return callback(err);
      }

      var out;

      try {
        out = Parser.parse(tokens, opt);
      } catch (e) {
        err = e;
      }

      opt.highlight = highlight;

      return err
        ? callback(err)
        : callback(null, out);
    };

    if (!highlight || highlight.length < 3) {
      return done();
    }

    delete opt.highlight;

    if (!pending) return done();

    for (; i < tokens.length; i++) {
      (function(token) {
        if (token.type !== 'code') {
          return --pending || done();
        }
        return highlight(token.text, token.lang, function(err, code) {
          if (err) return done(err);
          if (code == null || code === token.text) {
            return --pending || done();
          }
          token.text = code;
          token.escaped = true;
          --pending || done();
        });
      })(tokens[i]);
    }

    return;
  }
  try {
    if (opt) opt = merge({}, marked.defaults, opt);
    return Parser.parse(Lexer.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/chjj/marked.';
    if ((opt || marked.defaults).silent) {
      return '<p>An error occured:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  return marked;
};

marked.defaults = {
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  sanitizer: null,
  mangle: true,
  smartLists: false,
  silent: false,
  highlight: null,
  langPrefix: 'lang-',
  smartypants: false,
  headerPrefix: '',
  renderer: new Renderer,
  xhtml: false
};

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Renderer = Renderer;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.parse = marked;

if (typeof module !== 'undefined' && typeof exports === 'object') {
  module.exports = marked;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return marked; });
} else {
  this.marked = marked;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],27:[function(require,module,exports){
(function (global){
// This file is generated by `make build`. 
// Do NOT edit by hand. 
// 
// Make function changes in ./functions and 
// generator changes in ./lib/phpjsutil.js 
exports.XMLHttpRequest = {};
exports.window = {window: {},document: {lastModified: 1388954399,getElementsByTagName: function(){return [];}},location: {href: ""}};
exports.window.window = exports.window;

exports.array = function () {
  try {
      this.php_js = this.php_js || {};
    } catch (e) {
      this.php_js = {};
    }
  
    var arrInst, e, __, that = this,
      PHPJS_Array = function PHPJS_Array() {};
    mainArgs = arguments, p = this.php_js,
    _indexOf = function(value, from, strict) {
      var i = from || 0,
        nonstrict = !strict,
        length = this.length;
      while (i < length) {
        if (this[i] === value || (nonstrict && this[i] == value)) {
          return i;
        }
        i++;
      }
      return -1;
    };
    // BEGIN REDUNDANT
    if (!p.Relator) {
      p.Relator = (function() { // Used this functional class for giving privacy to the class we are creating
        // Code adapted from http://www.devpro.it/code/192.html
        // Relator explained at http://webreflection.blogspot.com/2008/07/javascript-relator-object-aka.html
        // Its use as privacy technique described at http://webreflection.blogspot.com/2008/10/new-relator-object-plus-unshared.html
        // 1) At top of closure, put: var __ = Relator.$();
        // 2) In constructor, put: var _ = __.constructor(this);
        // 3) At top of each prototype method, put: var _ = __.method(this);
        // 4) Use like:  _.privateVar = 5;
        function _indexOf(value) {
          var i = 0,
            length = this.length;
          while (i < length) {
            if (this[i] === value) {
              return i;
            }
            i++;
          }
          return -1;
        }
  
        function Relator() {
          var Stack = [],
            Array = [];
          if (!Stack.indexOf) {
            Stack.indexOf = _indexOf;
          }
          return {
            // create a new relator
            $: function() {
              return Relator();
            },
            constructor: function(that) {
              var i = Stack.indexOf(that);~
              i ? Array[i] : Array[Stack.push(that) - 1] = {};
              this.method(that)
                .that = that;
              return this.method(that);
            },
            method: function(that) {
              return Array[Stack.indexOf(that)];
            }
          };
        }
        return Relator();
      }());
    }
    // END REDUNDANT
  
    if (p && p.ini && p.ini['phpjs.return_phpjs_arrays'].local_value.toLowerCase() === 'on') {
      if (!p.PHPJS_Array) {
        // We keep this Relator outside the class in case adding prototype methods below
        // Prototype methods added elsewhere can also use this ArrayRelator to share these "pseudo-global mostly-private" variables
        __ = p.ArrayRelator = p.ArrayRelator || p.Relator.$();
        // We could instead allow arguments of {key:XX, value:YY} but even more cumbersome to write
        p.PHPJS_Array = function PHPJS_Array() {
          var _ = __.constructor(this),
            args = arguments,
            i = 0,
            argl, p;
          args = (args.length === 1 && args[0] && typeof args[0] === 'object' &&
            args[0].length && !args[0].propertyIsEnumerable('length')) ? args[0] : args; // If first and only arg is an array, use that (Don't depend on this)
          if (!_.objectChain) {
            _.objectChain = args;
            _.object = {};
            _.keys = [];
            _.values = [];
          }
          for (argl = args.length; i < argl; i++) {
            for (p in args[i]) {
              // Allow for access by key; use of private members to store sequence allows these to be iterated via for...in (but for read-only use, with hasOwnProperty or function filtering to avoid prototype methods, and per ES, potentially out of order)
              this[p] = _.object[p] = args[i][p];
              // Allow for easier access by prototype methods
              _.keys[_.keys.length] = p;
              _.values[_.values.length] = args[i][p];
              break;
            }
          }
        };
        e = p.PHPJS_Array.prototype;
        e.change_key_case = function(cs) {
          var _ = __.method(this),
            oldkey, newkey, i = 0,
            kl = _.keys.length,
            case_fn = (!cs || cs === 'CASE_LOWER') ? 'toLowerCase' : 'toUpperCase';
          while (i < kl) {
            oldkey = _.keys[i];
            newkey = _.keys[i] = _.keys[i][case_fn]();
            if (oldkey !== newkey) {
              this[oldkey] = _.object[oldkey] = _.objectChain[i][oldkey] = null; // Break reference before deleting
              delete this[oldkey];
              delete _.object[oldkey];
              delete _.objectChain[i][oldkey];
              this[newkey] = _.object[newkey] = _.objectChain[i][newkey] = _.values[i]; // Fix: should we make a deep copy?
            }
            i++;
          }
          return this;
        };
        e.flip = function() {
          var _ = __.method(this),
            i = 0,
            kl = _.keys.length;
          while (i < kl) {
            oldkey = _.keys[i];
            newkey = _.values[i];
            if (oldkey !== newkey) {
              this[oldkey] = _.object[oldkey] = _.objectChain[i][oldkey] = null; // Break reference before deleting
              delete this[oldkey];
              delete _.object[oldkey];
              delete _.objectChain[i][oldkey];
              this[newkey] = _.object[newkey] = _.objectChain[i][newkey] = oldkey;
              _.keys[i] = newkey;
            }
            i++;
          }
          return this;
        };
        e.walk = function(funcname, userdata) {
          var _ = __.method(this),
            obj, func, ini, i = 0,
            kl = 0;
  
          try {
            if (typeof funcname === 'function') {
              for (i = 0, kl = _.keys.length; i < kl; i++) {
                if (arguments.length > 1) {
                  funcname(_.values[i], _.keys[i], userdata);
                } else {
                  funcname(_.values[i], _.keys[i]);
                }
              }
            } else if (typeof funcname === 'string') {
              this.php_js = this.php_js || {};
              this.php_js.ini = this.php_js.ini || {};
              ini = this.php_js.ini['phpjs.no-eval'];
              if (ini && (
                parseInt(ini.local_value, 10) !== 0 && (!ini.local_value.toLowerCase || ini.local_value
                  .toLowerCase() !== 'off')
              )) {
                if (arguments.length > 1) {
                  for (i = 0, kl = _.keys.length; i < kl; i++) {
                    this.window[funcname](_.values[i], _.keys[i], userdata);
                  }
                } else {
                  for (i = 0, kl = _.keys.length; i < kl; i++) {
                    this.window[funcname](_.values[i], _.keys[i]);
                  }
                }
              } else {
                if (arguments.length > 1) {
                  for (i = 0, kl = _.keys.length; i < kl; i++) {
                    eval(funcname + '(_.values[i], _.keys[i], userdata)');
                  }
                } else {
                  for (i = 0, kl = _.keys.length; i < kl; i++) {
                    eval(funcname + '(_.values[i], _.keys[i])');
                  }
                }
              }
            } else if (funcname && typeof funcname === 'object' && funcname.length === 2) {
              obj = funcname[0];
              func = funcname[1];
              if (arguments.length > 1) {
                for (i = 0, kl = _.keys.length; i < kl; i++) {
                  obj[func](_.values[i], _.keys[i], userdata);
                }
              } else {
                for (i = 0, kl = _.keys.length; i < kl; i++) {
                  obj[func](_.values[i], _.keys[i]);
                }
              }
            } else {
              return false;
            }
          } catch (e) {
            return false;
          }
  
          return this;
        };
        // Here we'll return actual arrays since most logical and practical for these functions to do this
        e.keys = function(search_value, argStrict) {
          var _ = __.method(this),
            pos,
            search = typeof search_value !== 'undefined',
            tmp_arr = [],
            strict = !! argStrict;
          if (!search) {
            return _.keys;
          }
          while ((pos = _indexOf(_.values, pos, strict)) !== -1) {
            tmp_arr[tmp_arr.length] = _.keys[pos];
          }
          return tmp_arr;
        };
        e.values = function() {
          var _ = __.method(this);
          return _.values;
        };
        // Return non-object, non-array values, since most sensible
        e.search = function(needle, argStrict) {
          var _ = __.method(this),
            strict = !! argStrict,
            haystack = _.values,
            i, vl, val, flags;
          if (typeof needle === 'object' && needle.exec) { // Duck-type for RegExp
            if (!strict) { // Let's consider case sensitive searches as strict
              flags = 'i' + (needle.global ? 'g' : '') +
                (needle.multiline ? 'm' : '') +
                (needle.sticky ? 'y' : ''); // sticky is FF only
              needle = new RegExp(needle.source, flags);
            }
            for (i = 0, vl = haystack.length; i < vl; i++) {
              val = haystack[i];
              if (needle.test(val)) {
                return _.keys[i];
              }
            }
            return false;
          }
          for (i = 0, vl = haystack.length; i < vl; i++) {
            val = haystack[i];
            if ((strict && val === needle) || (!strict && val == needle)) {
              return _.keys[i];
            }
          }
          return false;
        };
        e.sum = function() {
          var _ = __.method(this),
            sum = 0,
            i = 0,
            kl = _.keys.length;
          while (i < kl) {
            if (!isNaN(parseFloat(_.values[i]))) {
              sum += parseFloat(_.values[i]);
            }
            i++;
          }
          return sum;
        };
        // Experimental functions
        e.foreach = function(handler) {
          var _ = __.method(this),
            i = 0,
            kl = _.keys.length;
          while (i < kl) {
            if (handler.length === 1) {
              handler(_.values[i]); // only pass the value
            } else {
              handler(_.keys[i], _.values[i]);
            }
            i++;
          }
          return this;
        };
        e.list = function() {
          var key, _ = __.method(this),
            i = 0,
            argl = arguments.length;
          while (i < argl) {
            key = _.keys[i];
            if (key && key.length === parseInt(key, 10)
              .toString()
              .length && // Key represents an int
              parseInt(key, 10) < argl) { // Key does not exceed arguments
              that.window[arguments[key]] = _.values[key];
            }
            i++;
          }
          return this;
        };
        // Parallel functionality and naming of built-in JavaScript array methods
        e.forEach = function(handler) {
          var _ = __.method(this),
            i = 0,
            kl = _.keys.length;
          while (i < kl) {
            handler(_.values[i], _.keys[i], this);
            i++;
          }
          return this;
        };
        // Our own custom convenience functions
        e.$object = function() {
          var _ = __.method(this);
          return _.object;
        };
        e.$objectChain = function() {
          var _ = __.method(this);
          return _.objectChain;
        };
      }
      PHPJS_Array.prototype = p.PHPJS_Array.prototype;
      arrInst = new PHPJS_Array();
      p.PHPJS_Array.apply(arrInst, mainArgs);
      return arrInst;
    }
    return Array.prototype.slice.call(mainArgs);
};

exports.array_change_key_case = function (array, cs) {
  var case_fn, key, tmp_ar = {};
  
    if (Object.prototype.toString.call(array) === '[object Array]') {
      return array;
    }
    if (array && typeof array === 'object' && array.change_key_case) { // Duck-type check for our own array()-created PHPJS_Array
      return array.change_key_case(cs);
    }
    if (array && typeof array === 'object') {
      case_fn = (!cs || cs === 'CASE_LOWER') ? 'toLowerCase' : 'toUpperCase';
      for (key in array) {
        tmp_ar[key[case_fn]()] = array[key];
      }
      return tmp_ar;
    }
  
    return false;
};

exports.array_chunk = function (input, size, preserve_keys) {
  var x, p = '',
      i = 0,
      c = -1,
      l = input.length || 0,
      n = [];
  
    if (size < 1) {
      return null;
    }
  
    if (Object.prototype.toString.call(input) === '[object Array]') {
      if (preserve_keys) {
        while (i < l) {
          (x = i % size) ? n[c][i] = input[i] : n[++c] = {}, n[c][i] = input[i];
          i++;
        }
      } else {
        while (i < l) {
          (x = i % size) ? n[c][x] = input[i] : n[++c] = [input[i]];
          i++;
        }
      }
    } else {
      if (preserve_keys) {
        for (p in input) {
          if (input.hasOwnProperty(p)) {
            (x = i % size) ? n[c][p] = input[p] : n[++c] = {}, n[c][p] = input[p];
            i++;
          }
        }
      } else {
        for (p in input) {
          if (input.hasOwnProperty(p)) {
            (x = i % size) ? n[c][x] = input[p] : n[++c] = [input[p]];
            i++;
          }
        }
      }
    }
    return n;
};

exports.array_combine = function (keys, values) {
  var new_array = {},
      keycount = keys && keys.length,
      i = 0;
  
    // input sanitation
    if (typeof keys !== 'object' || typeof values !== 'object' || // Only accept arrays or array-like objects
      typeof keycount !== 'number' || typeof values.length !== 'number' || !keycount) { // Require arrays to have a count
      return false;
    }
  
    // number of elements does not match
    if (keycount != values.length) {
      return false;
    }
  
    for (i = 0; i < keycount; i++) {
      new_array[keys[i]] = values[i];
    }
  
    return new_array;
};

exports.array_count_values = function (array) {
  var tmp_arr = {},
      key = '',
      t = '';
  
    var __getType = function(obj) {
      // Objects are php associative arrays.
      var t = typeof obj;
      t = t.toLowerCase();
      if (t === 'object') {
        t = 'array';
      }
      return t;
    };
  
    var __countValue = function(value) {
      switch (typeof value) {
        case 'number':
          if (Math.floor(value) !== value) {
            return;
          }
          // Fall-through
        case 'string':
          if (value in this && this.hasOwnProperty(value)) {
            ++this[value];
          } else {
            this[value] = 1;
          }
      }
    };
  
    t = __getType(array);
    if (t === 'array') {
      for (key in array) {
        if (array.hasOwnProperty(key)) {
          __countValue.call(tmp_arr, array[key]);
        }
      }
    }
  
    return tmp_arr;
};

exports.array_diff = function (arr1) {
  var retArr = {},
      argl = arguments.length,
      k1 = '',
      i = 1,
      k = '',
      arr = {};
  
    arr1keys: for (k1 in arr1) {
      for (i = 1; i < argl; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (arr[k] === arr1[k1]) {
            // If it reaches here, it was found in at least one array, so try next value
            continue arr1keys;
          }
        }
        retArr[k1] = arr1[k1];
      }
    }
  
    return retArr;
};

exports.array_diff_assoc = function (arr1) {
  var retArr = {},
      argl = arguments.length,
      k1 = '',
      i = 1,
      k = '',
      arr = {};
  
    arr1keys: for (k1 in arr1) {
      for (i = 1; i < argl; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (arr[k] === arr1[k1] && k === k1) {
            // If it reaches here, it was found in at least one array, so try next value
            continue arr1keys;
          }
        }
        retArr[k1] = arr1[k1];
      }
    }
  
    return retArr;
};

exports.array_diff_key = function (arr1) {
  var argl = arguments.length,
      retArr = {},
      k1 = '',
      i = 1,
      k = '',
      arr = {};
  
    arr1keys: for (k1 in arr1) {
      for (i = 1; i < argl; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (k === k1) {
            // If it reaches here, it was found in at least one array, so try next value
            continue arr1keys;
          }
        }
        retArr[k1] = arr1[k1];
      }
    }
  
    return retArr;
};

exports.array_diff_uassoc = function (arr1) {
  var retArr = {},
      arglm1 = arguments.length - 1,
      cb = arguments[arglm1],
      arr = {},
      i = 1,
      k1 = '',
      k = '';
    cb = (typeof cb === 'string') ? this.window[cb] : (Object.prototype.toString.call(cb) === '[object Array]') ? this.window[
      cb[0]][cb[1]] : cb;
  
    arr1keys: for (k1 in arr1) {
      for (i = 1; i < arglm1; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (arr[k] === arr1[k1] && cb(k, k1) === 0) {
            // If it reaches here, it was found in at least one array, so try next value
            continue arr1keys;
          }
        }
        retArr[k1] = arr1[k1];
      }
    }
  
    return retArr;
};

exports.array_diff_ukey = function (arr1) {
  var retArr = {},
      arglm1 = arguments.length - 1,
      cb = arguments[arglm1],
      arr = {},
      i = 1,
      k1 = '',
      k = '';
  
    cb = (typeof cb === 'string') ? this.window[cb] : (Object.prototype.toString.call(cb) === '[object Array]') ? this.window[
      cb[0]][cb[1]] : cb;
  
    arr1keys: for (k1 in arr1) {
      for (i = 1; i < arglm1; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (cb(k, k1) === 0) {
            // If it reaches here, it was found in at least one array, so try next value
            continue arr1keys;
          }
        }
        retArr[k1] = arr1[k1];
      }
    }
  
    return retArr;
};

exports.array_fill = function (start_index, num, mixed_val) {
  var key, tmp_arr = {};
  
    if (!isNaN(start_index) && !isNaN(num)) {
      for (key = 0; key < num; key++) {
        tmp_arr[(key + start_index)] = mixed_val;
      }
    }
  
    return tmp_arr;
};

exports.array_fill_keys = function (keys, value) {
  var retObj = {},
      key = '';
  
    for (key in keys) {
      retObj[keys[key]] = value;
    }
  
    return retObj;
};

exports.array_filter = function (arr, func) {
  var retObj = {},
      k;
  
    func = func || function(v) {
      return v;
    };
  
    // Fix: Issue #73
    if (Object.prototype.toString.call(arr) === '[object Array]') {
      retObj = [];
    }
  
    for (k in arr) {
      if (func(arr[k])) {
        retObj[k] = arr[k];
      }
    }
  
    return retObj;
};

exports.array_intersect = function (arr1) {
  var retArr = {},
      argl = arguments.length,
      arglm1 = argl - 1,
      k1 = '',
      arr = {},
      i = 0,
      k = '';
  
    arr1keys: for (k1 in arr1) {
      arrs: for (i = 1; i < argl; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (arr[k] === arr1[k1]) {
            if (i === arglm1) {
              retArr[k1] = arr1[k1];
            }
            // If the innermost loop always leads at least once to an equal value, continue the loop until done
            continue arrs;
          }
        }
        // If it reaches here, it wasn't found in at least one array, so try next value
        continue arr1keys;
      }
    }
  
    return retArr;
};

exports.array_intersect_assoc = function (arr1) {
  var retArr = {},
      argl = arguments.length,
      arglm1 = argl - 1,
      k1 = '',
      arr = {},
      i = 0,
      k = '';
  
    arr1keys: for (k1 in arr1) {
      arrs: for (i = 1; i < argl; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (arr[k] === arr1[k1] && k === k1) {
            if (i === arglm1) {
              retArr[k1] = arr1[k1];
            }
            // If the innermost loop always leads at least once to an equal value, continue the loop until done
            continue arrs;
          }
        }
        // If it reaches here, it wasn't found in at least one array, so try next value
        continue arr1keys;
      }
    }
  
    return retArr;
};

exports.array_intersect_key = function (arr1) {
  var retArr = {},
      argl = arguments.length,
      arglm1 = argl - 1,
      k1 = '',
      arr = {},
      i = 0,
      k = '';
  
    arr1keys: for (k1 in arr1) {
      arrs: for (i = 1; i < argl; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (k === k1) {
            if (i === arglm1) {
              retArr[k1] = arr1[k1];
            }
            // If the innermost loop always leads at least once to an equal value, continue the loop until done
            continue arrs;
          }
        }
        // If it reaches here, it wasn't found in at least one array, so try next value
        continue arr1keys;
      }
    }
  
    return retArr;
};

exports.array_intersect_uassoc = function (arr1) {
  var retArr = {},
      arglm1 = arguments.length - 1,
      arglm2 = arglm1 - 1,
      cb = arguments[arglm1],
      k1 = '',
      i = 1,
      arr = {},
      k = '';
  
    cb = (typeof cb === 'string') ? this.window[cb] : (Object.prototype.toString.call(cb) === '[object Array]') ? this.window[
      cb[0]][cb[1]] : cb;
  
    arr1keys: for (k1 in arr1) {
      arrs: for (i = 1; i < arglm1; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (arr[k] === arr1[k1] && cb(k, k1) === 0) {
            if (i === arglm2) {
              retArr[k1] = arr1[k1];
            }
            // If the innermost loop always leads at least once to an equal value, continue the loop until done
            continue arrs;
          }
        }
        // If it reaches here, it wasn't found in at least one array, so try next value
        continue arr1keys;
      }
    }
  
    return retArr;
};

exports.array_intersect_ukey = function (arr1) {
  var retArr = {},
      arglm1 = arguments.length - 1,
      arglm2 = arglm1 - 1,
      cb = arguments[arglm1],
      k1 = '',
      i = 1,
      arr = {},
      k = '';
  
    cb = (typeof cb === 'string') ? this.window[cb] : (Object.prototype.toString.call(cb) === '[object Array]') ? this.window[
      cb[0]][cb[1]] : cb;
  
    arr1keys: for (k1 in arr1) {
      arrs: for (i = 1; i < arglm1; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (cb(k, k1) === 0) {
            if (i === arglm2) {
              retArr[k1] = arr1[k1];
            }
            // If the innermost loop always leads at least once to an equal value, continue the loop until done
            continue arrs;
          }
        }
        // If it reaches here, it wasn't found in at least one array, so try next value
        continue arr1keys;
      }
    }
  
    return retArr;
};

exports.array_key_exists = function (key, search) {
  if (!search || (search.constructor !== Array && search.constructor !== Object)) {
      return false;
    }
  
    return key in search;
};

exports.array_keys = function (input, search_value, argStrict) {
  var search = typeof search_value !== 'undefined',
      tmp_arr = [],
      strict = !! argStrict,
      include = true,
      key = '';
  
    if (input && typeof input === 'object' && input.change_key_case) { // Duck-type check for our own array()-created PHPJS_Array
      return input.keys(search_value, argStrict);
    }
  
    for (key in input) {
      if (input.hasOwnProperty(key)) {
        include = true;
        if (search) {
          if (strict && input[key] !== search_value) {
            include = false;
          } else if (input[key] != search_value) {
            include = false;
          }
        }
  
        if (include) {
          tmp_arr[tmp_arr.length] = key;
        }
      }
    }
  
    return tmp_arr;
};

exports.array_map = function (callback) {
  var argc = arguments.length,
      argv = arguments,
      glbl = this.window,
      obj = null,
      cb = callback,
      j = argv[1].length,
      i = 0,
      k = 1,
      m = 0,
      tmp = [],
      tmp_ar = [];
  
    while (i < j) {
      while (k < argc) {
        tmp[m++] = argv[k++][i];
      }
  
      m = 0;
      k = 1;
  
      if (callback) {
        if (typeof callback === 'string') {
          cb = glbl[callback];
        } else if (typeof callback === 'object' && callback.length) {
          obj = typeof callback[0] === 'string' ? glbl[callback[0]] : callback[0];
          if (typeof obj === 'undefined') {
            throw 'Object not found: ' + callback[0];
          }
          cb = typeof callback[1] === 'string' ? obj[callback[1]] : callback[1];
        }
        tmp_ar[i++] = cb.apply(obj, tmp);
      } else {
        tmp_ar[i++] = tmp;
      }
  
      tmp = [];
    }
  
    return tmp_ar;
};

exports.array_merge = function () {
  var args = Array.prototype.slice.call(arguments),
      argl = args.length,
      arg,
      retObj = {},
      k = '',
      argil = 0,
      j = 0,
      i = 0,
      ct = 0,
      toStr = Object.prototype.toString,
      retArr = true;
  
    for (i = 0; i < argl; i++) {
      if (toStr.call(args[i]) !== '[object Array]') {
        retArr = false;
        break;
      }
    }
  
    if (retArr) {
      retArr = [];
      for (i = 0; i < argl; i++) {
        retArr = retArr.concat(args[i]);
      }
      return retArr;
    }
  
    for (i = 0, ct = 0; i < argl; i++) {
      arg = args[i];
      if (toStr.call(arg) === '[object Array]') {
        for (j = 0, argil = arg.length; j < argil; j++) {
          retObj[ct++] = arg[j];
        }
      } else {
        for (k in arg) {
          if (arg.hasOwnProperty(k)) {
            if (parseInt(k, 10) + '' === k) {
              retObj[ct++] = arg[k];
            } else {
              retObj[k] = arg[k];
            }
          }
        }
      }
    }
    return retObj;
};

exports.array_multisort = function (arr) {
  var g, i, j, k, l, sal, vkey, elIndex, lastSorts, tmpArray, zlast;
  
    var sortFlag = [0];
    var thingsToSort = [];
    var nLastSort = [];
    var lastSort = [];
    var args = arguments; // possibly redundant
  
    var flags = {
      'SORT_REGULAR': 16,
      'SORT_NUMERIC': 17,
      'SORT_STRING': 18,
      'SORT_ASC': 32,
      'SORT_DESC': 40
    };
  
    var sortDuplicator = function(a, b) {
      return nLastSort.shift();
    };
  
    var sortFunctions = [
      [
  
        function(a, b) {
          lastSort.push(a > b ? 1 : (a < b ? -1 : 0));
          return a > b ? 1 : (a < b ? -1 : 0);
        },
        function(a, b) {
          lastSort.push(b > a ? 1 : (b < a ? -1 : 0));
          return b > a ? 1 : (b < a ? -1 : 0);
        }
      ],
      [
  
        function(a, b) {
          lastSort.push(a - b);
          return a - b;
        },
        function(a, b) {
          lastSort.push(b - a);
          return b - a;
        }
      ],
      [
  
        function(a, b) {
          lastSort.push((a + '') > (b + '') ? 1 : ((a + '') < (b + '') ? -1 : 0));
          return (a + '') > (b + '') ? 1 : ((a + '') < (b + '') ? -1 : 0);
        },
        function(a, b) {
          lastSort.push((b + '') > (a + '') ? 1 : ((b + '') < (a + '') ? -1 : 0));
          return (b + '') > (a + '') ? 1 : ((b + '') < (a + '') ? -1 : 0);
        }
      ]
    ];
  
    var sortArrs = [
      []
    ];
  
    var sortKeys = [
      []
    ];
  
    // Store first argument into sortArrs and sortKeys if an Object.
    // First Argument should be either a Javascript Array or an Object, otherwise function would return FALSE like in PHP
    if (Object.prototype.toString.call(arr) === '[object Array]') {
      sortArrs[0] = arr;
    } else if (arr && typeof arr === 'object') {
      for (i in arr) {
        if (arr.hasOwnProperty(i)) {
          sortKeys[0].push(i);
          sortArrs[0].push(arr[i]);
        }
      }
    } else {
      return false;
    }
  
    // arrMainLength: Holds the length of the first array. All other arrays must be of equal length, otherwise function would return FALSE like in PHP
    //
    // sortComponents: Holds 2 indexes per every section of the array that can be sorted. As this is the start, the whole array can be sorted.
    var arrMainLength = sortArrs[0].length;
    var sortComponents = [0, arrMainLength];
  
    // Loop through all other arguments, checking lengths and sort flags of arrays and adding them to the above variables.
    var argl = arguments.length;
    for (j = 1; j < argl; j++) {
      if (Object.prototype.toString.call(arguments[j]) === '[object Array]') {
        sortArrs[j] = arguments[j];
        sortFlag[j] = 0;
        if (arguments[j].length !== arrMainLength) {
          return false;
        }
      } else if (arguments[j] && typeof arguments[j] === 'object') {
        sortKeys[j] = [];
        sortArrs[j] = [];
        sortFlag[j] = 0;
        for (i in arguments[j]) {
          if (arguments[j].hasOwnProperty(i)) {
            sortKeys[j].push(i);
            sortArrs[j].push(arguments[j][i]);
          }
        }
        if (sortArrs[j].length !== arrMainLength) {
          return false;
        }
      } else if (typeof arguments[j] === 'string') {
        var lFlag = sortFlag.pop();
        // Keep extra parentheses around latter flags check to avoid minimization leading to CDATA closer
        if (typeof flags[arguments[j]] === 'undefined' || ((((flags[arguments[j]]) >>> 4) & (lFlag >>> 4)) > 0)) {
          return false;
        }
        sortFlag.push(lFlag + flags[arguments[j]]);
      } else {
        return false;
      }
    }
  
    for (i = 0; i !== arrMainLength; i++) {
      thingsToSort.push(true);
    }
  
    // Sort all the arrays....
    for (i in sortArrs) {
      if (sortArrs.hasOwnProperty(i)) {
        lastSorts = [];
        tmpArray = [];
        elIndex = 0;
        nLastSort = [];
        lastSort = [];
  
        // If there are no sortComponents, then no more sorting is neeeded. Copy the array back to the argument.
        if (sortComponents.length === 0) {
          if (Object.prototype.toString.call(arguments[i]) === '[object Array]') {
            args[i] = sortArrs[i];
          } else {
            for (k in arguments[i]) {
              if (arguments[i].hasOwnProperty(k)) {
                delete arguments[i][k];
              }
            }
            sal = sortArrs[i].length;
            for (j = 0, vkey = 0; j < sal; j++) {
              vkey = sortKeys[i][j];
              args[i][vkey] = sortArrs[i][j];
            }
          }
          delete sortArrs[i];
          delete sortKeys[i];
          continue;
        }
  
        // Sort function for sorting. Either sorts asc or desc, regular/string or numeric.
        var sFunction = sortFunctions[(sortFlag[i] & 3)][((sortFlag[i] & 8) > 0) ? 1 : 0];
  
        // Sort current array.
        for (l = 0; l !== sortComponents.length; l += 2) {
          tmpArray = sortArrs[i].slice(sortComponents[l], sortComponents[l + 1] + 1);
          tmpArray.sort(sFunction);
          lastSorts[l] = [].concat(lastSort); // Is there a better way to copy an array in Javascript?
          elIndex = sortComponents[l];
          for (g in tmpArray) {
            if (tmpArray.hasOwnProperty(g)) {
              sortArrs[i][elIndex] = tmpArray[g];
              elIndex++;
            }
          }
        }
  
        // Duplicate the sorting of the current array on future arrays.
        sFunction = sortDuplicator;
        for (j in sortArrs) {
          if (sortArrs.hasOwnProperty(j)) {
            if (sortArrs[j] === sortArrs[i]) {
              continue;
            }
            for (l = 0; l !== sortComponents.length; l += 2) {
              tmpArray = sortArrs[j].slice(sortComponents[l], sortComponents[l + 1] + 1);
              nLastSort = [].concat(lastSorts[l]); // alert(l + ':' + nLastSort);
              tmpArray.sort(sFunction);
              elIndex = sortComponents[l];
              for (g in tmpArray) {
                if (tmpArray.hasOwnProperty(g)) {
                  sortArrs[j][elIndex] = tmpArray[g];
                  elIndex++;
                }
              }
            }
          }
        }
  
        // Duplicate the sorting of the current array on array keys
        for (j in sortKeys) {
          if (sortKeys.hasOwnProperty(j)) {
            for (l = 0; l !== sortComponents.length; l += 2) {
              tmpArray = sortKeys[j].slice(sortComponents[l], sortComponents[l + 1] + 1);
              nLastSort = [].concat(lastSorts[l]);
              tmpArray.sort(sFunction);
              elIndex = sortComponents[l];
              for (g in tmpArray) {
                if (tmpArray.hasOwnProperty(g)) {
                  sortKeys[j][elIndex] = tmpArray[g];
                  elIndex++;
                }
              }
            }
          }
        }
  
        // Generate the next sortComponents
        zlast = null;
        sortComponents = [];
        for (j in sortArrs[i]) {
          if (sortArrs[i].hasOwnProperty(j)) {
            if (!thingsToSort[j]) {
              if ((sortComponents.length & 1)) {
                sortComponents.push(j - 1);
              }
              zlast = null;
              continue;
            }
            if (!(sortComponents.length & 1)) {
              if (zlast !== null) {
                if (sortArrs[i][j] === zlast) {
                  sortComponents.push(j - 1);
                } else {
                  thingsToSort[j] = false;
                }
              }
              zlast = sortArrs[i][j];
            } else {
              if (sortArrs[i][j] !== zlast) {
                sortComponents.push(j - 1);
                zlast = sortArrs[i][j];
              }
            }
          }
        }
  
        if (sortComponents.length & 1) {
          sortComponents.push(j);
        }
        if (Object.prototype.toString.call(arguments[i]) === '[object Array]') {
          args[i] = sortArrs[i];
        } else {
          for (j in arguments[i]) {
            if (arguments[i].hasOwnProperty(j)) {
              delete arguments[i][j];
            }
          }
  
          sal = sortArrs[i].length;
          for (j = 0, vkey = 0; j < sal; j++) {
            vkey = sortKeys[i][j];
            args[i][vkey] = sortArrs[i][j];
          }
  
        }
        delete sortArrs[i];
        delete sortKeys[i];
      }
    }
    return true;
};

exports.array_pad = function (input, pad_size, pad_value) {
  var pad = [],
      newArray = [],
      newLength,
      diff = 0,
      i = 0;
  
    if (Object.prototype.toString.call(input) === '[object Array]' && !isNaN(pad_size)) {
      newLength = ((pad_size < 0) ? (pad_size * -1) : pad_size);
      diff = newLength - input.length;
  
      if (diff > 0) {
        for (i = 0; i < diff; i++) {
          newArray[i] = pad_value;
        }
        pad = ((pad_size < 0) ? newArray.concat(input) : input.concat(newArray));
      } else {
        pad = input;
      }
    }
  
    return pad;
};

exports.array_pop = function (inputArr) {
  var key = '',
      lastKey = '';
  
    if (inputArr.hasOwnProperty('length')) {
      // Indexed
      if (!inputArr.length) {
        // Done popping, are we?
        return null;
      }
      return inputArr.pop();
    } else {
      // Associative
      for (key in inputArr) {
        if (inputArr.hasOwnProperty(key)) {
          lastKey = key;
        }
      }
      if (lastKey) {
        var tmp = inputArr[lastKey];
        delete(inputArr[lastKey]);
        return tmp;
      } else {
        return null;
      }
    }
};

exports.array_product = function (input) {
  var idx = 0,
      product = 1,
      il = 0;
  
    if (Object.prototype.toString.call(input) !== '[object Array]') {
      return null;
    }
  
    il = input.length;
    while (idx < il) {
      product *= (!isNaN(input[idx]) ? input[idx] : 0);
      idx++;
    }
    return product;
};

exports.array_push = function (inputArr) {
  var i = 0,
      pr = '',
      argv = arguments,
      argc = argv.length,
      allDigits = /^\d$/,
      size = 0,
      highestIdx = 0,
      len = 0;
    if (inputArr.hasOwnProperty('length')) {
      for (i = 1; i < argc; i++) {
        inputArr[inputArr.length] = argv[i];
      }
      return inputArr.length;
    }
  
    // Associative (object)
    for (pr in inputArr) {
      if (inputArr.hasOwnProperty(pr)) {
        ++len;
        if (pr.search(allDigits) !== -1) {
          size = parseInt(pr, 10);
          highestIdx = size > highestIdx ? size : highestIdx;
        }
      }
    }
    for (i = 1; i < argc; i++) {
      inputArr[++highestIdx] = argv[i];
    }
    return len + i - 1;
};

exports.array_rand = function (input, num_req) {
  var indexes = [];
    var ticks = num_req || 1;
    var checkDuplicate = function(input, value) {
      var exist = false,
        index = 0,
        il = input.length;
      while (index < il) {
        if (input[index] === value) {
          exist = true;
          break;
        }
        index++;
      }
      return exist;
    };
  
    if (Object.prototype.toString.call(input) === '[object Array]' && ticks <= input.length) {
      while (true) {
        var rand = Math.floor((Math.random() * input.length));
        if (indexes.length === ticks) {
          break;
        }
        if (!checkDuplicate(indexes, rand)) {
          indexes.push(rand);
        }
      }
    } else {
      indexes = null;
    }
  
    return ((ticks == 1) ? indexes.join() : indexes);
};

exports.array_reduce = function (a_input, callback) {
  var lon = a_input.length;
    var res = 0,
      i = 0;
    var tmp = [];
  
    for (i = 0; i < lon; i += 2) {
      tmp[0] = a_input[i];
      if (a_input[(i + 1)]) {
        tmp[1] = a_input[(i + 1)];
      } else {
        tmp[1] = 0;
      }
      res += callback.apply(null, tmp);
      tmp = [];
    }
  
    return res;
};

exports.array_replace = function (arr) {
  var retObj = {},
      i = 0,
      p = '',
      argl = arguments.length;
  
    if (argl < 2) {
      throw new Error('There should be at least 2 arguments passed to array_replace()');
    }
  
    // Although docs state that the arguments are passed in by reference, it seems they are not altered, but rather the copy that is returned (just guessing), so we make a copy here, instead of acting on arr itself
    for (p in arr) {
      retObj[p] = arr[p];
    }
  
    for (i = 1; i < argl; i++) {
      for (p in arguments[i]) {
        retObj[p] = arguments[i][p];
      }
    }
    return retObj;
};

exports.array_replace_recursive = function (arr) {
  var retObj = {},
      i = 0,
      p = '',
      argl = arguments.length;
  
    if (argl < 2) {
      throw new Error('There should be at least 2 arguments passed to array_replace_recursive()');
    }
  
    // Although docs state that the arguments are passed in by reference, it seems they are not altered, but rather the copy that is returned (just guessing), so we make a copy here, instead of acting on arr itself
    for (p in arr) {
      retObj[p] = arr[p];
    }
  
    for (i = 1; i < argl; i++) {
      for (p in arguments[i]) {
        if (retObj[p] && typeof retObj[p] === 'object') {
          retObj[p] = this.array_replace_recursive(retObj[p], arguments[i][p]);
        } else {
          retObj[p] = arguments[i][p];
        }
      }
    }
    return retObj;
};

exports.array_reverse = function (array, preserve_keys) {
  var isArray = Object.prototype.toString.call(array) === '[object Array]',
      tmp_arr = preserve_keys ? {} : [],
      key;
  
    if (isArray && !preserve_keys) {
      return array.slice(0)
        .reverse();
    }
  
    if (preserve_keys) {
      var keys = [];
      for (key in array) {
        // if (array.hasOwnProperty(key)) {
        keys.push(key);
        // }
      }
  
      var i = keys.length;
      while (i--) {
        key = keys[i];
        // FIXME: don't rely on browsers keeping keys in insertion order
        // it's implementation specific
        // eg. the result will differ from expected in Google Chrome
        tmp_arr[key] = array[key];
      }
    } else {
      for (key in array) {
        // if (array.hasOwnProperty(key)) {
        tmp_arr.unshift(array[key]);
        // }
      }
    }
  
    return tmp_arr;
};

exports.array_shift = function (inputArr) {
  var props = false,
      shift = undefined,
      pr = '',
      allDigits = /^\d$/,
      int_ct = -1,
      _checkToUpIndices = function(arr, ct, key) {
        // Deal with situation, e.g., if encounter index 4 and try to set it to 0, but 0 exists later in loop (need to
        // increment all subsequent (skipping current key, since we need its value below) until find unused)
        if (arr[ct] !== undefined) {
          var tmp = ct;
          ct += 1;
          if (ct === key) {
            ct += 1;
          }
          ct = _checkToUpIndices(arr, ct, key);
          arr[ct] = arr[tmp];
          delete arr[tmp];
        }
        return ct;
      };
  
    if (inputArr.length === 0) {
      return null;
    }
    if (inputArr.length > 0) {
      return inputArr.shift();
    }
  
    /*
    UNFINISHED FOR HANDLING OBJECTS
    for (pr in inputArr) {
      if (inputArr.hasOwnProperty(pr)) {
        props = true;
        shift = inputArr[pr];
        delete inputArr[pr];
        break;
      }
    }
    for (pr in inputArr) {
      if (inputArr.hasOwnProperty(pr)) {
        if (pr.search(allDigits) !== -1) {
          int_ct += 1;
          if (parseInt(pr, 10) === int_ct) { // Key is already numbered ok, so don't need to change key for value
            continue;
          }
          _checkToUpIndices(inputArr, int_ct, pr);
          arr[int_ct] = arr[pr];
          delete arr[pr];
        }
      }
    }
    if (!props) {
      return null;
    }
    return shift;
    */
};

exports.array_sum = function (array) {
  var key, sum = 0;
  
    if (array && typeof array === 'object' && array.change_key_case) { // Duck-type check for our own array()-created PHPJS_Array
      return array.sum.apply(array, Array.prototype.slice.call(arguments, 0));
    }
  
    // input sanitation
    if (typeof array !== 'object') {
      return null;
    }
  
    for (key in array) {
      if (!isNaN(parseFloat(array[key]))) {
        sum += parseFloat(array[key]);
      }
    }
  
    return sum;
};

exports.array_udiff = function (arr1) {
  var retArr = {},
      arglm1 = arguments.length - 1,
      cb = arguments[arglm1],
      arr = '',
      i = 1,
      k1 = '',
      k = '';
    cb = (typeof cb === 'string') ? this.window[cb] : (Object.prototype.toString.call(cb) === '[object Array]') ? this.window[
      cb[0]][cb[1]] : cb;
  
    arr1keys: for (k1 in arr1) {
      for (i = 1; i < arglm1; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (cb(arr[k], arr1[k1]) === 0) {
            // If it reaches here, it was found in at least one array, so try next value
            continue arr1keys;
          }
        }
        retArr[k1] = arr1[k1];
      }
    }
  
    return retArr;
};

exports.array_udiff_assoc = function (arr1) {
  var retArr = {},
      arglm1 = arguments.length - 1,
      cb = arguments[arglm1],
      arr = {},
      i = 1,
      k1 = '',
      k = '';
    cb = (typeof cb === 'string') ? this.window[cb] : (Object.prototype.toString.call(cb) === '[object Array]') ? this.window[
      cb[0]][cb[1]] : cb;
  
    arr1keys: for (k1 in arr1) {
      for (i = 1; i < arglm1; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (cb(arr[k], arr1[k1]) === 0 && k === k1) {
            // If it reaches here, it was found in at least one array, so try next value
            continue arr1keys;
          }
        }
        retArr[k1] = arr1[k1];
      }
    }
  
    return retArr;
};

exports.array_udiff_uassoc = function (arr1) {
  var retArr = {},
      arglm1 = arguments.length - 1,
      arglm2 = arglm1 - 1,
      cb = arguments[arglm1],
      cb0 = arguments[arglm2],
      k1 = '',
      i = 1,
      k = '',
      arr = {};
  
    cb = (typeof cb === 'string') ? this.window[cb] : (Object.prototype.toString.call(cb) === '[object Array]') ? this.window[
      cb[0]][cb[1]] : cb;
    cb0 = (typeof cb0 === 'string') ? this.window[cb0] : (Object.prototype.toString.call(cb0) === '[object Array]') ?
      this.window[cb0[0]][cb0[1]] : cb0;
  
    arr1keys: for (k1 in arr1) {
      for (i = 1; i < arglm2; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (cb0(arr[k], arr1[k1]) === 0 && cb(k, k1) === 0) {
            // If it reaches here, it was found in at least one array, so try next value
            continue arr1keys;
          }
        }
        retArr[k1] = arr1[k1];
      }
    }
  
    return retArr;
};

exports.array_uintersect = function (arr1) {
  var retArr = {},
      arglm1 = arguments.length - 1,
      arglm2 = arglm1 - 1,
      cb = arguments[arglm1],
      k1 = '',
      i = 1,
      arr = {},
      k = '';
  
    cb = (typeof cb === 'string') ? this.window[cb] : (Object.prototype.toString.call(cb) === '[object Array]') ? this.window[
      cb[0]][cb[1]] : cb;
  
    arr1keys: for (k1 in arr1) {
      arrs: for (i = 1; i < arglm1; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (cb(arr[k], arr1[k1]) === 0) {
            if (i === arglm2) {
              retArr[k1] = arr1[k1];
            }
            // If the innermost loop always leads at least once to an equal value, continue the loop until done
            continue arrs;
          }
        }
        // If it reaches here, it wasn't found in at least one array, so try next value
        continue arr1keys;
      }
    }
  
    return retArr;
};

exports.array_uintersect_assoc = function (arr1) {
  var retArr = {},
      arglm1 = arguments.length - 1,
      arglm2 = arglm1 - 2,
      cb = arguments[arglm1],
      k1 = '',
      i = 1,
      arr = {},
      k = '';
  
    cb = (typeof cb === 'string') ? this.window[cb] : (Object.prototype.toString.call(cb) === '[object Array]') ? this.window[
      cb[0]][cb[1]] : cb;
  
    arr1keys: for (k1 in arr1) {
      arrs: for (i = 1; i < arglm1; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (k === k1 && cb(arr[k], arr1[k1]) === 0) {
            if (i === arglm2) {
              retArr[k1] = arr1[k1];
            }
            // If the innermost loop always leads at least once to an equal value, continue the loop until done
            continue arrs;
          }
        }
        // If it reaches here, it wasn't found in at least one array, so try next value
        continue arr1keys;
      }
    }
  
    return retArr;
};

exports.array_uintersect_uassoc = function (arr1) {
  var retArr = {},
      arglm1 = arguments.length - 1,
      arglm2 = arglm1 - 1,
      cb = arguments[arglm1],
      cb0 = arguments[arglm2],
      k1 = '',
      i = 1,
      k = '',
      arr = {};
  
    cb = (typeof cb === 'string') ? this.window[cb] : (Object.prototype.toString.call(cb) === '[object Array]') ? this.window[
      cb[0]][cb[1]] : cb;
    cb0 = (typeof cb0 === 'string') ? this.window[cb0] : (Object.prototype.toString.call(cb0) === '[object Array]') ?
      this.window[cb0[0]][cb0[1]] : cb0;
  
    arr1keys: for (k1 in arr1) {
      arrs: for (i = 1; i < arglm2; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (cb0(arr[k], arr1[k1]) === 0 && cb(k, k1) === 0) {
            if (i === arguments.length - 3) {
              retArr[k1] = arr1[k1];
            }
            continue arrs; // If the innermost loop always leads at least once to an equal value, continue the loop until done
          }
        }
        continue arr1keys; // If it reaches here, it wasn't found in at least one array, so try next value
      }
    }
  
    return retArr;
};

exports.array_unique = function (inputArr) {
  var key = '',
      tmp_arr2 = {},
      val = '';
  
    var __array_search = function(needle, haystack) {
      var fkey = '';
      for (fkey in haystack) {
        if (haystack.hasOwnProperty(fkey)) {
          if ((haystack[fkey] + '') === (needle + '')) {
            return fkey;
          }
        }
      }
      return false;
    };
  
    for (key in inputArr) {
      if (inputArr.hasOwnProperty(key)) {
        val = inputArr[key];
        if (false === __array_search(val, tmp_arr2)) {
          tmp_arr2[key] = val;
        }
      }
    }
  
    return tmp_arr2;
};

exports.array_unshift = function (array) {
  var i = arguments.length;
  
    while (--i !== 0) {
      arguments[0].unshift(arguments[i]);
    }
  
    return arguments[0].length;
};

exports.array_values = function (input) {
  var tmp_arr = [],
      key = '';
  
    if (input && typeof input === 'object' && input.change_key_case) { // Duck-type check for our own array()-created PHPJS_Array
      return input.values();
    }
  
    for (key in input) {
      tmp_arr[tmp_arr.length] = input[key];
    }
  
    return tmp_arr;
};

exports.array_walk_recursive = function (array, funcname, userdata) {
  var key;
  
    if (typeof array !== 'object') {
      return false;
    }
  
    for (key in array) {
      if (typeof array[key] === 'object') {
        return this.array_walk_recursive(array[key], funcname, userdata);
      }
  
      if (typeof userdata !== 'undefined') {
        eval(funcname + '( array [key] , key , userdata  )');
      } else {
        eval(funcname + '(  userdata ) ');
      }
    }
  
    return true;
};

exports.compact = function () {
  var matrix = {},
      that = this;
  
    var process = function(value) {
      var i = 0,
        l = value.length,
        key_value = '';
      for (i = 0; i < l; i++) {
        key_value = value[i];
        if (Object.prototype.toString.call(key_value) === '[object Array]') {
          process(key_value);
        } else {
          if (typeof that.window[key_value] !== 'undefined') {
            matrix[key_value] = that.window[key_value];
          }
        }
      }
      return true;
    };
  
    process(arguments);
    return matrix;
};

exports.count = function (mixed_var, mode) {
  var key, cnt = 0;
  
    if (mixed_var === null || typeof mixed_var === 'undefined') {
      return 0;
    } else if (mixed_var.constructor !== Array && mixed_var.constructor !== Object) {
      return 1;
    }
  
    if (mode === 'COUNT_RECURSIVE') {
      mode = 1;
    }
    if (mode != 1) {
      mode = 0;
    }
  
    for (key in mixed_var) {
      if (mixed_var.hasOwnProperty(key)) {
        cnt++;
        if (mode == 1 && mixed_var[key] && (mixed_var[key].constructor === Array || mixed_var[key].constructor ===
          Object)) {
          cnt += this.count(mixed_var[key], 1);
        }
      }
    }
  
    return cnt;
};

exports.current = function (arr) {
  this.php_js = this.php_js || {};
    this.php_js.pointers = this.php_js.pointers || [];
    var indexOf = function(value) {
      for (var i = 0, length = this.length; i < length; i++) {
        if (this[i] === value) {
          return i;
        }
      }
      return -1;
    };
    // END REDUNDANT
    var pointers = this.php_js.pointers;
    if (!pointers.indexOf) {
      pointers.indexOf = indexOf;
    }
    if (pointers.indexOf(arr) === -1) {
      pointers.push(arr, 0);
    }
    var arrpos = pointers.indexOf(arr);
    var cursor = pointers[arrpos + 1];
    if (Object.prototype.toString.call(arr) === '[object Array]') {
      return arr[cursor] || false;
    }
    var ct = 0;
    for (var k in arr) {
      if (ct === cursor) {
        return arr[k];
      }
      ct++;
    }
    return false; // Empty
};

exports.each = function (arr) {
  this.php_js = this.php_js || {};
    this.php_js.pointers = this.php_js.pointers || [];
    var indexOf = function(value) {
      for (var i = 0, length = this.length; i < length; i++) {
        if (this[i] === value) {
          return i;
        }
      }
      return -1;
    };
    // END REDUNDANT
    var pointers = this.php_js.pointers;
    if (!pointers.indexOf) {
      pointers.indexOf = indexOf;
    }
    if (pointers.indexOf(arr) === -1) {
      pointers.push(arr, 0);
    }
    var arrpos = pointers.indexOf(arr);
    var cursor = pointers[arrpos + 1];
    var pos = 0;
  
    if (Object.prototype.toString.call(arr) !== '[object Array]') {
      var ct = 0;
      for (var k in arr) {
        if (ct === cursor) {
          pointers[arrpos + 1] += 1;
          if (each.returnArrayOnly) {
            return [k, arr[k]];
          } else {
            return {
              1: arr[k],
              value: arr[k],
              0: k,
              key: k
            };
          }
        }
        ct++;
      }
      return false; // Empty
    }
    if (arr.length === 0 || cursor === arr.length) {
      return false;
    }
    pos = cursor;
    pointers[arrpos + 1] += 1;
    if (each.returnArrayOnly) {
      return [pos, arr[pos]];
    } else {
      return {
        1: arr[pos],
        value: arr[pos],
        0: pos,
        key: pos
      };
    }
};

exports.end = function (arr) {
  this.php_js = this.php_js || {};
    this.php_js.pointers = this.php_js.pointers || [];
    var indexOf = function(value) {
      for (var i = 0, length = this.length; i < length; i++) {
        if (this[i] === value) {
          return i;
        }
      }
      return -1;
    };
    // END REDUNDANT
    var pointers = this.php_js.pointers;
    if (!pointers.indexOf) {
      pointers.indexOf = indexOf;
    }
    if (pointers.indexOf(arr) === -1) {
      pointers.push(arr, 0);
    }
    var arrpos = pointers.indexOf(arr);
    if (Object.prototype.toString.call(arr) !== '[object Array]') {
      var ct = 0;
      var val;
      for (var k in arr) {
        ct++;
        val = arr[k];
      }
      if (ct === 0) {
        return false; // Empty
      }
      pointers[arrpos + 1] = ct - 1;
      return val;
    }
    if (arr.length === 0) {
      return false;
    }
    pointers[arrpos + 1] = arr.length - 1;
    return arr[pointers[arrpos + 1]];
};

exports.in_array = function (needle, haystack, argStrict) {
  var key = '',
      strict = !! argStrict;
  
    //we prevent the double check (strict && arr[key] === ndl) || (!strict && arr[key] == ndl)
    //in just one for, in order to improve the performance 
    //deciding wich type of comparation will do before walk array
    if (strict) {
      for (key in haystack) {
        if (haystack[key] === needle) {
          return true;
        }
      }
    } else {
      for (key in haystack) {
        if (haystack[key] == needle) {
          return true;
        }
      }
    }
  
    return false;
};

exports.key = function (arr) {
  this.php_js = this.php_js || {};
    this.php_js.pointers = this.php_js.pointers || [];
    var indexOf = function(value) {
      for (var i = 0, length = this.length; i < length; i++) {
        if (this[i] === value) {
          return i;
        }
      }
      return -1;
    };
    // END REDUNDANT
    var pointers = this.php_js.pointers;
    if (!pointers.indexOf) {
      pointers.indexOf = indexOf;
    }
  
    if (pointers.indexOf(arr) === -1) {
      pointers.push(arr, 0);
    }
    var cursor = pointers[pointers.indexOf(arr) + 1];
    if (Object.prototype.toString.call(arr) !== '[object Array]') {
      var ct = 0;
      for (var k in arr) {
        if (ct === cursor) {
          return k;
        }
        ct++;
      }
      return false; // Empty
    }
    if (arr.length === 0) {
      return false;
    }
    return cursor;
};

exports.next = function (arr) {
  this.php_js = this.php_js || {};
    this.php_js.pointers = this.php_js.pointers || [];
    var indexOf = function(value) {
      for (var i = 0, length = this.length; i < length; i++) {
        if (this[i] === value) {
          return i;
        }
      }
      return -1;
    };
    // END REDUNDANT
    var pointers = this.php_js.pointers;
    if (!pointers.indexOf) {
      pointers.indexOf = indexOf;
    }
    if (pointers.indexOf(arr) === -1) {
      pointers.push(arr, 0);
    }
    var arrpos = pointers.indexOf(arr);
    var cursor = pointers[arrpos + 1];
    if (Object.prototype.toString.call(arr) !== '[object Array]') {
      var ct = 0;
      for (var k in arr) {
        if (ct === cursor + 1) {
          pointers[arrpos + 1] += 1;
          return arr[k];
        }
        ct++;
      }
      return false; // End
    }
    if (arr.length === 0 || cursor === (arr.length - 1)) {
      return false;
    }
    pointers[arrpos + 1] += 1;
    return arr[pointers[arrpos + 1]];
};

exports.prev = function (arr) {
  this.php_js = this.php_js || {};
    this.php_js.pointers = this.php_js.pointers || [];
    var indexOf = function(value) {
      for (var i = 0, length = this.length; i < length; i++) {
        if (this[i] === value) {
          return i;
        }
      }
      return -1;
    };
    // END REDUNDANT
    var pointers = this.php_js.pointers;
    if (!pointers.indexOf) {
      pointers.indexOf = indexOf;
    }
    var arrpos = pointers.indexOf(arr);
    var cursor = pointers[arrpos + 1];
    if (pointers.indexOf(arr) === -1 || cursor === 0) {
      return false;
    }
    if (Object.prototype.toString.call(arr) !== '[object Array]') {
      var ct = 0;
      for (var k in arr) {
        if (ct === cursor - 1) {
          pointers[arrpos + 1] -= 1;
          return arr[k];
        }
        ct++;
      }
      // Shouldn't reach here
    }
    if (arr.length === 0) {
      return false;
    }
    pointers[arrpos + 1] -= 1;
    return arr[pointers[arrpos + 1]];
};

exports.range = function (low, high, step) {
  var matrix = [];
    var inival, endval, plus;
    var walker = step || 1;
    var chars = false;
  
    if (!isNaN(low) && !isNaN(high)) {
      inival = low;
      endval = high;
    } else if (isNaN(low) && isNaN(high)) {
      chars = true;
      inival = low.charCodeAt(0);
      endval = high.charCodeAt(0);
    } else {
      inival = (isNaN(low) ? 0 : low);
      endval = (isNaN(high) ? 0 : high);
    }
  
    plus = ((inival > endval) ? false : true);
    if (plus) {
      while (inival <= endval) {
        matrix.push(((chars) ? String.fromCharCode(inival) : inival));
        inival += walker;
      }
    } else {
      while (inival >= endval) {
        matrix.push(((chars) ? String.fromCharCode(inival) : inival));
        inival -= walker;
      }
    }
  
    return matrix;
};

exports.reset = function (arr) {
  this.php_js = this.php_js || {};
    this.php_js.pointers = this.php_js.pointers || [];
    var indexOf = function(value) {
      for (var i = 0, length = this.length; i < length; i++) {
        if (this[i] === value) {
          return i;
        }
      }
      return -1;
    };
    // END REDUNDANT
    var pointers = this.php_js.pointers;
    if (!pointers.indexOf) {
      pointers.indexOf = indexOf;
    }
    if (pointers.indexOf(arr) === -1) {
      pointers.push(arr, 0);
    }
    var arrpos = pointers.indexOf(arr);
    if (Object.prototype.toString.call(arr) !== '[object Array]') {
      for (var k in arr) {
        if (pointers.indexOf(arr) === -1) {
          pointers.push(arr, 0);
        } else {
          pointers[arrpos + 1] = 0;
        }
        return arr[k];
      }
      return false; // Empty
    }
    if (arr.length === 0) {
      return false;
    }
    pointers[arrpos + 1] = 0;
    return arr[pointers[arrpos + 1]];
};

exports.shuffle = function (inputArr) {
  var valArr = [],
      k = '',
      i = 0,
      strictForIn = false,
      populateArr = [];
  
    for (k in inputArr) { // Get key and value arrays
      if (inputArr.hasOwnProperty(k)) {
        valArr.push(inputArr[k]);
        if (strictForIn) {
          delete inputArr[k];
        }
      }
    }
    valArr.sort(function() {
      return 0.5 - Math.random();
    });
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    for (i = 0; i < valArr.length; i++) { // Repopulate the old array
      populateArr[i] = valArr[i];
    }
  
    return strictForIn || populateArr;
};

exports.uasort = function (inputArr, sorter) {
  var valArr = [],
      tempKeyVal, tempValue, ret, k = '',
      i = 0,
      strictForIn = false,
      populateArr = {};
  
    if (typeof sorter === 'string') {
      sorter = this[sorter];
    } else if (Object.prototype.toString.call(sorter) === '[object Array]') {
      sorter = this[sorter[0]][sorter[1]];
    }
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    for (k in inputArr) { // Get key and value arrays
      if (inputArr.hasOwnProperty(k)) {
        valArr.push([k, inputArr[k]]);
        if (strictForIn) {
          delete inputArr[k];
        }
      }
    }
    valArr.sort(function(a, b) {
      return sorter(a[1], b[1]);
    });
  
    for (i = 0; i < valArr.length; i++) { // Repopulate the old array
      populateArr[valArr[i][0]] = valArr[i][1];
    }
  
    return strictForIn || populateArr;
};

exports.uksort = function (inputArr, sorter) {
  var tmp_arr = {},
      keys = [],
      i = 0,
      k = '',
      strictForIn = false,
      populateArr = {};
  
    if (typeof sorter === 'string') {
      sorter = this.window[sorter];
    }
  
    // Make a list of key names
    for (k in inputArr) {
      if (inputArr.hasOwnProperty(k)) {
        keys.push(k);
      }
    }
  
    // Sort key names
    try {
      if (sorter) {
        keys.sort(sorter);
      } else {
        keys.sort();
      }
    } catch (e) {
      return false;
    }
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    // Rebuild array with sorted key names
    for (i = 0; i < keys.length; i++) {
      k = keys[i];
      tmp_arr[k] = inputArr[k];
      if (strictForIn) {
        delete inputArr[k];
      }
    }
    for (i in tmp_arr) {
      if (tmp_arr.hasOwnProperty(i)) {
        populateArr[i] = tmp_arr[i];
      }
    }
    return strictForIn || populateArr;
};

exports.usort = function (inputArr, sorter) {
  var valArr = [],
      k = '',
      i = 0,
      strictForIn = false,
      populateArr = {};
  
    if (typeof sorter === 'string') {
      sorter = this[sorter];
    } else if (Object.prototype.toString.call(sorter) === '[object Array]') {
      sorter = this[sorter[0]][sorter[1]];
    }
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    for (k in inputArr) { // Get key and value arrays
      if (inputArr.hasOwnProperty(k)) {
        valArr.push(inputArr[k]);
        if (strictForIn) {
          delete inputArr[k];
        }
      }
    }
    try {
      valArr.sort(sorter);
    } catch (e) {
      return false;
    }
    for (i = 0; i < valArr.length; i++) { // Repopulate the old array
      populateArr[i] = valArr[i];
    }
  
    return strictForIn || populateArr;
};

exports.checkdate = function (m, d, y) {
  return m > 0 && m < 13 && y > 0 && y < 32768 && d > 0 && d <= (new Date(y, m, 0))
      .getDate();
};

exports.date = function (format, timestamp) {
  var that = this;
    var jsdate, f;
    // Keep this here (works, but for code commented-out below for file size reasons)
    // var tal= [];
    var txt_words = [
      'Sun', 'Mon', 'Tues', 'Wednes', 'Thurs', 'Fri', 'Satur',
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    // trailing backslash -> (dropped)
    // a backslash followed by any character (including backslash) -> the character
    // empty string -> empty string
    var formatChr = /\\?(.?)/gi;
    var formatChrCb = function(t, s) {
      return f[t] ? f[t]() : s;
    };
    var _pad = function(n, c) {
      n = String(n);
      while (n.length < c) {
        n = '0' + n;
      }
      return n;
    };
    f = {
      // Day
      d: function() { // Day of month w/leading 0; 01..31
        return _pad(f.j(), 2);
      },
      D: function() { // Shorthand day name; Mon...Sun
        return f.l()
          .slice(0, 3);
      },
      j: function() { // Day of month; 1..31
        return jsdate.getDate();
      },
      l: function() { // Full day name; Monday...Sunday
        return txt_words[f.w()] + 'day';
      },
      N: function() { // ISO-8601 day of week; 1[Mon]..7[Sun]
        return f.w() || 7;
      },
      S: function() { // Ordinal suffix for day of month; st, nd, rd, th
        var j = f.j();
        var i = j % 10;
        if (i <= 3 && parseInt((j % 100) / 10, 10) == 1) {
          i = 0;
        }
        return ['st', 'nd', 'rd'][i - 1] || 'th';
      },
      w: function() { // Day of week; 0[Sun]..6[Sat]
        return jsdate.getDay();
      },
      z: function() { // Day of year; 0..365
        var a = new Date(f.Y(), f.n() - 1, f.j());
        var b = new Date(f.Y(), 0, 1);
        return Math.round((a - b) / 864e5);
      },
  
      // Week
      W: function() { // ISO-8601 week number
        var a = new Date(f.Y(), f.n() - 1, f.j() - f.N() + 3);
        var b = new Date(a.getFullYear(), 0, 4);
        return _pad(1 + Math.round((a - b) / 864e5 / 7), 2);
      },
  
      // Month
      F: function() { // Full month name; January...December
        return txt_words[6 + f.n()];
      },
      m: function() { // Month w/leading 0; 01...12
        return _pad(f.n(), 2);
      },
      M: function() { // Shorthand month name; Jan...Dec
        return f.F()
          .slice(0, 3);
      },
      n: function() { // Month; 1...12
        return jsdate.getMonth() + 1;
      },
      t: function() { // Days in month; 28...31
        return (new Date(f.Y(), f.n(), 0))
          .getDate();
      },
  
      // Year
      L: function() { // Is leap year?; 0 or 1
        var j = f.Y();
        return j % 4 === 0 & j % 100 !== 0 | j % 400 === 0;
      },
      o: function() { // ISO-8601 year
        var n = f.n();
        var W = f.W();
        var Y = f.Y();
        return Y + (n === 12 && W < 9 ? 1 : n === 1 && W > 9 ? -1 : 0);
      },
      Y: function() { // Full year; e.g. 1980...2010
        return jsdate.getFullYear();
      },
      y: function() { // Last two digits of year; 00...99
        return f.Y()
          .toString()
          .slice(-2);
      },
  
      // Time
      a: function() { // am or pm
        return jsdate.getHours() > 11 ? 'pm' : 'am';
      },
      A: function() { // AM or PM
        return f.a()
          .toUpperCase();
      },
      B: function() { // Swatch Internet time; 000..999
        var H = jsdate.getUTCHours() * 36e2;
        // Hours
        var i = jsdate.getUTCMinutes() * 60;
        // Minutes
        var s = jsdate.getUTCSeconds(); // Seconds
        return _pad(Math.floor((H + i + s + 36e2) / 86.4) % 1e3, 3);
      },
      g: function() { // 12-Hours; 1..12
        return f.G() % 12 || 12;
      },
      G: function() { // 24-Hours; 0..23
        return jsdate.getHours();
      },
      h: function() { // 12-Hours w/leading 0; 01..12
        return _pad(f.g(), 2);
      },
      H: function() { // 24-Hours w/leading 0; 00..23
        return _pad(f.G(), 2);
      },
      i: function() { // Minutes w/leading 0; 00..59
        return _pad(jsdate.getMinutes(), 2);
      },
      s: function() { // Seconds w/leading 0; 00..59
        return _pad(jsdate.getSeconds(), 2);
      },
      u: function() { // Microseconds; 000000-999000
        return _pad(jsdate.getMilliseconds() * 1000, 6);
      },
  
      // Timezone
      e: function() { // Timezone identifier; e.g. Atlantic/Azores, ...
        // The following works, but requires inclusion of the very large
        // timezone_abbreviations_list() function.
        /*              return that.date_default_timezone_get();
         */
        throw 'Not supported (see source code of date() for timezone on how to add support)';
      },
      I: function() { // DST observed?; 0 or 1
        // Compares Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC.
        // If they are not equal, then DST is observed.
        var a = new Date(f.Y(), 0);
        // Jan 1
        var c = Date.UTC(f.Y(), 0);
        // Jan 1 UTC
        var b = new Date(f.Y(), 6);
        // Jul 1
        var d = Date.UTC(f.Y(), 6); // Jul 1 UTC
        return ((a - c) !== (b - d)) ? 1 : 0;
      },
      O: function() { // Difference to GMT in hour format; e.g. +0200
        var tzo = jsdate.getTimezoneOffset();
        var a = Math.abs(tzo);
        return (tzo > 0 ? '-' : '+') + _pad(Math.floor(a / 60) * 100 + a % 60, 4);
      },
      P: function() { // Difference to GMT w/colon; e.g. +02:00
        var O = f.O();
        return (O.substr(0, 3) + ':' + O.substr(3, 2));
      },
      T: function() { // Timezone abbreviation; e.g. EST, MDT, ...
        // The following works, but requires inclusion of the very
        // large timezone_abbreviations_list() function.
        /*              var abbr, i, os, _default;
        if (!tal.length) {
          tal = that.timezone_abbreviations_list();
        }
        if (that.php_js && that.php_js.default_timezone) {
          _default = that.php_js.default_timezone;
          for (abbr in tal) {
            for (i = 0; i < tal[abbr].length; i++) {
              if (tal[abbr][i].timezone_id === _default) {
                return abbr.toUpperCase();
              }
            }
          }
        }
        for (abbr in tal) {
          for (i = 0; i < tal[abbr].length; i++) {
            os = -jsdate.getTimezoneOffset() * 60;
            if (tal[abbr][i].offset === os) {
              return abbr.toUpperCase();
            }
          }
        }
        */
        return 'UTC';
      },
      Z: function() { // Timezone offset in seconds (-43200...50400)
        return -jsdate.getTimezoneOffset() * 60;
      },
  
      // Full Date/Time
      c: function() { // ISO-8601 date.
        return 'Y-m-d\\TH:i:sP'.replace(formatChr, formatChrCb);
      },
      r: function() { // RFC 2822
        return 'D, d M Y H:i:s O'.replace(formatChr, formatChrCb);
      },
      U: function() { // Seconds since UNIX epoch
        return jsdate / 1000 | 0;
      }
    };
    this.date = function(format, timestamp) {
      that = this;
      jsdate = (timestamp === undefined ? new Date() : // Not provided
        (timestamp instanceof Date) ? new Date(timestamp) : // JS Date()
        new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
      );
      return format.replace(formatChr, formatChrCb);
    };
    return this.date(format, timestamp);
};

exports.getdate = function (timestamp) {
  var _w = ['Sun', 'Mon', 'Tues', 'Wednes', 'Thurs', 'Fri', 'Satur'];
    var _m = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
      'November', 'December'
    ];
    var d = ((typeof timestamp === 'undefined') ? new Date() : // Not provided
      (typeof timestamp === 'object') ? new Date(timestamp) : // Javascript Date()
      new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
    );
    var w = d.getDay();
    var m = d.getMonth();
    var y = d.getFullYear();
    var r = {};
  
    r.seconds = d.getSeconds();
    r.minutes = d.getMinutes();
    r.hours = d.getHours();
    r.mday = d.getDate();
    r.wday = w;
    r.mon = m + 1;
    r.year = y;
    r.yday = Math.floor((d - (new Date(y, 0, 1))) / 86400000);
    r.weekday = _w[w] + 'day';
    r.month = _m[m];
    r['0'] = parseInt(d.getTime() / 1000, 10);
  
    return r;
};

exports.gettimeofday = function (return_float) {
  var t = new Date(),
      y = 0;
  
    if (return_float) {
      return t.getTime() / 1000;
    }
  
    y = t.getFullYear(); // Store current year.
    return {
      sec: t.getUTCSeconds(),
      usec: t.getUTCMilliseconds() * 1000,
      minuteswest: t.getTimezoneOffset(),
      // Compare Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC to see if DST is observed.
      dsttime: 0 + (((new Date(y, 0)) - Date.UTC(y, 0)) !== ((new Date(y, 6)) - Date.UTC(y, 6)))
    };
};

exports.gmmktime = function () {
  var d = new Date(),
      r = arguments,
      i = 0,
      e = ['Hours', 'Minutes', 'Seconds', 'Month', 'Date', 'FullYear'];
  
    for (i = 0; i < e.length; i++) {
      if (typeof r[i] === 'undefined') {
        r[i] = d['getUTC' + e[i]]();
        r[i] += (i === 3); // +1 to fix JS months.
      } else {
        r[i] = parseInt(r[i], 10);
        if (isNaN(r[i])) {
          return false;
        }
      }
    }
  
    // Map years 0-69 to 2000-2069 and years 70-100 to 1970-2000.
    r[5] += (r[5] >= 0 ? (r[5] <= 69 ? 2e3 : (r[5] <= 100 ? 1900 : 0)) : 0);
  
    // Set year, month (-1 to fix JS months), and date.
    // !This must come before the call to setHours!
    d.setUTCFullYear(r[5], r[3] - 1, r[4]);
  
    // Set hours, minutes, and seconds.
    d.setUTCHours(r[0], r[1], r[2]);
  
    // Divide milliseconds by 1000 to return seconds and drop decimal.
    // Add 1 second if negative or it'll be off from PHP by 1 second.
    return (d.getTime() / 1e3 >> 0) - (d.getTime() < 0);
};

exports.idate = function (format, timestamp) {
  if (format === undefined) {
      throw 'idate() expects at least 1 parameter, 0 given';
    }
    if (!format.length || format.length > 1) {
      throw 'idate format is one char';
    }
  
    // Fix: Need to allow date_default_timezone_set() (check for this.php_js.default_timezone and use)
    var date = ((typeof timestamp === 'undefined') ? new Date() : // Not provided
      (timestamp instanceof Date) ? new Date(timestamp) : // Javascript Date()
      new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
    ),
      a;
  
    switch (format) {
      case 'B':
        return Math.floor(((date.getUTCHours() * 36e2) + (date.getUTCMinutes() * 60) + date.getUTCSeconds() + 36e2) /
          86.4) % 1e3;
      case 'd':
        return date.getDate();
      case 'h':
        return date.getHours() % 12 || 12;
      case 'H':
        return date.getHours();
      case 'i':
        return date.getMinutes();
      case 'I':
        // capital 'i'
        // Logic original by getimeofday().
        // Compares Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC.
        // If they are not equal, then DST is observed.
        a = date.getFullYear();
        return 0 + (((new Date(a, 0)) - Date.UTC(a, 0)) !== ((new Date(a, 6)) - Date.UTC(a, 6)));
      case 'L':
        a = date.getFullYear();
        return (!(a & 3) && (a % 1e2 || !(a % 4e2))) ? 1 : 0;
      case 'm':
        return date.getMonth() + 1;
      case 's':
        return date.getSeconds();
      case 't':
        return (new Date(date.getFullYear(), date.getMonth() + 1, 0))
          .getDate();
      case 'U':
        return Math.round(date.getTime() / 1000);
      case 'w':
        return date.getDay();
      case 'W':
        a = new Date(date.getFullYear(), date.getMonth(), date.getDate() - (date.getDay() || 7) + 3);
        return 1 + Math.round((a - (new Date(a.getFullYear(), 0, 4))) / 864e5 / 7);
      case 'y':
        return parseInt((date.getFullYear() + '')
          .slice(2), 10); // This function returns an integer, unlike date()
      case 'Y':
        return date.getFullYear();
      case 'z':
        return Math.floor((date - new Date(date.getFullYear(), 0, 1)) / 864e5);
      case 'Z':
        return -date.getTimezoneOffset() * 60;
      default:
        throw 'Unrecognized date format token';
    }
};

exports.microtime = function (get_as_float) {
  var now = new Date()
      .getTime() / 1000;
    var s = parseInt(now, 10);
  
    return (get_as_float) ? now : (Math.round((now - s) * 1000) / 1000) + ' ' + s;
};

exports.mktime = function () {
  var d = new Date(),
      r = arguments,
      i = 0,
      e = ['Hours', 'Minutes', 'Seconds', 'Month', 'Date', 'FullYear'];
  
    for (i = 0; i < e.length; i++) {
      if (typeof r[i] === 'undefined') {
        r[i] = d['get' + e[i]]();
        r[i] += (i === 3); // +1 to fix JS months.
      } else {
        r[i] = parseInt(r[i], 10);
        if (isNaN(r[i])) {
          return false;
        }
      }
    }
  
    // Map years 0-69 to 2000-2069 and years 70-100 to 1970-2000.
    r[5] += (r[5] >= 0 ? (r[5] <= 69 ? 2e3 : (r[5] <= 100 ? 1900 : 0)) : 0);
  
    // Set year, month (-1 to fix JS months), and date.
    // !This must come before the call to setHours!
    d.setFullYear(r[5], r[3] - 1, r[4]);
  
    // Set hours, minutes, and seconds.
    d.setHours(r[0], r[1], r[2]);
  
    // Divide milliseconds by 1000 to return seconds and drop decimal.
    // Add 1 second if negative or it'll be off from PHP by 1 second.
    return (d.getTime() / 1e3 >> 0) - (d.getTime() < 0);
};

exports.strtotime = function (text, now) {
  var parsed, match, today, year, date, days, ranges, len, times, regex, i, fail = false;
  
    if (!text) {
      return fail;
    }
  
    // Unecessary spaces
    text = text.replace(/^\s+|\s+$/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/[\t\r\n]/g, '')
      .toLowerCase();
  
    // in contrast to php, js Date.parse function interprets:
    // dates given as yyyy-mm-dd as in timezone: UTC,
    // dates with "." or "-" as MDY instead of DMY
    // dates with two-digit years differently
    // etc...etc...
    // ...therefore we manually parse lots of common date formats
    match = text.match(
      /^(\d{1,4})([\-\.\/\:])(\d{1,2})([\-\.\/\:])(\d{1,4})(?:\s(\d{1,2}):(\d{2})?:?(\d{2})?)?(?:\s([A-Z]+)?)?$/);
  
    if (match && match[2] === match[4]) {
      if (match[1] > 1901) {
        switch (match[2]) {
          case '-':
            { // YYYY-M-D
              if (match[3] > 12 || match[5] > 31) {
                return fail;
              }
  
              return new Date(match[1], parseInt(match[3], 10) - 1, match[5],
                match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
            }
          case '.':
            { // YYYY.M.D is not parsed by strtotime()
              return fail;
            }
          case '/':
            { // YYYY/M/D
              if (match[3] > 12 || match[5] > 31) {
                return fail;
              }
  
              return new Date(match[1], parseInt(match[3], 10) - 1, match[5],
                match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
            }
        }
      } else if (match[5] > 1901) {
        switch (match[2]) {
          case '-':
            { // D-M-YYYY
              if (match[3] > 12 || match[1] > 31) {
                return fail;
              }
  
              return new Date(match[5], parseInt(match[3], 10) - 1, match[1],
                match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
            }
          case '.':
            { // D.M.YYYY
              if (match[3] > 12 || match[1] > 31) {
                return fail;
              }
  
              return new Date(match[5], parseInt(match[3], 10) - 1, match[1],
                match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
            }
          case '/':
            { // M/D/YYYY
              if (match[1] > 12 || match[3] > 31) {
                return fail;
              }
  
              return new Date(match[5], parseInt(match[1], 10) - 1, match[3],
                match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
            }
        }
      } else {
        switch (match[2]) {
          case '-':
            { // YY-M-D
              if (match[3] > 12 || match[5] > 31 || (match[1] < 70 && match[1] > 38)) {
                return fail;
              }
  
              year = match[1] >= 0 && match[1] <= 38 ? +match[1] + 2000 : match[1];
              return new Date(year, parseInt(match[3], 10) - 1, match[5],
                match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
            }
          case '.':
            { // D.M.YY or H.MM.SS
              if (match[5] >= 70) { // D.M.YY
                if (match[3] > 12 || match[1] > 31) {
                  return fail;
                }
  
                return new Date(match[5], parseInt(match[3], 10) - 1, match[1],
                  match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
              }
              if (match[5] < 60 && !match[6]) { // H.MM.SS
                if (match[1] > 23 || match[3] > 59) {
                  return fail;
                }
  
                today = new Date();
                return new Date(today.getFullYear(), today.getMonth(), today.getDate(),
                  match[1] || 0, match[3] || 0, match[5] || 0, match[9] || 0) / 1000;
              }
  
              return fail; // invalid format, cannot be parsed
            }
          case '/':
            { // M/D/YY
              if (match[1] > 12 || match[3] > 31 || (match[5] < 70 && match[5] > 38)) {
                return fail;
              }
  
              year = match[5] >= 0 && match[5] <= 38 ? +match[5] + 2000 : match[5];
              return new Date(year, parseInt(match[1], 10) - 1, match[3],
                match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
            }
          case ':':
            { // HH:MM:SS
              if (match[1] > 23 || match[3] > 59 || match[5] > 59) {
                return fail;
              }
  
              today = new Date();
              return new Date(today.getFullYear(), today.getMonth(), today.getDate(),
                match[1] || 0, match[3] || 0, match[5] || 0) / 1000;
            }
        }
      }
    }
  
    // other formats and "now" should be parsed by Date.parse()
    if (text === 'now') {
      return now === null || isNaN(now) ? new Date()
        .getTime() / 1000 | 0 : now | 0;
    }
    if (!isNaN(parsed = Date.parse(text))) {
      return parsed / 1000 | 0;
    }
  
    date = now ? new Date(now * 1000) : new Date();
    days = {
      'sun': 0,
      'mon': 1,
      'tue': 2,
      'wed': 3,
      'thu': 4,
      'fri': 5,
      'sat': 6
    };
    ranges = {
      'yea': 'FullYear',
      'mon': 'Month',
      'day': 'Date',
      'hou': 'Hours',
      'min': 'Minutes',
      'sec': 'Seconds'
    };
  
    function lastNext(type, range, modifier) {
      var diff, day = days[range];
  
      if (typeof day !== 'undefined') {
        diff = day - date.getDay();
  
        if (diff === 0) {
          diff = 7 * modifier;
        } else if (diff > 0 && type === 'last') {
          diff -= 7;
        } else if (diff < 0 && type === 'next') {
          diff += 7;
        }
  
        date.setDate(date.getDate() + diff);
      }
    }
  
    function process(val) {
      var splt = val.split(' '), // Todo: Reconcile this with regex using \s, taking into account browser issues with split and regexes
        type = splt[0],
        range = splt[1].substring(0, 3),
        typeIsNumber = /\d+/.test(type),
        ago = splt[2] === 'ago',
        num = (type === 'last' ? -1 : 1) * (ago ? -1 : 1);
  
      if (typeIsNumber) {
        num *= parseInt(type, 10);
      }
  
      if (ranges.hasOwnProperty(range) && !splt[1].match(/^mon(day|\.)?$/i)) {
        return date['set' + ranges[range]](date['get' + ranges[range]]() + num);
      }
  
      if (range === 'wee') {
        return date.setDate(date.getDate() + (num * 7));
      }
  
      if (type === 'next' || type === 'last') {
        lastNext(type, range, num);
      } else if (!typeIsNumber) {
        return false;
      }
  
      return true;
    }
  
    times = '(years?|months?|weeks?|days?|hours?|minutes?|min|seconds?|sec' +
      '|sunday|sun\\.?|monday|mon\\.?|tuesday|tue\\.?|wednesday|wed\\.?' +
      '|thursday|thu\\.?|friday|fri\\.?|saturday|sat\\.?)';
    regex = '([+-]?\\d+\\s' + times + '|' + '(last|next)\\s' + times + ')(\\sago)?';
  
    match = text.match(new RegExp(regex, 'gi'));
    if (!match) {
      return fail;
    }
  
    for (i = 0, len = match.length; i < len; i++) {
      if (!process(match[i])) {
        return fail;
      }
    }
  
    // ECMAScript 5 only
    // if (!match.every(process))
    //    return false;
  
    return (date.getTime() / 1000);
};

exports.time = function () {
  return Math.floor(new Date()
      .getTime() / 1000);
};

exports.escapeshellarg = function (arg) {
  var ret = '';
  
    ret = arg.replace(/[^\\]'/g, function(m, i, s) {
      return m.slice(0, 1) + '\\\'';
    });
  
    return "'" + ret + "'";
};

exports.basename = function (path, suffix) {
  var b = path;
    var lastChar = b.charAt(b.length - 1);
  
    if (lastChar === '/' || lastChar === '\\') {
      b = b.slice(0, -1);
    }
  
    b = b.replace(/^.*[\/\\]/g, '');
  
    if (typeof suffix === 'string' && b.substr(b.length - suffix.length) == suffix) {
      b = b.substr(0, b.length - suffix.length);
    }
  
    return b;
};

exports.dirname = function (path) {
  return path.replace(/\\/g, '/')
      .replace(/\/[^\/]*\/?$/, '');
};

exports.file_get_contents = function (url, flags, context, offset, maxLen) {
  var tmp, headers = [],
      newTmp = [],
      k = 0,
      i = 0,
      href = '',
      pathPos = -1,
      flagNames = 0,
      content = null,
      http_stream = false;
    var func = function(value) {
      return value.substring(1) !== '';
    };
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    var ini = this.php_js.ini;
    context = context || this.php_js.default_streams_context || null;
  
    if (!flags) {
      flags = 0;
    }
    var OPTS = {
      FILE_USE_INCLUDE_PATH: 1,
      FILE_TEXT: 32,
      FILE_BINARY: 64
    };
    if (typeof flags === 'number') { // Allow for a single string or an array of string flags
      flagNames = flags;
    } else {
      flags = [].concat(flags);
      for (i = 0; i < flags.length; i++) {
        if (OPTS[flags[i]]) {
          flagNames = flagNames | OPTS[flags[i]];
        }
      }
    }
  
    if (flagNames & OPTS.FILE_BINARY && (flagNames & OPTS.FILE_TEXT)) { // These flags shouldn't be together
      throw 'You cannot pass both FILE_BINARY and FILE_TEXT to file_get_contents()';
    }
  
    if ((flagNames & OPTS.FILE_USE_INCLUDE_PATH) && ini.include_path && ini.include_path.local_value) {
      var slash = ini.include_path.local_value.indexOf('/') !== -1 ? '/' : '\\';
      url = ini.include_path.local_value + slash + url;
    } else if (!/^(https?|file):/.test(url)) { // Allow references within or below the same directory (should fix to allow other relative references or root reference; could make dependent on parse_url())
      href = this.window.location.href;
      pathPos = url.indexOf('/') === 0 ? href.indexOf('/', 8) - 1 : href.lastIndexOf('/');
      url = href.slice(0, pathPos + 1) + url;
    }
  
    var http_options;
    if (context) {
      http_options = context.stream_options && context.stream_options.http;
      http_stream = !! http_options;
    }
  
    if (!context || http_stream) {
      var req = this.window.ActiveXObject ? new ActiveXObject('Microsoft.XMLHTTP') : new XMLHttpRequest();
      if (!req) {
        throw new Error('XMLHttpRequest not supported');
      }
  
      var method = http_stream ? http_options.method : 'GET';
      var async = !! (context && context.stream_params && context.stream_params['phpjs.async']);
  
      if (ini['phpjs.ajaxBypassCache'] && ini['phpjs.ajaxBypassCache'].local_value) {
        url += (url.match(/\?/) == null ? '?' : '&') + (new Date())
          .getTime(); // Give optional means of forcing bypass of cache
      }
  
      req.open(method, url, async);
      if (async) {
        var notification = context.stream_params.notification;
        if (typeof notification === 'function') {
          // Fix: make work with req.addEventListener if available: https://developer.mozilla.org/En/Using_XMLHttpRequest
          if (0 && req.addEventListener) { // Unimplemented so don't allow to get here
            /*
            req.addEventListener('progress', updateProgress, false);
            req.addEventListener('load', transferComplete, false);
            req.addEventListener('error', transferFailed, false);
            req.addEventListener('abort', transferCanceled, false);
            */
          } else {
            req.onreadystatechange = function(aEvt) { // aEvt has stopPropagation(), preventDefault(); see https://developer.mozilla.org/en/NsIDOMEvent
              // Other XMLHttpRequest properties: multipart, responseXML, status, statusText, upload, withCredentials
              /*
    PHP Constants:
    STREAM_NOTIFY_RESOLVE   1       A remote address required for this stream has been resolved, or the resolution failed. See severity  for an indication of which happened.
    STREAM_NOTIFY_CONNECT   2     A connection with an external resource has been established.
    STREAM_NOTIFY_AUTH_REQUIRED 3     Additional authorization is required to access the specified resource. Typical issued with severity level of STREAM_NOTIFY_SEVERITY_ERR.
    STREAM_NOTIFY_MIME_TYPE_IS  4     The mime-type of resource has been identified, refer to message for a description of the discovered type.
    STREAM_NOTIFY_FILE_SIZE_IS  5     The size of the resource has been discovered.
    STREAM_NOTIFY_REDIRECTED    6     The external resource has redirected the stream to an alternate location. Refer to message .
    STREAM_NOTIFY_PROGRESS  7     Indicates current progress of the stream transfer in bytes_transferred and possibly bytes_max as well.
    STREAM_NOTIFY_COMPLETED 8     There is no more data available on the stream.
    STREAM_NOTIFY_FAILURE   9     A generic error occurred on the stream, consult message and message_code for details.
    STREAM_NOTIFY_AUTH_RESULT   10     Authorization has been completed (with or without success).
  
    STREAM_NOTIFY_SEVERITY_INFO 0     Normal, non-error related, notification.
    STREAM_NOTIFY_SEVERITY_WARN 1     Non critical error condition. Processing may continue.
    STREAM_NOTIFY_SEVERITY_ERR  2     A critical error occurred. Processing cannot continue.
    */
              var objContext = {
                responseText: req.responseText,
                responseXML: req.responseXML,
                status: req.status,
                statusText: req.statusText,
                readyState: req.readyState,
                evt: aEvt
              }; // properties are not available in PHP, but offered on notification via 'this' for convenience
              // notification args: notification_code, severity, message, message_code, bytes_transferred, bytes_max (all int's except string 'message')
              // Need to add message, etc.
              var bytes_transferred;
              switch (req.readyState) {
                case 0:
                  //     UNINITIALIZED     open() has not been called yet.
                  notification.call(objContext, 0, 0, '', 0, 0, 0);
                  break;
                case 1:
                  //     LOADING     send() has not been called yet.
                  notification.call(objContext, 0, 0, '', 0, 0, 0);
                  break;
                case 2:
                  //     LOADED     send() has been called, and headers and status are available.
                  notification.call(objContext, 0, 0, '', 0, 0, 0);
                  break;
                case 3:
                  //     INTERACTIVE     Downloading; responseText holds partial data.
                  bytes_transferred = req.responseText.length * 2; // One character is two bytes
                  notification.call(objContext, 7, 0, '', 0, bytes_transferred, 0);
                  break;
                case 4:
                  //     COMPLETED     The operation is complete.
                  if (req.status >= 200 && req.status < 400) {
                    bytes_transferred = req.responseText.length * 2; // One character is two bytes
                    notification.call(objContext, 8, 0, '', req.status, bytes_transferred, 0);
                  } else if (req.status === 403) { // Fix: These two are finished except for message
                    notification.call(objContext, 10, 2, '', req.status, 0, 0);
                  } else { // Errors
                    notification.call(objContext, 9, 2, '', req.status, 0, 0);
                  }
                  break;
                default:
                  throw 'Unrecognized ready state for file_get_contents()';
              }
            };
          }
        }
      }
  
      if (http_stream) {
        var sendHeaders = http_options.header && http_options.header.split(/\r?\n/);
        var userAgentSent = false;
        for (i = 0; i < sendHeaders.length; i++) {
          var sendHeader = sendHeaders[i];
          var breakPos = sendHeader.search(/:\s*/);
          var sendHeaderName = sendHeader.substring(0, breakPos);
          req.setRequestHeader(sendHeaderName, sendHeader.substring(breakPos + 1));
          if (sendHeaderName === 'User-Agent') {
            userAgentSent = true;
          }
        }
        if (!userAgentSent) {
          var user_agent = http_options.user_agent || (ini.user_agent && ini.user_agent.local_value);
          if (user_agent) {
            req.setRequestHeader('User-Agent', user_agent);
          }
        }
        content = http_options.content || null;
        /*
        // Presently unimplemented HTTP context options
        var request_fulluri = http_options.request_fulluri || false; // When set to TRUE, the entire URI will be used when constructing the request. (i.e. GET http://www.example.com/path/to/file.html HTTP/1.0). While this is a non-standard request format, some proxy servers require it.
        var max_redirects = http_options.max_redirects || 20; // The max number of redirects to follow. Value 1 or less means that no redirects are followed.
        var protocol_version = http_options.protocol_version || 1.0; // HTTP protocol version
        var timeout = http_options.timeout || (ini.default_socket_timeout && ini.default_socket_timeout.local_value); // Read timeout in seconds, specified by a float
        var ignore_errors = http_options.ignore_errors || false; // Fetch the content even on failure status codes.
        */
      }
  
      if (flagNames & OPTS.FILE_TEXT) { // Overrides how encoding is treated (regardless of what is returned from the server)
        var content_type = 'text/html';
        if (http_options && http_options['phpjs.override']) { // Fix: Could allow for non-HTTP as well
          content_type = http_options['phpjs.override']; // We use this, e.g., in gettext-related functions if character set
          //   overridden earlier by bind_textdomain_codeset()
        } else {
          var encoding = (ini['unicode.stream_encoding'] && ini['unicode.stream_encoding'].local_value) ||
            'UTF-8';
          if (http_options && http_options.header && (/^content-type:/im)
            .test(http_options.header)) { // We'll assume a content-type expects its own specified encoding if present
            content_type = http_options.header.match(/^content-type:\s*(.*)$/im)[1]; // We let any header encoding stand
          }
          if (!(/;\s*charset=/)
            .test(content_type)) { // If no encoding
            content_type += '; charset=' + encoding;
          }
        }
        req.overrideMimeType(content_type);
      }
      // Default is FILE_BINARY, but for binary, we apparently deviate from PHP in requiring the flag, since many if not
      //     most people will also want a way to have it be auto-converted into native JavaScript text instead
      else if (flagNames & OPTS.FILE_BINARY) { // Trick at https://developer.mozilla.org/En/Using_XMLHttpRequest to get binary
        req.overrideMimeType('text/plain; charset=x-user-defined');
        // Getting an individual byte then requires:
        // responseText.charCodeAt(x) & 0xFF; // throw away high-order byte (f7) where x is 0 to responseText.length-1 (see notes in our substr())
      }
  
      try {
        if (http_options && http_options['phpjs.sendAsBinary']) { // For content sent in a POST or PUT request (use with file_put_contents()?)
          req.sendAsBinary(content); // In Firefox, only available FF3+
        } else {
          req.send(content);
        }
      } catch (e) {
        // catches exception reported in issue #66
        return false;
      }
  
      tmp = req.getAllResponseHeaders();
      if (tmp) {
        tmp = tmp.split('\n');
        for (k = 0; k < tmp.length; k++) {
          if (func(tmp[k])) {
            newTmp.push(tmp[k]);
          }
        }
        tmp = newTmp;
        for (i = 0; i < tmp.length; i++) {
          headers[i] = tmp[i];
        }
        this.$http_response_header = headers; // see http://php.net/manual/en/reserved.variables.httpresponseheader.php
      }
  
      if (offset || maxLen) {
        if (maxLen) {
          return req.responseText.substr(offset || 0, maxLen);
        }
        return req.responseText.substr(offset);
      }
      return req.responseText;
    }
    return false;
};

exports.realpath = function (path) {
  var p = 0,
      arr = []; /* Save the root, if not given */
    var r = this.window.location.href; /* Avoid input failures */
    path = (path + '')
      .replace('\\', '/'); /* Check if there's a port in path (like 'http://') */
    if (path.indexOf('://') !== -1) {
      p = 1;
    } /* Ok, there's not a port in path, so let's take the root */
    if (!p) {
      path = r.substring(0, r.lastIndexOf('/') + 1) + path;
    } /* Explode the given path into it's parts */
    arr = path.split('/'); /* The path is an array now */
    path = []; /* Foreach part make a check */
    for (var k in arr) { /* This is'nt really interesting */
      if (arr[k] == '.') {
        continue;
      } /* This reduces the realpath */
      if (arr[k] == '..') {
        /* But only if there more than 3 parts in the path-array.
         * The first three parts are for the uri */
        if (path.length > 3) {
          path.pop();
        }
      } /* This adds parts to the realpath */
      else {
        /* But only if the part is not empty or the uri
         * (the first three parts ar needed) was not
         * saved */
        if ((path.length < 2) || (arr[k] !== '')) {
          path.push(arr[k]);
        }
      }
    } /* Returns the absloute path as a string */
    return path.join('/');
};

exports.call_user_func = function (cb) {
  var func;
  
    if (typeof cb === 'string') {
      func = (typeof this[cb] === 'function') ? this[cb] : func = (new Function(null, 'return ' + cb))();
    } else if (Object.prototype.toString.call(cb) === '[object Array]') {
      func = (typeof cb[0] === 'string') ? eval(cb[0] + "['" + cb[1] + "']") : func = cb[0][cb[1]];
    } else if (typeof cb === 'function') {
      func = cb;
    }
  
    if (typeof func !== 'function') {
      throw new Error(func + ' is not a valid function');
    }
  
    var parameters = Array.prototype.slice.call(arguments, 1);
    return (typeof cb[0] === 'string') ? func.apply(eval(cb[0]), parameters) : (typeof cb[0] !== 'object') ? func.apply(
      null, parameters) : func.apply(cb[0], parameters);
};

exports.call_user_func_array = function (cb, parameters) {
  var func;
  
    if (typeof cb === 'string') {
      func = (typeof this[cb] === 'function') ? this[cb] : func = (new Function(null, 'return ' + cb))();
    } else if (Object.prototype.toString.call(cb) === '[object Array]') {
      func = (typeof cb[0] === 'string') ? eval(cb[0] + "['" + cb[1] + "']") : func = cb[0][cb[1]];
    } else if (typeof cb === 'function') {
      func = cb;
    }
  
    if (typeof func !== 'function') {
      throw new Error(func + ' is not a valid function');
    }
  
    return (typeof cb[0] === 'string') ? func.apply(eval(cb[0]), parameters) : (typeof cb[0] !== 'object') ? func.apply(
      null, parameters) : func.apply(cb[0], parameters);
};

exports.create_function = function (args, code) {
  try {
      return Function.apply(null, args.split(',')
        .concat(code));
    } catch (e) {
      return false;
    }
};

exports.function_exists = function (func_name) {
  if (typeof func_name === 'string') {
      func_name = this.window[func_name];
    }
    return typeof func_name === 'function';
};

exports.get_defined_functions = function () {
  var i = '',
      arr = [],
      already = {};
  
    for (i in this.window) {
      try {
        if (typeof this.window[i] === 'function') {
          if (!already[i]) {
            already[i] = 1;
            arr.push(i);
          }
        } else if (typeof this.window[i] === 'object') {
          for (var j in this.window[i]) {
            if (typeof this.window[j] === 'function' && this.window[j] && !already[j]) {
              already[j] = 1;
              arr.push(j);
            }
          }
        }
      } catch (e) {
        // Some objects in Firefox throw exceptions when their properties are accessed (e.g., sessionStorage)
      }
    }
  
    return arr;
};

exports.i18n_loc_set_default = function (name) {
  // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    // END REDUNDANT
  
    this.php_js.i18nLocales = {
      en_US_POSIX: {
        sorting: function(str1, str2) { // Fix: This one taken from strcmp, but need for other locales; we don't use localeCompare since its locale is not settable
          return (str1 == str2) ? 0 : ((str1 > str2) ? 1 : -1);
        }
      }
    };
  
    this.php_js.i18nLocale = name;
    return true;
};

exports.assert_options = function (what, value) {
  // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    this.php_js.assert_values = this.php_js.assert_values || {};
    // END REDUNDANT
  
    var ini, dflt;
    switch (what) {
      case 'ASSERT_ACTIVE':
        ini = 'assert.active';
        dflt = 1;
        break;
      case 'ASSERT_WARNING':
        ini = 'assert.warning';
        dflt = 1;
        throw 'We have not yet implemented warnings for us to throw in JavaScript (assert_options())';
      case 'ASSERT_BAIL':
        ini = 'assert.bail';
        dflt = 0;
        break;
      case 'ASSERT_QUIET_EVAL':
        ini = 'assert.quiet_eval';
        dflt = 0;
        break;
      case 'ASSERT_CALLBACK':
        ini = 'assert.callback';
        dflt = null;
        break;
      default:
        throw 'Improper type for assert_options()';
    }
    // I presume this is to be the most recent value, instead of the default value
    var originalValue = this.php_js.assert_values[ini] || (this.php_js.ini[ini] && this.php_js.ini[ini].local_value) ||
      dflt;
  
    if (value) {
      this.php_js.assert_values[ini] = value; // We use 'ini' instead of 'what' as key to be more convenient for assert() to test for current value
    }
    return originalValue;
};

exports.getenv = function (varname) {
  if (!this.php_js || !this.php_js.ENV || !this.php_js.ENV[varname]) {
      return false;
    }
  
    return this.php_js.ENV[varname];
};

exports.getlastmod = function () {
  return new Date(this.window.document.lastModified)
      .getTime() / 1000;
};

exports.ini_get = function (varname) {
  if (this.php_js && this.php_js.ini && this.php_js.ini[varname] && this.php_js.ini[varname].local_value !==
      undefined) {
      if (this.php_js.ini[varname].local_value === null) {
        return '';
      }
      return this.php_js.ini[varname].local_value;
    }
  
    return '';
};

exports.ini_set = function (varname, newvalue) {
  var oldval = '';
    var self = this;
  
    try {
      this.php_js = this.php_js || {};
    } catch (e) {
      this.php_js = {};
    }
  
    this.php_js.ini = this.php_js.ini || {};
    this.php_js.ini[varname] = this.php_js.ini[varname] || {};
  
    oldval = this.php_js.ini[varname].local_value;
  
    var _setArr = function(oldval) {
      // Although these are set individually, they are all accumulated
      if (typeof oldval === 'undefined') {
        self.php_js.ini[varname].local_value = [];
      }
      self.php_js.ini[varname].local_value.push(newvalue);
    };
  
    switch (varname) {
      case 'extension':
        if (typeof this.dl === 'function') {
          // This function is only experimental in php.js
          this.dl(newvalue);
        }
        _setArr(oldval, newvalue);
        break;
      default:
        this.php_js.ini[varname].local_value = newvalue;
        break;
    }
  
    return oldval;
};

exports.set_time_limit = function (seconds) {
  // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    // END REDUNDANT
  
    this.window.setTimeout(function() {
      if (!this.php_js.timeoutStatus) {
        this.php_js.timeoutStatus = true;
      }
      throw 'Maximum execution time exceeded';
    }, seconds * 1000);
};

exports.version_compare = function (v1, v2, operator) {
  this.php_js = this.php_js || {};
    this.php_js.ENV = this.php_js.ENV || {};
    // END REDUNDANT
    // Important: compare must be initialized at 0.
    var i = 0,
      x = 0,
      compare = 0,
      // vm maps textual PHP versions to negatives so they're less than 0.
      // PHP currently defines these as CASE-SENSITIVE. It is important to
      // leave these as negatives so that they can come before numerical versions
      // and as if no letters were there to begin with.
      // (1alpha is < 1 and < 1.1 but > 1dev1)
      // If a non-numerical value can't be mapped to this table, it receives
      // -7 as its value.
      vm = {
        'dev': -6,
        'alpha': -5,
        'a': -5,
        'beta': -4,
        'b': -4,
        'RC': -3,
        'rc': -3,
        '#': -2,
        'p': 1,
        'pl': 1
      },
      // This function will be called to prepare each version argument.
      // It replaces every _, -, and + with a dot.
      // It surrounds any nonsequence of numbers/dots with dots.
      // It replaces sequences of dots with a single dot.
      //    version_compare('4..0', '4.0') == 0
      // Important: A string of 0 length needs to be converted into a value
      // even less than an unexisting value in vm (-7), hence [-8].
      // It's also important to not strip spaces because of this.
      //   version_compare('', ' ') == 1
      prepVersion = function(v) {
        v = ('' + v)
          .replace(/[_\-+]/g, '.');
        v = v.replace(/([^.\d]+)/g, '.$1.')
          .replace(/\.{2,}/g, '.');
        return (!v.length ? [-8] : v.split('.'));
      };
    // This converts a version component to a number.
    // Empty component becomes 0.
    // Non-numerical component becomes a negative number.
    // Numerical component becomes itself as an integer.
    numVersion = function(v) {
      return !v ? 0 : (isNaN(v) ? vm[v] || -7 : parseInt(v, 10));
    };
    v1 = prepVersion(v1);
    v2 = prepVersion(v2);
    x = Math.max(v1.length, v2.length);
    for (i = 0; i < x; i++) {
      if (v1[i] == v2[i]) {
        continue;
      }
      v1[i] = numVersion(v1[i]);
      v2[i] = numVersion(v2[i]);
      if (v1[i] < v2[i]) {
        compare = -1;
        break;
      } else if (v1[i] > v2[i]) {
        compare = 1;
        break;
      }
    }
    if (!operator) {
      return compare;
    }
  
    // Important: operator is CASE-SENSITIVE.
    // "No operator" seems to be treated as "<."
    // Any other values seem to make the function return null.
    switch (operator) {
      case '>':
      case 'gt':
        return (compare > 0);
      case '>=':
      case 'ge':
        return (compare >= 0);
      case '<=':
      case 'le':
        return (compare <= 0);
      case '==':
      case '=':
      case 'eq':
        return (compare === 0);
      case '<>':
      case '!=':
      case 'ne':
        return (compare !== 0);
      case '':
      case '<':
      case 'lt':
        return (compare < 0);
      default:
        return null;
    }
};

exports.json_decode = function (str_json) {
  /*
      http://www.JSON.org/json2.js
      2008-11-19
      Public Domain.
      NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
      See http://www.JSON.org/js.html
    */
  
    var json = this.window.JSON;
    if (typeof json === 'object' && typeof json.parse === 'function') {
      try {
        return json.parse(str_json);
      } catch (err) {
        if (!(err instanceof SyntaxError)) {
          throw new Error('Unexpected error type in json_decode()');
        }
        this.php_js = this.php_js || {};
        this.php_js.last_error_json = 4; // usable by json_last_error()
        return null;
      }
    }
  
    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    var j;
    var text = str_json;
  
    // Parsing happens in four stages. In the first stage, we replace certain
    // Unicode characters with escape sequences. JavaScript handles many characters
    // incorrectly, either silently deleting them, or treating them as line endings.
    cx.lastIndex = 0;
    if (cx.test(text)) {
      text = text.replace(cx, function(a) {
        return '\\u' + ('0000' + a.charCodeAt(0)
          .toString(16))
          .slice(-4);
      });
    }
  
    // In the second stage, we run the text against regular expressions that look
    // for non-JSON patterns. We are especially concerned with '()' and 'new'
    // because they can cause invocation, and '=' because it can cause mutation.
    // But just to be safe, we want to reject all unexpected forms.
    // We split the second stage into 4 regexp operations in order to work around
    // crippling inefficiencies in IE's and Safari's regexp engines. First we
    // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
    // replace all simple value tokens with ']' characters. Third, we delete all
    // open brackets that follow a colon or comma or that begin the text. Finally,
    // we look to see that the remaining characters are only whitespace or ']' or
    // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.
    if ((/^[\],:{}\s]*$/)
      .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
  
      // In the third stage we use the eval function to compile the text into a
      // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
      // in JavaScript: it can begin a block or an object literal. We wrap the text
      // in parens to eliminate the ambiguity.
      j = eval('(' + text + ')');
  
      return j;
    }
  
    this.php_js = this.php_js || {};
    this.php_js.last_error_json = 4; // usable by json_last_error()
    return null;
};

exports.json_encode = function (mixed_val) {
  /*
      http://www.JSON.org/json2.js
      2008-11-19
      Public Domain.
      NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
      See http://www.JSON.org/js.html
    */
    var retVal, json = this.window.JSON;
    try {
      if (typeof json === 'object' && typeof json.stringify === 'function') {
        retVal = json.stringify(mixed_val); // Errors will not be caught here if our own equivalent to resource
        //  (an instance of PHPJS_Resource) is used
        if (retVal === undefined) {
          throw new SyntaxError('json_encode');
        }
        return retVal;
      }
  
      var value = mixed_val;
  
      var quote = function(string) {
        var escapable =
          /[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        var meta = { // table of character substitutions
          '\b': '\\b',
          '\t': '\\t',
          '\n': '\\n',
          '\f': '\\f',
          '\r': '\\r',
          '"': '\\"',
          '\\': '\\\\'
        };
  
        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
          var c = meta[a];
          return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0)
            .toString(16))
            .slice(-4);
        }) + '"' : '"' + string + '"';
      };
  
      var str = function(key, holder) {
        var gap = '';
        var indent = '    ';
        var i = 0; // The loop counter.
        var k = ''; // The member key.
        var v = ''; // The member value.
        var length = 0;
        var mind = gap;
        var partial = [];
        var value = holder[key];
  
        // If the value has a toJSON method, call it to obtain a replacement value.
        if (value && typeof value === 'object' && typeof value.toJSON === 'function') {
          value = value.toJSON(key);
        }
  
        // What happens next depends on the value's type.
        switch (typeof value) {
          case 'string':
            return quote(value);
  
          case 'number':
            // JSON numbers must be finite. Encode non-finite numbers as null.
            return isFinite(value) ? String(value) : 'null';
  
          case 'boolean':
          case 'null':
            // If the value is a boolean or null, convert it to a string. Note:
            // typeof null does not produce 'null'. The case is included here in
            // the remote chance that this gets fixed someday.
            return String(value);
  
          case 'object':
            // If the type is 'object', we might be dealing with an object or an array or
            // null.
            // Due to a specification blunder in ECMAScript, typeof null is 'object',
            // so watch out for that case.
            if (!value) {
              return 'null';
            }
            if ((this.PHPJS_Resource && value instanceof this.PHPJS_Resource) || (window.PHPJS_Resource &&
              value instanceof window.PHPJS_Resource)) {
              throw new SyntaxError('json_encode');
            }
  
            // Make an array to hold the partial results of stringifying this object value.
            gap += indent;
            partial = [];
  
            // Is the value an array?
            if (Object.prototype.toString.apply(value) === '[object Array]') {
              // The value is an array. Stringify every element. Use null as a placeholder
              // for non-JSON values.
              length = value.length;
              for (i = 0; i < length; i += 1) {
                partial[i] = str(i, value) || 'null';
              }
  
              // Join all of the elements together, separated with commas, and wrap them in
              // brackets.
              v = partial.length === 0 ? '[]' : gap ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind +
                ']' : '[' + partial.join(',') + ']';
              gap = mind;
              return v;
            }
  
            // Iterate through all of the keys in the object.
            for (k in value) {
              if (Object.hasOwnProperty.call(value, k)) {
                v = str(k, value);
                if (v) {
                  partial.push(quote(k) + (gap ? ': ' : ':') + v);
                }
              }
            }
  
            // Join all of the member texts together, separated with commas,
            // and wrap them in braces.
            v = partial.length === 0 ? '{}' : gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
              '{' + partial.join(',') + '}';
            gap = mind;
            return v;
          case 'undefined':
            // Fall-through
          case 'function':
            // Fall-through
          default:
            throw new SyntaxError('json_encode');
        }
      };
  
      // Make a fake root object containing our value under the key of ''.
      // Return the result of stringifying the value.
      return str('', {
        '': value
      });
  
    } catch (err) { // Todo: ensure error handling above throws a SyntaxError in all cases where it could
      // (i.e., when the JSON global is not available and there is an error)
      if (!(err instanceof SyntaxError)) {
        throw new Error('Unexpected error type in json_encode()');
      }
      this.php_js = this.php_js || {};
      this.php_js.last_error_json = 4; // usable by json_last_error()
      return null;
    }
};

exports.json_last_error = function () {
  /*
    JSON_ERROR_NONE = 0
    JSON_ERROR_DEPTH = 1 // max depth limit to be removed per PHP comments in json.c (not possible in JS?)
    JSON_ERROR_STATE_MISMATCH = 2 // internal use? also not documented
    JSON_ERROR_CTRL_CHAR = 3 // [\u0000-\u0008\u000B-\u000C\u000E-\u001F] if used directly within json_decode(),
                                    // but JSON functions auto-escape these, so error not possible in JavaScript
    JSON_ERROR_SYNTAX = 4
    */
    return this.php_js && this.php_js.last_error_json ? this.php_js.last_error_json : 0;
};

exports.abs = function (mixed_number) {
  return Math.abs(mixed_number) || 0;
};

exports.acos = function (arg) {
  return Math.acos(arg);
};

exports.acosh = function (arg) {
  return Math.log(arg + Math.sqrt(arg * arg - 1));
};

exports.asin = function (arg) {
  return Math.asin(arg);
};

exports.asinh = function (arg) {
  return Math.log(arg + Math.sqrt(arg * arg + 1));
};

exports.atan = function (arg) {
  return Math.atan(arg);
};

exports.atan2 = function (y, x) {
  return Math.atan2(y, x);
};

exports.atanh = function (arg) {
  return 0.5 * Math.log((1 + arg) / (1 - arg));
};

exports.base_convert = function (number, frombase, tobase) {
  return parseInt(number + '', frombase | 0)
      .toString(tobase | 0);
};

exports.bindec = function (binary_string) {
  binary_string = (binary_string + '')
      .replace(/[^01]/gi, '');
    return parseInt(binary_string, 2);
};

exports.ceil = function (value) {
  return Math.ceil(value);
};

exports.cos = function (arg) {
  return Math.cos(arg);
};

exports.cosh = function (arg) {
  return (Math.exp(arg) + Math.exp(-arg)) / 2;
};

exports.decbin = function (number) {
  if (number < 0) {
      number = 0xFFFFFFFF + number + 1;
    }
    return parseInt(number, 10)
      .toString(2);
};

exports.dechex = function (number) {
  if (number < 0) {
      number = 0xFFFFFFFF + number + 1;
    }
    return parseInt(number, 10)
      .toString(16);
};

exports.decoct = function (number) {
  if (number < 0) {
      number = 0xFFFFFFFF + number + 1;
    }
    return parseInt(number, 10)
      .toString(8);
};

exports.deg2rad = function (angle) {
  return angle * .017453292519943295; // (angle / 180) * Math.PI;
};

exports.exp = function (arg) {
  return Math.exp(arg);
};

exports.expm1 = function (x) {
  var ret = 0,
      n = 50; // degree of precision
    var factorial = function factorial(n) {
      if ((n === 0) || (n === 1)) {
        return 1;
      } else {
        var result = (n * factorial(n - 1));
        return result;
      }
    };
    for (var i = 1; i < n; i++) {
      ret += Math.pow(x, i) / factorial(i);
    }
    return ret;
};

exports.floor = function (value) {
  return Math.floor(value);
};

exports.fmod = function (x, y) {
  var tmp, tmp2, p = 0,
      pY = 0,
      l = 0.0,
      l2 = 0.0;
  
    tmp = x.toExponential()
      .match(/^.\.?(.*)e(.+)$/);
    p = parseInt(tmp[2], 10) - (tmp[1] + '')
      .length;
    tmp = y.toExponential()
      .match(/^.\.?(.*)e(.+)$/);
    pY = parseInt(tmp[2], 10) - (tmp[1] + '')
      .length;
  
    if (pY > p) {
      p = pY;
    }
  
    tmp2 = (x % y);
  
    if (p < -100 || p > 20) {
      // toFixed will give an out of bound error so we fix it like this:
      l = Math.round(Math.log(tmp2) / Math.log(10));
      l2 = Math.pow(10, l);
  
      return (tmp2 / l2)
        .toFixed(l - p) * l2;
    } else {
      return parseFloat(tmp2.toFixed(-p));
    }
};

exports.getrandmax = function () {
  return 2147483647;
};

exports.hexdec = function (hex_string) {
  hex_string = (hex_string + '')
      .replace(/[^a-f0-9]/gi, '');
    return parseInt(hex_string, 16);
};

exports.hypot = function (x, y) {
  return Math.sqrt(x * x + y * y) || 0;
};

exports.is_finite = function (val) {
  var warningType = '';
  
    if (val === Infinity || val === -Infinity) {
      return false;
    }
  
    //Some warnings for maximum PHP compatibility
    if (typeof val === 'object') {
      warningType = (Object.prototype.toString.call(val) === '[object Array]' ? 'array' : 'object');
    } else if (typeof val === 'string' && !val.match(/^[\+\-]?\d/)) {
      //simulate PHP's behaviour: '-9a' doesn't give a warning, but 'a9' does.
      warningType = 'string';
    }
    if (warningType) {
      throw new Error('Warning: is_finite() expects parameter 1 to be double, ' + warningType + ' given');
    }
  
    return true;
};

exports.is_infinite = function (val) {
  var warningType = '';
  
    if (val === Infinity || val === -Infinity) {
      return true;
    }
  
    //Some warnings for maximum PHP compatibility
    if (typeof val === 'object') {
      warningType = (Object.prototype.toString.call(val) === '[object Array]' ? 'array' : 'object');
    } else if (typeof val === 'string' && !val.match(/^[\+\-]?\d/)) {
      //simulate PHP's behaviour: '-9a' doesn't give a warning, but 'a9' does.
      warningType = 'string';
    }
    if (warningType) {
      throw new Error('Warning: is_infinite() expects parameter 1 to be double, ' + warningType + ' given');
    }
  
    return false;
};

exports.is_nan = function (val) {
  var warningType = '';
  
    if (typeof val === 'number' && isNaN(val)) {
      return true;
    }
  
    //Some errors for maximum PHP compatibility
    if (typeof val === 'object') {
      warningType = (Object.prototype.toString.call(val) === '[object Array]' ? 'array' : 'object');
    } else if (typeof val === 'string' && !val.match(/^[\+\-]?\d/)) {
      //simulate PHP's behaviour: '-9a' doesn't give a warning, but 'a9' does.
      warningType = 'string';
    }
    if (warningType) {
      throw new Error('Warning: is_nan() expects parameter 1 to be double, ' + warningType + ' given');
    }
  
    return false;
};

exports.lcg_value = function () {
  return Math.random();
};

exports.log = function (arg, base) {
  return (typeof base === 'undefined') ?
      Math.log(arg) :
      Math.log(arg) / Math.log(base);
};

exports.log10 = function (arg) {
  return Math.log(arg) / 2.302585092994046; // Math.LN10
};

exports.log1p = function (x) {
  var ret = 0,
      n = 50; // degree of precision
    if (x <= -1) {
      return '-INF'; // JavaScript style would be to return Number.NEGATIVE_INFINITY
    }
    if (x < 0 || x > 1) {
      return Math.log(1 + x);
    }
    for (var i = 1; i < n; i++) {
      if ((i % 2) === 0) {
        ret -= Math.pow(x, i) / i;
      } else {
        ret += Math.pow(x, i) / i;
      }
    }
    return ret;
};

exports.max = function () {
  var ar, retVal, i = 0,
      n = 0,
      argv = arguments,
      argc = argv.length,
      _obj2Array = function(obj) {
        if (Object.prototype.toString.call(obj) === '[object Array]') {
          return obj;
        } else {
          var ar = [];
          for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
              ar.push(obj[i]);
            }
          }
          return ar;
        }
      }; //function _obj2Array
    _compare = function(current, next) {
      var i = 0,
        n = 0,
        tmp = 0,
        nl = 0,
        cl = 0;
  
      if (current === next) {
        return 0;
      } else if (typeof current === 'object') {
        if (typeof next === 'object') {
          current = _obj2Array(current);
          next = _obj2Array(next);
          cl = current.length;
          nl = next.length;
          if (nl > cl) {
            return 1;
          } else if (nl < cl) {
            return -1;
          }
          for (i = 0, n = cl; i < n; ++i) {
            tmp = _compare(current[i], next[i]);
            if (tmp == 1) {
              return 1;
            } else if (tmp == -1) {
              return -1;
            }
          }
          return 0;
        }
        return -1;
      } else if (typeof next === 'object') {
        return 1;
      } else if (isNaN(next) && !isNaN(current)) {
        if (current == 0) {
          return 0;
        }
        return (current < 0 ? 1 : -1);
      } else if (isNaN(current) && !isNaN(next)) {
        if (next == 0) {
          return 0;
        }
        return (next > 0 ? 1 : -1);
      }
  
      if (next == current) {
        return 0;
      }
      return (next > current ? 1 : -1);
    }; //function _compare
    if (argc === 0) {
      throw new Error('At least one value should be passed to max()');
    } else if (argc === 1) {
      if (typeof argv[0] === 'object') {
        ar = _obj2Array(argv[0]);
      } else {
        throw new Error('Wrong parameter count for max()');
      }
      if (ar.length === 0) {
        throw new Error('Array must contain at least one element for max()');
      }
    } else {
      ar = argv;
    }
  
    retVal = ar[0];
    for (i = 1, n = ar.length; i < n; ++i) {
      if (_compare(retVal, ar[i]) == 1) {
        retVal = ar[i];
      }
    }
  
    return retVal;
};

exports.min = function () {
  var ar, retVal, i = 0,
      n = 0,
      argv = arguments,
      argc = argv.length,
      _obj2Array = function(obj) {
        if (Object.prototype.toString.call(obj) === '[object Array]') {
          return obj;
        }
        var ar = [];
        for (var i in obj) {
          if (obj.hasOwnProperty(i)) {
            ar.push(obj[i]);
          }
        }
        return ar;
      }; //function _obj2Array
    _compare = function(current, next) {
      var i = 0,
        n = 0,
        tmp = 0,
        nl = 0,
        cl = 0;
  
      if (current === next) {
        return 0;
      } else if (typeof current === 'object') {
        if (typeof next === 'object') {
          current = _obj2Array(current);
          next = _obj2Array(next);
          cl = current.length;
          nl = next.length;
          if (nl > cl) {
            return 1;
          } else if (nl < cl) {
            return -1;
          }
          for (i = 0, n = cl; i < n; ++i) {
            tmp = _compare(current[i], next[i]);
            if (tmp == 1) {
              return 1;
            } else if (tmp == -1) {
              return -1;
            }
          }
          return 0;
        }
        return -1;
      } else if (typeof next === 'object') {
        return 1;
      } else if (isNaN(next) && !isNaN(current)) {
        if (current == 0) {
          return 0;
        }
        return (current < 0 ? 1 : -1);
      } else if (isNaN(current) && !isNaN(next)) {
        if (next == 0) {
          return 0;
        }
        return (next > 0 ? 1 : -1);
      }
  
      if (next == current) {
        return 0;
      }
      return (next > current ? 1 : -1);
    }; //function _compare
    if (argc === 0) {
      throw new Error('At least one value should be passed to min()');
    } else if (argc === 1) {
      if (typeof argv[0] === 'object') {
        ar = _obj2Array(argv[0]);
      } else {
        throw new Error('Wrong parameter count for min()');
      }
      if (ar.length === 0) {
        throw new Error('Array must contain at least one element for min()');
      }
    } else {
      ar = argv;
    }
  
    retVal = ar[0];
    for (i = 1, n = ar.length; i < n; ++i) {
      if (_compare(retVal, ar[i]) == -1) {
        retVal = ar[i];
      }
    }
  
    return retVal;
};

exports.mt_getrandmax = function () {
  return 2147483647;
};

exports.mt_rand = function (min, max) {
  var argc = arguments.length;
    if (argc === 0) {
      min = 0;
      max = 2147483647;
    } else if (argc === 1) {
      throw new Error('Warning: mt_rand() expects exactly 2 parameters, 1 given');
    } else {
      min = parseInt(min, 10);
      max = parseInt(max, 10);
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

exports.octdec = function (oct_string) {
  oct_string = (oct_string + '')
      .replace(/[^0-7]/gi, '');
    return parseInt(oct_string, 8);
};

exports.pi = function () {
  return 3.141592653589793; // Math.PI
};

exports.pow = function (base, exp) {
  return Math.pow(base, exp);
};

exports.rad2deg = function (angle) {
  return angle * 57.29577951308232; // angle / Math.PI * 180
};

exports.rand = function (min, max) {
  var argc = arguments.length;
    if (argc === 0) {
      min = 0;
      max = 2147483647;
    } else if (argc === 1) {
      throw new Error('Warning: rand() expects exactly 2 parameters, 1 given');
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  
    /*
    // See note above for an explanation of the following alternative code
  
    // +   reimplemented by: Brett Zamir (http://brett-zamir.me)
    // -    depends on: srand
    // %          note 1: This is a very possibly imperfect adaptation from the PHP source code
    var rand_seed, ctx, PHP_RAND_MAX=2147483647; // 0x7fffffff
  
    if (!this.php_js || this.php_js.rand_seed === undefined) {
      this.srand();
    }
    rand_seed = this.php_js.rand_seed;
  
    var argc = arguments.length;
    if (argc === 1) {
      throw new Error('Warning: rand() expects exactly 2 parameters, 1 given');
    }
  
    var do_rand = function (ctx) {
      return ((ctx * 1103515245 + 12345) % (PHP_RAND_MAX + 1));
    };
  
    var php_rand = function (ctxArg) { // php_rand_r
      this.php_js.rand_seed = do_rand(ctxArg);
      return parseInt(this.php_js.rand_seed, 10);
    };
  
    var number = php_rand(rand_seed);
  
    if (argc === 2) {
      number = min + parseInt(parseFloat(parseFloat(max) - min + 1.0) * (number/(PHP_RAND_MAX + 1.0)), 10);
    }
    return number;
    */
};

exports.round = function (value, precision, mode) {
  var m, f, isHalf, sgn; // helper variables
    precision |= 0; // making sure precision is integer
    m = Math.pow(10, precision);
    value *= m;
    sgn = (value > 0) | -(value < 0); // sign of the number
    isHalf = value % 1 === 0.5 * sgn;
    f = Math.floor(value);
  
    if (isHalf) {
      switch (mode) {
        case 'PHP_ROUND_HALF_DOWN':
          value = f + (sgn < 0); // rounds .5 toward zero
          break;
        case 'PHP_ROUND_HALF_EVEN':
          value = f + (f % 2 * sgn); // rouds .5 towards the next even integer
          break;
        case 'PHP_ROUND_HALF_ODD':
          value = f + !(f % 2); // rounds .5 towards the next odd integer
          break;
        default:
          value = f + (sgn > 0); // rounds .5 away from zero
      }
    }
  
    return (isHalf ? value : Math.round(value)) / m;
};

exports.sin = function (arg) {
  return Math.sin(arg);
};

exports.sinh = function (arg) {
  return (Math.exp(arg) - Math.exp(-arg)) / 2;
};

exports.sqrt = function (arg) {
  return Math.sqrt(arg);
};

exports.tan = function (arg) {
  return Math.tan(arg);
};

exports.tanh = function (arg) {
  return (Math.exp(arg) - Math.exp(-arg)) / (Math.exp(arg) + Math.exp(-arg));
};

exports.pack = function (format) {
  var formatPointer = 0,
      argumentPointer = 1,
      result = '',
      argument = '',
      i = 0,
      r = [],
      instruction, quantifier, word, precisionBits, exponentBits, extraNullCount;
  
    // vars used by float encoding
    var bias, minExp, maxExp, minUnnormExp, status, exp, len, bin, signal, n, intPart, floatPart, lastBit, rounded, j,
      k, tmpResult;
  
    while (formatPointer < format.length) {
      instruction = format.charAt(formatPointer);
      quantifier = '';
      formatPointer++;
      while ((formatPointer < format.length) && (format.charAt(formatPointer)
        .match(/[\d\*]/) !== null)) {
        quantifier += format.charAt(formatPointer);
        formatPointer++;
      }
      if (quantifier === '') {
        quantifier = '1';
      }
  
      // Now pack variables: 'quantifier' times 'instruction'
      switch (instruction) {
        case 'a':
          // NUL-padded string
        case 'A':
          // SPACE-padded string
          if (typeof arguments[argumentPointer] === 'undefined') {
            throw new Error('Warning:  pack() Type ' + instruction + ': not enough arguments');
          } else {
            argument = String(arguments[argumentPointer]);
          }
          if (quantifier === '*') {
            quantifier = argument.length;
          }
          for (i = 0; i < quantifier; i++) {
            if (typeof argument[i] === 'undefined') {
              if (instruction === 'a') {
                result += String.fromCharCode(0);
              } else {
                result += ' ';
              }
            } else {
              result += argument[i];
            }
          }
          argumentPointer++;
          break;
        case 'h':
          // Hex string, low nibble first
        case 'H':
          // Hex string, high nibble first
          if (typeof arguments[argumentPointer] === 'undefined') {
            throw new Error('Warning: pack() Type ' + instruction + ': not enough arguments');
          } else {
            argument = arguments[argumentPointer];
          }
          if (quantifier === '*') {
            quantifier = argument.length;
          }
          if (quantifier > argument.length) {
            throw new Error('Warning: pack() Type ' + instruction + ': not enough characters in string');
          }
  
          for (i = 0; i < quantifier; i += 2) {
            // Always get per 2 bytes...
            word = argument[i];
            if (((i + 1) >= quantifier) || typeof argument[i + 1] === 'undefined') {
              word += '0';
            } else {
              word += argument[i + 1];
            }
            // The fastest way to reverse?
            if (instruction === 'h') {
              word = word[1] + word[0];
            }
            result += String.fromCharCode(parseInt(word, 16));
          }
          argumentPointer++;
          break;
  
        case 'c':
          // signed char
        case 'C':
          // unsigned char
          // c and C is the same in pack
          if (quantifier === '*') {
            quantifier = arguments.length - argumentPointer;
          }
          if (quantifier > (arguments.length - argumentPointer)) {
            throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments');
          }
  
          for (i = 0; i < quantifier; i++) {
            result += String.fromCharCode(arguments[argumentPointer]);
            argumentPointer++;
          }
          break;
  
        case 's':
          // signed short (always 16 bit, machine byte order)
        case 'S':
          // unsigned short (always 16 bit, machine byte order)
        case 'v':
          // s and S is the same in pack
          if (quantifier === '*') {
            quantifier = arguments.length - argumentPointer;
          }
          if (quantifier > (arguments.length - argumentPointer)) {
            throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments');
          }
  
          for (i = 0; i < quantifier; i++) {
            result += String.fromCharCode(arguments[argumentPointer] & 0xFF);
            result += String.fromCharCode(arguments[argumentPointer] >> 8 & 0xFF);
            argumentPointer++;
          }
          break;
  
        case 'n':
          // unsigned short (always 16 bit, big endian byte order)
          if (quantifier === '*') {
            quantifier = arguments.length - argumentPointer;
          }
          if (quantifier > (arguments.length - argumentPointer)) {
            throw new Error('Warning: pack() Type ' + instruction + ': too few arguments');
          }
  
          for (i = 0; i < quantifier; i++) {
            result += String.fromCharCode(arguments[argumentPointer] & 0xFF);
            argumentPointer++;
          }
          break;
  
        case 'i':
          // signed integer (machine dependent size and byte order)
        case 'I':
          // unsigned integer (machine dependent size and byte order)
        case 'l':
          // signed long (always 32 bit, machine byte order)
        case 'L':
          // unsigned long (always 32 bit, machine byte order)
        case 'V':
          // unsigned long (always 32 bit, little endian byte order)
          if (quantifier === '*') {
            quantifier = arguments.length - argumentPointer;
          }
          if (quantifier > (arguments.length - argumentPointer)) {
            throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments');
          }
  
          for (i = 0; i < quantifier; i++) {
            result += String.fromCharCode(arguments[argumentPointer] & 0xFF);
            result += String.fromCharCode(arguments[argumentPointer] >> 8 & 0xFF);
            result += String.fromCharCode(arguments[argumentPointer] >> 16 & 0xFF);
            result += String.fromCharCode(arguments[argumentPointer] >> 24 & 0xFF);
            argumentPointer++;
          }
  
          break;
        case 'N':
          // unsigned long (always 32 bit, big endian byte order)
          if (quantifier === '*') {
            quantifier = arguments.length - argumentPointer;
          }
          if (quantifier > (arguments.length - argumentPointer)) {
            throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments');
          }
  
          for (i = 0; i < quantifier; i++) {
            result += String.fromCharCode(arguments[argumentPointer] >> 24 & 0xFF);
            result += String.fromCharCode(arguments[argumentPointer] >> 16 & 0xFF);
            result += String.fromCharCode(arguments[argumentPointer] >> 8 & 0xFF);
            result += String.fromCharCode(arguments[argumentPointer] & 0xFF);
            argumentPointer++;
          }
          break;
  
        case 'f':
          // float (machine dependent size and representation)
        case 'd':
          // double (machine dependent size and representation)
          // version original by IEEE754
          precisionBits = 23;
          exponentBits = 8;
          if (instruction === 'd') {
            precisionBits = 52;
            exponentBits = 11;
          }
  
          if (quantifier === '*') {
            quantifier = arguments.length - argumentPointer;
          }
          if (quantifier > (arguments.length - argumentPointer)) {
            throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments');
          }
          for (i = 0; i < quantifier; i++) {
            argument = arguments[argumentPointer];
            bias = Math.pow(2, exponentBits - 1) - 1;
            minExp = -bias + 1;
            maxExp = bias;
            minUnnormExp = minExp - precisionBits;
            status = isNaN(n = parseFloat(argument)) || n === -Infinity || n === +Infinity ? n : 0;
            exp = 0;
            len = 2 * bias + 1 + precisionBits + 3;
            bin = new Array(len);
            signal = (n = status !== 0 ? 0 : n) < 0;
            n = Math.abs(n);
            intPart = Math.floor(n);
            floatPart = n - intPart;
  
            for (k = len; k;) {
              bin[--k] = 0;
            }
            for (k = bias + 2; intPart && k;) {
              bin[--k] = intPart % 2;
              intPart = Math.floor(intPart / 2);
            }
            for (k = bias + 1; floatPart > 0 && k; --floatPart) {
              (bin[++k] = ((floatPart *= 2) >= 1) - 0);
            }
            for (k = -1; ++k < len && !bin[k];) {}
  
            if (bin[(lastBit = precisionBits - 1 + (k = (exp = bias + 1 - k) >= minExp && exp <= maxExp ? k + 1 :
              bias + 1 - (exp = minExp - 1))) + 1]) {
              if (!(rounded = bin[lastBit])) {
                for (j = lastBit + 2; !rounded && j < len; rounded = bin[j++]) {}
              }
              for (j = lastBit + 1; rounded && --j >= 0;
                (bin[j] = !bin[j] - 0) && (rounded = 0)) {}
            }
  
            for (k = k - 2 < 0 ? -1 : k - 3; ++k < len && !bin[k];) {}
  
            if ((exp = bias + 1 - k) >= minExp && exp <= maxExp) {
              ++k;
            } else {
              if (exp < minExp) {
                if (exp !== bias + 1 - len && exp < minUnnormExp) { /*"encodeFloat::float underflow" */ }
                k = bias + 1 - (exp = minExp - 1);
              }
            }
  
            if (intPart || status !== 0) {
              exp = maxExp + 1;
              k = bias + 2;
              if (status === -Infinity) {
                signal = 1;
              } else if (isNaN(status)) {
                bin[k] = 1;
              }
            }
  
            n = Math.abs(exp + bias);
            tmpResult = '';
  
            for (j = exponentBits + 1; --j;) {
              tmpResult = (n % 2) + tmpResult;
              n = n >>= 1;
            }
  
            n = 0;
            j = 0;
            k = (tmpResult = (signal ? '1' : '0') + tmpResult + bin.slice(k, k + precisionBits)
              .join(''))
              .length;
            r = [];
  
            for (; k;) {
              n += (1 << j) * tmpResult.charAt(--k);
              if (j === 7) {
                r[r.length] = String.fromCharCode(n);
                n = 0;
              }
              j = (j + 1) % 8;
            }
  
            r[r.length] = n ? String.fromCharCode(n) : '';
            result += r.join('');
            argumentPointer++;
          }
          break;
  
        case 'x':
          // NUL byte
          if (quantifier === '*') {
            throw new Error('Warning: pack(): Type x: \'*\' ignored');
          }
          for (i = 0; i < quantifier; i++) {
            result += String.fromCharCode(0);
          }
          break;
  
        case 'X':
          // Back up one byte
          if (quantifier === '*') {
            throw new Error('Warning: pack(): Type X: \'*\' ignored');
          }
          for (i = 0; i < quantifier; i++) {
            if (result.length === 0) {
              throw new Error('Warning: pack(): Type X:' + ' outside of string');
            } else {
              result = result.substring(0, result.length - 1);
            }
          }
          break;
  
        case '@':
          // NUL-fill to absolute position
          if (quantifier === '*') {
            throw new Error('Warning: pack(): Type X: \'*\' ignored');
          }
          if (quantifier > result.length) {
            extraNullCount = quantifier - result.length;
            for (i = 0; i < extraNullCount; i++) {
              result += String.fromCharCode(0);
            }
          }
          if (quantifier < result.length) {
            result = result.substring(0, quantifier);
          }
          break;
  
        default:
          throw new Error('Warning:  pack() Type ' + instruction + ': unknown format code');
      }
    }
    if (argumentPointer < arguments.length) {
      throw new Error('Warning: pack(): ' + (arguments.length - argumentPointer) + ' arguments unused');
    }
  
    return result;
};

exports.time_sleep_until = function (timestamp) {
  while (new Date() < timestamp * 1000) {}
    return true;
};

exports.uniqid = function (prefix, more_entropy) {
  if (typeof prefix === 'undefined') {
      prefix = '';
    }
  
    var retId;
    var formatSeed = function(seed, reqWidth) {
      seed = parseInt(seed, 10)
        .toString(16); // to hex str
      if (reqWidth < seed.length) { // so long we split
        return seed.slice(seed.length - reqWidth);
      }
      if (reqWidth > seed.length) { // so short we pad
        return Array(1 + (reqWidth - seed.length))
          .join('0') + seed;
      }
      return seed;
    };
  
    // BEGIN REDUNDANT
    if (!this.php_js) {
      this.php_js = {};
    }
    // END REDUNDANT
    if (!this.php_js.uniqidSeed) { // init seed with big random int
      this.php_js.uniqidSeed = Math.floor(Math.random() * 0x75bcd15);
    }
    this.php_js.uniqidSeed++;
  
    retId = prefix; // start with prefix, add current milliseconds hex string
    retId += formatSeed(parseInt(new Date()
      .getTime() / 1000, 10), 8);
    retId += formatSeed(this.php_js.uniqidSeed, 5); // add seed hex string
    if (more_entropy) {
      // for more entropy we add a float lower to 10
      retId += (Math.random() * 10)
        .toFixed(8)
        .toString();
    }
  
    return retId;
};

exports.gopher_parsedir = function (dirent) {
  /* Types
     * 0 = plain text file
     * 1 = directory menu listing
     * 2 = CSO search query
     * 3 = error message
     * 4 = BinHex encoded text file
     * 5 = binary archive file
     * 6 = UUEncoded text file
     * 7 = search engine query
     * 8 = telnet session pointer
     * 9 = binary file
     * g = Graphics file format, primarily a GIF file
     * h = HTML file
     * i = informational message
     * s = Audio file format, primarily a WAV file
     */
  
    var entryPattern = /^(.)(.*?)\t(.*?)\t(.*?)\t(.*?)\u000d\u000a$/;
    var entry = dirent.match(entryPattern);
  
    if (entry === null) {
      throw 'Could not parse the directory entry';
      // return false;
    }
  
    var type = entry[1];
    switch (type) {
      case 'i':
        type = 255; // GOPHER_INFO
        break;
      case '1':
        type = 1; // GOPHER_DIRECTORY
        break;
      case '0':
        type = 0; // GOPHER_DOCUMENT
        break;
      case '4':
        type = 4; // GOPHER_BINHEX
        break;
      case '5':
        type = 5; // GOPHER_DOSBINARY
        break;
      case '6':
        type = 6; // GOPHER_UUENCODED
        break;
      case '9':
        type = 9; // GOPHER_BINARY
        break;
      case 'h':
        type = 254; // GOPHER_HTTP
        break;
      default:
        return {
          type: -1,
          data: dirent
        }; // GOPHER_UNKNOWN
    }
    return {
      type: type,
      title: entry[2],
      path: entry[3],
      host: entry[4],
      port: entry[5]
    };
};

exports.inet_ntop = function (a) {
  var i = 0,
      m = '',
      c = [];
    a += '';
    if (a.length === 4) { // IPv4
      return [
        a.charCodeAt(0), a.charCodeAt(1), a.charCodeAt(2), a.charCodeAt(3)].join('.');
    } else if (a.length === 16) { // IPv6
      for (i = 0; i < 16; i++) {
        c.push(((a.charCodeAt(i++) << 8) + a.charCodeAt(i))
          .toString(16));
      }
      return c.join(':')
        .replace(/((^|:)0(?=:|$))+:?/g, function(t) {
          m = (t.length > m.length) ? t : m;
          return t;
        })
        .replace(m || ' ', '::');
    } else { // Invalid length
      return false;
    }
};

exports.inet_pton = function (a) {
  var r, m, x, i, j, f = String.fromCharCode;
    m = a.match(/^(?:\d{1,3}(?:\.|$)){4}/); // IPv4
    if (m) {
      m = m[0].split('.');
      m = f(m[0]) + f(m[1]) + f(m[2]) + f(m[3]);
      // Return if 4 bytes, otherwise false.
      return m.length === 4 ? m : false;
    }
    r = /^((?:[\da-f]{1,4}(?::|)){0,8})(::)?((?:[\da-f]{1,4}(?::|)){0,8})$/;
    m = a.match(r); // IPv6
    if (m) {
      // Translate each hexadecimal value.
      for (j = 1; j < 4; j++) {
        // Indice 2 is :: and if no length, continue.
        if (j === 2 || m[j].length === 0) {
          continue;
        }
        m[j] = m[j].split(':');
        for (i = 0; i < m[j].length; i++) {
          m[j][i] = parseInt(m[j][i], 16);
          // Would be NaN if it was blank, return false.
          if (isNaN(m[j][i])) {
            return false; // Invalid IP.
          }
          m[j][i] = f(m[j][i] >> 8) + f(m[j][i] & 0xFF);
        }
        m[j] = m[j].join('');
      }
      x = m[1].length + m[3].length;
      if (x === 16) {
        return m[1] + m[3];
      } else if (x < 16 && m[2].length > 0) {
        return m[1] + (new Array(16 - x + 1))
          .join('\x00') + m[3];
      }
    }
    return false; // Invalid IP.
};

exports.ip2long = function (IP) {
  var i = 0;
    // PHP allows decimal, octal, and hexadecimal IP components.
    // PHP allows between 1 (e.g. 127) to 4 (e.g 127.0.0.1) components.
    IP = IP.match(
      /^([1-9]\d*|0[0-7]*|0x[\da-f]+)(?:\.([1-9]\d*|0[0-7]*|0x[\da-f]+))?(?:\.([1-9]\d*|0[0-7]*|0x[\da-f]+))?(?:\.([1-9]\d*|0[0-7]*|0x[\da-f]+))?$/i
    ); // Verify IP format.
    if (!IP) {
      return false; // Invalid format.
    }
    // Reuse IP variable for component counter.
    IP[0] = 0;
    for (i = 1; i < 5; i += 1) {
      IP[0] += !! ((IP[i] || '')
        .length);
      IP[i] = parseInt(IP[i]) || 0;
    }
    // Continue to use IP for overflow values.
    // PHP does not allow any component to overflow.
    IP.push(256, 256, 256, 256);
    // Recalculate overflow of last component supplied to make up for missing components.
    IP[4 + IP[0]] *= Math.pow(256, 4 - IP[0]);
    if (IP[1] >= IP[5] || IP[2] >= IP[6] || IP[3] >= IP[7] || IP[4] >= IP[8]) {
      return false;
    }
    return IP[1] * (IP[0] === 1 || 16777216) + IP[2] * (IP[0] <= 2 || 65536) + IP[3] * (IP[0] <= 3 || 256) + IP[4] * 1;
};

exports.long2ip = function (ip) {
  if (!isFinite(ip))
      return false;
  
    return [ip >>> 24, ip >>> 16 & 0xFF, ip >>> 8 & 0xFF, ip & 0xFF].join('.');
};

exports.setrawcookie = function (name, value, expires, path, domain, secure) {
  if (typeof expires === 'string' && (/^\d+$/)
      .test(expires)) {
      expires = parseInt(expires, 10);
    }
  
    if (expires instanceof Date) {
      expires = expires.toGMTString();
    } else if (typeof expires === 'number') {
      expires = (new Date(expires * 1e3))
        .toGMTString();
    }
  
    var r = [name + '=' + value],
      s = {},
      i = '';
    s = {
      expires: expires,
      path: path,
      domain: domain
    };
    for (i in s) {
      if (s.hasOwnProperty(i)) { // Exclude items on Object.prototype
        s[i] && r.push(i + '=' + s[i]);
      }
    }
  
    return secure && r.push('secure'), this.window.document.cookie = r.join(';'), true;
};

exports.preg_grep = function (pattern, input, flags) {
  var p = '';
    var retObj = {};
    var invert = (flags === 1 || flags === 'PREG_GREP_INVERT'); // Todo: put flags as number and do bitwise checks (at least if other flags allowable); see pathinfo()
  
    if (typeof pattern === 'string') {
      pattern = eval(pattern);
    }
  
    if (invert) {
      for (p in input) {
        if ((input[p] + '')
          .search(pattern) === -1) {
          retObj[p] = input[p];
        }
      }
    } else {
      for (p in input) {
        if ((input[p] + '')
          .search(pattern) !== -1) {
          retObj[p] = input[p];
        }
      }
    }
  
    return retObj;
};

exports.preg_quote = function (str, delimiter) {
  return String(str)
      .replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
};

exports.addcslashes = function (str, charlist) {
  var target = '',
      chrs = [],
      i = 0,
      j = 0,
      c = '',
      next = '',
      rangeBegin = '',
      rangeEnd = '',
      chr = '',
      begin = 0,
      end = 0,
      octalLength = 0,
      postOctalPos = 0,
      cca = 0,
      escHexGrp = [],
      encoded = '',
      percentHex = /%([\dA-Fa-f]+)/g;
    var _pad = function(n, c) {
      if ((n = n + '')
        .length < c) {
        return new Array(++c - n.length)
          .join('0') + n;
      }
      return n;
    };
  
    for (i = 0; i < charlist.length; i++) {
      c = charlist.charAt(i);
      next = charlist.charAt(i + 1);
      if (c === '\\' && next && (/\d/)
        .test(next)) { // Octal
        rangeBegin = charlist.slice(i + 1)
          .match(/^\d+/)[0];
        octalLength = rangeBegin.length;
        postOctalPos = i + octalLength + 1;
        if (charlist.charAt(postOctalPos) + charlist.charAt(postOctalPos + 1) === '..') { // Octal begins range
          begin = rangeBegin.charCodeAt(0);
          if ((/\\\d/)
            .test(charlist.charAt(postOctalPos + 2) + charlist.charAt(postOctalPos + 3))) { // Range ends with octal
            rangeEnd = charlist.slice(postOctalPos + 3)
              .match(/^\d+/)[0];
            i += 1; // Skip range end backslash
          } else if (charlist.charAt(postOctalPos + 2)) { // Range ends with character
            rangeEnd = charlist.charAt(postOctalPos + 2);
          } else {
            throw 'Range with no end point';
          }
          end = rangeEnd.charCodeAt(0);
          if (end > begin) { // Treat as a range
            for (j = begin; j <= end; j++) {
              chrs.push(String.fromCharCode(j));
            }
          } else { // Supposed to treat period, begin and end as individual characters only, not a range
            chrs.push('.', rangeBegin, rangeEnd);
          }
          i += rangeEnd.length + 2; // Skip dots and range end (already skipped range end backslash if present)
        } else { // Octal is by itself
          chr = String.fromCharCode(parseInt(rangeBegin, 8));
          chrs.push(chr);
        }
        i += octalLength; // Skip range begin
      } else if (next + charlist.charAt(i + 2) === '..') { // Character begins range
        rangeBegin = c;
        begin = rangeBegin.charCodeAt(0);
        if ((/\\\d/)
          .test(charlist.charAt(i + 3) + charlist.charAt(i + 4))) { // Range ends with octal
          rangeEnd = charlist.slice(i + 4)
            .match(/^\d+/)[0];
          i += 1; // Skip range end backslash
        } else if (charlist.charAt(i + 3)) { // Range ends with character
          rangeEnd = charlist.charAt(i + 3);
        } else {
          throw 'Range with no end point';
        }
        end = rangeEnd.charCodeAt(0);
        if (end > begin) { // Treat as a range
          for (j = begin; j <= end; j++) {
            chrs.push(String.fromCharCode(j));
          }
        } else { // Supposed to treat period, begin and end as individual characters only, not a range
          chrs.push('.', rangeBegin, rangeEnd);
        }
        i += rangeEnd.length + 2; // Skip dots and range end (already skipped range end backslash if present)
      } else { // Character is by itself
        chrs.push(c);
      }
    }
  
    for (i = 0; i < str.length; i++) {
      c = str.charAt(i);
      if (chrs.indexOf(c) !== -1) {
        target += '\\';
        cca = c.charCodeAt(0);
        if (cca < 32 || cca > 126) { // Needs special escaping
          switch (c) {
            case '\n':
              target += 'n';
              break;
            case '\t':
              target += 't';
              break;
            case '\u000D':
              target += 'r';
              break;
            case '\u0007':
              target += 'a';
              break;
            case '\v':
              target += 'v';
              break;
            case '\b':
              target += 'b';
              break;
            case '\f':
              target += 'f';
              break;
            default:
              //target += _pad(cca.toString(8), 3);break; // Sufficient for UTF-16
              encoded = encodeURIComponent(c);
  
              // 3-length-padded UTF-8 octets
              if ((escHexGrp = percentHex.exec(encoded)) !== null) {
                target += _pad(parseInt(escHexGrp[1], 16)
                  .toString(8), 3); // already added a slash above
              }
              while ((escHexGrp = percentHex.exec(encoded)) !== null) {
                target += '\\' + _pad(parseInt(escHexGrp[1], 16)
                  .toString(8), 3);
              }
              break;
          }
        } else { // Perform regular backslashed escaping
          target += c;
        }
      } else { // Just add the character unescaped
        target += c;
      }
    }
    return target;
};

exports.addslashes = function (str) {
  return (str + '')
      .replace(/[\\"']/g, '\\$&')
      .replace(/\u0000/g, '\\0');
};

exports.bin2hex = function (s) {
  var i, l, o = '',
      n;
  
    s += '';
  
    for (i = 0, l = s.length; i < l; i++) {
      n = s.charCodeAt(i)
        .toString(16);
      o += n.length < 2 ? '0' + n : n;
    }
  
    return o;
};

exports.chr = function (codePt) {
  if (codePt > 0xFFFF) { // Create a four-byte string (length 2) since this code point is high
      //   enough for the UTF-16 encoding (JavaScript internal use), to
      //   require representation with two surrogates (reserved non-characters
      //   used for building other characters; the first is "high" and the next "low")
      codePt -= 0x10000;
      return String.fromCharCode(0xD800 + (codePt >> 10), 0xDC00 + (codePt & 0x3FF));
    }
    return String.fromCharCode(codePt);
};

exports.chunk_split = function (body, chunklen, end) {
  chunklen = parseInt(chunklen, 10) || 76;
    end = end || '\r\n';
  
    if (chunklen < 1) {
      return false;
    }
  
    return body.match(new RegExp('.{0,' + chunklen + '}', 'g'))
      .join(end);
};

exports.convert_cyr_string = function (str, from, to) {
  var _cyr_win1251 = [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
      30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57,
      58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85,
      86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110,
      111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 46, 46, 46, 46, 46, 46, 46,
      46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 154, 174,
      190, 46, 159, 189, 46, 46, 179, 191, 180, 157, 46, 46, 156, 183, 46, 46, 182, 166, 173, 46, 46, 158, 163, 152,
      164, 155, 46, 46, 46, 167, 225, 226, 247, 231, 228, 229, 246, 250, 233, 234, 235, 236, 237, 238, 239, 240, 242,
      243, 244, 245, 230, 232, 227, 254, 251, 253, 255, 249, 248, 252, 224, 241, 193, 194, 215, 199, 196, 197, 214,
      218, 201, 202, 203, 204, 205, 206, 207, 208, 210, 211, 212, 213, 198, 200, 195, 222, 219, 221, 223, 217, 216,
      220, 192, 209, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
      27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54,
      55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82,
      83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108,
      109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 32, 32, 32, 32,
      32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
      32, 32, 32, 184, 186, 32, 179, 191, 32, 32, 32, 32, 32, 180, 162, 32, 32, 32, 32, 168, 170, 32, 178, 175, 32,
      32, 32, 32, 32, 165, 161, 169, 254, 224, 225, 246, 228, 229, 244, 227, 245, 232, 233, 234, 235, 236, 237, 238,
      239, 255, 240, 241, 242, 243, 230, 226, 252, 251, 231, 248, 253, 249, 247, 250, 222, 192, 193, 214, 196, 197,
      212, 195, 213, 200, 201, 202, 203, 204, 205, 206, 207, 223, 208, 209, 210, 211, 198, 194, 220, 219, 199, 216,
      221, 217, 215, 218
    ],
      _cyr_cp866 = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
        29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55,
        56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82,
        83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107,
        108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 225,
        226, 247, 231, 228, 229, 246, 250, 233, 234, 235, 236, 237, 238, 239, 240, 242, 243, 244, 245, 230, 232,
        227, 254, 251, 253, 255, 249, 248, 252, 224, 241, 193, 194, 215, 199, 196, 197, 214, 218, 201, 202, 203,
        204, 205, 206, 207, 208, 35, 35, 35, 124, 124, 124, 124, 43, 43, 124, 124, 43, 43, 43, 43, 43, 43, 45, 45,
        124, 45, 43, 124, 124, 43, 43, 45, 45, 124, 45, 43, 45, 45, 45, 45, 43, 43, 43, 43, 43, 43, 43, 43, 35, 35,
        124, 124, 35, 210, 211, 212, 213, 198, 200, 195, 222, 219, 221, 223, 217, 216, 220, 192, 209, 179, 163, 180,
        164, 183, 167, 190, 174, 32, 149, 158, 32, 152, 159, 148, 154, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
        14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
        41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67,
        68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94,
        95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116,
        117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
        32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 205, 186, 213, 241, 243, 201,
        32, 245, 187, 212, 211, 200, 190, 32, 247, 198, 199, 204, 181, 240, 242, 185, 32, 244, 203, 207, 208, 202,
        216, 32, 246, 32, 238, 160, 161, 230, 164, 165, 228, 163, 229, 168, 169, 170, 171, 172, 173, 174, 175, 239,
        224, 225, 226, 227, 166, 162, 236, 235, 167, 232, 237, 233, 231, 234, 158, 128, 129, 150, 132, 133, 148,
        131, 149, 136, 137, 138, 139, 140, 141, 142, 143, 159, 144, 145, 146, 147, 134, 130, 156, 155, 135, 152,
        157, 153, 151, 154
      ],
      _cyr_iso88595 = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
        29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55,
        56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82,
        83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107,
        108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 32, 32,
        32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
        32, 32, 32, 32, 179, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 225, 226, 247, 231, 228, 229,
        246, 250, 233, 234, 235, 236, 237, 238, 239, 240, 242, 243, 244, 245, 230, 232, 227, 254, 251, 253, 255,
        249, 248, 252, 224, 241, 193, 194, 215, 199, 196, 197, 214, 218, 201, 202, 203, 204, 205, 206, 207, 208,
        210, 211, 212, 213, 198, 200, 195, 222, 219, 221, 223, 217, 216, 220, 192, 209, 32, 163, 32, 32, 32, 32, 32,
        32, 32, 32, 32, 32, 32, 32, 32, 32, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46,
        47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73,
        74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100,
        101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121,
        122, 123, 124, 125, 126, 127, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
        32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 241, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
        32, 32, 32, 32, 32, 161, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 238, 208, 209, 230, 212, 213, 228,
        211, 229, 216, 217, 218, 219, 220, 221, 222, 223, 239, 224, 225, 226, 227, 214, 210, 236, 235, 215, 232,
        237, 233, 231, 234, 206, 176, 177, 198, 180, 181, 196, 179, 197, 184, 185, 186, 187, 188, 189, 190, 191,
        207, 192, 193, 194, 195, 182, 178, 204, 203, 183, 200, 205, 201, 199, 202
      ],
      _cyr_mac = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
        29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55,
        56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82,
        83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107,
        108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 225,
        226, 247, 231, 228, 229, 246, 250, 233, 234, 235, 236, 237, 238, 239, 240, 242, 243, 244, 245, 230, 232,
        227, 254, 251, 253, 255, 249, 248, 252, 224, 241, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170,
        171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191,
        128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148,
        149, 150, 151, 152, 153, 154, 155, 156, 179, 163, 209, 193, 194, 215, 199, 196, 197, 214, 218, 201, 202,
        203, 204, 205, 206, 207, 208, 210, 211, 212, 213, 198, 200, 195, 222, 219, 221, 223, 217, 216, 220, 192,
        255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54,
        55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81,
        82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106,
        107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127,
        192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212,
        213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 160, 161, 162, 222, 164, 165, 166, 167, 168, 169,
        170, 171, 172, 173, 174, 175, 176, 177, 178, 221, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190,
        191, 254, 224, 225, 246, 228, 229, 244, 227, 245, 232, 233, 234, 235, 236, 237, 238, 239, 223, 240, 241,
        242, 243, 230, 226, 252, 251, 231, 248, 253, 249, 247, 250, 158, 128, 129, 150, 132, 133, 148, 131, 149,
        136, 137, 138, 139, 140, 141, 142, 143, 159, 144, 145, 146, 147, 134, 130, 156, 155, 135, 152, 157, 153,
        151, 154
      ];
  
    var from_table = null,
      to_table = null,
      tmp, i = 0,
      retStr = '';
  
    switch (from.toUpperCase()) {
      case 'W':
        from_table = _cyr_win1251;
        break;
      case 'A':
      case 'D':
        from_table = _cyr_cp866;
        break;
      case 'I':
        from_table = _cyr_iso88595;
        break;
      case 'M':
        from_table = _cyr_mac;
        break;
      case 'K':
        break;
      default:
        throw 'Unknown source charset: ' + from; // warning
    }
  
    switch (to.toUpperCase()) {
      case 'W':
        to_table = _cyr_win1251;
        break;
      case 'A':
      case 'D':
        to_table = _cyr_cp866;
        break;
      case 'I':
        to_table = _cyr_iso88595;
        break;
      case 'M':
        to_table = _cyr_mac;
        break;
      case 'K':
        break;
      default:
        throw 'Unknown destination charset: ' + to; // fix: make a warning
    }
  
    if (!str) {
      return str;
    }
  
    for (i = 0; i < str.length; i++) {
      tmp = (from_table === null) ? str.charAt(i) : String.fromCharCode(from_table[str.charAt(i)
        .charCodeAt(0)]);
      retStr += (to_table === null) ? tmp : String.fromCharCode(to_table[tmp.charCodeAt(0) + 256]);
    }
    return retStr;
};

exports.count_chars = function (str, mode) {
  var result = {},
      resultArr = [],
      i;
  
    str = ('' + str)
      .split('')
      .sort()
      .join('')
      .match(/(.)\1*/g);
  
    if ((mode & 1) == 0) {
      for (i = 0; i != 256; i++) {
        result[i] = 0;
      }
    }
  
    if (mode === 2 || mode === 4) {
  
      for (i = 0; i != str.length; i += 1) {
        delete result[str[i].charCodeAt(0)];
      }
      for (i in result) {
        result[i] = (mode === 4) ? String.fromCharCode(i) : 0;
      }
  
    } else if (mode === 3) {
  
      for (i = 0; i != str.length; i += 1) {
        result[i] = str[i].slice(0, 1);
      }
  
    } else {
  
      for (i = 0; i != str.length; i += 1) {
        result[str[i].charCodeAt(0)] = str[i].length;
      }
  
    }
    if (mode < 3) {
      return result;
    }
  
    for (i in result) {
      resultArr.push(result[i]);
    }
    return resultArr.join('');
};

exports.explode = function (delimiter, string, limit) {
  if (arguments.length < 2 || typeof delimiter === 'undefined' || typeof string === 'undefined') return null;
    if (delimiter === '' || delimiter === false || delimiter === null) return false;
    if (typeof delimiter === 'function' || typeof delimiter === 'object' || typeof string === 'function' || typeof string ===
      'object') {
      return {
        0: ''
      };
    }
    if (delimiter === true) delimiter = '1';
  
    // Here we go...
    delimiter += '';
    string += '';
  
    var s = string.split(delimiter);
  
    if (typeof limit === 'undefined') return s;
  
    // Support for limit
    if (limit === 0) limit = 1;
  
    // Positive limit
    if (limit > 0) {
      if (limit >= s.length) return s;
      return s.slice(0, limit - 1)
        .concat([s.slice(limit - 1)
          .join(delimiter)
        ]);
    }
  
    // Negative limit
    if (-limit >= s.length) return [];
  
    s.splice(s.length + limit);
    return s;
};

exports.get_html_translation_table = function (table, quote_style) {
  var entities = {},
      hash_map = {},
      decimal;
    var constMappingTable = {},
      constMappingQuoteStyle = {};
    var useTable = {},
      useQuoteStyle = {};
  
    // Translate arguments
    constMappingTable[0] = 'HTML_SPECIALCHARS';
    constMappingTable[1] = 'HTML_ENTITIES';
    constMappingQuoteStyle[0] = 'ENT_NOQUOTES';
    constMappingQuoteStyle[2] = 'ENT_COMPAT';
    constMappingQuoteStyle[3] = 'ENT_QUOTES';
  
    useTable = !isNaN(table) ? constMappingTable[table] : table ? table.toUpperCase() : 'HTML_SPECIALCHARS';
    useQuoteStyle = !isNaN(quote_style) ? constMappingQuoteStyle[quote_style] : quote_style ? quote_style.toUpperCase() :
      'ENT_COMPAT';
  
    if (useTable !== 'HTML_SPECIALCHARS' && useTable !== 'HTML_ENTITIES') {
      throw new Error('Table: ' + useTable + ' not supported');
      // return false;
    }
  
    entities['38'] = '&amp;';
    if (useTable === 'HTML_ENTITIES') {
      entities['160'] = '&nbsp;';
      entities['161'] = '&iexcl;';
      entities['162'] = '&cent;';
      entities['163'] = '&pound;';
      entities['164'] = '&curren;';
      entities['165'] = '&yen;';
      entities['166'] = '&brvbar;';
      entities['167'] = '&sect;';
      entities['168'] = '&uml;';
      entities['169'] = '&copy;';
      entities['170'] = '&ordf;';
      entities['171'] = '&laquo;';
      entities['172'] = '&not;';
      entities['173'] = '&shy;';
      entities['174'] = '&reg;';
      entities['175'] = '&macr;';
      entities['176'] = '&deg;';
      entities['177'] = '&plusmn;';
      entities['178'] = '&sup2;';
      entities['179'] = '&sup3;';
      entities['180'] = '&acute;';
      entities['181'] = '&micro;';
      entities['182'] = '&para;';
      entities['183'] = '&middot;';
      entities['184'] = '&cedil;';
      entities['185'] = '&sup1;';
      entities['186'] = '&ordm;';
      entities['187'] = '&raquo;';
      entities['188'] = '&frac14;';
      entities['189'] = '&frac12;';
      entities['190'] = '&frac34;';
      entities['191'] = '&iquest;';
      entities['192'] = '&Agrave;';
      entities['193'] = '&Aacute;';
      entities['194'] = '&Acirc;';
      entities['195'] = '&Atilde;';
      entities['196'] = '&Auml;';
      entities['197'] = '&Aring;';
      entities['198'] = '&AElig;';
      entities['199'] = '&Ccedil;';
      entities['200'] = '&Egrave;';
      entities['201'] = '&Eacute;';
      entities['202'] = '&Ecirc;';
      entities['203'] = '&Euml;';
      entities['204'] = '&Igrave;';
      entities['205'] = '&Iacute;';
      entities['206'] = '&Icirc;';
      entities['207'] = '&Iuml;';
      entities['208'] = '&ETH;';
      entities['209'] = '&Ntilde;';
      entities['210'] = '&Ograve;';
      entities['211'] = '&Oacute;';
      entities['212'] = '&Ocirc;';
      entities['213'] = '&Otilde;';
      entities['214'] = '&Ouml;';
      entities['215'] = '&times;';
      entities['216'] = '&Oslash;';
      entities['217'] = '&Ugrave;';
      entities['218'] = '&Uacute;';
      entities['219'] = '&Ucirc;';
      entities['220'] = '&Uuml;';
      entities['221'] = '&Yacute;';
      entities['222'] = '&THORN;';
      entities['223'] = '&szlig;';
      entities['224'] = '&agrave;';
      entities['225'] = '&aacute;';
      entities['226'] = '&acirc;';
      entities['227'] = '&atilde;';
      entities['228'] = '&auml;';
      entities['229'] = '&aring;';
      entities['230'] = '&aelig;';
      entities['231'] = '&ccedil;';
      entities['232'] = '&egrave;';
      entities['233'] = '&eacute;';
      entities['234'] = '&ecirc;';
      entities['235'] = '&euml;';
      entities['236'] = '&igrave;';
      entities['237'] = '&iacute;';
      entities['238'] = '&icirc;';
      entities['239'] = '&iuml;';
      entities['240'] = '&eth;';
      entities['241'] = '&ntilde;';
      entities['242'] = '&ograve;';
      entities['243'] = '&oacute;';
      entities['244'] = '&ocirc;';
      entities['245'] = '&otilde;';
      entities['246'] = '&ouml;';
      entities['247'] = '&divide;';
      entities['248'] = '&oslash;';
      entities['249'] = '&ugrave;';
      entities['250'] = '&uacute;';
      entities['251'] = '&ucirc;';
      entities['252'] = '&uuml;';
      entities['253'] = '&yacute;';
      entities['254'] = '&thorn;';
      entities['255'] = '&yuml;';
    }
  
    if (useQuoteStyle !== 'ENT_NOQUOTES') {
      entities['34'] = '&quot;';
    }
    if (useQuoteStyle === 'ENT_QUOTES') {
      entities['39'] = '&#39;';
    }
    entities['60'] = '&lt;';
    entities['62'] = '&gt;';
  
    // ascii decimals to real symbols
    for (decimal in entities) {
      if (entities.hasOwnProperty(decimal)) {
        hash_map[String.fromCharCode(decimal)] = entities[decimal];
      }
    }
  
    return hash_map;
};

exports.echo = function () {
  var isNode = typeof module !== 'undefined' && module.exports && typeof global !== "undefined" && {}.toString.call(global) == '[object global]';
    if (isNode) {
      var args = Array.prototype.slice.call(arguments);
      return console.log(args.join(' '));
    }
  
    var arg = '',
      argc = arguments.length,
      argv = arguments,
      i = 0,
      holder, win = this.window,
      d = win.document,
      ns_xhtml = 'http://www.w3.org/1999/xhtml',
      ns_xul = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul'; // If we're in a XUL context
    var stringToDOM = function(str, parent, ns, container) {
      var extraNSs = '';
      if (ns === ns_xul) {
        extraNSs = ' xmlns:html="' + ns_xhtml + '"';
      }
      var stringContainer = '<' + container + ' xmlns="' + ns + '"' + extraNSs + '>' + str + '</' + container + '>';
      var dils = win.DOMImplementationLS,
        dp = win.DOMParser,
        ax = win.ActiveXObject;
      if (dils && dils.createLSInput && dils.createLSParser) {
        // Follows the DOM 3 Load and Save standard, but not
        // implemented in browsers at present; HTML5 is to standardize on innerHTML, but not for XML (though
        // possibly will also standardize with DOMParser); in the meantime, to ensure fullest browser support, could
        // attach http://svn2.assembla.com/svn/brettz9/DOMToString/DOM3.js (see http://svn2.assembla.com/svn/brettz9/DOMToString/DOM3.xhtml for a simple test file)
        var lsInput = dils.createLSInput();
        // If we're in XHTML, we'll try to allow the XHTML namespace to be available by default
        lsInput.stringData = stringContainer;
        var lsParser = dils.createLSParser(1, null); // synchronous, no schema type
        return lsParser.parse(lsInput)
          .firstChild;
      } else if (dp) {
        // If we're in XHTML, we'll try to allow the XHTML namespace to be available by default
        try {
          var fc = new dp()
            .parseFromString(stringContainer, 'text/xml');
          if (fc && fc.documentElement && fc.documentElement.localName !== 'parsererror' && fc.documentElement.namespaceURI !==
            'http://www.mozilla.org/newlayout/xml/parsererror.xml') {
            return fc.documentElement.firstChild;
          }
          // If there's a parsing error, we just continue on
        } catch (e) {
          // If there's a parsing error, we just continue on
        }
      } else if (ax) { // We don't bother with a holder in Explorer as it doesn't support namespaces
        var axo = new ax('MSXML2.DOMDocument');
        axo.loadXML(str);
        return axo.documentElement;
      }
      /*else if (win.XMLHttpRequest) { // Supposed to work in older Safari
        var req = new win.XMLHttpRequest;
        req.open('GET', 'data:application/xml;charset=utf-8,'+encodeURIComponent(str), false);
        if (req.overrideMimeType) {
          req.overrideMimeType('application/xml');
        }
        req.send(null);
        return req.responseXML;
      }*/
      // Document fragment did not work with innerHTML, so we create a temporary element holder
      // If we're in XHTML, we'll try to allow the XHTML namespace to be available by default
      //if (d.createElementNS && (d.contentType && d.contentType !== 'text/html')) { // Don't create namespaced elements if we're being served as HTML (currently only Mozilla supports this detection in true XHTML-supporting browsers, but Safari and Opera should work with the above DOMParser anyways, and IE doesn't support createElementNS anyways)
      if (d.createElementNS && // Browser supports the method
        (d.documentElement.namespaceURI || // We can use if the document is using a namespace
          d.documentElement.nodeName.toLowerCase() !== 'html' || // We know it's not HTML4 or less, if the tag is not HTML (even if the root namespace is null)
          (d.contentType && d.contentType !== 'text/html') // We know it's not regular HTML4 or less if this is Mozilla (only browser supporting the attribute) and the content type is something other than text/html; other HTML5 roots (like svg) still have a namespace
        )) { // Don't create namespaced elements if we're being served as HTML (currently only Mozilla supports this detection in true XHTML-supporting browsers, but Safari and Opera should work with the above DOMParser anyways, and IE doesn't support createElementNS anyways); last test is for the sake of being in a pure XML document
        holder = d.createElementNS(ns, container);
      } else {
        holder = d.createElement(container); // Document fragment did not work with innerHTML
      }
      holder.innerHTML = str;
      while (holder.firstChild) {
        parent.appendChild(holder.firstChild);
      }
      return false;
      // throw 'Your browser does not support DOM parsing as required by echo()';
    };
  
    var ieFix = function(node) {
      if (node.nodeType === 1) {
        var newNode = d.createElement(node.nodeName);
        var i, len;
        if (node.attributes && node.attributes.length > 0) {
          for (i = 0, len = node.attributes.length; i < len; i++) {
            newNode.setAttribute(node.attributes[i].nodeName, node.getAttribute(node.attributes[i].nodeName));
          }
        }
        if (node.childNodes && node.childNodes.length > 0) {
          for (i = 0, len = node.childNodes.length; i < len; i++) {
            newNode.appendChild(ieFix(node.childNodes[i]));
          }
        }
        return newNode;
      } else {
        return d.createTextNode(node.nodeValue);
      }
    };
  
    var replacer = function(s, m1, m2) {
      // We assume for now that embedded variables do not have dollar sign; to add a dollar sign, you currently must use {$$var} (We might change this, however.)
      // Doesn't cover all cases yet: see http://php.net/manual/en/language.types.string.php#language.types.string.syntax.double
      if (m1 !== '\\') {
        return m1 + eval(m2);
      } else {
        return s;
      }
    };
  
    this.php_js = this.php_js || {};
    var phpjs = this.php_js,
      ini = phpjs.ini,
      obs = phpjs.obs;
    for (i = 0; i < argc; i++) {
      arg = argv[i];
      if (ini && ini['phpjs.echo_embedded_vars']) {
        arg = arg.replace(/(.?)\{?\$(\w*?\}|\w*)/g, replacer);
      }
  
      if (!phpjs.flushing && obs && obs.length) { // If flushing we output, but otherwise presence of a buffer means caching output
        obs[obs.length - 1].buffer += arg;
        continue;
      }
  
      if (d.appendChild) {
        if (d.body) {
          if (win.navigator.appName === 'Microsoft Internet Explorer') { // We unfortunately cannot use feature detection, since this is an IE bug with cloneNode nodes being appended
            d.body.appendChild(stringToDOM(ieFix(arg)));
          } else {
            var unappendedLeft = stringToDOM(arg, d.body, ns_xhtml, 'div')
              .cloneNode(true); // We will not actually append the div tag (just using for providing XHTML namespace by default)
            if (unappendedLeft) {
              d.body.appendChild(unappendedLeft);
            }
          }
        } else {
          d.documentElement.appendChild(stringToDOM(arg, d.documentElement, ns_xul, 'description')); // We will not actually append the description tag (just using for providing XUL namespace by default)
        }
      } else if (d.write) {
        d.write(arg);
      }
      /* else { // This could recurse if we ever add print!
        print(arg);
      }*/
    }
};

exports.htmlspecialchars = function (string, quote_style, charset, double_encode) {
  var optTemp = 0,
      i = 0,
      noquotes = false;
    if (typeof quote_style === 'undefined' || quote_style === null) {
      quote_style = 2;
    }
    string = string.toString();
    if (double_encode !== false) { // Put this first to avoid double-encoding
      string = string.replace(/&/g, '&amp;');
    }
    string = string.replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  
    var OPTS = {
      'ENT_NOQUOTES': 0,
      'ENT_HTML_QUOTE_SINGLE': 1,
      'ENT_HTML_QUOTE_DOUBLE': 2,
      'ENT_COMPAT': 2,
      'ENT_QUOTES': 3,
      'ENT_IGNORE': 4
    };
    if (quote_style === 0) {
      noquotes = true;
    }
    if (typeof quote_style !== 'number') { // Allow for a single string or an array of string flags
      quote_style = [].concat(quote_style);
      for (i = 0; i < quote_style.length; i++) {
        // Resolve string input to bitwise e.g. 'ENT_IGNORE' becomes 4
        if (OPTS[quote_style[i]] === 0) {
          noquotes = true;
        } else if (OPTS[quote_style[i]]) {
          optTemp = optTemp | OPTS[quote_style[i]];
        }
      }
      quote_style = optTemp;
    }
    if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
      string = string.replace(/'/g, '&#039;');
    }
    if (!noquotes) {
      string = string.replace(/"/g, '&quot;');
    }
  
    return string;
};

exports.htmlspecialchars_decode = function (string, quote_style) {
  var optTemp = 0,
      i = 0,
      noquotes = false;
    if (typeof quote_style === 'undefined') {
      quote_style = 2;
    }
    string = string.toString()
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    var OPTS = {
      'ENT_NOQUOTES': 0,
      'ENT_HTML_QUOTE_SINGLE': 1,
      'ENT_HTML_QUOTE_DOUBLE': 2,
      'ENT_COMPAT': 2,
      'ENT_QUOTES': 3,
      'ENT_IGNORE': 4
    };
    if (quote_style === 0) {
      noquotes = true;
    }
    if (typeof quote_style !== 'number') { // Allow for a single string or an array of string flags
      quote_style = [].concat(quote_style);
      for (i = 0; i < quote_style.length; i++) {
        // Resolve string input to bitwise e.g. 'PATHINFO_EXTENSION' becomes 4
        if (OPTS[quote_style[i]] === 0) {
          noquotes = true;
        } else if (OPTS[quote_style[i]]) {
          optTemp = optTemp | OPTS[quote_style[i]];
        }
      }
      quote_style = optTemp;
    }
    if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
      string = string.replace(/&#0*39;/g, "'"); // PHP doesn't currently escape if more than one 0, but it should
      // string = string.replace(/&apos;|&#x0*27;/g, "'"); // This would also be useful here, but not a part of PHP
    }
    if (!noquotes) {
      string = string.replace(/&quot;/g, '"');
    }
    // Put this in last place to avoid escape being double-decoded
    string = string.replace(/&amp;/g, '&');
  
    return string;
};

exports.implode = function (glue, pieces) {
  var i = '',
      retVal = '',
      tGlue = '';
    if (arguments.length === 1) {
      pieces = glue;
      glue = '';
    }
    if (typeof pieces === 'object') {
      if (Object.prototype.toString.call(pieces) === '[object Array]') {
        return pieces.join(glue);
      }
      for (i in pieces) {
        retVal += tGlue + pieces[i];
        tGlue = glue;
      }
      return retVal;
    }
    return pieces;
};

exports.lcfirst = function (str) {
  str += '';
    var f = str.charAt(0)
      .toLowerCase();
    return f + str.substr(1);
};

exports.levenshtein = function (s1, s2) {
  if (s1 == s2) {
      return 0;
    }
  
    var s1_len = s1.length;
    var s2_len = s2.length;
    if (s1_len === 0) {
      return s2_len;
    }
    if (s2_len === 0) {
      return s1_len;
    }
  
    // BEGIN STATIC
    var split = false;
    try {
      split = !('0')[0];
    } catch (e) {
      split = true; // Earlier IE may not support access by string index
    }
    // END STATIC
    if (split) {
      s1 = s1.split('');
      s2 = s2.split('');
    }
  
    var v0 = new Array(s1_len + 1);
    var v1 = new Array(s1_len + 1);
  
    var s1_idx = 0,
      s2_idx = 0,
      cost = 0;
    for (s1_idx = 0; s1_idx < s1_len + 1; s1_idx++) {
      v0[s1_idx] = s1_idx;
    }
    var char_s1 = '',
      char_s2 = '';
    for (s2_idx = 1; s2_idx <= s2_len; s2_idx++) {
      v1[0] = s2_idx;
      char_s2 = s2[s2_idx - 1];
  
      for (s1_idx = 0; s1_idx < s1_len; s1_idx++) {
        char_s1 = s1[s1_idx];
        cost = (char_s1 == char_s2) ? 0 : 1;
        var m_min = v0[s1_idx + 1] + 1;
        var b = v1[s1_idx] + 1;
        var c = v0[s1_idx] + cost;
        if (b < m_min) {
          m_min = b;
        }
        if (c < m_min) {
          m_min = c;
        }
        v1[s1_idx + 1] = m_min;
      }
      var v_tmp = v0;
      v0 = v1;
      v1 = v_tmp;
    }
    return v0[s1_len];
};

exports.ltrim = function (str, charlist) {
  charlist = !charlist ? ' \\s\u00A0' : (charlist + '')
      .replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '$1');
    var re = new RegExp('^[' + charlist + ']+', 'g');
    return (str + '')
      .replace(re, '');
};

exports.metaphone = function (word, max_phonemes) {
  var type = typeof word;
  
    if (type === 'undefined' || type === 'object' && word !== null) {
      return null; // weird!
    }
  
    // infinity and NaN values are treated as strings
    if (type === 'number') {
      if (isNaN(word)) {
        word = 'NAN';
      } else if (!isFinite(word)) {
        word = 'INF';
      }
    }
  
    if (max_phonemes < 0) {
      return false;
    }
  
    max_phonemes = Math.floor(+max_phonemes) || 0;
  
    // alpha depends on locale, so this var might need an update
    // or should be turned into a regex
    // for now assuming pure a-z
    var alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      vowel = 'AEIOU',
      soft = 'EIY',
      leadingNonAlpha = new RegExp('^[^' + alpha + ']+');
  
    word = typeof word === 'string' ? word : '';
    word = word.toUpperCase()
      .replace(leadingNonAlpha, '');
  
    if (!word) {
      return '';
    }
  
    var is = function(p, c) {
      return c !== '' && p.indexOf(c) !== -1;
    };
  
    var i = 0,
      cc = word.charAt(0), // current char. Short name, because it's used all over the function
      nc = word.charAt(1), // next char
      nnc, // after next char
      pc, // previous char
      l = word.length,
      meta = '',
      // traditional is an internal param that could be exposed
      // for now let it be a local var
      traditional = true;
  
    switch (cc) {
      case 'A':
        meta += nc === 'E' ? nc : cc;
        i += 1;
        break;
      case 'G':
      case 'K':
      case 'P':
        if (nc === 'N') {
          meta += nc;
          i += 2;
        }
        break;
      case 'W':
        if (nc === 'R') {
          meta += nc;
          i += 2;
        } else if (nc === 'H' || is(vowel, nc)) {
          meta += 'W';
          i += 2;
        }
        break;
      case 'X':
        meta += 'S';
        i += 1;
        break;
      case 'E':
      case 'I':
      case 'O':
      case 'U':
        meta += cc;
        i++;
        break;
    }
  
    for (; i < l && (max_phonemes === 0 || meta.length < max_phonemes); i += 1) {
      cc = word.charAt(i);
      nc = word.charAt(i + 1);
      pc = word.charAt(i - 1);
      nnc = word.charAt(i + 2);
  
      if (cc === pc && cc !== 'C') {
        continue;
      }
  
      switch (cc) {
        case 'B':
          if (pc !== 'M') {
            meta += cc;
          }
          break;
        case 'C':
          if (is(soft, nc)) {
            if (nc === 'I' && nnc === 'A') {
              meta += 'X';
            } else if (pc !== 'S') {
              meta += 'S';
            }
          } else if (nc === 'H') {
            meta += !traditional && (nnc === 'R' || pc === 'S') ? 'K' : 'X';
            i += 1;
          } else {
            meta += 'K';
          }
          break;
        case 'D':
          if (nc === 'G' && is(soft, nnc)) {
            meta += 'J';
            i += 1;
          } else {
            meta += 'T';
          }
          break;
        case 'G':
          if (nc === 'H') {
            if (!(is('BDH', word.charAt(i - 3)) || word.charAt(i - 4) === 'H')) {
              meta += 'F';
              i += 1;
            }
          } else if (nc === 'N') {
            if (is(alpha, nnc) && word.substr(i + 1, 3) !== 'NED') {
              meta += 'K';
            }
          } else if (is(soft, nc) && pc !== 'G') {
            meta += 'J';
          } else {
            meta += 'K';
          }
          break;
        case 'H':
          if (is(vowel, nc) && !is('CGPST', pc)) {
            meta += cc;
          }
          break;
        case 'K':
          if (pc !== 'C') {
            meta += 'K';
          }
          break;
        case 'P':
          meta += nc === 'H' ? 'F' : cc;
          break;
        case 'Q':
          meta += 'K';
          break;
        case 'S':
          if (nc === 'I' && is('AO', nnc)) {
            meta += 'X';
          } else if (nc === 'H') {
            meta += 'X';
            i += 1;
          } else if (!traditional && word.substr(i + 1, 3) === 'CHW') {
            meta += 'X';
            i += 2;
          } else {
            meta += 'S';
          }
          break;
        case 'T':
          if (nc === 'I' && is('AO', nnc)) {
            meta += 'X';
          } else if (nc === 'H') {
            meta += '0';
            i += 1;
          } else if (word.substr(i + 1, 2) !== 'CH') {
            meta += 'T';
          }
          break;
        case 'V':
          meta += 'F';
          break;
        case 'W':
        case 'Y':
          if (is(vowel, nc)) {
            meta += cc;
          }
          break;
        case 'X':
          meta += 'KS';
          break;
        case 'Z':
          meta += 'S';
          break;
        case 'F':
        case 'J':
        case 'L':
        case 'M':
        case 'N':
        case 'R':
          meta += cc;
          break;
      }
    }
  
    return meta;
  
    /*
    "    abc", "ABK", // skip leading whitespace
    "1234.678!@abc", "ABK", // skip leading non-alpha chars
    "aero", "ER", // leading 'a' followed by 'e' turns into 'e'
    "air", "AR", // leading 'a' turns into 'e', other vowels ignored
    // leading vowels added to result
    "egg", "EK",
    "if", "IF",
    "of", "OF",
    "use", "US",
    // other vowels ignored
    "xAEIOU", "S",
    // GN, KN, PN become 'N'
    "gnome", "NM",
    "knight", "NFT",
    "pneumatic", "NMTK",
    // leading 'WR' becomes 'R'
    "wrong", "RNK",
    // leading 'WH+vowel" becomes 'W'
    "wheel", "WL",
    // leading 'X' becomes 'S', 'KS' otherwise
    "xerox", "SRKS",
    "exchange", "EKSXNJ",
    // duplicate chars, except 'C' are ignored
    "accuracy", "AKKRS",
    "blogger", "BLKR",
    "fffound", "FNT",
    // ignore 'B' if after 'M'
    "billboard", "BLBRT",
    "symbol", "SML",
    // 'CIA' -> 'X'
    "special", "SPXL",
    // 'SC[IEY]' -> 'C' ignored
    "science", "SNS",
    // '[^S]C' -> 'C' becomes 'S'
    "dance", "TNS",
    // 'CH' -> 'X'
    "change", "XNJ",
    "school", "SXL",
    // 'C' -> 'K'
    "micro", "MKR",
    // 'DGE', 'DGI', DGY' -> 'J'
    // 'T' otherwise
    "bridge", "BRJ",
    "pidgin", "PJN",
    "edgy", "EJ",
    "handgun", "HNTKN",
    "draw", "TR",
    //'GN\b' 'GNED' -> ignore 'G'
    "sign", "SN",
    "signed", "SNT",
    "signs", "SKNS",
    // [^G]G[EIY] -> 'J'...
    "agency", "AJNS",
    // 'GH' -> 'F' if not b--gh, d--gh, h--gh
    "night", "NFT",
    "bright", "BRT",
    "height", "HT",
    "midnight", "MTNT",
    // 'K' otherwise
    "jogger", "JKR",
    // '[^CGPST]H[AEIOU]' -> 'H', ignore otherwise
    "horse", "HRS",
    "adhere", "ATHR",
    "mahjong", "MJNK",
    "fight", "FFT", // interesting
    "ghost", "FST",
    // 'K' -> 'K' if not after 'C'
    "ski", "SK",
    "brick", "BRK",
    // 'PH' -> 'F'
    "phrase", "FRS",
    // 'P.' -> 'P'
    "hypnotic", "PNTK",
    "topnotch", "TPNX",
    // 'Q' -> 'K'
    "quit", "KT",
    "squid", "SKT",
    // 'SIO', 'SIA', 'SH' -> 'X'
    "version", "FRXN",
    "silesia", "SLX",
    "enthusiasm", "EN0XSM",
    "shell", "XL",
    // 'S' -> 'S' in other cases
    "spy", "SP",
    "system", "SSTM",
    // 'TIO', 'TIA' -> 'X'
    "ratio", "RX",
    "nation", "NXN",
    "spatial", "SPXL",
    // 'TH' -> '0'
    "the", "0",
    "nth", "N0",
    "truth", "TR0",
    // 'TCH' -> ignore 'T'
    "watch", "WX",
    // 'T' otherwise
    "vote", "FT",
    "tweet", "TWT",
    // 'V' -> 'F'
    "evolve", "EFLF",
    // 'W' -> 'W' if followed by vowel
    "rewrite", "RRT",
    "outwrite", "OTRT",
    "artwork", "ARTWRK",
    // 'X' -> 'KS' if not first char
    "excel", "EKSSL",
    // 'Y' -> 'Y' if followed by vowel
    "cyan", "SYN",
    "way", "W",
    "hybrid", "BRT",
    // 'Z' -> 'S'
    "zip", "SP",
    "zoom", "SM",
    "jazz", "JS",
    "zigzag", "SKSK",
    "abc abc", "ABKBK" // eventhough there are two words, second 'a' is ignored
    */
};

exports.nl2br = function (str, is_xhtml) {
  var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br ' + '/>' : '<br>'; // Adjust comment to avoid issue on phpjs.org display
  
    return (str + '')
      .replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
};

exports.number_format = function (number, decimals, dec_point, thousands_sep) {
  number = (number + '')
      .replace(/[^0-9+\-Ee.]/g, '');
    var n = !isFinite(+number) ? 0 : +number,
      prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
      sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
      dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
      s = '',
      toFixedFix = function(n, prec) {
        var k = Math.pow(10, prec);
        return '' + (Math.round(n * k) / k)
          .toFixed(prec);
      };
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n))
      .split('.');
    if (s[0].length > 3) {
      s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '')
      .length < prec) {
      s[1] = s[1] || '';
      s[1] += new Array(prec - s[1].length + 1)
        .join('0');
    }
    return s.join(dec);
};

exports.ord = function (string) {
  var str = string + '',
      code = str.charCodeAt(0);
    if (0xD800 <= code && code <= 0xDBFF) { // High surrogate (could change last hex to 0xDB7F to treat high private surrogates as single characters)
      var hi = code;
      if (str.length === 1) {
        return code; // This is just a high surrogate with no following low surrogate, so we return its value;
        // we could also throw an error as it is not a complete character, but someone may want to know
      }
      var low = str.charCodeAt(1);
      return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
    }
    if (0xDC00 <= code && code <= 0xDFFF) { // Low surrogate
      return code; // This is just a low surrogate with no preceding high surrogate, so we return its value;
      // we could also throw an error as it is not a complete character, but someone may want to know
    }
    return code;
};

exports.parse_str = function (str, array) {
  var strArr = String(str)
      .replace(/^&/, '')
      .replace(/&$/, '')
      .split('&'),
      sal = strArr.length,
      i, j, ct, p, lastObj, obj, lastIter, undef, chr, tmp, key, value,
      postLeftBracketPos, keys, keysLen,
      fixStr = function(str) {
        return decodeURIComponent(str.replace(/\+/g, '%20'));
      };
  
    if (!array) {
      array = this.window;
    }
  
    for (i = 0; i < sal; i++) {
      tmp = strArr[i].split('=');
      key = fixStr(tmp[0]);
      value = (tmp.length < 2) ? '' : fixStr(tmp[1]);
  
      while (key.charAt(0) === ' ') {
        key = key.slice(1);
      }
      if (key.indexOf('\x00') > -1) {
        key = key.slice(0, key.indexOf('\x00'));
      }
      if (key && key.charAt(0) !== '[') {
        keys = [];
        postLeftBracketPos = 0;
        for (j = 0; j < key.length; j++) {
          if (key.charAt(j) === '[' && !postLeftBracketPos) {
            postLeftBracketPos = j + 1;
          } else if (key.charAt(j) === ']') {
            if (postLeftBracketPos) {
              if (!keys.length) {
                keys.push(key.slice(0, postLeftBracketPos - 1));
              }
              keys.push(key.substr(postLeftBracketPos, j - postLeftBracketPos));
              postLeftBracketPos = 0;
              if (key.charAt(j + 1) !== '[') {
                break;
              }
            }
          }
        }
        if (!keys.length) {
          keys = [key];
        }
        for (j = 0; j < keys[0].length; j++) {
          chr = keys[0].charAt(j);
          if (chr === ' ' || chr === '.' || chr === '[') {
            keys[0] = keys[0].substr(0, j) + '_' + keys[0].substr(j + 1);
          }
          if (chr === '[') {
            break;
          }
        }
  
        obj = array;
        for (j = 0, keysLen = keys.length; j < keysLen; j++) {
          key = keys[j].replace(/^['"]/, '')
            .replace(/['"]$/, '');
          lastIter = j !== keys.length - 1;
          lastObj = obj;
          if ((key !== '' && key !== ' ') || j === 0) {
            if (obj[key] === undef) {
              obj[key] = {};
            }
            obj = obj[key];
          } else { // To insert new dimension
            ct = -1;
            for (p in obj) {
              if (obj.hasOwnProperty(p)) {
                if (+p > ct && p.match(/^\d+$/g)) {
                  ct = +p;
                }
              }
            }
            key = ct + 1;
          }
        }
        lastObj[key] = value;
      }
    }
};

exports.quoted_printable_decode = function (str) {
  var RFC2045Decode1 = /=\r\n/gm,
      // Decodes all equal signs followed by two hex digits
      RFC2045Decode2IN = /=([0-9A-F]{2})/gim,
      // the RFC states against decoding lower case encodings, but following apparent PHP behavior
      // RFC2045Decode2IN = /=([0-9A-F]{2})/gm,
      RFC2045Decode2OUT = function(sMatch, sHex) {
        return String.fromCharCode(parseInt(sHex, 16));
      };
    return str.replace(RFC2045Decode1, '')
      .replace(RFC2045Decode2IN, RFC2045Decode2OUT);
};

exports.quoted_printable_encode = function (str) {
  var hexChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'],
      RFC2045Encode1IN = / \r\n|\r\n|[^!-<>-~ ]/gm,
      RFC2045Encode1OUT = function(sMatch) {
        // Encode space before CRLF sequence to prevent spaces from being stripped
        // Keep hard line breaks intact; CRLF sequences
        if (sMatch.length > 1) {
          return sMatch.replace(' ', '=20');
        }
        // Encode matching character
        var chr = sMatch.charCodeAt(0);
        return '=' + hexChars[((chr >>> 4) & 15)] + hexChars[(chr & 15)];
      };
    // Split lines to 75 characters; the reason it's 75 and not 76 is because softline breaks are preceeded by an equal sign; which would be the 76th character.
    // However, if the last line/string was exactly 76 characters, then a softline would not be needed. PHP currently softbreaks anyway; so this function replicates PHP.
    RFC2045Encode2IN = /.{1,72}(?!\r\n)[^=]{0,3}/g,
    RFC2045Encode2OUT = function(sMatch) {
      if (sMatch.substr(sMatch.length - 2) === '\r\n') {
        return sMatch;
      }
      return sMatch + '=\r\n';
    };
    str = str.replace(RFC2045Encode1IN, RFC2045Encode1OUT)
      .replace(RFC2045Encode2IN, RFC2045Encode2OUT);
    // Strip last softline break
    return str.substr(0, str.length - 3);
};

exports.quotemeta = function (str) {
  return (str + '')
      .replace(/([\.\\\+\*\?\[\^\]\$\(\)])/g, '\\$1');
};

exports.rtrim = function (str, charlist) {
  charlist = !charlist ? ' \\s\u00A0' : (charlist + '')
      .replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '\\$1');
    var re = new RegExp('[' + charlist + ']+$', 'g');
    return (str + '')
      .replace(re, '');
};

exports.similar_text = function (first, second, percent) {
  if (first === null || second === null || typeof first === 'undefined' || typeof second === 'undefined') {
      return 0;
    }
  
    first += '';
    second += '';
  
    var pos1 = 0,
      pos2 = 0,
      max = 0,
      firstLength = first.length,
      secondLength = second.length,
      p, q, l, sum;
  
    max = 0;
  
    for (p = 0; p < firstLength; p++) {
      for (q = 0; q < secondLength; q++) {
        for (l = 0;
          (p + l < firstLength) && (q + l < secondLength) && (first.charAt(p + l) === second.charAt(q + l)); l++)
        ;
        if (l > max) {
          max = l;
          pos1 = p;
          pos2 = q;
        }
      }
    }
  
    sum = max;
  
    if (sum) {
      if (pos1 && pos2) {
        sum += this.similar_text(first.substr(0, pos1), second.substr(0, pos2));
      }
  
      if ((pos1 + max < firstLength) && (pos2 + max < secondLength)) {
        sum += this.similar_text(first.substr(pos1 + max, firstLength - pos1 - max), second.substr(pos2 + max,
          secondLength - pos2 - max));
      }
    }
  
    if (!percent) {
      return sum;
    } else {
      return (sum * 200) / (firstLength + secondLength);
    }
};

exports.soundex = function (str) {
  str = (str + '')
      .toUpperCase();
    if (!str) {
      return '';
    }
    var sdx = [0, 0, 0, 0],
      m = {
        B: 1,
        F: 1,
        P: 1,
        V: 1,
        C: 2,
        G: 2,
        J: 2,
        K: 2,
        Q: 2,
        S: 2,
        X: 2,
        Z: 2,
        D: 3,
        T: 3,
        L: 4,
        M: 5,
        N: 5,
        R: 6
      },
      i = 0,
      j, s = 0,
      c, p;
  
    while ((c = str.charAt(i++)) && s < 4) {
      if (j = m[c]) {
        if (j !== p) {
          sdx[s++] = p = j;
        }
      } else {
        s += i === 1;
        p = 0;
      }
    }
  
    sdx[0] = str.charAt(0);
    return sdx.join('');
};

exports.sprintf = function () {
  var regex = /%%|%(\d+\$)?([-+\'#0 ]*)(\*\d+\$|\*|\d+)?(\.(\*\d+\$|\*|\d+))?([scboxXuideEfFgG])/g;
    var a = arguments;
    var i = 0;
    var format = a[i++];
  
    // pad()
    var pad = function(str, len, chr, leftJustify) {
      if (!chr) {
        chr = ' ';
      }
      var padding = (str.length >= len) ? '' : new Array(1 + len - str.length >>> 0)
        .join(chr);
      return leftJustify ? str + padding : padding + str;
    };
  
    // justify()
    var justify = function(value, prefix, leftJustify, minWidth, zeroPad, customPadChar) {
      var diff = minWidth - value.length;
      if (diff > 0) {
        if (leftJustify || !zeroPad) {
          value = pad(value, minWidth, customPadChar, leftJustify);
        } else {
          value = value.slice(0, prefix.length) + pad('', diff, '0', true) + value.slice(prefix.length);
        }
      }
      return value;
    };
  
    // formatBaseX()
    var formatBaseX = function(value, base, prefix, leftJustify, minWidth, precision, zeroPad) {
      // Note: casts negative numbers to positive ones
      var number = value >>> 0;
      prefix = prefix && number && {
        '2': '0b',
        '8': '0',
        '16': '0x'
      }[base] || '';
      value = prefix + pad(number.toString(base), precision || 0, '0', false);
      return justify(value, prefix, leftJustify, minWidth, zeroPad);
    };
  
    // formatString()
    var formatString = function(value, leftJustify, minWidth, precision, zeroPad, customPadChar) {
      if (precision != null) {
        value = value.slice(0, precision);
      }
      return justify(value, '', leftJustify, minWidth, zeroPad, customPadChar);
    };
  
    // doFormat()
    var doFormat = function(substring, valueIndex, flags, minWidth, _, precision, type) {
      var number, prefix, method, textTransform, value;
  
      if (substring === '%%') {
        return '%';
      }
  
      // parse flags
      var leftJustify = false;
      var positivePrefix = '';
      var zeroPad = false;
      var prefixBaseX = false;
      var customPadChar = ' ';
      var flagsl = flags.length;
      for (var j = 0; flags && j < flagsl; j++) {
        switch (flags.charAt(j)) {
          case ' ':
            positivePrefix = ' ';
            break;
          case '+':
            positivePrefix = '+';
            break;
          case '-':
            leftJustify = true;
            break;
          case "'":
            customPadChar = flags.charAt(j + 1);
            break;
          case '0':
            zeroPad = true;
            customPadChar = '0';
            break;
          case '#':
            prefixBaseX = true;
            break;
        }
      }
  
      // parameters may be null, undefined, empty-string or real valued
      // we want to ignore null, undefined and empty-string values
      if (!minWidth) {
        minWidth = 0;
      } else if (minWidth === '*') {
        minWidth = +a[i++];
      } else if (minWidth.charAt(0) == '*') {
        minWidth = +a[minWidth.slice(1, -1)];
      } else {
        minWidth = +minWidth;
      }
  
      // Note: undocumented perl feature:
      if (minWidth < 0) {
        minWidth = -minWidth;
        leftJustify = true;
      }
  
      if (!isFinite(minWidth)) {
        throw new Error('sprintf: (minimum-)width must be finite');
      }
  
      if (!precision) {
        precision = 'fFeE'.indexOf(type) > -1 ? 6 : (type === 'd') ? 0 : undefined;
      } else if (precision === '*') {
        precision = +a[i++];
      } else if (precision.charAt(0) == '*') {
        precision = +a[precision.slice(1, -1)];
      } else {
        precision = +precision;
      }
  
      // grab value using valueIndex if required?
      value = valueIndex ? a[valueIndex.slice(0, -1)] : a[i++];
  
      switch (type) {
        case 's':
          return formatString(String(value), leftJustify, minWidth, precision, zeroPad, customPadChar);
        case 'c':
          return formatString(String.fromCharCode(+value), leftJustify, minWidth, precision, zeroPad);
        case 'b':
          return formatBaseX(value, 2, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
        case 'o':
          return formatBaseX(value, 8, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
        case 'x':
          return formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
        case 'X':
          return formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad)
            .toUpperCase();
        case 'u':
          return formatBaseX(value, 10, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
        case 'i':
        case 'd':
          number = +value || 0;
          number = Math.round(number - number % 1); // Plain Math.round doesn't just truncate
          prefix = number < 0 ? '-' : positivePrefix;
          value = prefix + pad(String(Math.abs(number)), precision, '0', false);
          return justify(value, prefix, leftJustify, minWidth, zeroPad);
        case 'e':
        case 'E':
        case 'f': // Should handle locales (as per setlocale)
        case 'F':
        case 'g':
        case 'G':
          number = +value;
          prefix = number < 0 ? '-' : positivePrefix;
          method = ['toExponential', 'toFixed', 'toPrecision']['efg'.indexOf(type.toLowerCase())];
          textTransform = ['toString', 'toUpperCase']['eEfFgG'.indexOf(type) % 2];
          value = prefix + Math.abs(number)[method](precision);
          return justify(value, prefix, leftJustify, minWidth, zeroPad)[textTransform]();
        default:
          return substring;
      }
    };
  
    return format.replace(regex, doFormat);
};

exports.sscanf = function (str, format) {
  // SETUP
    var retArr = [],
      num = 0,
      _NWS = /\S/,
      args = arguments,
      that = this,
      digit;
  
    var _setExtraConversionSpecs = function(offset) {
      // Since a mismatched character sets us off track from future legitimate finds, we just scan
      // to the end for any other conversion specifications (besides a percent literal), setting them to null
      // sscanf seems to disallow all conversion specification components (of sprintf) except for type specifiers
      //var matches = format.match(/%[+-]?([ 0]|'.)?-?\d*(\.\d+)?[bcdeufFosxX]/g); // Do not allow % in last char. class
      var matches = format.slice(offset)
        .match(/%[cdeEufgosxX]/g); // Do not allow % in last char. class;
      // b, F,G give errors in PHP, but 'g', though also disallowed, doesn't
      if (matches) {
        var lgth = matches.length;
        while (lgth--) {
          retArr.push(null);
        }
      }
      return _finish();
    };
  
    var _finish = function() {
      if (args.length === 2) {
        return retArr;
      }
      for (var i = 0; i < retArr.length; ++i) {
        that.window[args[i + 2]] = retArr[i];
      }
      return i;
    };
  
    var _addNext = function(j, regex, cb) {
      if (assign) {
        var remaining = str.slice(j);
        var check = width ? remaining.substr(0, width) : remaining;
        var match = regex.exec(check);
        var testNull = retArr[digit !== undefined ? digit : retArr.length] = match ? (cb ? cb.apply(null, match) :
          match[0]) : null;
        if (testNull === null) {
          throw 'No match in string';
        }
        return j + match[0].length;
      }
      return j;
    };
  
    if (arguments.length < 2) {
      throw 'Not enough arguments passed to sscanf';
    }
  
    // PROCESS
    for (var i = 0, j = 0; i < format.length; i++) {
  
      var width = 0,
        assign = true;
  
      if (format.charAt(i) === '%') {
        if (format.charAt(i + 1) === '%') {
          if (str.charAt(j) === '%') { // a matched percent literal
            ++i, ++j; // skip beyond duplicated percent
            continue;
          }
          // Format indicated a percent literal, but not actually present
          return _setExtraConversionSpecs(i + 2);
        }
  
        // CHARACTER FOLLOWING PERCENT IS NOT A PERCENT
  
        var prePattern = new RegExp('^(?:(\\d+)\\$)?(\\*)?(\\d*)([hlL]?)', 'g'); // We need 'g' set to get lastIndex
  
        var preConvs = prePattern.exec(format.slice(i + 1));
  
        var tmpDigit = digit;
        if (tmpDigit && preConvs[1] === undefined) {
          throw 'All groups in sscanf() must be expressed as numeric if any have already been used';
        }
        digit = preConvs[1] ? parseInt(preConvs[1], 10) - 1 : undefined;
  
        assign = !preConvs[2];
        width = parseInt(preConvs[3], 10);
        var sizeCode = preConvs[4];
        i += prePattern.lastIndex;
  
        // Fix: Does PHP do anything with these? Seems not to matter
        if (sizeCode) { // This would need to be processed later
          switch (sizeCode) {
            case 'h':
              // Treats subsequent as short int (for d,i,n) or unsigned short int (for o,u,x)
            case 'l':
              // Treats subsequent as long int (for d,i,n), or unsigned long int (for o,u,x);
              //    or as double (for e,f,g) instead of float or wchar_t instead of char
            case 'L':
              // Treats subsequent as long double (for e,f,g)
              break;
            default:
              throw 'Unexpected size specifier in sscanf()!';
              break;
          }
        }
        // PROCESS CHARACTER
        try {
          switch (format.charAt(i + 1)) {
            // For detailed explanations, see http://web.archive.org/web/20031128125047/http://www.uwm.edu/cgi-bin/IMT/wwwman?topic=scanf%283%29&msection=
            // Also http://www.mathworks.com/access/helpdesk/help/techdoc/ref/sscanf.html
            // p, S, C arguments in C function not available
            // DOCUMENTED UNDER SSCANF
            case 'F':
              // Not supported in PHP sscanf; the argument is treated as a float, and
              //  presented as a floating-point number (non-locale aware)
              // sscanf doesn't support locales, so no need for two (see %f)
              break;
            case 'g':
              // Not supported in PHP sscanf; shorter of %e and %f
              // Irrelevant to input conversion
              break;
            case 'G':
              // Not supported in PHP sscanf; shorter of %E and %f
              // Irrelevant to input conversion
              break;
            case 'b':
              // Not supported in PHP sscanf; the argument is treated as an integer, and presented as a binary number
              // Not supported - couldn't distinguish from other integers
              break;
            case 'i':
              // Integer with base detection (Equivalent of 'd', but base 0 instead of 10)
              j = _addNext(j, /([+-])?(?:(?:0x([\da-fA-F]+))|(?:0([0-7]+))|(\d+))/, function(num, sign, hex,
                oct, dec) {
                return hex ? parseInt(num, 16) : oct ? parseInt(num, 8) : parseInt(num, 10);
              });
              break;
            case 'n':
              // Number of characters processed so far
              retArr[digit !== undefined ? digit : retArr.length - 1] = j;
              break;
              // DOCUMENTED UNDER SPRINTF
            case 'c':
              // Get character; suppresses skipping over whitespace! (but shouldn't be whitespace in format anyways, so no difference here)
              // Non-greedy match
              j = _addNext(j, new RegExp('.{1,' + (width || 1) + '}'));
              break;
            case 'D':
              // sscanf documented decimal number; equivalent of 'd';
            case 'd':
              // Optionally signed decimal integer
              j = _addNext(j, /([+-])?(?:0*)(\d+)/, function(num, sign, dec) {
                // Ignores initial zeroes, unlike %i and parseInt()
                var decInt = parseInt((sign || '') + dec, 10);
                if (decInt < 0) { // PHP also won't allow less than -2147483648
                  return decInt < -2147483648 ? -2147483648 : decInt; // integer overflow with negative
                } else { // PHP also won't allow greater than -2147483647
                  return decInt < 2147483647 ? decInt : 2147483647;
                }
              });
              break;
            case 'f':
              // Although sscanf doesn't support locales, this is used instead of '%F'; seems to be same as %e
            case 'E':
              // These don't discriminate here as both allow exponential float of either case
            case 'e':
              j = _addNext(j, /([+-])?(?:0*)(\d*\.?\d*(?:[eE]?\d+)?)/, function(num, sign, dec) {
                if (dec === '.') {
                  return null;
                }
                return parseFloat((sign || '') + dec); // Ignores initial zeroes, unlike %i and parseFloat()
              });
              break;
            case 'u':
              // unsigned decimal integer
              // We won't deal with integer overflows due to signs
              j = _addNext(j, /([+-])?(?:0*)(\d+)/, function(num, sign, dec) {
                // Ignores initial zeroes, unlike %i and parseInt()
                var decInt = parseInt(dec, 10);
                if (sign === '-') { // PHP also won't allow greater than 4294967295
                  return 4294967296 - decInt; // integer overflow with negative
                } else {
                  return decInt < 4294967295 ? decInt : 4294967295;
                }
              });
              break;
            case 'o':
              // Octal integer // Fix: add overflows as above?
              j = _addNext(j, /([+-])?(?:0([0-7]+))/, function(num, sign, oct) {
                return parseInt(num, 8);
              });
              break;
            case 's':
              // Greedy match
              j = _addNext(j, /\S+/);
              break;
            case 'X':
              // Same as 'x'?
            case 'x':
              // Fix: add overflows as above?
              // Initial 0x not necessary here
              j = _addNext(j, /([+-])?(?:(?:0x)?([\da-fA-F]+))/, function(num, sign, hex) {
                return parseInt(num, 16);
              });
              break;
            case '':
              // If no character left in expression
              throw 'Missing character after percent mark in sscanf() format argument';
            default:
              throw 'Unrecognized character after percent mark in sscanf() format argument';
          }
        } catch (e) {
          if (e === 'No match in string') { // Allow us to exit
            return _setExtraConversionSpecs(i + 2);
          }
        }++i; // Calculate skipping beyond initial percent too
      } else if (format.charAt(i) !== str.charAt(j)) {
        // Fix: Double-check i whitespace ignored in string and/or formats
        _NWS.lastIndex = 0;
        if ((_NWS)
          .test(str.charAt(j)) || str.charAt(j) === '') { // Whitespace doesn't need to be an exact match)
          return _setExtraConversionSpecs(i + 1);
        } else {
          // Adjust strings when encounter non-matching whitespace, so they align in future checks above
          str = str.slice(0, j) + str.slice(j + 1); // Ok to replace with j++;?
          i--;
        }
      } else {
        j++;
      }
    }
  
    // POST-PROCESSING
    return _finish();
};

exports.str_getcsv = function (input, delimiter, enclosure, escape) {
  // These test cases allowing for missing delimiters are not currently supported
    /*
      str_getcsv('"row2""cell1",row2cell2,row2cell3', null, null, '"');
      ['row2"cell1', 'row2cell2', 'row2cell3']
  
      str_getcsv('row1cell1,"row1,cell2",row1cell3', null, null, '"');
      ['row1cell1', 'row1,cell2', 'row1cell3']
  
      str_getcsv('"row2""cell1",row2cell2,"row2""""cell3"');
      ['row2"cell1', 'row2cell2', 'row2""cell3']
  
      str_getcsv('row1cell1,"row1,cell2","row1"",""cell3"', null, null, '"');
      ['row1cell1', 'row1,cell2', 'row1","cell3'];
  
      Should also test newlines within
  */
    var i, inpLen, output = [];
    var backwards = function(str) { // We need to go backwards to simulate negative look-behind (don't split on
      //an escaped enclosure even if followed by the delimiter and another enclosure mark)
      return str.split('')
        .reverse()
        .join('');
    };
    var pq = function(str) { // preg_quote()
      return String(str)
        .replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!<\>\|\:])/g, '\\$1');
    };
  
    delimiter = delimiter || ',';
    enclosure = enclosure || '"';
    escape = escape || '\\';
    var pqEnc = pq(enclosure);
    var pqEsc = pq(escape);
  
    input = input.replace(new RegExp('^\\s*' + pqEnc), '')
      .replace(new RegExp(pqEnc + '\\s*$'), '');
  
    // PHP behavior may differ by including whitespace even outside of the enclosure
    input = backwards(input)
      .split(new RegExp(pqEnc + '\\s*' + pq(delimiter) + '\\s*' + pqEnc + '(?!' + pqEsc + ')',
        'g'))
      .reverse();
  
    for (i = 0, inpLen = input.length; i < inpLen; i++) {
      output.push(backwards(input[i])
        .replace(new RegExp(pqEsc + pqEnc, 'g'), enclosure));
    }
  
    return output;
};

exports.str_ireplace = function (search, replace, subject) {
  var i, k = '';
    var searchl = 0;
    var reg;
  
    var escapeRegex = function(s) {
      return s.replace(/([\\\^\$*+\[\]?{}.=!:(|)])/g, '\\$1');
    };
  
    search += '';
    searchl = search.length;
    if (Object.prototype.toString.call(replace) !== '[object Array]') {
      replace = [replace];
      if (Object.prototype.toString.call(search) === '[object Array]') {
        // If search is an array and replace is a string,
        // then this replacement string is used for every value of search
        while (searchl > replace.length) {
          replace[replace.length] = replace[0];
        }
      }
    }
  
    if (Object.prototype.toString.call(search) !== '[object Array]') {
      search = [search];
    }
    while (search.length > replace.length) {
      // If replace has fewer values than search,
      // then an empty string is used for the rest of replacement values
      replace[replace.length] = '';
    }
  
    if (Object.prototype.toString.call(subject) === '[object Array]') {
      // If subject is an array, then the search and replace is performed
      // with every entry of subject , and the return value is an array as well.
      for (k in subject) {
        if (subject.hasOwnProperty(k)) {
          subject[k] = str_ireplace(search, replace, subject[k]);
        }
      }
      return subject;
    }
  
    searchl = search.length;
    for (i = 0; i < searchl; i++) {
      reg = new RegExp(escapeRegex(search[i]), 'gi');
      subject = subject.replace(reg, replace[i]);
    }
  
    return subject;
};

exports.str_pad = function (input, pad_length, pad_string, pad_type) {
  var half = '',
      pad_to_go;
  
    var str_pad_repeater = function(s, len) {
      var collect = '',
        i;
  
      while (collect.length < len) {
        collect += s;
      }
      collect = collect.substr(0, len);
  
      return collect;
    };
  
    input += '';
    pad_string = pad_string !== undefined ? pad_string : ' ';
  
    if (pad_type !== 'STR_PAD_LEFT' && pad_type !== 'STR_PAD_RIGHT' && pad_type !== 'STR_PAD_BOTH') {
      pad_type = 'STR_PAD_RIGHT';
    }
    if ((pad_to_go = pad_length - input.length) > 0) {
      if (pad_type === 'STR_PAD_LEFT') {
        input = str_pad_repeater(pad_string, pad_to_go) + input;
      } else if (pad_type === 'STR_PAD_RIGHT') {
        input = input + str_pad_repeater(pad_string, pad_to_go);
      } else if (pad_type === 'STR_PAD_BOTH') {
        half = str_pad_repeater(pad_string, Math.ceil(pad_to_go / 2));
        input = half + input + half;
        input = input.substr(0, pad_length);
      }
    }
  
    return input;
};

exports.str_repeat = function (input, multiplier) {
  var y = '';
    while (true) {
      if (multiplier & 1) {
        y += input;
      }
      multiplier >>= 1;
      if (multiplier) {
        input += input;
      } else {
        break;
      }
    }
    return y;
};

exports.str_replace = function (search, replace, subject, count) {
  var i = 0,
      j = 0,
      temp = '',
      repl = '',
      sl = 0,
      fl = 0,
      f = [].concat(search),
      r = [].concat(replace),
      s = subject,
      ra = Object.prototype.toString.call(r) === '[object Array]',
      sa = Object.prototype.toString.call(s) === '[object Array]';
    s = [].concat(s);
    if (count) {
      this.window[count] = 0;
    }
  
    for (i = 0, sl = s.length; i < sl; i++) {
      if (s[i] === '') {
        continue;
      }
      for (j = 0, fl = f.length; j < fl; j++) {
        temp = s[i] + '';
        repl = ra ? (r[j] !== undefined ? r[j] : '') : r[0];
        s[i] = (temp)
          .split(f[j])
          .join(repl);
        if (count && s[i] !== temp) {
          this.window[count] += (temp.length - s[i].length) / f[j].length;
        }
      }
    }
    return sa ? s : s[0];
};

exports.str_rot13 = function (str) {
  return (str + '')
      .replace(/[a-z]/gi, function(s) {
        return String.fromCharCode(s.charCodeAt(0) + (s.toLowerCase() < 'n' ? 13 : -13));
      });
};

exports.str_shuffle = function (str) {
  if (arguments.length === 0) {
      throw 'Wrong parameter count for str_shuffle()';
    }
  
    if (str == null) {
      return '';
    }
  
    str += '';
  
    var newStr = '',
      rand, i = str.length;
  
    while (i) {
      rand = Math.floor(Math.random() * i);
      newStr += str.charAt(rand);
      str = str.substring(0, rand) + str.substr(rand + 1);
      i--;
    }
  
    return newStr;
};

exports.str_split = function (string, split_length) {
  if (split_length === null) {
      split_length = 1;
    }
    if (string === null || split_length < 1) {
      return false;
    }
    string += '';
    var chunks = [],
      pos = 0,
      len = string.length;
    while (pos < len) {
      chunks.push(string.slice(pos, pos += split_length));
    }
  
    return chunks;
};

exports.strcasecmp = function (f_string1, f_string2) {
  var string1 = (f_string1 + '')
      .toLowerCase();
    var string2 = (f_string2 + '')
      .toLowerCase();
  
    if (string1 > string2) {
      return 1;
    } else if (string1 == string2) {
      return 0;
    }
  
    return -1;
};

exports.strcmp = function (str1, str2) {
  return ((str1 == str2) ? 0 : ((str1 > str2) ? 1 : -1));
};

exports.strcspn = function (str, mask, start, length) {
  start = start ? start : 0;
    var count = (length && ((start + length) < str.length)) ? start + length : str.length;
    strct: for (var i = start, lgth = 0; i < count; i++) {
      for (var j = 0; j < mask.length; j++) {
        if (str.charAt(i)
          .indexOf(mask[j]) !== -1) {
          continue strct;
        }
      }++lgth;
    }
  
    return lgth;
};

exports.strip_tags = function (input, allowed) {
  allowed = (((allowed || '') + '')
      .toLowerCase()
      .match(/<[a-z][a-z0-9]*>/g) || [])
      .join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
      commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
    return input.replace(commentsAndPhpTags, '')
      .replace(tags, function($0, $1) {
        return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
      });
};

exports.stripos = function (f_haystack, f_needle, f_offset) {
  var haystack = (f_haystack + '')
      .toLowerCase();
    var needle = (f_needle + '')
      .toLowerCase();
    var index = 0;
  
    if ((index = haystack.indexOf(needle, f_offset)) !== -1) {
      return index;
    }
    return false;
};

exports.stripslashes = function (str) {
  return (str + '')
      .replace(/\\(.?)/g, function(s, n1) {
        switch (n1) {
          case '\\':
            return '\\';
          case '0':
            return '\u0000';
          case '':
            return '';
          default:
            return n1;
        }
      });
};

exports.stristr = function (haystack, needle, bool) {
  var pos = 0;
  
    haystack += '';
    pos = haystack.toLowerCase()
      .indexOf((needle + '')
        .toLowerCase());
    if (pos == -1) {
      return false;
    } else {
      if (bool) {
        return haystack.substr(0, pos);
      } else {
        return haystack.slice(pos);
      }
    }
};

exports.strlen = function (string) {
  var str = string + '';
    var i = 0,
      chr = '',
      lgth = 0;
  
    if (!this.php_js || !this.php_js.ini || !this.php_js.ini['unicode.semantics'] || this.php_js.ini[
      'unicode.semantics'].local_value.toLowerCase() !== 'on') {
      return string.length;
    }
  
    var getWholeChar = function(str, i) {
      var code = str.charCodeAt(i);
      var next = '',
        prev = '';
      if (0xD800 <= code && code <= 0xDBFF) { // High surrogate (could change last hex to 0xDB7F to treat high private surrogates as single characters)
        if (str.length <= (i + 1)) {
          throw 'High surrogate without following low surrogate';
        }
        next = str.charCodeAt(i + 1);
        if (0xDC00 > next || next > 0xDFFF) {
          throw 'High surrogate without following low surrogate';
        }
        return str.charAt(i) + str.charAt(i + 1);
      } else if (0xDC00 <= code && code <= 0xDFFF) { // Low surrogate
        if (i === 0) {
          throw 'Low surrogate without preceding high surrogate';
        }
        prev = str.charCodeAt(i - 1);
        if (0xD800 > prev || prev > 0xDBFF) { //(could change last hex to 0xDB7F to treat high private surrogates as single characters)
          throw 'Low surrogate without preceding high surrogate';
        }
        return false; // We can pass over low surrogates now as the second component in a pair which we have already processed
      }
      return str.charAt(i);
    };
  
    for (i = 0, lgth = 0; i < str.length; i++) {
      if ((chr = getWholeChar(str, i)) === false) {
        continue;
      } // Adapt this line at the top of any loop, passing in the whole string and the current iteration and returning a variable to represent the individual character; purpose is to treat the first part of a surrogate pair as the whole character and then ignore the second part
      lgth++;
    }
    return lgth;
};

exports.strnatcasecmp = function (str1, str2) {
  var a = (str1 + '')
      .toLowerCase();
    var b = (str2 + '')
      .toLowerCase();
  
    var isWhitespaceChar = function(a) {
      return a.charCodeAt(0) <= 32;
    };
  
    var isDigitChar = function(a) {
      var charCode = a.charCodeAt(0);
      return (charCode >= 48 && charCode <= 57);
    };
  
    var compareRight = function(a, b) {
      var bias = 0;
      var ia = 0;
      var ib = 0;
  
      var ca;
      var cb;
  
      // The longest run of digits wins.  That aside, the greatest
      // value wins, but we can't know that it will until we've scanned
      // both numbers to know that they have the same magnitude, so we
      // remember it in BIAS.
      for (var cnt = 0; true; ia++, ib++) {
        ca = a.charAt(ia);
        cb = b.charAt(ib);
  
        if (!isDigitChar(ca) && !isDigitChar(cb)) {
          return bias;
        } else if (!isDigitChar(ca)) {
          return -1;
        } else if (!isDigitChar(cb)) {
          return 1;
        } else if (ca < cb) {
          if (bias === 0) {
            bias = -1;
          }
        } else if (ca > cb) {
          if (bias === 0) {
            bias = 1;
          }
        } else if (ca === '0' && cb === '0') {
          return bias;
        }
      }
    };
  
    var ia = 0,
      ib = 0;
    var nza = 0,
      nzb = 0;
    var ca, cb;
    var result;
  
    while (true) {
      // only count the number of zeroes leading the last number compared
      nza = nzb = 0;
  
      ca = a.charAt(ia);
      cb = b.charAt(ib);
  
      // skip over leading spaces or zeros
      while (isWhitespaceChar(ca) || ca === '0') {
        if (ca === '0') {
          nza++;
        } else {
          // only count consecutive zeroes
          nza = 0;
        }
  
        ca = a.charAt(++ia);
      }
  
      while (isWhitespaceChar(cb) || cb === '0') {
        if (cb === '0') {
          nzb++;
        } else {
          // only count consecutive zeroes
          nzb = 0;
        }
  
        cb = b.charAt(++ib);
      }
  
      // process run of digits
      if (isDigitChar(ca) && isDigitChar(cb)) {
        if ((result = compareRight(a.substring(ia), b.substring(ib))) !== 0) {
          return result;
        }
      }
  
      if (ca === '0' && cb === '0') {
        // The strings compare the same.  Perhaps the caller
        // will want to call strcmp to break the tie.
        return nza - nzb;
      }
  
      if (ca < cb) {
        return -1;
      } else if (ca > cb) {
        return +1;
      }
  
      // prevent possible infinite loop
      if (ia >= a.length && ib >= b.length) return 0;
  
      ++ia;
      ++ib;
    }
};

exports.strncasecmp = function (argStr1, argStr2, len) {
  var diff, i = 0;
    var str1 = (argStr1 + '')
      .toLowerCase()
      .substr(0, len);
    var str2 = (argStr2 + '')
      .toLowerCase()
      .substr(0, len);
  
    if (str1.length !== str2.length) {
      if (str1.length < str2.length) {
        len = str1.length;
        if (str2.substr(0, str1.length) == str1) {
          return str1.length - str2.length; // return the difference of chars
        }
      } else {
        len = str2.length;
        // str1 is longer than str2
        if (str1.substr(0, str2.length) == str2) {
          return str1.length - str2.length; // return the difference of chars
        }
      }
    } else {
      // Avoids trying to get a char that does not exist
      len = str1.length;
    }
  
    for (diff = 0, i = 0; i < len; i++) {
      diff = str1.charCodeAt(i) - str2.charCodeAt(i);
      if (diff !== 0) {
        return diff;
      }
    }
  
    return 0;
};

exports.strncmp = function (str1, str2, lgth) {
  var s1 = (str1 + '')
      .substr(0, lgth);
    var s2 = (str2 + '')
      .substr(0, lgth);
  
    return ((s1 == s2) ? 0 : ((s1 > s2) ? 1 : -1));
};

exports.strpbrk = function (haystack, char_list) {
  for (var i = 0, len = haystack.length; i < len; ++i) {
      if (char_list.indexOf(haystack.charAt(i)) >= 0) {
        return haystack.slice(i);
      }
    }
    return false;
};

exports.strpos = function (haystack, needle, offset) {
  var i = (haystack + '')
      .indexOf(needle, (offset || 0));
    return i === -1 ? false : i;
};

exports.strrchr = function (haystack, needle) {
  var pos = 0;
  
    if (typeof needle !== 'string') {
      needle = String.fromCharCode(parseInt(needle, 10));
    }
    needle = needle.charAt(0);
    pos = haystack.lastIndexOf(needle);
    if (pos === -1) {
      return false;
    }
  
    return haystack.substr(pos);
};

exports.strrev = function (string) {
  string = string + '';
  
    // Performance will be enhanced with the next two lines of code commented
    //      out if you don't care about combining characters
    // Keep Unicode combining characters together with the character preceding
    //      them and which they are modifying (as in PHP 6)
    // See http://unicode.org/reports/tr44/#Property_Table (Me+Mn)
    // We also add the low surrogate range at the beginning here so it will be
    //      maintained with its preceding high surrogate
    var grapheme_extend =
      /(.)([\uDC00-\uDFFF\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065E\u0670\u06D6-\u06DC\u06DE-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u0901-\u0903\u093C\u093E-\u094D\u0951-\u0954\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C01-\u0C03\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C82\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D02\u0D03\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F90-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B6-\u17D3\u17DD\u180B-\u180D\u18A9\u1920-\u192B\u1930-\u193B\u19B0-\u19C0\u19C8\u19C9\u1A17-\u1A1B\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAA\u1C24-\u1C37\u1DC0-\u1DE6\u1DFE\u1DFF\u20D0-\u20F0\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA67C\uA67D\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C4\uA926-\uA92D\uA947-\uA953\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uFB1E\uFE00-\uFE0F\uFE20-\uFE26]+)/g;
    string = string.replace(grapheme_extend, '$2$1'); // Temporarily reverse
    return string.split('')
      .reverse()
      .join('');
};

exports.strripos = function (haystack, needle, offset) {
  haystack = (haystack + '')
      .toLowerCase();
    needle = (needle + '')
      .toLowerCase();
  
    var i = -1;
    if (offset) {
      i = (haystack + '')
        .slice(offset)
        .lastIndexOf(needle); // strrpos' offset indicates starting point of range till end,
      // while lastIndexOf's optional 2nd argument indicates ending point of range from the beginning
      if (i !== -1) {
        i += offset;
      }
    } else {
      i = (haystack + '')
        .lastIndexOf(needle);
    }
    return i >= 0 ? i : false;
};

exports.strrpos = function (haystack, needle, offset) {
  var i = -1;
    if (offset) {
      i = (haystack + '')
        .slice(offset)
        .lastIndexOf(needle); // strrpos' offset indicates starting point of range till end,
      // while lastIndexOf's optional 2nd argument indicates ending point of range from the beginning
      if (i !== -1) {
        i += offset;
      }
    } else {
      i = (haystack + '')
        .lastIndexOf(needle);
    }
    return i >= 0 ? i : false;
};

exports.strspn = function (str1, str2, start, lgth) {
  var found;
    var stri;
    var strj;
    var j = 0;
    var i = 0;
  
    start = start ? (start < 0 ? (str1.length + start) : start) : 0;
    lgth = lgth ? ((lgth < 0) ? (str1.length + lgth - start) : lgth) : str1.length - start;
    str1 = str1.substr(start, lgth);
  
    for (i = 0; i < str1.length; i++) {
      found = 0;
      stri = str1.substring(i, i + 1);
      for (j = 0; j <= str2.length; j++) {
        strj = str2.substring(j, j + 1);
        if (stri == strj) {
          found = 1;
          break;
        }
      }
      if (found != 1) {
        return i;
      }
    }
  
    return i;
};

exports.strstr = function (haystack, needle, bool) {
  var pos = 0;
  
    haystack += '';
    pos = haystack.indexOf(needle);
    if (pos == -1) {
      return false;
    } else {
      if (bool) {
        return haystack.substr(0, pos);
      } else {
        return haystack.slice(pos);
      }
    }
};

exports.strtok = function (str, tokens) {
  this.php_js = this.php_js || {};
    // END REDUNDANT
    if (tokens === undefined) {
      tokens = str;
      str = this.php_js.strtokleftOver;
    }
    if (str.length === 0) {
      return false;
    }
    if (tokens.indexOf(str.charAt(0)) !== -1) {
      return this.strtok(str.substr(1), tokens);
    }
    for (var i = 0; i < str.length; i++) {
      if (tokens.indexOf(str.charAt(i)) !== -1) {
        break;
      }
    }
    this.php_js.strtokleftOver = str.substr(i + 1);
    return str.substring(0, i);
};

exports.strtolower = function (str) {
  return (str + '')
      .toLowerCase();
};

exports.strtoupper = function (str) {
  return (str + '')
      .toUpperCase();
};

exports.substr = function (str, start, len) {
  var i = 0,
      allBMP = true,
      es = 0,
      el = 0,
      se = 0,
      ret = '';
    str += '';
    var end = str.length;
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    switch ((this.php_js.ini['unicode.semantics'] && this.php_js.ini['unicode.semantics'].local_value.toLowerCase())) {
      case 'on':
        // Full-blown Unicode including non-Basic-Multilingual-Plane characters
        // strlen()
        for (i = 0; i < str.length; i++) {
          if (/[\uD800-\uDBFF]/.test(str.charAt(i)) && /[\uDC00-\uDFFF]/.test(str.charAt(i + 1))) {
            allBMP = false;
            break;
          }
        }
  
        if (!allBMP) {
          if (start < 0) {
            for (i = end - 1, es = (start += end); i >= es; i--) {
              if (/[\uDC00-\uDFFF]/.test(str.charAt(i)) && /[\uD800-\uDBFF]/.test(str.charAt(i - 1))) {
                start--;
                es--;
              }
            }
          } else {
            var surrogatePairs = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
            while ((surrogatePairs.exec(str)) != null) {
              var li = surrogatePairs.lastIndex;
              if (li - 2 < start) {
                start++;
              } else {
                break;
              }
            }
          }
  
          if (start >= end || start < 0) {
            return false;
          }
          if (len < 0) {
            for (i = end - 1, el = (end += len); i >= el; i--) {
              if (/[\uDC00-\uDFFF]/.test(str.charAt(i)) && /[\uD800-\uDBFF]/.test(str.charAt(i - 1))) {
                end--;
                el--;
              }
            }
            if (start > end) {
              return false;
            }
            return str.slice(start, end);
          } else {
            se = start + len;
            for (i = start; i < se; i++) {
              ret += str.charAt(i);
              if (/[\uD800-\uDBFF]/.test(str.charAt(i)) && /[\uDC00-\uDFFF]/.test(str.charAt(i + 1))) {
                se++; // Go one further, since one of the "characters" is part of a surrogate pair
              }
            }
            return ret;
          }
          break;
        }
        // Fall-through
      case 'off':
        // assumes there are no non-BMP characters;
        //    if there may be such characters, then it is best to turn it on (critical in true XHTML/XML)
      default:
        if (start < 0) {
          start += end;
        }
        end = typeof len === 'undefined' ? end : (len < 0 ? len + end : len + start);
        // PHP returns false if start does not fall within the string.
        // PHP returns false if the calculated end comes before the calculated start.
        // PHP returns an empty string if start and end are the same.
        // Otherwise, PHP returns the portion of the string from start to end.
        return start >= str.length || start < 0 || start > end ? !1 : str.slice(start, end);
    }
    return undefined; // Please Netbeans
};

exports.substr_compare = function (main_str, str, offset, length, case_insensitivity) {
  if (!offset && offset !== 0) {
      throw 'Missing offset for substr_compare()';
    }
  
    if (offset < 0) {
      offset = main_str.length + offset;
    }
  
    if (length && length > (main_str.length - offset)) {
      return false;
    }
    length = length || main_str.length - offset;
  
    main_str = main_str.substr(offset, length);
    str = str.substr(0, length); // Should only compare up to the desired length
    if (case_insensitivity) { // Works as strcasecmp
      main_str = (main_str + '')
        .toLowerCase();
      str = (str + '')
        .toLowerCase();
      if (main_str == str) {
        return 0;
      }
      return (main_str > str) ? 1 : -1;
    }
    // Works as strcmp
    return ((main_str == str) ? 0 : ((main_str > str) ? 1 : -1));
};

exports.substr_count = function (haystack, needle, offset, length) {
  var cnt = 0;
  
    haystack += '';
    needle += '';
    if (isNaN(offset)) {
      offset = 0;
    }
    if (isNaN(length)) {
      length = 0;
    }
    if (needle.length == 0) {
      return false;
    }
    offset--;
  
    while ((offset = haystack.indexOf(needle, offset + 1)) != -1) {
      if (length > 0 && (offset + needle.length) > length) {
        return false;
      }
      cnt++;
    }
  
    return cnt;
};

exports.substr_replace = function (str, replace, start, length) {
  if (start < 0) { // start position in str
      start = start + str.length;
    }
    length = length !== undefined ? length : str.length;
    if (length < 0) {
      length = length + str.length - start;
    }
  
    return str.slice(0, start) + replace.substr(0, length) + replace.slice(length) + str.slice(start + length);
};

exports.trim = function (str, charlist) {
  var whitespace, l = 0,
      i = 0;
    str += '';
  
    if (!charlist) {
      // default list
      whitespace =
        ' \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000';
    } else {
      // preg_quote custom list
      charlist += '';
      whitespace = charlist.replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '$1');
    }
  
    l = str.length;
    for (i = 0; i < l; i++) {
      if (whitespace.indexOf(str.charAt(i)) === -1) {
        str = str.substring(i);
        break;
      }
    }
  
    l = str.length;
    for (i = l - 1; i >= 0; i--) {
      if (whitespace.indexOf(str.charAt(i)) === -1) {
        str = str.substring(0, i + 1);
        break;
      }
    }
  
    return whitespace.indexOf(str.charAt(0)) === -1 ? str : '';
};

exports.ucfirst = function (str) {
  str += '';
    var f = str.charAt(0)
      .toUpperCase();
    return f + str.substr(1);
};

exports.ucwords = function (str) {
  return (str + '')
      .replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function($1) {
        return $1.toUpperCase();
      });
};

exports.wordwrap = function (str, int_width, str_break, cut) {
  var m = ((arguments.length >= 2) ? arguments[1] : 75);
    var b = ((arguments.length >= 3) ? arguments[2] : '\n');
    var c = ((arguments.length >= 4) ? arguments[3] : false);
  
    var i, j, l, s, r;
  
    str += '';
  
    if (m < 1) {
      return str;
    }
  
    for (i = -1, l = (r = str.split(/\r\n|\n|\r/))
      .length; ++i < l; r[i] += s) {
      for (s = r[i], r[i] = ''; s.length > m; r[i] += s.slice(0, j) + ((s = s.slice(j))
        .length ? b : '')) {
        j = c == 2 || (j = s.slice(0, m + 1)
          .match(/\S*(\s)?$/))[1] ? m : j.input.length - j[0].length || c == 1 && m || j.input.length + (j = s.slice(
            m)
          .match(/^\S*/))[0].length;
      }
    }
  
    return r.join('\n');
};

exports.base64_decode = function (data) {
  var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
      ac = 0,
      dec = '',
      tmp_arr = [];
  
    if (!data) {
      return data;
    }
  
    data += '';
  
    do { // unpack four hexets into three octets using index points in b64
      h1 = b64.indexOf(data.charAt(i++));
      h2 = b64.indexOf(data.charAt(i++));
      h3 = b64.indexOf(data.charAt(i++));
      h4 = b64.indexOf(data.charAt(i++));
  
      bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;
  
      o1 = bits >> 16 & 0xff;
      o2 = bits >> 8 & 0xff;
      o3 = bits & 0xff;
  
      if (h3 == 64) {
        tmp_arr[ac++] = String.fromCharCode(o1);
      } else if (h4 == 64) {
        tmp_arr[ac++] = String.fromCharCode(o1, o2);
      } else {
        tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
      }
    } while (i < data.length);
  
    dec = tmp_arr.join('');
  
    return decodeURIComponent(escape(dec.replace(/\0+$/, '')));
};

exports.base64_encode = function (data) {
  var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
      ac = 0,
      enc = '',
      tmp_arr = [];
  
    if (!data) {
      return data;
    }
  
    data = unescape(encodeURIComponent(data))
  
    do { // pack three octets into four hexets
      o1 = data.charCodeAt(i++);
      o2 = data.charCodeAt(i++);
      o3 = data.charCodeAt(i++);
  
      bits = o1 << 16 | o2 << 8 | o3;
  
      h1 = bits >> 18 & 0x3f;
      h2 = bits >> 12 & 0x3f;
      h3 = bits >> 6 & 0x3f;
      h4 = bits & 0x3f;
  
      // use hexets to index into b64, and append result to encoded string
      tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);
  
    enc = tmp_arr.join('');
  
    var r = data.length % 3;
  
    return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
};

exports.parse_url = function (str, component) {
  var query, key = ['source', 'scheme', 'authority', 'userInfo', 'user', 'pass', 'host', 'port',
        'relative', 'path', 'directory', 'file', 'query', 'fragment'
      ],
      ini = (this.php_js && this.php_js.ini) || {},
      mode = (ini['phpjs.parse_url.mode'] &&
        ini['phpjs.parse_url.mode'].local_value) || 'php',
      parser = {
        php: /^(?:([^:\/?#]+):)?(?:\/\/()(?:(?:()(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?()(?:(()(?:(?:[^?#\/]*\/)*)()(?:[^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/\/?)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/ // Added one optional slash to post-scheme to catch file:/// (should restrict this)
      };
  
    var m = parser[mode].exec(str),
      uri = {},
      i = 14;
    while (i--) {
      if (m[i]) {
        uri[key[i]] = m[i];
      }
    }
  
    if (component) {
      return uri[component.replace('PHP_URL_', '')
        .toLowerCase()];
    }
    if (mode !== 'php') {
      var name = (ini['phpjs.parse_url.queryKey'] &&
        ini['phpjs.parse_url.queryKey'].local_value) || 'queryKey';
      parser = /(?:^|&)([^&=]*)=?([^&]*)/g;
      uri[name] = {};
      query = uri[key[12]] || '';
      query.replace(parser, function($0, $1, $2) {
        if ($1) {
          uri[name][$1] = $2;
        }
      });
    }
    delete uri.source;
    return uri;
};

exports.rawurldecode = function (str) {
  return decodeURIComponent((str + '')
      .replace(/%(?![\da-f]{2})/gi, function() {
        // PHP tolerates poorly formed escape sequences
        return '%25';
      }));
};

exports.rawurlencode = function (str) {
  str = (str + '')
      .toString();
  
    // Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
    // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .
    replace(/\)/g, '%29')
      .replace(/\*/g, '%2A');
};

exports.urldecode = function (str) {
  return decodeURIComponent((str + '')
      .replace(/%(?![\da-f]{2})/gi, function() {
        // PHP tolerates poorly formed escape sequences
        return '%25';
      })
      .replace(/\+/g, '%20'));
};

exports.urlencode = function (str) {
  str = (str + '')
      .toString();
  
    // Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
    // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .
    replace(/\)/g, '%29')
      .replace(/\*/g, '%2A')
      .replace(/%20/g, '+');
};

exports.empty = function (mixed_var) {
  var undef, key, i, len;
    var emptyValues = [undef, null, false, 0, '', '0'];
  
    for (i = 0, len = emptyValues.length; i < len; i++) {
      if (mixed_var === emptyValues[i]) {
        return true;
      }
    }
  
    if (typeof mixed_var === 'object') {
      for (key in mixed_var) {
        // TODO: should we check for own properties only?
        //if (mixed_var.hasOwnProperty(key)) {
        return false;
        //}
      }
      return true;
    }
  
    return false;
};

exports.floatval = function (mixed_var) {
  return (parseFloat(mixed_var) || 0);
};

exports.intval = function (mixed_var, base) {
  var tmp;
  
    var type = typeof mixed_var;
  
    if (type === 'boolean') {
      return +mixed_var;
    } else if (type === 'string') {
      tmp = parseInt(mixed_var, base || 10);
      return (isNaN(tmp) || !isFinite(tmp)) ? 0 : tmp;
    } else if (type === 'number' && isFinite(mixed_var)) {
      return mixed_var | 0;
    } else {
      return 0;
    }
};

exports.is_array = function (mixed_var) {
  var ini,
      _getFuncName = function(fn) {
        var name = (/\W*function\s+([\w\$]+)\s*\(/)
          .exec(fn);
        if (!name) {
          return '(Anonymous)';
        }
        return name[1];
      };
    _isArray = function(mixed_var) {
      // return Object.prototype.toString.call(mixed_var) === '[object Array]';
      // The above works, but let's do the even more stringent approach: (since Object.prototype.toString could be overridden)
      // Null, Not an object, no length property so couldn't be an Array (or String)
      if (!mixed_var || typeof mixed_var !== 'object' || typeof mixed_var.length !== 'number') {
        return false;
      }
      var len = mixed_var.length;
      mixed_var[mixed_var.length] = 'bogus';
      // The only way I can think of to get around this (or where there would be trouble) would be to have an object defined
      // with a custom "length" getter which changed behavior on each call (or a setter to mess up the following below) or a custom
      // setter for numeric properties, but even that would need to listen for specific indexes; but there should be no false negatives
      // and such a false positive would need to rely on later JavaScript innovations like __defineSetter__
      if (len !== mixed_var.length) { // We know it's an array since length auto-changed with the addition of a
        // numeric property at its length end, so safely get rid of our bogus element
        mixed_var.length -= 1;
        return true;
      }
      // Get rid of the property we added onto a non-array object; only possible
      // side-effect is if the user adds back the property later, it will iterate
      // this property in the older order placement in IE (an order which should not
      // be depended on anyways)
      delete mixed_var[mixed_var.length];
      return false;
    };
  
    if (!mixed_var || typeof mixed_var !== 'object') {
      return false;
    }
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
  
    ini = this.php_js.ini['phpjs.objectsAsArrays'];
  
    return _isArray(mixed_var) ||
    // Allow returning true unless user has called
    // ini_set('phpjs.objectsAsArrays', 0) to disallow objects as arrays
    ((!ini || ( // if it's not set to 0 and it's not 'off', check for objects as arrays
      (parseInt(ini.local_value, 10) !== 0 && (!ini.local_value.toLowerCase || ini.local_value.toLowerCase() !==
        'off')))) && (
      Object.prototype.toString.call(mixed_var) === '[object Object]' && _getFuncName(mixed_var.constructor) ===
      'Object' // Most likely a literal and intended as assoc. array
    ));
};

exports.is_binary = function (vr) {
  return typeof vr === 'string'; // If it is a string of any kind, it could be binary
};

exports.is_bool = function (mixed_var) {
  return (mixed_var === true || mixed_var === false); // Faster (in FF) than type checking
};

exports.is_buffer = function (vr) {
  return typeof vr === 'string';
};

exports.is_callable = function (v, syntax_only, callable_name) {
  var name = '',
      obj = {},
      method = '';
    var getFuncName = function(fn) {
      var name = (/\W*function\s+([\w\$]+)\s*\(/)
        .exec(fn);
      if (!name) {
        return '(Anonymous)';
      }
      return name[1];
    };
    if (typeof v === 'string') {
      obj = this.window;
      method = v;
      name = v;
    } else if (typeof v === 'function') {
      return true;
    } else if (Object.prototype.toString.call(v) === '[object Array]' &&
      v.length === 2 && typeof v[0] === 'object' && typeof v[1] === 'string') {
      obj = v[0];
      method = v[1];
      name = (obj.constructor && getFuncName(obj.constructor)) + '::' + method;
    } else {
      return false;
    }
    if (syntax_only || typeof obj[method] === 'function') {
      if (callable_name) {
        this.window[callable_name] = name;
      }
      return true;
    }
    return false;
};

exports.is_float = function (mixed_var) {
  return +mixed_var === mixed_var && (!isFinite(mixed_var) || !! (mixed_var % 1));
};

exports.is_int = function (mixed_var) {
  return mixed_var === +mixed_var && isFinite(mixed_var) && !(mixed_var % 1);
};

exports.is_null = function (mixed_var) {
  return (mixed_var === null);
};

exports.is_numeric = function (mixed_var) {
  var whitespace =
      " \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000";
    return (typeof mixed_var === 'number' || (typeof mixed_var === 'string' && whitespace.indexOf(mixed_var.slice(-1)) === -
      1)) && mixed_var !== '' && !isNaN(mixed_var);
};

exports.is_object = function (mixed_var) {
  if (Object.prototype.toString.call(mixed_var) === '[object Array]') {
      return false;
    }
    return mixed_var !== null && typeof mixed_var === 'object';
};

exports.is_resource = function (handle) {
  var getFuncName = function(fn) {
      var name = (/\W*function\s+([\w\$]+)\s*\(/)
        .exec(fn);
      if (!name) {
        return '(Anonymous)';
      }
      return name[1];
    };
    return !(!handle || typeof handle !== 'object' || !handle.constructor || getFuncName(handle.constructor) !==
      'PHPJS_Resource');
};

exports.is_scalar = function (mixed_var) {
  return (/boolean|number|string/)
      .test(typeof mixed_var);
};

exports.is_string = function (mixed_var) {
  return (typeof mixed_var === 'string');
};

exports.is_unicode = function (vr) {
  if (typeof vr !== 'string') {
      return false;
    }
  
    // If surrogates occur outside of high-low pairs, then this is not Unicode
    var arr = [],
      any = '([\s\S])',
      highSurrogate = '[\uD800-\uDBFF]',
      lowSurrogate = '[\uDC00-\uDFFF]',
      highSurrogateBeforeAny = new RegExp(highSurrogate + any, 'g'),
      lowSurrogateAfterAny = new RegExp(any + lowSurrogate, 'g'),
      singleLowSurrogate = new RegExp('^' + lowSurrogate + '$'),
      singleHighSurrogate = new RegExp('^' + highSurrogate + '$');
  
    while ((arr = highSurrogateBeforeAny.exec(vr)) !== null) {
      if (!arr[1] || !arr[1].match(singleLowSurrogate)) { // If high not followed by low surrogate
        return false;
      }
    }
    while ((arr = lowSurrogateAfterAny.exec(vr)) !== null) {
      if (!arr[1] || !arr[1].match(singleHighSurrogate)) { // If low not preceded by high surrogate
        return false;
      }
    }
    return true;
};

exports.isset = function () {
  var a = arguments,
      l = a.length,
      i = 0,
      undef;
  
    if (l === 0) {
      throw new Error('Empty isset');
    }
  
    while (i !== l) {
      if (a[i] === undef || a[i] === null) {
        return false;
      }
      i++;
    }
    return true;
};

exports.serialize = function (mixed_value) {
  var val, key, okey,
      ktype = '',
      vals = '',
      count = 0,
      _utf8Size = function(str) {
        var size = 0,
          i = 0,
          l = str.length,
          code = '';
        for (i = 0; i < l; i++) {
          code = str.charCodeAt(i);
          if (code < 0x0080) {
            size += 1;
          } else if (code < 0x0800) {
            size += 2;
          } else {
            size += 3;
          }
        }
        return size;
      };
    _getType = function(inp) {
      var match, key, cons, types, type = typeof inp;
  
      if (type === 'object' && !inp) {
        return 'null';
      }
      if (type === 'object') {
        if (!inp.constructor) {
          return 'object';
        }
        cons = inp.constructor.toString();
        match = cons.match(/(\w+)\(/);
        if (match) {
          cons = match[1].toLowerCase();
        }
        types = ['boolean', 'number', 'string', 'array'];
        for (key in types) {
          if (cons == types[key]) {
            type = types[key];
            break;
          }
        }
      }
      return type;
    };
    type = _getType(mixed_value);
  
    switch (type) {
      case 'function':
        val = '';
        break;
      case 'boolean':
        val = 'b:' + (mixed_value ? '1' : '0');
        break;
      case 'number':
        val = (Math.round(mixed_value) == mixed_value ? 'i' : 'd') + ':' + mixed_value;
        break;
      case 'string':
        val = 's:' + _utf8Size(mixed_value) + ':"' + mixed_value + '"';
        break;
      case 'array':
      case 'object':
        val = 'a';
        /*
          if (type === 'object') {
            var objname = mixed_value.constructor.toString().match(/(\w+)\(\)/);
            if (objname == undefined) {
              return;
            }
            objname[1] = this.serialize(objname[1]);
            val = 'O' + objname[1].substring(1, objname[1].length - 1);
          }
          */
  
        for (key in mixed_value) {
          if (mixed_value.hasOwnProperty(key)) {
            ktype = _getType(mixed_value[key]);
            if (ktype === 'function') {
              continue;
            }
  
            okey = (key.match(/^[0-9]+$/) ? parseInt(key, 10) : key);
            vals += this.serialize(okey) + this.serialize(mixed_value[key]);
            count++;
          }
        }
        val += ':' + count + ':{' + vals + '}';
        break;
      case 'undefined':
        // Fall-through
      default:
        // if the JS object has a property which contains a null value, the string cannot be unserialized by PHP
        val = 'N';
        break;
    }
    if (type !== 'object' && type !== 'array') {
      val += ';';
    }
    return val;
};

exports.settype = function (vr, type) {
  var is_array = function(arr) {
      return typeof arr === 'object' && typeof arr.length === 'number' && !(arr.propertyIsEnumerable('length')) &&
        typeof arr.splice === 'function';
    };
    var v, mtch, i, obj;
    v = this[vr] ? this[vr] : vr;
  
    try {
      switch (type) {
        case 'boolean':
          if (is_array(v) && v.length === 0) {
            this[vr] = false;
          } else if (v === '0') {
            this[vr] = false;
          } else if (typeof v === 'object' && !is_array(v)) {
            var lgth = false;
            for (i in v) {
              lgth = true;
            }
            this[vr] = lgth;
          } else {
            this[vr] = !! v;
          }
          break;
        case 'integer':
          if (typeof v === 'number') {
            this[vr] = parseInt(v, 10);
          } else if (typeof v === 'string') {
            mtch = v.match(/^([+\-]?)(\d+)/);
            if (!mtch) {
              this[vr] = 0;
            } else {
              this[vr] = parseInt(v, 10);
            }
          } else if (v === true) {
            this[vr] = 1;
          } else if (v === false || v === null) {
            this[vr] = 0;
          } else if (is_array(v) && v.length === 0) {
            this[vr] = 0;
          } else if (typeof v === 'object') {
            this[vr] = 1;
          }
  
          break;
        case 'float':
          if (typeof v === 'string') {
            mtch = v.match(/^([+\-]?)(\d+(\.\d+)?|\.\d+)([eE][+\-]?\d+)?/);
            if (!mtch) {
              this[vr] = 0;
            } else {
              this[vr] = parseFloat(v, 10);
            }
          } else if (v === true) {
            this[vr] = 1;
          } else if (v === false || v === null) {
            this[vr] = 0;
          } else if (is_array(v) && v.length === 0) {
            this[vr] = 0;
          } else if (typeof v === 'object') {
            this[vr] = 1;
          }
          break;
        case 'string':
          if (v === null || v === false) {
            this[vr] = '';
          } else if (is_array(v)) {
            this[vr] = 'Array';
          } else if (typeof v === 'object') {
            this[vr] = 'Object';
          } else if (v === true) {
            this[vr] = '1';
          } else {
            this[vr] += '';
          } // numbers (and functions?)
          break;
        case 'array':
          if (v === null) {
            this[vr] = [];
          } else if (typeof v !== 'object') {
            this[vr] = [v];
          }
          break;
        case 'object':
          if (v === null) {
            this[vr] = {};
          } else if (is_array(v)) {
            for (i = 0, obj = {}; i < v.length; i++) {
              obj[i] = v;
            }
            this[vr] = obj;
          } else if (typeof v !== 'object') {
            this[vr] = {
              scalar: v
            };
          }
          break;
        case 'null':
          delete this[vr];
          break;
      }
      return true;
    } catch (e) {
      return false;
    }
};

exports.unserialize = function (data) {
  var that = this,
      utf8Overhead = function(chr) {
        // http://phpjs.org/functions/unserialize:571#comment_95906
        var code = chr.charCodeAt(0);
        if (code < 0x0080) {
          return 0;
        }
        if (code < 0x0800) {
          return 1;
        }
        return 2;
      };
    error = function(type, msg, filename, line) {
      throw new that.window[type](msg, filename, line);
    };
    read_until = function(data, offset, stopchr) {
      var i = 2,
        buf = [],
        chr = data.slice(offset, offset + 1);
  
      while (chr != stopchr) {
        if ((i + offset) > data.length) {
          error('Error', 'Invalid');
        }
        buf.push(chr);
        chr = data.slice(offset + (i - 1), offset + i);
        i += 1;
      }
      return [buf.length, buf.join('')];
    };
    read_chrs = function(data, offset, length) {
      var i, chr, buf;
  
      buf = [];
      for (i = 0; i < length; i++) {
        chr = data.slice(offset + (i - 1), offset + i);
        buf.push(chr);
        length -= utf8Overhead(chr);
      }
      return [buf.length, buf.join('')];
    };
    _unserialize = function(data, offset) {
      var dtype, dataoffset, keyandchrs, keys, contig,
        length, array, readdata, readData, ccount,
        stringlength, i, key, kprops, kchrs, vprops,
        vchrs, value, chrs = 0,
        typeconvert = function(x) {
          return x;
        };
  
      if (!offset) {
        offset = 0;
      }
      dtype = (data.slice(offset, offset + 1))
        .toLowerCase();
  
      dataoffset = offset + 2;
  
      switch (dtype) {
        case 'i':
          typeconvert = function(x) {
            return parseInt(x, 10);
          };
          readData = read_until(data, dataoffset, ';');
          chrs = readData[0];
          readdata = readData[1];
          dataoffset += chrs + 1;
          break;
        case 'b':
          typeconvert = function(x) {
            return parseInt(x, 10) !== 0;
          };
          readData = read_until(data, dataoffset, ';');
          chrs = readData[0];
          readdata = readData[1];
          dataoffset += chrs + 1;
          break;
        case 'd':
          typeconvert = function(x) {
            return parseFloat(x);
          };
          readData = read_until(data, dataoffset, ';');
          chrs = readData[0];
          readdata = readData[1];
          dataoffset += chrs + 1;
          break;
        case 'n':
          readdata = null;
          break;
        case 's':
          ccount = read_until(data, dataoffset, ':');
          chrs = ccount[0];
          stringlength = ccount[1];
          dataoffset += chrs + 2;
  
          readData = read_chrs(data, dataoffset + 1, parseInt(stringlength, 10));
          chrs = readData[0];
          readdata = readData[1];
          dataoffset += chrs + 2;
          if (chrs != parseInt(stringlength, 10) && chrs != readdata.length) {
            error('SyntaxError', 'String length mismatch');
          }
          break;
        case 'a':
          readdata = {};
  
          keyandchrs = read_until(data, dataoffset, ':');
          chrs = keyandchrs[0];
          keys = keyandchrs[1];
          dataoffset += chrs + 2;
  
          length = parseInt(keys, 10);
          contig = true;
  
          for (i = 0; i < length; i++) {
            kprops = _unserialize(data, dataoffset);
            kchrs = kprops[1];
            key = kprops[2];
            dataoffset += kchrs;
  
            vprops = _unserialize(data, dataoffset);
            vchrs = vprops[1];
            value = vprops[2];
            dataoffset += vchrs;
  
            if (key !== i)
              contig = false;
  
            readdata[key] = value;
          }
  
          if (contig) {
            array = new Array(length);
            for (i = 0; i < length; i++)
              array[i] = readdata[i];
            readdata = array;
          }
  
          dataoffset += 1;
          break;
        default:
          error('SyntaxError', 'Unknown / Unhandled data type(s): ' + dtype);
          break;
      }
      return [dtype, dataoffset - offset, typeconvert(readdata)];
    };
  
    return _unserialize((data + ''), 0)[2];
};

exports.xdiff_string_diff = function (old_data, new_data, context_lines, minimal) {
  // (This code was done by Imgen Tata; I have only reformatted for use in php.js)
  
    // See http://en.wikipedia.org/wiki/Diff#Unified_format
    var i = 0,
      j = 0,
      k = 0,
      ori_hunk_start, new_hunk_start, ori_hunk_end, new_hunk_end, ori_hunk_line_no, new_hunk_line_no, ori_hunk_size,
      new_hunk_size,
      // Potential configuration
      MAX_CONTEXT_LINES = Number.POSITIVE_INFINITY,
      MIN_CONTEXT_LINES = 0,
      DEFAULT_CONTEXT_LINES = 3,
      //
      HEADER_PREFIX = '@@ ',
      HEADER_SUFFIX = ' @@',
      ORIGINAL_INDICATOR = '-',
      NEW_INDICATOR = '+',
      RANGE_SEPARATOR = ',',
      CONTEXT_INDICATOR = ' ',
      DELETION_INDICATOR = '-',
      ADDITION_INDICATOR = '+',
      ori_lines, new_lines, NEW_LINE = '\n',
      /**
       * Trims string
       */
      trim = function(text) {
        if (typeof text !== 'string') {
          throw new Error('String parameter required');
        }
  
        return text.replace(/(^\s*)|(\s*$)/g, '');
      },
      /**
       * Verifies type of arguments
       */
      verify_type = function(type) {
        var args = arguments,
          args_len = arguments.length,
          basic_types = ['number', 'boolean', 'string', 'function', 'object', 'undefined'],
          basic_type, i, j, type_of_type = typeof type;
        if (type_of_type !== 'string' && type_of_type !== 'function') {
          throw new Error('Bad type parameter');
        }
  
        if (args_len < 2) {
          throw new Error('Too few arguments');
        }
  
        if (type_of_type === 'string') {
          type = trim(type);
  
          if (type === '') {
            throw new Error('Bad type parameter');
          }
  
          for (j = 0; j < basic_types.length; j++) {
            basic_type = basic_types[j];
  
            if (basic_type == type) {
              for (i = 1; i < args_len; i++) {
                if (typeof args[i] !== type) {
                  throw new Error('Bad type');
                }
              }
  
              return;
            }
          }
  
          throw new Error('Bad type parameter');
        }
  
        // Not basic type. we need to use instanceof operator
        for (i = 1; i < args_len; i++) {
          if (!(args[i] instanceof type)) {
            throw new Error('Bad type');
          }
        }
      },
      /**
       * Checks if the specified array contains an element with specified value
       */
      has_value = function(array, value) {
        var i;
        verify_type(Array, array);
  
        for (i = 0; i < array.length; i++) {
          if (array[i] === value) {
            return true;
          }
        }
  
        return false;
      },
      /**
       * Checks the type of arguments
       * @param {String | Function} type Specifies the desired type
       * @return {Boolean} Return true if all arguments after the type argument are of specified type. Else false
       */
      are_type_of = function(type) {
        var args = arguments,
          args_len = arguments.length,
          basic_types = ['number', 'boolean', 'string', 'function', 'object', 'undefined'],
          basic_type, i, j, type_of_type = typeof type;
        if (type_of_type !== 'string' && type_of_type !== 'function') {
          throw new Error('Bad type parameter');
        }
  
        if (args_len < 2) {
          throw new Error('Too few arguments');
        }
  
        if (type_of_type === 'string') {
          type = trim(type);
  
          if (type === '') {
            return false;
          }
  
          for (j = 0; j < basic_types.length; j++) {
            basic_type = basic_types[j];
  
            if (basic_type == type) {
              for (i = 1; i < args_len; i++) {
                if (typeof args[i] != type) {
                  return false;
                }
              }
  
              return true;
            }
          }
  
          throw new Error('Bad type parameter');
        }
  
        // Not basic type. we need to use instanceof operator
        for (i = 1; i < args_len; i++) {
          if (!(args[i] instanceof type)) {
            return false;
          }
        }
  
        return true;
      },
      /*
       * Initialize and return an array with specified size and initial value
       */
      get_initialized_array = function(array_size, init_value) {
        var array = [],
          i;
        verify_type('number', array_size);
  
        for (i = 0; i < array_size; i++) {
          array.push(init_value);
        }
  
        return array;
      },
      /**
       * Splits text into lines and return as a string array
       */
      split_into_lines = function(text) {
        verify_type('string', text);
  
        if (text === '') {
          return [];
        }
        return text.split('\n');
      },
      is_empty_array = function(obj) {
        return are_type_of(Array, obj) && obj.length === 0;
      },
      /**
       * Finds longest common sequence between two sequences
       * @see {@link http://wordaligned.org/articles/longest-common-subsequence}
       */
      find_longest_common_sequence = function(seq1, seq2, seq1_is_in_lcs, seq2_is_in_lcs) {
        if (!are_type_of(Array, seq1, seq2)) {
          throw new Error('Array parameters are required');
        }
  
        // Deal with edge case
        if (is_empty_array(seq1) || is_empty_array(seq2)) {
          return [];
        }
  
        // Function to calculate lcs lengths
        var lcs_lens = function(xs, ys) {
          var i, j, prev,
            curr = get_initialized_array(ys.length + 1, 0);
  
          for (i = 0; i < xs.length; i++) {
            prev = curr.slice(0);
            for (j = 0; j < ys.length; j++) {
              if (xs[i] === ys[j]) {
                curr[j + 1] = prev[j] + 1;
              } else {
                curr[j + 1] = Math.max(curr[j], prev[j + 1]);
              }
            }
          }
  
          return curr;
        },
          // Function to find lcs and fill in the array to indicate the optimal longest common sequence
          find_lcs = function(xs, xidx, xs_is_in, ys) {
            var i, xb, xe, ll_b, ll_e, pivot, max, yb, ye,
              nx = xs.length,
              ny = ys.length;
  
            if (nx === 0) {
              return [];
            }
            if (nx === 1) {
              if (has_value(ys, xs[0])) {
                xs_is_in[xidx] = true;
                return [xs[0]];
              }
              return [];
            }
            i = Math.floor(nx / 2);
            xb = xs.slice(0, i);
            xe = xs.slice(i);
            ll_b = lcs_lens(xb, ys);
            ll_e = lcs_lens(xe.slice(0)
              .reverse(), ys.slice(0)
              .reverse());
  
            pivot = 0;
            max = 0;
            for (j = 0; j <= ny; j++) {
              if (ll_b[j] + ll_e[ny - j] > max) {
                pivot = j;
                max = ll_b[j] + ll_e[ny - j];
              }
            }
            yb = ys.slice(0, pivot);
            ye = ys.slice(pivot);
            return find_lcs(xb, xidx, xs_is_in, yb)
              .concat(find_lcs(xe, xidx + i, xs_is_in, ye));
          };
  
        // Fill in seq1_is_in_lcs to find the optimal longest common subsequence of first sequence
        find_lcs(seq1, 0, seq1_is_in_lcs, seq2);
        // Fill in seq2_is_in_lcs to find the optimal longest common subsequence of second sequence and return the result
        return find_lcs(seq2, 0, seq2_is_in_lcs, seq1);
      };
  
    // First, check the parameters
    if (are_type_of('string', old_data, new_data) === false) {
      return false;
    }
  
    if (old_data == new_data) {
      return '';
    }
  
    if (typeof context_lines !== 'number' || context_lines > MAX_CONTEXT_LINES || context_lines < MIN_CONTEXT_LINES) {
      context_lines = DEFAULT_CONTEXT_LINES;
    }
  
    ori_lines = split_into_lines(old_data);
    new_lines = split_into_lines(new_data);
    var ori_len = ori_lines.length,
      new_len = new_lines.length,
      ori_is_in_lcs = get_initialized_array(ori_len, false),
      new_is_in_lcs = get_initialized_array(new_len, false),
      lcs_len = find_longest_common_sequence(ori_lines, new_lines, ori_is_in_lcs, new_is_in_lcs)
        .length,
      unidiff = '';
  
    if (lcs_len === 0) { // No common sequence
      unidiff = HEADER_PREFIX + ORIGINAL_INDICATOR + (ori_len > 0 ? '1' : '0') + RANGE_SEPARATOR + ori_len + ' ' +
        NEW_INDICATOR + (new_len > 0 ? '1' : '0') + RANGE_SEPARATOR + new_len + HEADER_SUFFIX;
  
      for (i = 0; i < ori_len; i++) {
        unidiff += NEW_LINE + DELETION_INDICATOR + ori_lines[i];
      }
  
      for (j = 0; j < new_len; j++) {
        unidiff += NEW_LINE + ADDITION_INDICATOR + new_lines[j];
      }
  
      return unidiff;
    }
  
    var leading_context = [],
      trailing_context = [],
      actual_leading_context = [],
      actual_trailing_context = [],
  
      // Regularize leading context by the context_lines parameter
      regularize_leading_context = function(context) {
        if (context.length === 0 || context_lines === 0) {
          return [];
        }
  
        var context_start_pos = Math.max(context.length - context_lines, 0);
  
        return context.slice(context_start_pos);
      },
  
      // Regularize trailing context by the context_lines parameter
      regularize_trailing_context = function(context) {
        if (context.length === 0 || context_lines === 0) {
          return [];
        }
  
        return context.slice(0, Math.min(context_lines, context.length));
      };
  
    // Skip common lines in the beginning
    while (i < ori_len && ori_is_in_lcs[i] === true && new_is_in_lcs[i] === true) {
      leading_context.push(ori_lines[i]);
      i++;
    }
  
    j = i;
    k = i; // The index in the longest common sequence
    ori_hunk_start = i;
    new_hunk_start = j;
    ori_hunk_end = i;
    new_hunk_end = j;
  
    while (i < ori_len || j < new_len) {
      while (i < ori_len && ori_is_in_lcs[i] === false) {
        i++;
      }
      ori_hunk_end = i;
  
      while (j < new_len && new_is_in_lcs[j] === false) {
        j++;
      }
      new_hunk_end = j;
  
      // Find the trailing context
      trailing_context = [];
      while (i < ori_len && ori_is_in_lcs[i] === true && j < new_len && new_is_in_lcs[j] === true) {
        trailing_context.push(ori_lines[i]);
        k++;
        i++;
        j++;
      }
  
      if (k >= lcs_len || // No more in longest common lines
        trailing_context.length >= 2 * context_lines) { // Context break found
        if (trailing_context.length < 2 * context_lines) { // It must be last block of common lines but not a context break
          trailing_context = [];
  
          // Force break out
          i = ori_len;
          j = new_len;
  
          // Update hunk ends to force output to the end
          ori_hunk_end = ori_len;
          new_hunk_end = new_len;
        }
  
        // Output the diff hunk
  
        // Trim the leading and trailing context block
        actual_leading_context = regularize_leading_context(leading_context);
        actual_trailing_context = regularize_trailing_context(trailing_context);
  
        ori_hunk_start -= actual_leading_context.length;
        new_hunk_start -= actual_leading_context.length;
        ori_hunk_end += actual_trailing_context.length;
        new_hunk_end += actual_trailing_context.length;
  
        ori_hunk_line_no = ori_hunk_start + 1;
        new_hunk_line_no = new_hunk_start + 1;
        ori_hunk_size = ori_hunk_end - ori_hunk_start;
        new_hunk_size = new_hunk_end - new_hunk_start;
  
        // Build header
        unidiff += HEADER_PREFIX + ORIGINAL_INDICATOR + ori_hunk_line_no + RANGE_SEPARATOR + ori_hunk_size + ' ' +
          NEW_INDICATOR + new_hunk_line_no + RANGE_SEPARATOR + new_hunk_size + HEADER_SUFFIX + NEW_LINE;
  
        // Build the diff hunk content
        while (ori_hunk_start < ori_hunk_end || new_hunk_start < new_hunk_end) {
          if (ori_hunk_start < ori_hunk_end && ori_is_in_lcs[ori_hunk_start] === true && new_is_in_lcs[
            new_hunk_start] === true) { // The context line
            unidiff += CONTEXT_INDICATOR + ori_lines[ori_hunk_start] + NEW_LINE;
            ori_hunk_start++;
            new_hunk_start++;
          } else if (ori_hunk_start < ori_hunk_end && ori_is_in_lcs[ori_hunk_start] === false) { // The deletion line
            unidiff += DELETION_INDICATOR + ori_lines[ori_hunk_start] + NEW_LINE;
            ori_hunk_start++;
          } else if (new_hunk_start < new_hunk_end && new_is_in_lcs[new_hunk_start] === false) { // The additional line
            unidiff += ADDITION_INDICATOR + new_lines[new_hunk_start] + NEW_LINE;
            new_hunk_start++;
          }
        }
  
        // Update hunk position and leading context
        ori_hunk_start = i;
        new_hunk_start = j;
        leading_context = trailing_context;
      }
    }
  
    // Trim the trailing new line if it exists
    if (unidiff.length > 0 && unidiff.charAt(unidiff.length) === NEW_LINE) {
      unidiff = unidiff.slice(0, -1);
    }
  
    return unidiff;
};

exports.xdiff_string_patch = function (originalStr, patch, flags, error) {
  // First two functions were adapted from Steven Levithan, also under an MIT license
    // Adapted from XRegExp 1.5.0
    // (c) 2007-2010 Steven Levithan
    // MIT License
    // <http://xregexp.com>
    var getNativeFlags = function(regex) {
      return (regex.global ? 'g' : '') + (regex.ignoreCase ? 'i' : '') + (regex.multiline ? 'm' : '') + (regex.extended ?
        'x' : '') + // Proposed for ES4; included in AS3
      (regex.sticky ? 'y' : '');
    },
      cbSplit = function(string, sep /* separator */ ) {
        // If separator `s` is not a regex, use the native `split`
        if (!(sep instanceof RegExp)) { // Had problems to get it to work here using prototype test
          return String.prototype.split.apply(string, arguments);
        }
        var str = String(string),
          output = [],
          lastLastIndex = 0,
          match, lastLength, limit = Infinity,
  
          // This is required if not `s.global`, and it avoids needing to set `s.lastIndex` to zero
          // and restore it to its original value when we're done using the regex
          x = sep._xregexp,
          s = new RegExp(sep.source, getNativeFlags(sep) + 'g'); // Brett paring down
        if (x) {
          s._xregexp = {
            source: x.source,
            captureNames: x.captureNames ? x.captureNames.slice(0) : null
          };
        }
  
        while ((match = s.exec(str))) { // Run the altered `exec` (required for `lastIndex` fix, etc.)
          if (s.lastIndex > lastLastIndex) {
            output.push(str.slice(lastLastIndex, match.index));
  
            if (match.length > 1 && match.index < str.length) {
              Array.prototype.push.apply(output, match.slice(1));
            }
  
            lastLength = match[0].length;
            lastLastIndex = s.lastIndex;
  
            if (output.length >= limit) {
              break;
            }
          }
  
          if (s.lastIndex === match.index) {
            s.lastIndex++;
          }
        }
  
        if (lastLastIndex === str.length) {
          if (!s.test('') || lastLength) {
            output.push('');
          }
        } else {
          output.push(str.slice(lastLastIndex));
        }
  
        return output.length > limit ? output.slice(0, limit) : output;
      },
      i = 0,
      ll = 0,
      ranges = [],
      lastLinePos = 0,
      firstChar = '',
      rangeExp = /^@@\s+-(\d+),(\d+)\s+\+(\d+),(\d+)\s+@@$/,
      lineBreaks = /\r?\n/,
      lines = cbSplit(patch.replace(/(\r?\n)+$/, ''), lineBreaks),
      origLines = cbSplit(originalStr, lineBreaks),
      newStrArr = [],
      linePos = 0,
      errors = '',
      // Both string & integer (constant) input is allowed
      optTemp = 0,
      OPTS = { // Unsure of actual PHP values, so better to rely on string
        'XDIFF_PATCH_NORMAL': 1,
        'XDIFF_PATCH_REVERSE': 2,
        'XDIFF_PATCH_IGNORESPACE': 4
      };
  
    // Input defaulting & sanitation
    if (typeof originalStr !== 'string' || !patch) {
      return false;
    }
    if (!flags) {
      flags = 'XDIFF_PATCH_NORMAL';
    }
  
    if (typeof flags !== 'number') { // Allow for a single string or an array of string flags
      flags = [].concat(flags);
      for (i = 0; i < flags.length; i++) {
        // Resolve string input to bitwise e.g. 'XDIFF_PATCH_NORMAL' becomes 1
        if (OPTS[flags[i]]) {
          optTemp = optTemp | OPTS[flags[i]];
        }
      }
      flags = optTemp;
    }
  
    if (flags & OPTS.XDIFF_PATCH_NORMAL) {
      for (i = 0, ll = lines.length; i < ll; i++) {
        ranges = lines[i].match(rangeExp);
        if (ranges) {
          lastLinePos = linePos;
          linePos = ranges[1] - 1;
          while (lastLinePos < linePos) {
            newStrArr[newStrArr.length] = origLines[lastLinePos++];
          }
          while (lines[++i] && (rangeExp.exec(lines[i])) === null) {
            firstChar = lines[i].charAt(0);
            switch (firstChar) {
              case '-':
                ++linePos; // Skip including that line
                break;
              case '+':
                newStrArr[newStrArr.length] = lines[i].slice(1);
                break;
              case ' ':
                newStrArr[newStrArr.length] = origLines[linePos++];
                break;
              default:
                throw 'Unrecognized initial character in unidiff line'; // Reconcile with returning errrors arg?
            }
          }
          if (lines[i]) {
            i--;
          }
        }
      }
      while (linePos > 0 && linePos < origLines.length) {
        newStrArr[newStrArr.length] = origLines[linePos++];
      }
    } else if (flags & OPTS.XDIFF_PATCH_REVERSE) { // Only differs from above by a few lines
      for (i = 0, ll = lines.length; i < ll; i++) {
        ranges = lines[i].match(rangeExp);
        if (ranges) {
          lastLinePos = linePos;
          linePos = ranges[3] - 1;
          while (lastLinePos < linePos) {
            newStrArr[newStrArr.length] = origLines[lastLinePos++];
          }
          while (lines[++i] && (rangeExp.exec(lines[i])) === null) {
            firstChar = lines[i].charAt(0);
            switch (firstChar) {
              case '-':
                newStrArr[newStrArr.length] = lines[i].slice(1);
                break;
              case '+':
                ++linePos; // Skip including that line
                break;
              case ' ':
                newStrArr[newStrArr.length] = origLines[linePos++];
                break;
              default:
                throw 'Unrecognized initial character in unidiff line'; // Reconcile with returning errrors arg?
            }
          }
          if (lines[i]) {
            i--;
          }
        }
      }
      while (linePos > 0 && linePos < origLines.length) {
        newStrArr[newStrArr.length] = origLines[linePos++];
      }
    }
    if (typeof error === 'string') {
      this.window[error] = errors;
    }
    return newStrArr.join('\n');
};

exports.utf8_decode = function (str_data) {
  var tmp_arr = [],
      i = 0,
      ac = 0,
      c1 = 0,
      c2 = 0,
      c3 = 0,
      c4 = 0;
  
    str_data += '';
  
    while (i < str_data.length) {
      c1 = str_data.charCodeAt(i);
      if (c1 <= 191) {
        tmp_arr[ac++] = String.fromCharCode(c1);
        i++;
      } else if (c1 <= 223) {
        c2 = str_data.charCodeAt(i + 1);
        tmp_arr[ac++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
        i += 2;
      } else if (c1 <= 239) {
        // http://en.wikipedia.org/wiki/UTF-8#Codepage_layout
        c2 = str_data.charCodeAt(i + 1);
        c3 = str_data.charCodeAt(i + 2);
        tmp_arr[ac++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        i += 3;
      } else {
        c2 = str_data.charCodeAt(i + 1);
        c3 = str_data.charCodeAt(i + 2);
        c4 = str_data.charCodeAt(i + 3);
        c1 = ((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63);
        c1 -= 0x10000;
        tmp_arr[ac++] = String.fromCharCode(0xD800 | ((c1 >> 10) & 0x3FF));
        tmp_arr[ac++] = String.fromCharCode(0xDC00 | (c1 & 0x3FF));
        i += 4;
      }
    }
  
    return tmp_arr.join('');
};

exports.utf8_encode = function (argString) {
  if (argString === null || typeof argString === 'undefined') {
      return '';
    }
  
    var string = (argString + ''); // .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    var utftext = '',
      start, end, stringl = 0;
  
    start = end = 0;
    stringl = string.length;
    for (var n = 0; n < stringl; n++) {
      var c1 = string.charCodeAt(n);
      var enc = null;
  
      if (c1 < 128) {
        end++;
      } else if (c1 > 127 && c1 < 2048) {
        enc = String.fromCharCode(
          (c1 >> 6) | 192, (c1 & 63) | 128
        );
      } else if ((c1 & 0xF800) != 0xD800) {
        enc = String.fromCharCode(
          (c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
        );
      } else { // surrogate pairs
        if ((c1 & 0xFC00) != 0xD800) {
          throw new RangeError('Unmatched trail surrogate at ' + n);
        }
        var c2 = string.charCodeAt(++n);
        if ((c2 & 0xFC00) != 0xDC00) {
          throw new RangeError('Unmatched lead surrogate at ' + (n - 1));
        }
        c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
        enc = String.fromCharCode(
          (c1 >> 18) | 240, ((c1 >> 12) & 63) | 128, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
        );
      }
      if (enc !== null) {
        if (end > start) {
          utftext += string.slice(start, end);
        }
        utftext += enc;
        start = end = n + 1;
      }
    }
  
    if (end > start) {
      utftext += string.slice(start, stringl);
    }
  
    return utftext;
};

exports.array_flip = function (trans) {
  var key, tmp_ar = {};
  
    // Duck-type check for our own array()-created PHPJS_Array
    if (trans && typeof trans === 'object' && trans.change_key_case) {
      return trans.flip();
    }
  
    for (key in trans) {
      if (!trans.hasOwnProperty(key)) {
        continue;
      }
      tmp_ar[trans[key]] = key;
    }
  
    return tmp_ar;
};

exports.array_merge_recursive = function (arr1, arr2) {
  var idx = '';
  
    if (arr1 && Object.prototype.toString.call(arr1) === '[object Array]' &&
      arr2 && Object.prototype.toString.call(arr2) === '[object Array]') {
      for (idx in arr2) {
        arr1.push(arr2[idx]);
      }
    } else if ((arr1 && (arr1 instanceof Object)) && (arr2 && (arr2 instanceof Object))) {
      for (idx in arr2) {
        if (idx in arr1) {
          if (typeof arr1[idx] === 'object' && typeof arr2 === 'object') {
            arr1[idx] = this.array_merge(arr1[idx], arr2[idx]);
          } else {
            arr1[idx] = arr2[idx];
          }
        } else {
          arr1[idx] = arr2[idx];
        }
      }
    }
  
    return arr1;
};

exports.array_search = function (needle, haystack, argStrict) {
  var strict = !! argStrict,
      key = '';
  
    if (haystack && typeof haystack === 'object' && haystack.change_key_case) { // Duck-type check for our own array()-created PHPJS_Array
      return haystack.search(needle, argStrict);
    }
    if (typeof needle === 'object' && needle.exec) { // Duck-type for RegExp
      if (!strict) { // Let's consider case sensitive searches as strict
        var flags = 'i' + (needle.global ? 'g' : '') +
          (needle.multiline ? 'm' : '') +
          (needle.sticky ? 'y' : ''); // sticky is FF only
        needle = new RegExp(needle.source, flags);
      }
      for (key in haystack) {
        if (needle.test(haystack[key])) {
          return key;
        }
      }
      return false;
    }
  
    for (key in haystack) {
      if ((strict && haystack[key] === needle) || (!strict && haystack[key] == needle)) {
        return key;
      }
    }
  
    return false;
};

exports.array_slice = function (arr, offst, lgth, preserve_keys) {
  /*
    if ('callee' in arr && 'length' in arr) {
      arr = Array.prototype.slice.call(arr);
    }
    */
  
    var key = '';
  
    if (Object.prototype.toString.call(arr) !== '[object Array]' ||
      (preserve_keys && offst !== 0)) { // Assoc. array as input or if required as output
      var lgt = 0,
        newAssoc = {};
      for (key in arr) {
        //if (key !== 'length') {
        lgt += 1;
        newAssoc[key] = arr[key];
        //}
      }
      arr = newAssoc;
  
      offst = (offst < 0) ? lgt + offst : offst;
      lgth = lgth === undefined ? lgt : (lgth < 0) ? lgt + lgth - offst : lgth;
  
      var assoc = {};
      var start = false,
        it = -1,
        arrlgth = 0,
        no_pk_idx = 0;
      for (key in arr) {
        ++it;
        if (arrlgth >= lgth) {
          break;
        }
        if (it == offst) {
          start = true;
        }
        if (!start) {
          continue;
        }++arrlgth;
        if (this.is_int(key) && !preserve_keys) {
          assoc[no_pk_idx++] = arr[key];
        } else {
          assoc[key] = arr[key];
        }
      }
      //assoc.length = arrlgth; // Make as array-like object (though length will not be dynamic)
      return assoc;
    }
  
    if (lgth === undefined) {
      return arr.slice(offst);
    } else if (lgth >= 0) {
      return arr.slice(offst, offst + lgth);
    } else {
      return arr.slice(offst, lgth);
    }
};

exports.array_splice = function (arr, offst, lgth, replacement) {
  var _checkToUpIndices = function(arr, ct, key) {
      // Deal with situation, e.g., if encounter index 4 and try to set it to 0, but 0 exists later in loop (need to
      // increment all subsequent (skipping current key, since we need its value below) until find unused)
      if (arr[ct] !== undefined) {
        var tmp = ct;
        ct += 1;
        if (ct === key) {
          ct += 1;
        }
        ct = _checkToUpIndices(arr, ct, key);
        arr[ct] = arr[tmp];
        delete arr[tmp];
      }
      return ct;
    };
  
    if (replacement && typeof replacement !== 'object') {
      replacement = [replacement];
    }
    if (lgth === undefined) {
      lgth = offst >= 0 ? arr.length - offst : -offst;
    } else if (lgth < 0) {
      lgth = (offst >= 0 ? arr.length - offst : -offst) + lgth;
    }
  
    if (Object.prototype.toString.call(arr) !== '[object Array]') {
      /*if (arr.length !== undefined) { // Deal with array-like objects as input
      delete arr.length;
      }*/
      var lgt = 0,
        ct = -1,
        rmvd = [],
        rmvdObj = {},
        repl_ct = -1,
        int_ct = -1;
      var returnArr = true,
        rmvd_ct = 0,
        rmvd_lgth = 0,
        key = '';
      // rmvdObj.length = 0;
      for (key in arr) { // Can do arr.__count__ in some browsers
        lgt += 1;
      }
      offst = (offst >= 0) ? offst : lgt + offst;
      for (key in arr) {
        ct += 1;
        if (ct < offst) {
          if (this.is_int(key)) {
            int_ct += 1;
            if (parseInt(key, 10) === int_ct) { // Key is already numbered ok, so don't need to change key for value
              continue;
            }
            _checkToUpIndices(arr, int_ct, key); // Deal with situation, e.g.,
            // if encounter index 4 and try to set it to 0, but 0 exists later in loop
            arr[int_ct] = arr[key];
            delete arr[key];
          }
          continue;
        }
        if (returnArr && this.is_int(key)) {
          rmvd.push(arr[key]);
          rmvdObj[rmvd_ct++] = arr[key]; // PHP starts over here too
        } else {
          rmvdObj[key] = arr[key];
          returnArr = false;
        }
        rmvd_lgth += 1;
        // rmvdObj.length += 1;
        if (replacement && replacement[++repl_ct]) {
          arr[key] = replacement[repl_ct];
        } else {
          delete arr[key];
        }
      }
      // arr.length = lgt - rmvd_lgth + (replacement ? replacement.length : 0); // Make (back) into an array-like object
      return returnArr ? rmvd : rmvdObj;
    }
  
    if (replacement) {
      replacement.unshift(offst, lgth);
      return Array.prototype.splice.apply(arr, replacement);
    }
    return arr.splice(offst, lgth);
};

exports.array_walk = function (array, funcname, userdata) {
  var key, value, ini;
  
    if (!array || typeof array !== 'object') {
      return false;
    }
    if (typeof array === 'object' && array.change_key_case) { // Duck-type check for our own array()-created PHPJS_Array
      if (arguments.length > 2) {
        return array.walk(funcname, userdata);
      } else {
        return array.walk(funcname);
      }
    }
  
    try {
      if (typeof funcname === 'function') {
        for (key in array) {
          if (arguments.length > 2) {
            funcname(array[key], key, userdata);
          } else {
            funcname(array[key], key);
          }
        }
      } else if (typeof funcname === 'string') {
        this.php_js = this.php_js || {};
        this.php_js.ini = this.php_js.ini || {};
        ini = this.php_js.ini['phpjs.no-eval'];
        if (ini && (
          parseInt(ini.local_value, 10) !== 0 && (!ini.local_value.toLowerCase || ini.local_value.toLowerCase() !==
            'off')
        )) {
          if (arguments.length > 2) {
            for (key in array) {
              this.window[funcname](array[key], key, userdata);
            }
          } else {
            for (key in array) {
              this.window[funcname](array[key], key);
            }
          }
        } else {
          if (arguments.length > 2) {
            for (key in array) {
              eval(funcname + '(array[key], key, userdata)');
            }
          } else {
            for (key in array) {
              eval(funcname + '(array[key], key)');
            }
          }
        }
      } else if (funcname && typeof funcname === 'object' && funcname.length === 2) {
        var obj = funcname[0],
          func = funcname[1];
        if (arguments.length > 2) {
          for (key in array) {
            obj[func](array[key], key, userdata);
          }
        } else {
          for (key in array) {
            obj[func](array[key], key);
          }
        }
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  
    return true;
};

exports.natcasesort = function (inputArr) {
  var valArr = [],
      k, i, ret, that = this,
      strictForIn = false,
      populateArr = {};
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    // Get key and value arrays
    for (k in inputArr) {
      if (inputArr.hasOwnProperty(k)) {
        valArr.push([k, inputArr[k]]);
        if (strictForIn) {
          delete inputArr[k];
        }
      }
    }
    valArr.sort(function(a, b) {
      return that.strnatcasecmp(a[1], b[1]);
    });
  
    // Repopulate the old array
    for (i = 0; i < valArr.length; i++) {
      populateArr[valArr[i][0]] = valArr[i][1];
    }
  
    return strictForIn || populateArr;
};

exports.pos = function (arr) {
  return this.current(arr);
};

exports.sizeof = function (mixed_var, mode) {
  return this.count(mixed_var, mode);
};

exports.bcadd = function (left_operand, right_operand, scale) {
  var libbcmath = this._phpjs_shared_bc();
  
    var first, second, result;
  
    if (typeof scale === 'undefined') {
      scale = libbcmath.scale;
    }
    scale = ((scale < 0) ? 0 : scale);
  
    // create objects
    first = libbcmath.bc_init_num();
    second = libbcmath.bc_init_num();
    result = libbcmath.bc_init_num();
  
    first = libbcmath.php_str2num(left_operand.toString());
    second = libbcmath.php_str2num(right_operand.toString());
  
    result = libbcmath.bc_add(first, second, scale);
  
    if (result.n_scale > scale) {
      result.n_scale = scale;
    }
  
    return result.toString();
};

exports.bccomp = function (left_operand, right_operand, scale) {
  var libbcmath = this._phpjs_shared_bc();
  
    var first, second; //bc_num
    if (typeof scale === 'undefined') {
      scale = libbcmath.scale;
    }
    scale = ((scale < 0) ? 0 : scale);
  
    first = libbcmath.bc_init_num();
    second = libbcmath.bc_init_num();
  
    first = libbcmath.bc_str2num(left_operand.toString(), scale); // note bc_ not php_str2num
    second = libbcmath.bc_str2num(right_operand.toString(), scale); // note bc_ not php_str2num
    return libbcmath.bc_compare(first, second, scale);
};

exports.bcdiv = function (left_operand, right_operand, scale) {
  var libbcmath = this._phpjs_shared_bc();
  
    var first, second, result;
  
    if (typeof scale === 'undefined') {
      scale = libbcmath.scale;
    }
    scale = ((scale < 0) ? 0 : scale);
  
    // create objects
    first = libbcmath.bc_init_num();
    second = libbcmath.bc_init_num();
    result = libbcmath.bc_init_num();
  
    first = libbcmath.php_str2num(left_operand.toString());
    second = libbcmath.php_str2num(right_operand.toString());
  
    result = libbcmath.bc_divide(first, second, scale);
    if (result === -1) {
      // error
      throw new Error(11, '(BC) Division by zero');
    }
    if (result.n_scale > scale) {
      result.n_scale = scale;
    }
    return result.toString();
};

exports.bcmul = function (left_operand, right_operand, scale) {
  var libbcmath = this._phpjs_shared_bc();
  
    var first, second, result;
  
    if (typeof scale === 'undefined') {
      scale = libbcmath.scale;
    }
    scale = ((scale < 0) ? 0 : scale);
  
    // create objects
    first = libbcmath.bc_init_num();
    second = libbcmath.bc_init_num();
    result = libbcmath.bc_init_num();
  
    first = libbcmath.php_str2num(left_operand.toString());
    second = libbcmath.php_str2num(right_operand.toString());
  
    result = libbcmath.bc_multiply(first, second, scale);
  
    if (result.n_scale > scale) {
      result.n_scale = scale;
    }
    return result.toString();
};

exports.bcround = function (val, precision) {
  var libbcmath = this._phpjs_shared_bc();
  
    var temp, result, digit;
    var right_operand;
  
    // create number
    temp = libbcmath.bc_init_num();
    temp = libbcmath.php_str2num(val.toString());
  
    // check if any rounding needs
    if (precision >= temp.n_scale) {
      // nothing to round, just add the zeros.
      while (temp.n_scale < precision) {
        temp.n_value[temp.n_len + temp.n_scale] = 0;
        temp.n_scale++;
      }
      return temp.toString();
    }
  
    // get the digit we are checking (1 after the precision)
    // loop through digits after the precision marker
    digit = temp.n_value[temp.n_len + precision];
  
    right_operand = libbcmath.bc_init_num();
    right_operand = libbcmath.bc_new_num(1, precision);
  
    if (digit >= 5) {
      //round away from zero by adding 1 (or -1) at the "precision".. ie 1.44999 @ 3dp = (1.44999 + 0.001).toString().substr(0,5)
      right_operand.n_value[right_operand.n_len + right_operand.n_scale - 1] = 1;
      if (temp.n_sign == libbcmath.MINUS) {
        // round down
        right_operand.n_sign = libbcmath.MINUS;
      }
      result = libbcmath.bc_add(temp, right_operand, precision);
    } else {
      // leave-as-is.. just truncate it.
      result = temp;
    }
  
    if (result.n_scale > precision) {
      result.n_scale = precision;
    }
    return result.toString();
};

exports.bcscale = function (scale) {
  var libbcmath = this._phpjs_shared_bc();
  
    scale = parseInt(scale, 10);
    if (isNaN(scale)) {
      return false;
    }
    if (scale < 0) {
      return false;
    }
    libbcmath.scale = scale;
    return true;
};

exports.bcsub = function (left_operand, right_operand, scale) {
  var libbcmath = this._phpjs_shared_bc();
  
    var first, second, result;
  
    if (typeof scale === 'undefined') {
      scale = libbcmath.scale;
    }
    scale = ((scale < 0) ? 0 : scale);
  
    // create objects
    first = libbcmath.bc_init_num();
    second = libbcmath.bc_init_num();
    result = libbcmath.bc_init_num();
  
    first = libbcmath.php_str2num(left_operand.toString());
    second = libbcmath.php_str2num(right_operand.toString());
  
    result = libbcmath.bc_sub(first, second, scale);
  
    if (result.n_scale > scale) {
      result.n_scale = scale;
    }
  
    return result.toString();
};

exports.date_parse = function (date) {
  // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    // END REDUNDANT
  
    var ts,
      warningsOffset = this.php_js.warnings ? this.php_js.warnings.length : null,
      errorsOffset = this.php_js.errors ? this.php_js.errors.length : null;
  
    try {
      this.php_js.date_parse_state = true; // Allow strtotime to return a decimal (which it normally does not)
      ts = this.strtotime(date);
      this.php_js.date_parse_state = false;
    } finally {
      if (!ts) {
        return false;
      }
    }
  
    var dt = new Date(ts * 1000);
  
    var retObj = { // Grab any new warnings or errors added (not implemented yet in strtotime()); throwing warnings, notices, or errors could also be easily monitored by using 'watch' on this.php_js.latestWarning, etc. and/or calling any defined error handlers
      warning_count: warningsOffset !== null ? this.php_js.warnings.slice(warningsOffset)
        .length : 0,
      warnings: warningsOffset !== null ? this.php_js.warnings.slice(warningsOffset) : [],
      error_count: errorsOffset !== null ? this.php_js.errors.slice(errorsOffset)
        .length : 0,
      errors: errorsOffset !== null ? this.php_js.errors.slice(errorsOffset) : []
    };
    retObj.year = dt.getFullYear();
    retObj.month = dt.getMonth() + 1;
    retObj.day = dt.getDate();
    retObj.hour = dt.getHours();
    retObj.minute = dt.getMinutes();
    retObj.second = dt.getSeconds();
    retObj.fraction = parseFloat('0.' + dt.getMilliseconds());
    retObj.is_localtime = dt.getTimezoneOffset() !== 0;
  
    return retObj;
};

exports.gmdate = function (format, timestamp) {
  var dt = typeof timestamp === 'undefined' ? new Date() : // Not provided
    typeof timestamp === 'object' ? new Date(timestamp) : // Javascript Date()
    new Date(timestamp * 1000); // UNIX timestamp (auto-convert to int)
    timestamp = Date.parse(dt.toUTCString()
      .slice(0, -4)) / 1000;
    return this.date(format, timestamp);
};

exports.pathinfo = function (path, options) {
  var opt = '',
      optName = '',
      optTemp = 0,
      tmp_arr = {},
      cnt = 0,
      i = 0;
    var have_basename = false,
      have_extension = false,
      have_filename = false;
  
    // Input defaulting & sanitation
    if (!path) {
      return false;
    }
    if (!options) {
      options = 'PATHINFO_ALL';
    }
  
    // Initialize binary arguments. Both the string & integer (constant) input is
    // allowed
    var OPTS = {
      'PATHINFO_DIRNAME': 1,
      'PATHINFO_BASENAME': 2,
      'PATHINFO_EXTENSION': 4,
      'PATHINFO_FILENAME': 8,
      'PATHINFO_ALL': 0
    };
    // PATHINFO_ALL sums up all previously defined PATHINFOs (could just pre-calculate)
    for (optName in OPTS) {
      OPTS.PATHINFO_ALL = OPTS.PATHINFO_ALL | OPTS[optName];
    }
    if (typeof options !== 'number') { // Allow for a single string or an array of string flags
      options = [].concat(options);
      for (i = 0; i < options.length; i++) {
        // Resolve string input to bitwise e.g. 'PATHINFO_EXTENSION' becomes 4
        if (OPTS[options[i]]) {
          optTemp = optTemp | OPTS[options[i]];
        }
      }
      options = optTemp;
    }
  
    // Internal Functions
    var __getExt = function(path) {
      var str = path + '';
      var dotP = str.lastIndexOf('.') + 1;
      return !dotP ? false : dotP !== str.length ? str.substr(dotP) : '';
    };
  
    // Gather path infos
    if (options & OPTS.PATHINFO_DIRNAME) {
      var dirName = path.replace(/\\/g, '/')
        .replace(/\/[^\/]*\/?$/, ''); // dirname
      tmp_arr.dirname = dirName === path ? '.' : dirName;
    }
  
    if (options & OPTS.PATHINFO_BASENAME) {
      if (false === have_basename) {
        have_basename = this.basename(path);
      }
      tmp_arr.basename = have_basename;
    }
  
    if (options & OPTS.PATHINFO_EXTENSION) {
      if (false === have_basename) {
        have_basename = this.basename(path);
      }
      if (false === have_extension) {
        have_extension = __getExt(have_basename);
      }
      if (false !== have_extension) {
        tmp_arr.extension = have_extension;
      }
    }
  
    if (options & OPTS.PATHINFO_FILENAME) {
      if (false === have_basename) {
        have_basename = this.basename(path);
      }
      if (false === have_extension) {
        have_extension = __getExt(have_basename);
      }
      if (false === have_filename) {
        have_filename = have_basename.slice(0, have_basename.length - (have_extension ? have_extension.length + 1 :
          have_extension === false ? 0 : 1));
      }
  
      tmp_arr.filename = have_filename;
    }
  
    // If array contains only 1 element: return string
    cnt = 0;
    for (opt in tmp_arr) {
      cnt++;
    }
    if (cnt == 1) {
      return tmp_arr[opt];
    }
  
    // Return full-blown array
    return tmp_arr;
};

exports.i18n_loc_get_default = function () {
  try {
      this.php_js = this.php_js || {};
    } catch (e) {
      this.php_js = {};
    }
  
    // Ensure defaults are set up
    return this.php_js.i18nLocale || (i18n_loc_set_default('en_US_POSIX'), 'en_US_POSIX');
};

exports.setcookie = function (name, value, expires, path, domain, secure) {
  return this.setrawcookie(name, encodeURIComponent(value), expires, path, domain, secure);
};

exports.chop = function (str, charlist) {
  return this.rtrim(str, charlist);
};

exports.convert_uuencode = function (str) {
  var chr = function(c) {
      return String.fromCharCode(c);
    };
  
    if (!str || str === '') {
      return chr(0);
    } else if (!this.is_scalar(str)) {
      return false;
    }
  
    var c = 0,
      u = 0,
      i = 0,
      a = 0;
    var encoded = '',
      tmp1 = '',
      tmp2 = '',
      bytes = {};
  
    // divide string into chunks of 45 characters
    var chunk = function() {
      bytes = str.substr(u, 45);
      for (i in bytes) {
        bytes[i] = bytes[i].charCodeAt(0);
      }
      if (bytes.length != 0) {
        return bytes.length;
      } else {
        return 0;
      }
    };
  
    while (chunk() !== 0) {
      c = chunk();
      u += 45;
  
      // New line encoded data starts with number of bytes encoded.
      encoded += chr(c + 32);
  
      // Convert each char in bytes[] to a byte
      for (i in bytes) {
        tmp1 = bytes[i].charCodeAt(0)
          .toString(2);
        while (tmp1.length < 8) {
          tmp1 = '0' + tmp1;
        }
        tmp2 += tmp1;
      }
  
      while (tmp2.length % 6) {
        tmp2 = tmp2 + '0';
      }
  
      for (i = 0; i <= (tmp2.length / 6) - 1; i++) {
        tmp1 = tmp2.substr(a, 6);
        if (tmp1 == '000000') {
          encoded += chr(96);
        } else {
          encoded += chr(parseInt(tmp1, 2) + 32);
        }
        a += 6;
      }
      a = 0;
      tmp2 = '';
      encoded += '\n';
    }
  
    // Add termination characters
    encoded += chr(96) + '\n';
  
    return encoded;
};

exports.crc32 = function (str) {
  str = this.utf8_encode(str);
    var table =
      '00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D';
  
    var crc = 0;
    var x = 0;
    var y = 0;
  
    crc = crc ^ (-1);
    for (var i = 0, iTop = str.length; i < iTop; i++) {
      y = (crc ^ str.charCodeAt(i)) & 0xFF;
      x = '0x' + table.substr(y * 9, 8);
      crc = (crc >>> 8) ^ x;
    }
  
    return crc ^ (-1);
};

exports.html_entity_decode = function (string, quote_style) {
  var hash_map = {},
      symbol = '',
      tmp_str = '',
      entity = '';
    tmp_str = string.toString();
  
    if (false === (hash_map = this.get_html_translation_table('HTML_ENTITIES', quote_style))) {
      return false;
    }
  
    // fix &amp; problem
    // http://phpjs.org/functions/get_html_translation_table:416#comment_97660
    delete(hash_map['&']);
    hash_map['&'] = '&amp;';
  
    for (symbol in hash_map) {
      entity = hash_map[symbol];
      tmp_str = tmp_str.split(entity)
        .join(symbol);
    }
    tmp_str = tmp_str.split('&#039;')
      .join("'");
  
    return tmp_str;
};

exports.htmlentities = function (string, quote_style, charset, double_encode) {
  var hash_map = this.get_html_translation_table('HTML_ENTITIES', quote_style),
      symbol = '';
    string = string == null ? '' : string + '';
  
    if (!hash_map) {
      return false;
    }
  
    if (quote_style && quote_style === 'ENT_QUOTES') {
      hash_map["'"] = '&#039;';
    }
  
    if ( !! double_encode || double_encode == null) {
      for (symbol in hash_map) {
        if (hash_map.hasOwnProperty(symbol)) {
          string = string.split(symbol)
            .join(hash_map[symbol]);
        }
      }
    } else {
      string = string.replace(/([\s\S]*?)(&(?:#\d+|#x[\da-f]+|[a-zA-Z][\da-z]*);|$)/g, function(ignore, text, entity) {
        for (symbol in hash_map) {
          if (hash_map.hasOwnProperty(symbol)) {
            text = text.split(symbol)
              .join(hash_map[symbol]);
          }
        }
  
        return text + entity;
      });
    }
  
    return string;
};

exports.join = function (glue, pieces) {
  return this.implode(glue, pieces);
};

exports.md5 = function (str) {
  var xl;
  
    var rotateLeft = function(lValue, iShiftBits) {
      return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    };
  
    var addUnsigned = function(lX, lY) {
      var lX4, lY4, lX8, lY8, lResult;
      lX8 = (lX & 0x80000000);
      lY8 = (lY & 0x80000000);
      lX4 = (lX & 0x40000000);
      lY4 = (lY & 0x40000000);
      lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
      if (lX4 & lY4) {
        return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
      }
      if (lX4 | lY4) {
        if (lResult & 0x40000000) {
          return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
        } else {
          return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
        }
      } else {
        return (lResult ^ lX8 ^ lY8);
      }
    };
  
    var _F = function(x, y, z) {
      return (x & y) | ((~x) & z);
    };
    var _G = function(x, y, z) {
      return (x & z) | (y & (~z));
    };
    var _H = function(x, y, z) {
      return (x ^ y ^ z);
    };
    var _I = function(x, y, z) {
      return (y ^ (x | (~z)));
    };
  
    var _FF = function(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(_F(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };
  
    var _GG = function(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(_G(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };
  
    var _HH = function(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(_H(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };
  
    var _II = function(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(_I(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };
  
    var convertToWordArray = function(str) {
      var lWordCount;
      var lMessageLength = str.length;
      var lNumberOfWords_temp1 = lMessageLength + 8;
      var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
      var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
      var lWordArray = new Array(lNumberOfWords - 1);
      var lBytePosition = 0;
      var lByteCount = 0;
      while (lByteCount < lMessageLength) {
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
        lByteCount++;
      }
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
      lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
      lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
      return lWordArray;
    };
  
    var wordToHex = function(lValue) {
      var wordToHexValue = '',
        wordToHexValue_temp = '',
        lByte, lCount;
      for (lCount = 0; lCount <= 3; lCount++) {
        lByte = (lValue >>> (lCount * 8)) & 255;
        wordToHexValue_temp = '0' + lByte.toString(16);
        wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
      }
      return wordToHexValue;
    };
  
    var x = [],
      k, AA, BB, CC, DD, a, b, c, d, S11 = 7,
      S12 = 12,
      S13 = 17,
      S14 = 22,
      S21 = 5,
      S22 = 9,
      S23 = 14,
      S24 = 20,
      S31 = 4,
      S32 = 11,
      S33 = 16,
      S34 = 23,
      S41 = 6,
      S42 = 10,
      S43 = 15,
      S44 = 21;
  
    str = this.utf8_encode(str);
    x = convertToWordArray(str);
    a = 0x67452301;
    b = 0xEFCDAB89;
    c = 0x98BADCFE;
    d = 0x10325476;
  
    xl = x.length;
    for (k = 0; k < xl; k += 16) {
      AA = a;
      BB = b;
      CC = c;
      DD = d;
      a = _FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
      d = _FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
      c = _FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
      b = _FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
      a = _FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
      d = _FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
      c = _FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
      b = _FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
      a = _FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
      d = _FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
      c = _FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
      b = _FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
      a = _FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
      d = _FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
      c = _FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
      b = _FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
      a = _GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
      d = _GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
      c = _GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
      b = _GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
      a = _GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
      d = _GG(d, a, b, c, x[k + 10], S22, 0x2441453);
      c = _GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
      b = _GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
      a = _GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
      d = _GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
      c = _GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
      b = _GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
      a = _GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
      d = _GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
      c = _GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
      b = _GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
      a = _HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
      d = _HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
      c = _HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
      b = _HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
      a = _HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
      d = _HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
      c = _HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
      b = _HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
      a = _HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
      d = _HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
      c = _HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
      b = _HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
      a = _HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
      d = _HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
      c = _HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
      b = _HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
      a = _II(a, b, c, d, x[k + 0], S41, 0xF4292244);
      d = _II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
      c = _II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
      b = _II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
      a = _II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
      d = _II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
      c = _II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
      b = _II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
      a = _II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
      d = _II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
      c = _II(c, d, a, b, x[k + 6], S43, 0xA3014314);
      b = _II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
      a = _II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
      d = _II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
      c = _II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
      b = _II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
      a = addUnsigned(a, AA);
      b = addUnsigned(b, BB);
      c = addUnsigned(c, CC);
      d = addUnsigned(d, DD);
    }
  
    var temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
  
    return temp.toLowerCase();
};

exports.md5_file = function (str_filename) {
  var buf = '';
  
    buf = this.file_get_contents(str_filename);
  
    if (!buf) {
      return false;
    }
  
    return this.md5(buf);
};

exports.printf = function () {
  var body, elmt, d = this.window.document;
    var ret = '';
  
    var HTMLNS = 'http://www.w3.org/1999/xhtml';
    body = d.getElementsByTagNameNS ? (d.getElementsByTagNameNS(HTMLNS, 'body')[0] ? d.getElementsByTagNameNS(HTMLNS,
      'body')[0] : d.documentElement.lastChild) : d.getElementsByTagName('body')[0];
  
    if (!body) {
      return false;
    }
  
    ret = this.sprintf.apply(this, arguments);
  
    elmt = d.createTextNode(ret);
    body.appendChild(elmt);
  
    return ret.length;
};

exports.setlocale = function (category, locale) {
  var categ = '',
      cats = [],
      i = 0,
      d = this.window.document;
  
    // BEGIN STATIC
    var _copy = function _copy(orig) {
      if (orig instanceof RegExp) {
        return new RegExp(orig);
      } else if (orig instanceof Date) {
        return new Date(orig);
      }
      var newObj = {};
      for (var i in orig) {
        if (typeof orig[i] === 'object') {
          newObj[i] = _copy(orig[i]);
        } else {
          newObj[i] = orig[i];
        }
      }
      return newObj;
    };
  
    // Function usable by a ngettext implementation (apparently not an accessible part of setlocale(), but locale-specific)
    // See http://www.gnu.org/software/gettext/manual/gettext.html#Plural-forms though amended with others from
    // https://developer.mozilla.org/En/Localization_and_Plurals (new categories noted with "MDC" below, though
    // not sure of whether there is a convention for the relative order of these newer groups as far as ngettext)
    // The function name indicates the number of plural forms (nplural)
    // Need to look into http://cldr.unicode.org/ (maybe future JavaScript); Dojo has some functions (under new BSD),
    // including JSON conversions of LDML XML from CLDR: http://bugs.dojotoolkit.org/browser/dojo/trunk/cldr
    // and docs at http://api.dojotoolkit.org/jsdoc/HEAD/dojo.cldr
    var _nplurals1 = function(n) { // e.g., Japanese
      return 0;
    };
    var _nplurals2a = function(n) { // e.g., English
      return n !== 1 ? 1 : 0;
    };
    var _nplurals2b = function(n) { // e.g., French
      return n > 1 ? 1 : 0;
    };
    var _nplurals2c = function(n) { // e.g., Icelandic (MDC)
      return n % 10 === 1 && n % 100 !== 11 ? 0 : 1;
    };
    var _nplurals3a = function(n) { // e.g., Latvian (MDC has a different order from gettext)
      return n % 10 === 1 && n % 100 !== 11 ? 0 : n !== 0 ? 1 : 2;
    };
    var _nplurals3b = function(n) { // e.g., Scottish Gaelic
      return n === 1 ? 0 : n === 2 ? 1 : 2;
    };
    var _nplurals3c = function(n) { // e.g., Romanian
      return n === 1 ? 0 : (n === 0 || (n % 100 > 0 && n % 100 < 20)) ? 1 : 2;
    };
    var _nplurals3d = function(n) { // e.g., Lithuanian (MDC has a different order from gettext)
      return n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
    };
    var _nplurals3e = function(n) { // e.g., Croatian
      return n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 :
        2;
    };
    var _nplurals3f = function(n) { // e.g., Slovak
      return n === 1 ? 0 : n >= 2 && n <= 4 ? 1 : 2;
    };
    var _nplurals3g = function(n) { // e.g., Polish
      return n === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
    };
    var _nplurals3h = function(n) { // e.g., Macedonian (MDC)
      return n % 10 === 1 ? 0 : n % 10 === 2 ? 1 : 2;
    };
    var _nplurals4a = function(n) { // e.g., Slovenian
      return n % 100 === 1 ? 0 : n % 100 === 2 ? 1 : n % 100 === 3 || n % 100 === 4 ? 2 : 3;
    };
    var _nplurals4b = function(n) { // e.g., Maltese (MDC)
      return n === 1 ? 0 : n === 0 || (n % 100 && n % 100 <= 10) ? 1 : n % 100 >= 11 && n % 100 <= 19 ? 2 : 3;
    };
    var _nplurals5 = function(n) { // e.g., Irish Gaeilge (MDC)
      return n === 1 ? 0 : n === 2 ? 1 : n >= 3 && n <= 6 ? 2 : n >= 7 && n <= 10 ? 3 : 4;
    };
    var _nplurals6 = function(n) { // e.g., Arabic (MDC) - Per MDC puts 0 as last group
      return n === 0 ? 5 : n === 1 ? 0 : n === 2 ? 1 : n % 100 >= 3 && n % 100 <= 10 ? 2 : n % 100 >= 11 && n % 100 <=
        99 ? 3 : 4;
    };
    // END STATIC
    // BEGIN REDUNDANT
    try {
      this.php_js = this.php_js || {};
    } catch (e) {
      this.php_js = {};
    }
  
    var phpjs = this.php_js;
  
    // Reconcile Windows vs. *nix locale names?
    // Allow different priority orders of languages, esp. if implement gettext as in
    //     LANGUAGE env. var.? (e.g., show German if French is not available)
    if (!phpjs.locales) {
      // Can add to the locales
      phpjs.locales = {};
  
      phpjs.locales.en = {
        'LC_COLLATE': // For strcoll
  
        function(str1, str2) { // Fix: This one taken from strcmp, but need for other locales; we don't use localeCompare since its locale is not settable
          return (str1 == str2) ? 0 : ((str1 > str2) ? 1 : -1);
        },
        'LC_CTYPE': { // Need to change any of these for English as opposed to C?
          an: /^[A-Za-z\d]+$/g,
          al: /^[A-Za-z]+$/g,
          ct: /^[\u0000-\u001F\u007F]+$/g,
          dg: /^[\d]+$/g,
          gr: /^[\u0021-\u007E]+$/g,
          lw: /^[a-z]+$/g,
          pr: /^[\u0020-\u007E]+$/g,
          pu: /^[\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E]+$/g,
          sp: /^[\f\n\r\t\v ]+$/g,
          up: /^[A-Z]+$/g,
          xd: /^[A-Fa-f\d]+$/g,
          CODESET: 'UTF-8',
          // Used by sql_regcase
          lower: 'abcdefghijklmnopqrstuvwxyz',
          upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        },
        'LC_TIME': { // Comments include nl_langinfo() constant equivalents and any changes from Blues' implementation
          a: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          // ABDAY_
          A: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          // DAY_
          b: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          // ABMON_
          B: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
            'November', 'December'
          ],
          // MON_
          c: '%a %d %b %Y %r %Z',
          // D_T_FMT // changed %T to %r per results
          p: ['AM', 'PM'],
          // AM_STR/PM_STR
          P: ['am', 'pm'],
          // Not available in nl_langinfo()
          r: '%I:%M:%S %p',
          // T_FMT_AMPM (Fixed for all locales)
          x: '%m/%d/%Y',
          // D_FMT // switched order of %m and %d; changed %y to %Y (C uses %y)
          X: '%r',
          // T_FMT // changed from %T to %r  (%T is default for C, not English US)
          // Following are from nl_langinfo() or http://www.cptec.inpe.br/sx4/sx4man2/g1ab02e/strftime.4.html
          alt_digits: '',
          // e.g., ordinal
          ERA: '',
          ERA_YEAR: '',
          ERA_D_T_FMT: '',
          ERA_D_FMT: '',
          ERA_T_FMT: ''
        },
        // Assuming distinction between numeric and monetary is thus:
        // See below for C locale
        'LC_MONETARY': { // original by Windows "english" (English_United States.1252) locale
          int_curr_symbol: 'USD',
          currency_symbol: '$',
          mon_decimal_point: '.',
          mon_thousands_sep: ',',
          mon_grouping: [3],
          // use mon_thousands_sep; "" for no grouping; additional array members indicate successive group lengths after first group (e.g., if to be 1,23,456, could be [3, 2])
          positive_sign: '',
          negative_sign: '-',
          int_frac_digits: 2,
          // Fractional digits only for money defaults?
          frac_digits: 2,
          p_cs_precedes: 1,
          // positive currency symbol follows value = 0; precedes value = 1
          p_sep_by_space: 0,
          // 0: no space between curr. symbol and value; 1: space sep. them unless symb. and sign are adjacent then space sep. them from value; 2: space sep. sign and value unless symb. and sign are adjacent then space separates
          n_cs_precedes: 1,
          // see p_cs_precedes
          n_sep_by_space: 0,
          // see p_sep_by_space
          p_sign_posn: 3,
          // 0: parentheses surround quantity and curr. symbol; 1: sign precedes them; 2: sign follows them; 3: sign immed. precedes curr. symbol; 4: sign immed. succeeds curr. symbol
          n_sign_posn: 0 // see p_sign_posn
        },
        'LC_NUMERIC': { // original by Windows "english" (English_United States.1252) locale
          decimal_point: '.',
          thousands_sep: ',',
          grouping: [3] // see mon_grouping, but for non-monetary values (use thousands_sep)
        },
        'LC_MESSAGES': {
          YESEXPR: '^[yY].*',
          NOEXPR: '^[nN].*',
          YESSTR: '',
          NOSTR: ''
        },
        nplurals: _nplurals2a
      };
      phpjs.locales.en_US = _copy(phpjs.locales.en);
      phpjs.locales.en_US.LC_TIME.c = '%a %d %b %Y %r %Z';
      phpjs.locales.en_US.LC_TIME.x = '%D';
      phpjs.locales.en_US.LC_TIME.X = '%r';
      // The following are original by *nix settings
      phpjs.locales.en_US.LC_MONETARY.int_curr_symbol = 'USD ';
      phpjs.locales.en_US.LC_MONETARY.p_sign_posn = 1;
      phpjs.locales.en_US.LC_MONETARY.n_sign_posn = 1;
      phpjs.locales.en_US.LC_MONETARY.mon_grouping = [3, 3];
      phpjs.locales.en_US.LC_NUMERIC.thousands_sep = '';
      phpjs.locales.en_US.LC_NUMERIC.grouping = [];
  
      phpjs.locales.en_GB = _copy(phpjs.locales.en);
      phpjs.locales.en_GB.LC_TIME.r = '%l:%M:%S %P %Z';
  
      phpjs.locales.en_AU = _copy(phpjs.locales.en_GB);
      phpjs.locales.C = _copy(phpjs.locales.en); // Assume C locale is like English (?) (We need C locale for LC_CTYPE)
      phpjs.locales.C.LC_CTYPE.CODESET = 'ANSI_X3.4-1968';
      phpjs.locales.C.LC_MONETARY = {
        int_curr_symbol: '',
        currency_symbol: '',
        mon_decimal_point: '',
        mon_thousands_sep: '',
        mon_grouping: [],
        p_cs_precedes: 127,
        p_sep_by_space: 127,
        n_cs_precedes: 127,
        n_sep_by_space: 127,
        p_sign_posn: 127,
        n_sign_posn: 127,
        positive_sign: '',
        negative_sign: '',
        int_frac_digits: 127,
        frac_digits: 127
      };
      phpjs.locales.C.LC_NUMERIC = {
        decimal_point: '.',
        thousands_sep: '',
        grouping: []
      };
      phpjs.locales.C.LC_TIME.c = '%a %b %e %H:%M:%S %Y'; // D_T_FMT
      phpjs.locales.C.LC_TIME.x = '%m/%d/%y'; // D_FMT
      phpjs.locales.C.LC_TIME.X = '%H:%M:%S'; // T_FMT
      phpjs.locales.C.LC_MESSAGES.YESEXPR = '^[yY]';
      phpjs.locales.C.LC_MESSAGES.NOEXPR = '^[nN]';
  
      phpjs.locales.fr = _copy(phpjs.locales.en);
      phpjs.locales.fr.nplurals = _nplurals2b;
      phpjs.locales.fr.LC_TIME.a = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
      phpjs.locales.fr.LC_TIME.A = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      phpjs.locales.fr.LC_TIME.b = ['jan', 'f\u00E9v', 'mar', 'avr', 'mai', 'jun', 'jui', 'ao\u00FB', 'sep', 'oct',
        'nov', 'd\u00E9c'
      ];
      phpjs.locales.fr.LC_TIME.B = ['janvier', 'f\u00E9vrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'ao\u00FBt',
        'septembre', 'octobre', 'novembre', 'd\u00E9cembre'
      ];
      phpjs.locales.fr.LC_TIME.c = '%a %d %b %Y %T %Z';
      phpjs.locales.fr.LC_TIME.p = ['', ''];
      phpjs.locales.fr.LC_TIME.P = ['', ''];
      phpjs.locales.fr.LC_TIME.x = '%d.%m.%Y';
      phpjs.locales.fr.LC_TIME.X = '%T';
  
      phpjs.locales.fr_CA = _copy(phpjs.locales.fr);
      phpjs.locales.fr_CA.LC_TIME.x = '%Y-%m-%d';
    }
    if (!phpjs.locale) {
      phpjs.locale = 'en_US';
      var NS_XHTML = 'http://www.w3.org/1999/xhtml';
      var NS_XML = 'http://www.w3.org/XML/1998/namespace';
      if (d.getElementsByTagNameNS && d.getElementsByTagNameNS(NS_XHTML, 'html')[0]) {
        if (d.getElementsByTagNameNS(NS_XHTML, 'html')[0].getAttributeNS && d.getElementsByTagNameNS(NS_XHTML,
          'html')[0].getAttributeNS(NS_XML, 'lang')) {
          phpjs.locale = d.getElementsByTagName(NS_XHTML, 'html')[0].getAttributeNS(NS_XML, 'lang');
        } else if (d.getElementsByTagNameNS(NS_XHTML, 'html')[0].lang) { // XHTML 1.0 only
          phpjs.locale = d.getElementsByTagNameNS(NS_XHTML, 'html')[0].lang;
        }
      } else if (d.getElementsByTagName('html')[0] && d.getElementsByTagName('html')[0].lang) {
        phpjs.locale = d.getElementsByTagName('html')[0].lang;
      }
    }
    phpjs.locale = phpjs.locale.replace('-', '_'); // PHP-style
    // Fix locale if declared locale hasn't been defined
    if (!(phpjs.locale in phpjs.locales)) {
      if (phpjs.locale.replace(/_[a-zA-Z]+$/, '') in phpjs.locales) {
        phpjs.locale = phpjs.locale.replace(/_[a-zA-Z]+$/, '');
      }
    }
  
    if (!phpjs.localeCategories) {
      phpjs.localeCategories = {
        'LC_COLLATE': phpjs.locale,
        // for string comparison, see strcoll()
        'LC_CTYPE': phpjs.locale,
        // for character classification and conversion, for example strtoupper()
        'LC_MONETARY': phpjs.locale,
        // for localeconv()
        'LC_NUMERIC': phpjs.locale,
        // for decimal separator (See also localeconv())
        'LC_TIME': phpjs.locale,
        // for date and time formatting with strftime()
        'LC_MESSAGES': phpjs.locale // for system responses (available if PHP was compiled with libintl)
      };
    }
    // END REDUNDANT
    if (locale === null || locale === '') {
      locale = this.getenv(category) || this.getenv('LANG');
    } else if (Object.prototype.toString.call(locale) === '[object Array]') {
      for (i = 0; i < locale.length; i++) {
        if (!(locale[i] in this.php_js.locales)) {
          if (i === locale.length - 1) {
            return false; // none found
          }
          continue;
        }
        locale = locale[i];
        break;
      }
    }
  
    // Just get the locale
    if (locale === '0' || locale === 0) {
      if (category === 'LC_ALL') {
        for (categ in this.php_js.localeCategories) {
          cats.push(categ + '=' + this.php_js.localeCategories[categ]); // Add ".UTF-8" or allow ".@latint", etc. to the end?
        }
        return cats.join(';');
      }
      return this.php_js.localeCategories[category];
    }
  
    if (!(locale in this.php_js.locales)) {
      return false; // Locale not found
    }
  
    // Set and get locale
    if (category === 'LC_ALL') {
      for (categ in this.php_js.localeCategories) {
        this.php_js.localeCategories[categ] = locale;
      }
    } else {
      this.php_js.localeCategories[category] = locale;
    }
    return locale;
};

exports.sha1 = function (str) {
  var rotate_left = function(n, s) {
      var t4 = (n << s) | (n >>> (32 - s));
      return t4;
    };
  
    /*var lsb_hex = function (val) { // Not in use; needed?
      var str="";
      var i;
      var vh;
      var vl;
  
      for ( i=0; i<=6; i+=2 ) {
        vh = (val>>>(i*4+4))&0x0f;
        vl = (val>>>(i*4))&0x0f;
        str += vh.toString(16) + vl.toString(16);
      }
      return str;
    };*/
  
    var cvt_hex = function(val) {
      var str = '';
      var i;
      var v;
  
      for (i = 7; i >= 0; i--) {
        v = (val >>> (i * 4)) & 0x0f;
        str += v.toString(16);
      }
      return str;
    };
  
    var blockstart;
    var i, j;
    var W = new Array(80);
    var H0 = 0x67452301;
    var H1 = 0xEFCDAB89;
    var H2 = 0x98BADCFE;
    var H3 = 0x10325476;
    var H4 = 0xC3D2E1F0;
    var A, B, C, D, E;
    var temp;
  
    str = this.utf8_encode(str);
    var str_len = str.length;
  
    var word_array = [];
    for (i = 0; i < str_len - 3; i += 4) {
      j = str.charCodeAt(i) << 24 | str.charCodeAt(i + 1) << 16 | str.charCodeAt(i + 2) << 8 | str.charCodeAt(i + 3);
      word_array.push(j);
    }
  
    switch (str_len % 4) {
      case 0:
        i = 0x080000000;
        break;
      case 1:
        i = str.charCodeAt(str_len - 1) << 24 | 0x0800000;
        break;
      case 2:
        i = str.charCodeAt(str_len - 2) << 24 | str.charCodeAt(str_len - 1) << 16 | 0x08000;
        break;
      case 3:
        i = str.charCodeAt(str_len - 3) << 24 | str.charCodeAt(str_len - 2) << 16 | str.charCodeAt(str_len - 1) <<
          8 | 0x80;
        break;
    }
  
    word_array.push(i);
  
    while ((word_array.length % 16) != 14) {
      word_array.push(0);
    }
  
    word_array.push(str_len >>> 29);
    word_array.push((str_len << 3) & 0x0ffffffff);
  
    for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {
      for (i = 0; i < 16; i++) {
        W[i] = word_array[blockstart + i];
      }
      for (i = 16; i <= 79; i++) {
        W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
      }
  
      A = H0;
      B = H1;
      C = H2;
      D = H3;
      E = H4;
  
      for (i = 0; i <= 19; i++) {
        temp = (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
        E = D;
        D = C;
        C = rotate_left(B, 30);
        B = A;
        A = temp;
      }
  
      for (i = 20; i <= 39; i++) {
        temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
        E = D;
        D = C;
        C = rotate_left(B, 30);
        B = A;
        A = temp;
      }
  
      for (i = 40; i <= 59; i++) {
        temp = (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
        E = D;
        D = C;
        C = rotate_left(B, 30);
        B = A;
        A = temp;
      }
  
      for (i = 60; i <= 79; i++) {
        temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
        E = D;
        D = C;
        C = rotate_left(B, 30);
        B = A;
        A = temp;
      }
  
      H0 = (H0 + A) & 0x0ffffffff;
      H1 = (H1 + B) & 0x0ffffffff;
      H2 = (H2 + C) & 0x0ffffffff;
      H3 = (H3 + D) & 0x0ffffffff;
      H4 = (H4 + E) & 0x0ffffffff;
    }
  
    temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
    return temp.toLowerCase();
};

exports.sha1_file = function (str_filename) {
  var buf = this.file_get_contents(str_filename);
  
    return this.sha1(buf);
};

exports.split = function (delimiter, string) {
  return this.explode(delimiter, string);
};

exports.strchr = function (haystack, needle, bool) {
  return this.strstr(haystack, needle, bool);
};

exports.strnatcmp = function (f_string1, f_string2, f_version) {
  var i = 0;
  
    if (f_version == undefined) {
      f_version = false;
    }
  
    var __strnatcmp_split = function(f_string) {
      var result = [];
      var buffer = '';
      var chr = '';
      var i = 0,
        f_stringl = 0;
  
      var text = true;
  
      f_stringl = f_string.length;
      for (i = 0; i < f_stringl; i++) {
        chr = f_string.substring(i, i + 1);
        if (chr.match(/\d/)) {
          if (text) {
            if (buffer.length > 0) {
              result[result.length] = buffer;
              buffer = '';
            }
  
            text = false;
          }
          buffer += chr;
        } else if ((text == false) && (chr === '.') && (i < (f_string.length - 1)) && (f_string.substring(i + 1, i +
            2)
          .match(/\d/))) {
          result[result.length] = buffer;
          buffer = '';
        } else {
          if (text == false) {
            if (buffer.length > 0) {
              result[result.length] = parseInt(buffer, 10);
              buffer = '';
            }
            text = true;
          }
          buffer += chr;
        }
      }
  
      if (buffer.length > 0) {
        if (text) {
          result[result.length] = buffer;
        } else {
          result[result.length] = parseInt(buffer, 10);
        }
      }
  
      return result;
    };
  
    var array1 = __strnatcmp_split(f_string1 + '');
    var array2 = __strnatcmp_split(f_string2 + '');
  
    var len = array1.length;
    var text = true;
  
    var result = -1;
    var r = 0;
  
    if (len > array2.length) {
      len = array2.length;
      result = 1;
    }
  
    for (i = 0; i < len; i++) {
      if (isNaN(array1[i])) {
        if (isNaN(array2[i])) {
          text = true;
  
          if ((r = this.strcmp(array1[i], array2[i])) != 0) {
            return r;
          }
        } else if (text) {
          return 1;
        } else {
          return -1;
        }
      } else if (isNaN(array2[i])) {
        if (text) {
          return -1;
        } else {
          return 1;
        }
      } else {
        if (text || f_version) {
          if ((r = (array1[i] - array2[i])) != 0) {
            return r;
          }
        } else {
          if ((r = this.strcmp(array1[i].toString(), array2[i].toString())) != 0) {
            return r;
          }
        }
  
        text = false;
      }
    }
  
    return result;
};

exports.vprintf = function (format, args) {
  var body, elmt;
    var ret = '',
      d = this.window.document;
  
    // .shift() does not work to get first item in bodies
    var HTMLNS = 'http://www.w3.org/1999/xhtml';
    body = d.getElementsByTagNameNS ? (d.getElementsByTagNameNS(HTMLNS, 'body')[0] ? d.getElementsByTagNameNS(HTMLNS,
      'body')[0] : d.documentElement.lastChild) : d.getElementsByTagName('body')[0];
  
    if (!body) {
      return false;
    }
  
    ret = this.sprintf.apply(this, [format].concat(args));
  
    elmt = d.createTextNode(ret);
    body.appendChild(elmt);
  
    return ret.length;
};

exports.vsprintf = function (format, args) {
  return this.sprintf.apply(this, [format].concat(args));
};

exports.get_headers = function (url, format) {
  var req = this.window.ActiveXObject ? new ActiveXObject('Microsoft.XMLHTTP') : new XMLHttpRequest();
  
    if (!req) {
      throw new Error('XMLHttpRequest not supported');
    }
    var tmp, headers, pair, i, j = 0;ß;
    req.open('HEAD', url, false);
    req.send(null);
  
    if (req.readyState < 3) {
      return false;
    }
  
    tmp = req.getAllResponseHeaders();
    tmp = tmp.split('\n');
    tmp = this.array_filter(tmp, function(value) {
      return value.substring(1) !== '';
    });
    headers = format ? {} : [];
  
    for (var i in tmp) {
      if (format) {
        pair = tmp[i].split(':');
        headers[pair.splice(0, 1)] = pair.join(':')
          .substring(1);
      } else {
        headers[j++] = tmp[i];
      }
    }
  
    return headers;
};

exports.get_meta_tags = function (file) {
  var fulltxt = '';
  
    if (false) {
      // Use this for testing instead of the line above:
      fulltxt = '<meta name="author" content="name">' + '<meta name="keywords" content="php documentation">' +
        '<meta name="DESCRIPTION" content="a php manual">' + '<meta name="geo.position" content="49.33;-86.59">' +
        '</head>';
    } else {
      fulltxt = this.file_get_contents(file)
        .match(/^[\s\S]*<\/head>/i); // We have to disallow some character, so we choose a Unicode non-character
    }
  
    var patt = /<meta[^>]*?>/gim;
    var patt1 = /<meta\s+.*?name\s*=\s*(['"]?)(.*?)\1\s+.*?content\s*=\s*(['"]?)(.*?)\3/gim;
    var patt2 = /<meta\s+.*?content\s*=\s*(['"?])(.*?)\1\s+.*?name\s*=\s*(['"]?)(.*?)\3/gim;
    var txt, match, name, arr = {};
  
    while ((txt = patt.exec(fulltxt)) !== null) {
      while ((match = patt1.exec(txt)) !== null) {
        name = match[2].replace(/\W/g, '_')
          .toLowerCase();
        arr[name] = match[4];
      }
      while ((match = patt2.exec(txt)) !== null) {
        name = match[4].replace(/\W/g, '_')
          .toLowerCase();
        arr[name] = match[2];
      }
    }
    return arr;
};

exports.http_build_query = function (formdata, numeric_prefix, arg_separator) {
  var value, key, tmp = [],
      that = this;
  
    var _http_build_query_helper = function(key, val, arg_separator) {
      var k, tmp = [];
      if (val === true) {
        val = '1';
      } else if (val === false) {
        val = '0';
      }
      if (val != null) {
        if (typeof val === 'object') {
          for (k in val) {
            if (val[k] != null) {
              tmp.push(_http_build_query_helper(key + '[' + k + ']', val[k], arg_separator));
            }
          }
          return tmp.join(arg_separator);
        } else if (typeof val !== 'function') {
          return that.urlencode(key) + '=' + that.urlencode(val);
        } else {
          throw new Error('There was an error processing for http_build_query().');
        }
      } else {
        return '';
      }
    };
  
    if (!arg_separator) {
      arg_separator = '&';
    }
    for (key in formdata) {
      value = formdata[key];
      if (numeric_prefix && !isNaN(key)) {
        key = String(numeric_prefix) + key;
      }
      var query = _http_build_query_helper(key, value, arg_separator);
      if (query !== '') {
        tmp.push(query);
      }
    }
  
    return tmp.join(arg_separator);
};

exports.doubleval = function (mixed_var) {
  return this.floatval(mixed_var);
};

exports.gettype = function (mixed_var) {
  var s = typeof mixed_var,
      name;
    var getFuncName = function(fn) {
      var name = (/\W*function\s+([\w\$]+)\s*\(/)
        .exec(fn);
      if (!name) {
        return '(Anonymous)';
      }
      return name[1];
    };
    if (s === 'object') {
      if (mixed_var !== null) { // From: http://javascript.crockford.com/remedial.html
        if (typeof mixed_var.length === 'number' && !(mixed_var.propertyIsEnumerable('length')) && typeof mixed_var
          .splice === 'function') {
          s = 'array';
        } else if (mixed_var.constructor && getFuncName(mixed_var.constructor)) {
          name = getFuncName(mixed_var.constructor);
          if (name === 'Date') {
            s = 'date'; // not in PHP
          } else if (name === 'RegExp') {
            s = 'regexp'; // not in PHP
          } else if (name === 'PHPJS_Resource') { // Check against our own resource constructor
            s = 'resource';
          }
        }
      } else {
        s = 'null';
      }
    } else if (s === 'number') {
      s = this.is_float(mixed_var) ? 'double' : 'integer';
    }
    return s;
};

exports.is_double = function (mixed_var) {
  return this.is_float(mixed_var);
};

exports.is_integer = function (mixed_var) {
  return this.is_int(mixed_var);
};

exports.is_long = function (mixed_var) {
  return this.is_float(mixed_var);
};

exports.is_real = function (mixed_var) {
  return this.is_float(mixed_var);
};

exports.print_r = function (array, return_val) {
  var output = '',
      pad_char = ' ',
      pad_val = 4,
      d = this.window.document,
      getFuncName = function(fn) {
        var name = (/\W*function\s+([\w\$]+)\s*\(/)
          .exec(fn);
        if (!name) {
          return '(Anonymous)';
        }
        return name[1];
      };
    repeat_char = function(len, pad_char) {
      var str = '';
      for (var i = 0; i < len; i++) {
        str += pad_char;
      }
      return str;
    };
    formatArray = function(obj, cur_depth, pad_val, pad_char) {
      if (cur_depth > 0) {
        cur_depth++;
      }
  
      var base_pad = repeat_char(pad_val * cur_depth, pad_char);
      var thick_pad = repeat_char(pad_val * (cur_depth + 1), pad_char);
      var str = '';
  
      if (typeof obj === 'object' && obj !== null && obj.constructor && getFuncName(obj.constructor) !==
        'PHPJS_Resource') {
        str += 'Array\n' + base_pad + '(\n';
        for (var key in obj) {
          if (Object.prototype.toString.call(obj[key]) === '[object Array]') {
            str += thick_pad + '[' + key + '] => ' + formatArray(obj[key], cur_depth + 1, pad_val, pad_char);
          } else {
            str += thick_pad + '[' + key + '] => ' + obj[key] + '\n';
          }
        }
        str += base_pad + ')\n';
      } else if (obj === null || obj === undefined) {
        str = '';
      } else { // for our "resource" class
        str = obj.toString();
      }
  
      return str;
    };
  
    output = formatArray(array, 0, pad_val, pad_char);
  
    if (return_val !== true) {
      if (d.body) {
        this.echo(output);
      } else {
        try {
          d = XULDocument; // We're in XUL, so appending as plain text won't work; trigger an error out of XUL
          this.echo('<pre xmlns="http://www.w3.org/1999/xhtml" style="white-space:pre;">' + output + '</pre>');
        } catch (e) {
          this.echo(output); // Outputting as plain text may work in some plain XML
        }
      }
      return true;
    }
    return output;
};

exports.var_dump = function () {
  var output = '',
      pad_char = ' ',
      pad_val = 4,
      lgth = 0,
      i = 0;
  
    var _getFuncName = function(fn) {
      var name = (/\W*function\s+([\w\$]+)\s*\(/)
        .exec(fn);
      if (!name) {
        return '(Anonymous)';
      }
      return name[1];
    };
  
    var _repeat_char = function(len, pad_char) {
      var str = '';
      for (var i = 0; i < len; i++) {
        str += pad_char;
      }
      return str;
    };
    var _getInnerVal = function(val, thick_pad) {
      var ret = '';
      if (val === null) {
        ret = 'NULL';
      } else if (typeof val === 'boolean') {
        ret = 'bool(' + val + ')';
      } else if (typeof val === 'string') {
        ret = 'string(' + val.length + ') "' + val + '"';
      } else if (typeof val === 'number') {
        if (parseFloat(val) == parseInt(val, 10)) {
          ret = 'int(' + val + ')';
        } else {
          ret = 'float(' + val + ')';
        }
      }
      // The remaining are not PHP behavior because these values only exist in this exact form in JavaScript
      else if (typeof val === 'undefined') {
        ret = 'undefined';
      } else if (typeof val === 'function') {
        var funcLines = val.toString()
          .split('\n');
        ret = '';
        for (var i = 0, fll = funcLines.length; i < fll; i++) {
          ret += (i !== 0 ? '\n' + thick_pad : '') + funcLines[i];
        }
      } else if (val instanceof Date) {
        ret = 'Date(' + val + ')';
      } else if (val instanceof RegExp) {
        ret = 'RegExp(' + val + ')';
      } else if (val.nodeName) { // Different than PHP's DOMElement
        switch (val.nodeType) {
          case 1:
            if (typeof val.namespaceURI === 'undefined' || val.namespaceURI === 'http://www.w3.org/1999/xhtml') { // Undefined namespace could be plain XML, but namespaceURI not widely supported
              ret = 'HTMLElement("' + val.nodeName + '")';
            } else {
              ret = 'XML Element("' + val.nodeName + '")';
            }
            break;
          case 2:
            ret = 'ATTRIBUTE_NODE(' + val.nodeName + ')';
            break;
          case 3:
            ret = 'TEXT_NODE(' + val.nodeValue + ')';
            break;
          case 4:
            ret = 'CDATA_SECTION_NODE(' + val.nodeValue + ')';
            break;
          case 5:
            ret = 'ENTITY_REFERENCE_NODE';
            break;
          case 6:
            ret = 'ENTITY_NODE';
            break;
          case 7:
            ret = 'PROCESSING_INSTRUCTION_NODE(' + val.nodeName + ':' + val.nodeValue + ')';
            break;
          case 8:
            ret = 'COMMENT_NODE(' + val.nodeValue + ')';
            break;
          case 9:
            ret = 'DOCUMENT_NODE';
            break;
          case 10:
            ret = 'DOCUMENT_TYPE_NODE';
            break;
          case 11:
            ret = 'DOCUMENT_FRAGMENT_NODE';
            break;
          case 12:
            ret = 'NOTATION_NODE';
            break;
        }
      }
      return ret;
    };
  
    var _formatArray = function(obj, cur_depth, pad_val, pad_char) {
      var someProp = '';
      if (cur_depth > 0) {
        cur_depth++;
      }
  
      var base_pad = _repeat_char(pad_val * (cur_depth - 1), pad_char);
      var thick_pad = _repeat_char(pad_val * (cur_depth + 1), pad_char);
      var str = '';
      var val = '';
  
      if (typeof obj === 'object' && obj !== null) {
        if (obj.constructor && _getFuncName(obj.constructor) === 'PHPJS_Resource') {
          return obj.var_dump();
        }
        lgth = 0;
        for (someProp in obj) {
          lgth++;
        }
        str += 'array(' + lgth + ') {\n';
        for (var key in obj) {
          var objVal = obj[key];
          if (typeof objVal === 'object' && objVal !== null && !(objVal instanceof Date) && !(objVal instanceof RegExp) && !
            objVal.nodeName) {
            str += thick_pad + '[' + key + '] =>\n' + thick_pad + _formatArray(objVal, cur_depth + 1, pad_val,
              pad_char);
          } else {
            val = _getInnerVal(objVal, thick_pad);
            str += thick_pad + '[' + key + '] =>\n' + thick_pad + val + '\n';
          }
        }
        str += base_pad + '}\n';
      } else {
        str = _getInnerVal(obj, thick_pad);
      }
      return str;
    };
  
    output = _formatArray(arguments[0], 0, pad_val, pad_char);
    for (i = 1; i < arguments.length; i++) {
      output += '\n' + _formatArray(arguments[i], 0, pad_val, pad_char);
    }
  
    this.echo(output);
};

exports.var_export = function (mixed_expression, bool_return) {
  var retstr = '',
      iret = '',
      value,
      cnt = 0,
      x = [],
      i = 0,
      funcParts = [],
      // We use the last argument (not part of PHP) to pass in
      // our indentation level
      idtLevel = arguments[2] || 2,
      innerIndent = '',
      outerIndent = '',
      getFuncName = function(fn) {
        var name = (/\W*function\s+([\w\$]+)\s*\(/)
          .exec(fn);
        if (!name) {
          return '(Anonymous)';
        }
        return name[1];
      };
    _makeIndent = function(idtLevel) {
      return (new Array(idtLevel + 1))
        .join(' ');
    };
    __getType = function(inp) {
      var i = 0,
        match, types, cons, type = typeof inp;
      if (type === 'object' && (inp && inp.constructor) &&
        getFuncName(inp.constructor) === 'PHPJS_Resource') {
        return 'resource';
      }
      if (type === 'function') {
        return 'function';
      }
      if (type === 'object' && !inp) {
        return 'null'; // Should this be just null?
      }
      if (type === 'object') {
        if (!inp.constructor) {
          return 'object';
        }
        cons = inp.constructor.toString();
        match = cons.match(/(\w+)\(/);
        if (match) {
          cons = match[1].toLowerCase();
        }
        types = ['boolean', 'number', 'string', 'array'];
        for (i = 0; i < types.length; i++) {
          if (cons === types[i]) {
            type = types[i];
            break;
          }
        }
      }
      return type;
    };
    type = __getType(mixed_expression);
  
    if (type === null) {
      retstr = 'NULL';
    } else if (type === 'array' || type === 'object') {
      outerIndent = _makeIndent(idtLevel - 2);
      innerIndent = _makeIndent(idtLevel);
      for (i in mixed_expression) {
        value = this.var_export(mixed_expression[i], 1, idtLevel + 2);
        value = typeof value === 'string' ? value.replace(/</g, '&lt;')
          .
        replace(/>/g, '&gt;') : value;
        x[cnt++] = innerIndent + i + ' => ' +
          (__getType(mixed_expression[i]) === 'array' ?
          '\n' : '') + value;
      }
      iret = x.join(',\n');
      retstr = outerIndent + 'array (\n' + iret + '\n' + outerIndent + ')';
    } else if (type === 'function') {
      funcParts = mixed_expression.toString()
        .
      match(/function .*?\((.*?)\) \{([\s\S]*)\}/);
  
      // For lambda functions, var_export() outputs such as the following:
      // '\000lambda_1'. Since it will probably not be a common use to
      // expect this (unhelpful) form, we'll use another PHP-exportable
      // construct, create_function() (though dollar signs must be on the
      // variables in JavaScript); if using instead in JavaScript and you
      // are using the namespaced version, note that create_function() will
      // not be available as a global
      retstr = "create_function ('" + funcParts[1] + "', '" +
        funcParts[2].replace(new RegExp("'", 'g'), "\\'") + "')";
    } else if (type === 'resource') {
      retstr = 'NULL'; // Resources treated as null for var_export
    } else {
      retstr = typeof mixed_expression !== 'string' ? mixed_expression :
        "'" + mixed_expression.replace(/(["'])/g, '\\$1')
        .
      replace(/\0/g, '\\0') + "'";
    }
  
    if (!bool_return) {
      this.echo(retstr);
      return null;
    }
  
    return retstr;
};

exports.arsort = function (inputArr, sort_flags) {
  var valArr = [],
      valArrLen = 0,
      k, i, ret, sorter, that = this,
      strictForIn = false,
      populateArr = {};
  
    switch (sort_flags) {
      case 'SORT_STRING':
        // compare items as strings
        sorter = function(a, b) {
          return that.strnatcmp(b, a);
        };
        break;
      case 'SORT_LOCALE_STRING':
        // compare items as strings, original by the current locale (set with i18n_loc_set_default() as of PHP6)
        var loc = this.i18n_loc_get_default();
        sorter = this.php_js.i18nLocales[loc].sorting;
        break;
      case 'SORT_NUMERIC':
        // compare items numerically
        sorter = function(a, b) {
          return (a - b);
        };
        break;
      case 'SORT_REGULAR':
        // compare items normally (don't change types)
      default:
        sorter = function(b, a) {
          var aFloat = parseFloat(a),
            bFloat = parseFloat(b),
            aNumeric = aFloat + '' === a,
            bNumeric = bFloat + '' === b;
          if (aNumeric && bNumeric) {
            return aFloat > bFloat ? 1 : aFloat < bFloat ? -1 : 0;
          } else if (aNumeric && !bNumeric) {
            return 1;
          } else if (!aNumeric && bNumeric) {
            return -1;
          }
          return a > b ? 1 : a < b ? -1 : 0;
        };
        break;
    }
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    // Get key and value arrays
    for (k in inputArr) {
      if (inputArr.hasOwnProperty(k)) {
        valArr.push([k, inputArr[k]]);
        if (strictForIn) {
          delete inputArr[k];
        }
      }
    }
    valArr.sort(function(a, b) {
      return sorter(a[1], b[1]);
    });
  
    // Repopulate the old array
    for (i = 0, valArrLen = valArr.length; i < valArrLen; i++) {
      populateArr[valArr[i][0]] = valArr[i][1];
    }
  
    return strictForIn || populateArr;
};

exports.asort = function (inputArr, sort_flags) {
  var valArr = [],
      valArrLen = 0,
      k, i, ret, sorter, that = this,
      strictForIn = false,
      populateArr = {};
  
    switch (sort_flags) {
      case 'SORT_STRING':
        // compare items as strings
        sorter = function(a, b) {
          return that.strnatcmp(a, b);
        };
        break;
      case 'SORT_LOCALE_STRING':
        // compare items as strings, original by the current locale (set with i18n_loc_set_default() as of PHP6)
        var loc = this.i18n_loc_get_default();
        sorter = this.php_js.i18nLocales[loc].sorting;
        break;
      case 'SORT_NUMERIC':
        // compare items numerically
        sorter = function(a, b) {
          return (a - b);
        };
        break;
      case 'SORT_REGULAR':
        // compare items normally (don't change types)
      default:
        sorter = function(a, b) {
          var aFloat = parseFloat(a),
            bFloat = parseFloat(b),
            aNumeric = aFloat + '' === a,
            bNumeric = bFloat + '' === b;
          if (aNumeric && bNumeric) {
            return aFloat > bFloat ? 1 : aFloat < bFloat ? -1 : 0;
          } else if (aNumeric && !bNumeric) {
            return 1;
          } else if (!aNumeric && bNumeric) {
            return -1;
          }
          return a > b ? 1 : a < b ? -1 : 0;
        };
        break;
    }
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    // Get key and value arrays
    for (k in inputArr) {
      if (inputArr.hasOwnProperty(k)) {
        valArr.push([k, inputArr[k]]);
        if (strictForIn) {
          delete inputArr[k];
        }
      }
    }
  
    valArr.sort(function(a, b) {
      return sorter(a[1], b[1]);
    });
  
    // Repopulate the old array
    for (i = 0, valArrLen = valArr.length; i < valArrLen; i++) {
      populateArr[valArr[i][0]] = valArr[i][1];
    }
  
    return strictForIn || populateArr;
};

exports.krsort = function (inputArr, sort_flags) {
  var tmp_arr = {},
      keys = [],
      sorter, i, k, that = this,
      strictForIn = false,
      populateArr = {};
  
    switch (sort_flags) {
      case 'SORT_STRING':
        // compare items as strings
        sorter = function(a, b) {
          return that.strnatcmp(b, a);
        };
        break;
      case 'SORT_LOCALE_STRING':
        // compare items as strings, original by the current locale (set with  i18n_loc_set_default() as of PHP6)
        var loc = this.i18n_loc_get_default();
        sorter = this.php_js.i18nLocales[loc].sorting;
        break;
      case 'SORT_NUMERIC':
        // compare items numerically
        sorter = function(a, b) {
          return (b - a);
        };
        break;
      case 'SORT_REGULAR':
        // compare items normally (don't change types)
      default:
        sorter = function(b, a) {
          var aFloat = parseFloat(a),
            bFloat = parseFloat(b),
            aNumeric = aFloat + '' === a,
            bNumeric = bFloat + '' === b;
          if (aNumeric && bNumeric) {
            return aFloat > bFloat ? 1 : aFloat < bFloat ? -1 : 0;
          } else if (aNumeric && !bNumeric) {
            return 1;
          } else if (!aNumeric && bNumeric) {
            return -1;
          }
          return a > b ? 1 : a < b ? -1 : 0;
        };
        break;
    }
  
    // Make a list of key names
    for (k in inputArr) {
      if (inputArr.hasOwnProperty(k)) {
        keys.push(k);
      }
    }
    keys.sort(sorter);
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    // Rebuild array with sorted key names
    for (i = 0; i < keys.length; i++) {
      k = keys[i];
      tmp_arr[k] = inputArr[k];
      if (strictForIn) {
        delete inputArr[k];
      }
    }
    for (i in tmp_arr) {
      if (tmp_arr.hasOwnProperty(i)) {
        populateArr[i] = tmp_arr[i];
      }
    }
  
    return strictForIn || populateArr;
};

exports.ksort = function (inputArr, sort_flags) {
  var tmp_arr = {},
      keys = [],
      sorter, i, k, that = this,
      strictForIn = false,
      populateArr = {};
  
    switch (sort_flags) {
      case 'SORT_STRING':
        // compare items as strings
        sorter = function(a, b) {
          return that.strnatcmp(a, b);
        };
        break;
      case 'SORT_LOCALE_STRING':
        // compare items as strings, original by the current locale (set with  i18n_loc_set_default() as of PHP6)
        var loc = this.i18n_loc_get_default();
        sorter = this.php_js.i18nLocales[loc].sorting;
        break;
      case 'SORT_NUMERIC':
        // compare items numerically
        sorter = function(a, b) {
          return ((a + 0) - (b + 0));
        };
        break;
        // case 'SORT_REGULAR': // compare items normally (don't change types)
      default:
        sorter = function(a, b) {
          var aFloat = parseFloat(a),
            bFloat = parseFloat(b),
            aNumeric = aFloat + '' === a,
            bNumeric = bFloat + '' === b;
          if (aNumeric && bNumeric) {
            return aFloat > bFloat ? 1 : aFloat < bFloat ? -1 : 0;
          } else if (aNumeric && !bNumeric) {
            return 1;
          } else if (!aNumeric && bNumeric) {
            return -1;
          }
          return a > b ? 1 : a < b ? -1 : 0;
        };
        break;
    }
  
    // Make a list of key names
    for (k in inputArr) {
      if (inputArr.hasOwnProperty(k)) {
        keys.push(k);
      }
    }
    keys.sort(sorter);
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    // Rebuild array with sorted key names
    for (i = 0; i < keys.length; i++) {
      k = keys[i];
      tmp_arr[k] = inputArr[k];
      if (strictForIn) {
        delete inputArr[k];
      }
    }
    for (i in tmp_arr) {
      if (tmp_arr.hasOwnProperty(i)) {
        populateArr[i] = tmp_arr[i];
      }
    }
  
    return strictForIn || populateArr;
};

exports.natsort = function (inputArr) {
  var valArr = [],
      k, i, ret, that = this,
      strictForIn = false,
      populateArr = {};
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    // Get key and value arrays
    for (k in inputArr) {
      if (inputArr.hasOwnProperty(k)) {
        valArr.push([k, inputArr[k]]);
        if (strictForIn) {
          delete inputArr[k];
        }
      }
    }
    valArr.sort(function(a, b) {
      return that.strnatcmp(a[1], b[1]);
    });
  
    // Repopulate the old array
    for (i = 0; i < valArr.length; i++) {
      populateArr[valArr[i][0]] = valArr[i][1];
    }
  
    return strictForIn || populateArr;
};

exports.rsort = function (inputArr, sort_flags) {
  var valArr = [],
      k = '',
      i = 0,
      sorter = false,
      that = this,
      strictForIn = false,
      populateArr = [];
  
    switch (sort_flags) {
      case 'SORT_STRING':
        // compare items as strings
        sorter = function(a, b) {
          return that.strnatcmp(b, a);
        };
        break;
      case 'SORT_LOCALE_STRING':
        // compare items as strings, original by the current locale (set with  i18n_loc_set_default() as of PHP6)
        var loc = this.i18n_loc_get_default();
        sorter = this.php_js.i18nLocales[loc].sorting;
        break;
      case 'SORT_NUMERIC':
        // compare items numerically
        sorter = function(a, b) {
          return (b - a);
        };
        break;
      case 'SORT_REGULAR':
        // compare items normally (don't change types)
      default:
        sorter = function(b, a) {
          var aFloat = parseFloat(a),
            bFloat = parseFloat(b),
            aNumeric = aFloat + '' === a,
            bNumeric = bFloat + '' === b;
          if (aNumeric && bNumeric) {
            return aFloat > bFloat ? 1 : aFloat < bFloat ? -1 : 0;
          } else if (aNumeric && !bNumeric) {
            return 1;
          } else if (!aNumeric && bNumeric) {
            return -1;
          }
          return a > b ? 1 : a < b ? -1 : 0;
        };
        break;
    }
  
    // BEGIN REDUNDANT
    try {
      this.php_js = this.php_js || {};
    } catch (e) {
      this.php_js = {};
    }
  
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    for (k in inputArr) { // Get key and value arrays
      if (inputArr.hasOwnProperty(k)) {
        valArr.push(inputArr[k]);
        if (strictForIn) {
          delete inputArr[k];
        }
      }
    }
  
    valArr.sort(sorter);
  
    for (i = 0; i < valArr.length; i++) { // Repopulate the old array
      populateArr[i] = valArr[i];
    }
    return strictForIn || populateArr;
};

exports.sort = function (inputArr, sort_flags) {
  var valArr = [],
      keyArr = [],
      k = '',
      i = 0,
      sorter = false,
      that = this,
      strictForIn = false,
      populateArr = [];
  
    switch (sort_flags) {
      case 'SORT_STRING':
        // compare items as strings
        sorter = function(a, b) {
          return that.strnatcmp(a, b);
        };
        break;
      case 'SORT_LOCALE_STRING':
        // compare items as strings, original by the current locale (set with  i18n_loc_set_default() as of PHP6)
        var loc = this.i18n_loc_get_default();
        sorter = this.php_js.i18nLocales[loc].sorting;
        break;
      case 'SORT_NUMERIC':
        // compare items numerically
        sorter = function(a, b) {
          return (a - b);
        };
        break;
      case 'SORT_REGULAR':
        // compare items normally (don't change types)
      default:
        sorter = function(a, b) {
          var aFloat = parseFloat(a),
            bFloat = parseFloat(b),
            aNumeric = aFloat + '' === a,
            bNumeric = bFloat + '' === b;
          if (aNumeric && bNumeric) {
            return aFloat > bFloat ? 1 : aFloat < bFloat ? -1 : 0;
          } else if (aNumeric && !bNumeric) {
            return 1;
          } else if (!aNumeric && bNumeric) {
            return -1;
          }
          return a > b ? 1 : a < b ? -1 : 0;
        };
        break;
    }
  
    // BEGIN REDUNDANT
    try {
      this.php_js = this.php_js || {};
    } catch (e) {
      this.php_js = {};
    }
  
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    for (k in inputArr) { // Get key and value arrays
      if (inputArr.hasOwnProperty(k)) {
        valArr.push(inputArr[k]);
        if (strictForIn) {
          delete inputArr[k];
        }
      }
    }
  
    valArr.sort(sorter);
  
    for (i = 0; i < valArr.length; i++) { // Repopulate the old array
      populateArr[i] = valArr[i];
    }
    return strictForIn || populateArr;
};

exports.ctype_alnum = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.an) !== -1;
};

exports.ctype_alpha = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.al) !== -1;
};

exports.ctype_cntrl = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.ct) !== -1;
};

exports.ctype_digit = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.dg) !== -1;
};

exports.ctype_graph = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.gr) !== -1;
};

exports.ctype_lower = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.lw) !== -1;
};

exports.ctype_print = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.pr) !== -1;
};

exports.ctype_punct = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.pu) !== -1;
};

exports.ctype_space = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.sp) !== -1;
};

exports.ctype_upper = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.up) !== -1;
};

exports.ctype_xdigit = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.xd) !== -1;
};

exports.strftime = function (fmt, timestamp) {
  this.php_js = this.php_js || {};
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    var phpjs = this.php_js;
  
    // BEGIN STATIC
    var _xPad = function(x, pad, r) {
      if (typeof r === 'undefined') {
        r = 10;
      }
      for (; parseInt(x, 10) < r && r > 1; r /= 10) {
        x = pad.toString() + x;
      }
      return x.toString();
    };
  
    var locale = phpjs.localeCategories.LC_TIME;
    var locales = phpjs.locales;
    var lc_time = locales[locale].LC_TIME;
  
    var _formats = {
      a: function(d) {
        return lc_time.a[d.getDay()];
      },
      A: function(d) {
        return lc_time.A[d.getDay()];
      },
      b: function(d) {
        return lc_time.b[d.getMonth()];
      },
      B: function(d) {
        return lc_time.B[d.getMonth()];
      },
      C: function(d) {
        return _xPad(parseInt(d.getFullYear() / 100, 10), 0);
      },
      d: ['getDate', '0'],
      e: ['getDate', ' '],
      g: function(d) {
        return _xPad(parseInt(this.G(d) / 100, 10), 0);
      },
      G: function(d) {
        var y = d.getFullYear();
        var V = parseInt(_formats.V(d), 10);
        var W = parseInt(_formats.W(d), 10);
  
        if (W > V) {
          y++;
        } else if (W === 0 && V >= 52) {
          y--;
        }
  
        return y;
      },
      H: ['getHours', '0'],
      I: function(d) {
        var I = d.getHours() % 12;
        return _xPad(I === 0 ? 12 : I, 0);
      },
      j: function(d) {
        var ms = d - new Date('' + d.getFullYear() + '/1/1 GMT');
        ms += d.getTimezoneOffset() * 60000; // Line differs from Yahoo implementation which would be equivalent to replacing it here with:
        // ms = new Date('' + d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate() + ' GMT') - ms;
        var doy = parseInt(ms / 60000 / 60 / 24, 10) + 1;
        return _xPad(doy, 0, 100);
      },
      k: ['getHours', '0'],
      // not in PHP, but implemented here (as in Yahoo)
      l: function(d) {
        var l = d.getHours() % 12;
        return _xPad(l === 0 ? 12 : l, ' ');
      },
      m: function(d) {
        return _xPad(d.getMonth() + 1, 0);
      },
      M: ['getMinutes', '0'],
      p: function(d) {
        return lc_time.p[d.getHours() >= 12 ? 1 : 0];
      },
      P: function(d) {
        return lc_time.P[d.getHours() >= 12 ? 1 : 0];
      },
      s: function(d) { // Yahoo uses return parseInt(d.getTime()/1000, 10);
        return Date.parse(d) / 1000;
      },
      S: ['getSeconds', '0'],
      u: function(d) {
        var dow = d.getDay();
        return ((dow === 0) ? 7 : dow);
      },
      U: function(d) {
        var doy = parseInt(_formats.j(d), 10);
        var rdow = 6 - d.getDay();
        var woy = parseInt((doy + rdow) / 7, 10);
        return _xPad(woy, 0);
      },
      V: function(d) {
        var woy = parseInt(_formats.W(d), 10);
        var dow1_1 = (new Date('' + d.getFullYear() + '/1/1'))
          .getDay();
        // First week is 01 and not 00 as in the case of %U and %W,
        // so we add 1 to the final result except if day 1 of the year
        // is a Monday (then %W returns 01).
        // We also need to subtract 1 if the day 1 of the year is
        // Friday-Sunday, so the resulting equation becomes:
        var idow = woy + (dow1_1 > 4 || dow1_1 <= 1 ? 0 : 1);
        if (idow === 53 && (new Date('' + d.getFullYear() + '/12/31'))
          .getDay() < 4) {
          idow = 1;
        } else if (idow === 0) {
          idow = _formats.V(new Date('' + (d.getFullYear() - 1) + '/12/31'));
        }
        return _xPad(idow, 0);
      },
      w: 'getDay',
      W: function(d) {
        var doy = parseInt(_formats.j(d), 10);
        var rdow = 7 - _formats.u(d);
        var woy = parseInt((doy + rdow) / 7, 10);
        return _xPad(woy, 0, 10);
      },
      y: function(d) {
        return _xPad(d.getFullYear() % 100, 0);
      },
      Y: 'getFullYear',
      z: function(d) {
        var o = d.getTimezoneOffset();
        var H = _xPad(parseInt(Math.abs(o / 60), 10), 0);
        var M = _xPad(o % 60, 0);
        return (o > 0 ? '-' : '+') + H + M;
      },
      Z: function(d) {
        return d.toString()
          .replace(/^.*\(([^)]+)\)$/, '$1');
        /*
        // Yahoo's: Better?
        var tz = d.toString().replace(/^.*:\d\d( GMT[+-]\d+)? \(?([A-Za-z ]+)\)?\d*$/, '$2').replace(/[a-z ]/g, '');
        if(tz.length > 4) {
          tz = Dt.formats.z(d);
        }
        return tz;
        */
      },
      '%': function(d) {
        return '%';
      }
    };
    // END STATIC
    /* Fix: Locale alternatives are supported though not documented in PHP; see http://linux.die.net/man/3/strptime
  Ec
  EC
  Ex
  EX
  Ey
  EY
  Od or Oe
  OH
  OI
  Om
  OM
  OS
  OU
  Ow
  OW
  Oy
    */
  
    var _date = ((typeof timestamp === 'undefined') ? new Date() : // Not provided
      (typeof timestamp === 'object') ? new Date(timestamp) : // Javascript Date()
      new Date(timestamp * 1000) // PHP API expects UNIX timestamp (auto-convert to int)
    );
  
    var _aggregates = {
      c: 'locale',
      D: '%m/%d/%y',
      F: '%y-%m-%d',
      h: '%b',
      n: '\n',
      r: 'locale',
      R: '%H:%M',
      t: '\t',
      T: '%H:%M:%S',
      x: 'locale',
      X: 'locale'
    };
  
    // First replace aggregates (run in a loop because an agg may be made up of other aggs)
    while (fmt.match(/%[cDFhnrRtTxX]/)) {
      fmt = fmt.replace(/%([cDFhnrRtTxX])/g, function(m0, m1) {
        var f = _aggregates[m1];
        return (f === 'locale' ? lc_time[m1] : f);
      });
    }
  
    // Now replace formats - we need a closure so that the date object gets passed through
    var str = fmt.replace(/%([aAbBCdegGHIjklmMpPsSuUVwWyYzZ%])/g, function(m0, m1) {
      var f = _formats[m1];
      if (typeof f === 'string') {
        return _date[f]();
      } else if (typeof f === 'function') {
        return f(_date);
      } else if (typeof f === 'object' && typeof f[0] === 'string') {
        return _xPad(_date[f[0]](), f[1]);
      } else { // Shouldn't reach here
        return m1;
      }
    });
    return str;
};

exports.strptime = function (dateStr, format) {
  // tm_isdst is in other docs; why not PHP?
  
    // Needs more thorough testing and examples
  
    var retObj = {
      tm_sec: 0,
      tm_min: 0,
      tm_hour: 0,
      tm_mday: 0,
      tm_mon: 0,
      tm_year: 0,
      tm_wday: 0,
      tm_yday: 0,
      unparsed: ''
    },
      i = 0,
      that = this,
      amPmOffset = 0,
      prevHour = false,
      _reset = function(dateObj, realMday) {
        // realMday is to allow for a value of 0 in return results (but without
        // messing up the Date() object)
        var jan1,
          o = retObj,
          d = dateObj;
        o.tm_sec = d.getUTCSeconds();
        o.tm_min = d.getUTCMinutes();
        o.tm_hour = d.getUTCHours();
        o.tm_mday = realMday === 0 ? realMday : d.getUTCDate();
        o.tm_mon = d.getUTCMonth();
        o.tm_year = d.getUTCFullYear() - 1900;
        o.tm_wday = realMday === 0 ? (d.getUTCDay() > 0 ? d.getUTCDay() - 1 : 6) : d.getUTCDay();
        jan1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        o.tm_yday = Math.ceil((d - jan1) / (1000 * 60 * 60 * 24));
      },
      _date = function() {
        var o = retObj;
        // We set date to at least 1 to ensure year or month doesn't go backwards
        return _reset(new Date(Date.UTC(o.tm_year + 1900, o.tm_mon, o.tm_mday || 1, o.tm_hour, o.tm_min, o.tm_sec)),
          o.tm_mday);
      };
  
    // BEGIN STATIC
    var _NWS = /\S/,
      _WS = /\s/;
  
    var _aggregates = {
      c: 'locale',
      D: '%m/%d/%y',
      F: '%y-%m-%d',
      r: 'locale',
      R: '%H:%M',
      T: '%H:%M:%S',
      x: 'locale',
      X: 'locale'
    };
  
    /* Fix: Locale alternatives are supported though not documented in PHP; see http://linux.die.net/man/3/strptime
  Ec
  EC
  Ex
  EX
  Ey
  EY
  Od or Oe
  OH
  OI
  Om
  OM
  OS
  OU
  Ow
  OW
  Oy
    */
    var _preg_quote = function(str) {
      return (str + '')
        .replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!<>\|\:])/g, '\\$1');
    };
    // END STATIC
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
  
    var phpjs = this.php_js;
    var locale = phpjs.localeCategories.LC_TIME;
    var locales = phpjs.locales;
    var lc_time = locales[locale].LC_TIME;
  
    // First replace aggregates (run in a loop because an agg may be made up of other aggs)
    while (format.match(/%[cDFhnrRtTxX]/)) {
      format = format.replace(/%([cDFhnrRtTxX])/g, function(m0, m1) {
        var f = _aggregates[m1];
        return (f === 'locale' ? lc_time[m1] : f);
      });
    }
  
    var _addNext = function(j, regex, cb) {
      if (typeof regex === 'string') {
        regex = new RegExp('^' + regex, 'i');
      }
      var check = dateStr.slice(j);
      var match = regex.exec(check);
      // Even if the callback returns null after assigning to the return object, the object won't be saved anyways
      var testNull = match ? cb.apply(null, match) : null;
      if (testNull === null) {
        throw 'No match in string';
      }
      return j + match[0].length;
    };
  
    var _addLocalized = function(j, formatChar, category) {
      return _addNext(j, that.array_map(
          _preg_quote, lc_time[formatChar])
        .join('|'), // Could make each parenthesized instead and pass index to callback
  
        function(m) {
          var match = lc_time[formatChar].search(new RegExp('^' + _preg_quote(m) + '$', 'i'));
          if (match) {
            retObj[category] = match[0];
          }
        });
    };
  
    // BEGIN PROCESSING CHARACTERS
    for (i = 0, j = 0; i < format.length; i++) {
      if (format.charAt(i) === '%') {
        var literalPos = ['%', 'n', 't'].indexOf(format.charAt(i + 1));
        if (literalPos !== -1) {
          if (['%', '\n', '\t'].indexOf(dateStr.charAt(j)) === literalPos) { // a matched literal
            ++i;
            ++j; // skip beyond
            continue;
          }
          // Format indicated a percent literal, but not actually present
          return false;
        }
        var formatChar = format.charAt(i + 1);
        try {
          switch (formatChar) {
            case 'a':
              // Fall-through // Sun-Sat
            case 'A':
              // Sunday-Saturday
              j = _addLocalized(j, formatChar, 'tm_wday'); // Changes nothing else
              break;
            case 'h':
              // Fall-through (alias of 'b');
            case 'b':
              // Jan-Dec
              j = _addLocalized(j, 'b', 'tm_mon');
              _date(); // Also changes wday, yday
              break;
            case 'B':
              // January-December
              j = _addLocalized(j, formatChar, 'tm_mon');
              _date(); // Also changes wday, yday
              break;
            case 'C':
              // 0+; century (19 for 20th)
              j = _addNext(j, /^\d?\d/, // PHP docs say two-digit, but accepts one-digit (two-digit max)
  
                function(d) {
                  var year = (parseInt(d, 10) - 19) * 100;
                  retObj.tm_year = year;
                  _date();
                  if (!retObj.tm_yday) {
                    retObj.tm_yday = -1;
                  }
                  // Also changes wday; and sets yday to -1 (always?)
                });
              break;
            case 'd':
              // Fall-through  01-31 day
            case 'e':
              // 1-31 day
              j = _addNext(j, formatChar === 'd' ? /^(0[1-9]|[1-2]\d|3[0-1])/ : /^([1-2]\d|3[0-1]|[1-9])/,
                function(d) {
                  var dayMonth = parseInt(d, 10);
                  retObj.tm_mday = dayMonth;
                  _date(); // Also changes w_day, y_day
                });
              break;
            case 'g':
              // No apparent effect; 2-digit year (see 'V')
              break;
            case 'G':
              // No apparent effect; 4-digit year (see 'V')'
              break;
            case 'H':
              // 00-23 hours
              j = _addNext(j, /^([0-1]\d|2[0-3])/, function(d) {
                var hour = parseInt(d, 10);
                retObj.tm_hour = hour;
                // Changes nothing else
              });
              break;
            case 'l':
              // Fall-through of lower-case 'L'; 1-12 hours
            case 'I':
              // 01-12 hours
              j = _addNext(j, formatChar === 'l' ? /^([1-9]|1[0-2])/ : /^(0[1-9]|1[0-2])/, function(d) {
                var hour = parseInt(d, 10) - 1 + amPmOffset;
                retObj.tm_hour = hour;
                prevHour = true; // Used for coordinating with am-pm
                // Changes nothing else, but affected by prior 'p/P'
              });
              break;
            case 'j':
              // 001-366 day of year
              j = _addNext(j, /^(00[1-9]|0[1-9]\d|[1-2]\d\d|3[0-6][0-6])/, function(d) {
                var dayYear = parseInt(d, 10) - 1;
                retObj.tm_yday = dayYear;
                // Changes nothing else (oddly, since if original by a given year, could calculate other fields)
              });
              break;
            case 'm':
              // 01-12 month
              j = _addNext(j, /^(0[1-9]|1[0-2])/, function(d) {
                var month = parseInt(d, 10) - 1;
                retObj.tm_mon = month;
                _date(); // Also sets wday and yday
              });
              break;
            case 'M':
              // 00-59 minutes
              j = _addNext(j, /^[0-5]\d/, function(d) {
                var minute = parseInt(d, 10);
                retObj.tm_min = minute;
                // Changes nothing else
              });
              break;
            case 'P':
              // Seems not to work; AM-PM
              return false; // Could make fall-through instead since supposed to be a synonym despite PHP docs
            case 'p':
              // am-pm
              j = _addNext(j, /^(am|pm)/i, function(d) {
                // No effect on 'H' since already 24 hours but
                //   works before or after setting of l/I hour
                amPmOffset = (/a/)
                  .test(d) ? 0 : 12;
                if (prevHour) {
                  retObj.tm_hour += amPmOffset;
                }
              });
              break;
            case 's':
              // Unix timestamp (in seconds)
              j = _addNext(j, /^\d+/, function(d) {
                var timestamp = parseInt(d, 10);
                var date = new Date(Date.UTC(timestamp * 1000));
                _reset(date);
                // Affects all fields, but can't be negative (and initial + not allowed)
              });
              break;
            case 'S':
              // 00-59 seconds
              j = _addNext(j, /^[0-5]\d/, // strptime also accepts 60-61 for some reason
  
                function(d) {
                  var second = parseInt(d, 10);
                  retObj.tm_sec = second;
                  // Changes nothing else
                });
              break;
            case 'u':
              // Fall-through; 1 (Monday)-7(Sunday)
            case 'w':
              // 0 (Sunday)-6(Saturday)
              j = _addNext(j, /^\d/, function(d) {
                retObj.tm_wday = d - (formatChar === 'u');
                // Changes nothing else apparently
              });
              break;
            case 'U':
              // Fall-through (week of year, from 1st Sunday)
            case 'V':
              // Fall-through (ISO-8601:1988 week number; from first 4-weekday week, starting with Monday)
            case 'W':
              // Apparently ignored (week of year, from 1st Monday)
              break;
            case 'y':
              // 69 (or higher) for 1969+, 68 (or lower) for 2068-
              j = _addNext(j, /^\d?\d/, // PHP docs say two-digit, but accepts one-digit (two-digit max)
  
                function(d) {
                  d = parseInt(d, 10);
                  var year = d >= 69 ? d : d + 100;
                  retObj.tm_year = year;
                  _date();
                  if (!retObj.tm_yday) {
                    retObj.tm_yday = -1;
                  }
                  // Also changes wday; and sets yday to -1 (always?)
                });
              break;
            case 'Y':
              // 2010 (4-digit year)
              j = _addNext(j, /^\d{1,4}/, // PHP docs say four-digit, but accepts one-digit (four-digit max)
  
                function(d) {
                  var year = (parseInt(d, 10)) - 1900;
                  retObj.tm_year = year;
                  _date();
                  if (!retObj.tm_yday) {
                    retObj.tm_yday = -1;
                  }
                  // Also changes wday; and sets yday to -1 (always?)
                });
              break;
            case 'z':
              // Timezone; on my system, strftime gives -0800, but strptime seems not to alter hour setting
              break;
            case 'Z':
              // Timezone; on my system, strftime gives PST, but strptime treats text as unparsed
              break;
            default:
              throw 'Unrecognized formatting character in strptime()';
          }
        } catch (e) {
          if (e === 'No match in string') { // Allow us to exit
            return false; // There was supposed to be a matching format but there wasn't
          }
        }++i; // Calculate skipping beyond initial percent too
      } else if (format.charAt(i) !== dateStr.charAt(j)) {
        // If extra whitespace at beginning or end of either, or between formats, no problem
        // (just a problem when between % and format specifier)
  
        // If the string has white-space, it is ok to ignore
        if (dateStr.charAt(j)
          .search(_WS) !== -1) {
          j++;
          i--; // Let the next iteration try again with the same format character
        } else if (format.charAt(i)
          .search(_NWS) !== -1) { // Any extra formatting characters besides white-space causes
          // problems (do check after WS though, as may just be WS in string before next character)
          return false;
        }
        // Extra WS in format
        // Adjust strings when encounter non-matching whitespace, so they align in future checks above
        // Will check on next iteration (against same (non-WS) string character)
      } else {
        j++;
      }
    }
  
    // POST-PROCESSING
    retObj.unparsed = dateStr.slice(j); // Will also get extra whitespace; empty string if none
    return retObj;
};

exports.sql_regcase = function (str) {
  this.setlocale('LC_ALL', 0);
    var i = 0,
      upper = '',
      lower = '',
      pos = 0,
      retStr = '';
  
    upper = this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.upper;
    lower = this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.lower;
  
    for (i = 0; i < str.length; i++) {
      if (((pos = upper.indexOf(str.charAt(i))) !== -1) || ((pos = lower.indexOf(str.charAt(i))) !== -1)) {
        retStr += '[' + upper.charAt(pos) + lower.charAt(pos) + ']';
      } else {
        retStr += str.charAt(i);
      }
    }
    return retStr;
};

exports.localeconv = function () {
  var arr = {},
      prop = '';
  
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place, if not already
    // END REDUNDANT
    // Make copies
    for (prop in this.php_js.locales[this.php_js.localeCategories.LC_NUMERIC].LC_NUMERIC) {
      arr[prop] = this.php_js.locales[this.php_js.localeCategories.LC_NUMERIC].LC_NUMERIC[prop];
    }
    for (prop in this.php_js.locales[this.php_js.localeCategories.LC_MONETARY].LC_MONETARY) {
      arr[prop] = this.php_js.locales[this.php_js.localeCategories.LC_MONETARY].LC_MONETARY[prop];
    }
  
    return arr;
};

exports.money_format = function (format, number) {
  // Per PHP behavior, there seems to be no extra padding for sign when there is a positive number, though my
    // understanding of the description is that there should be padding; need to revisit examples
  
    // Helpful info at http://ftp.gnu.org/pub/pub/old-gnu/Manuals/glibc-2.2.3/html_chapter/libc_7.html and http://publib.boulder.ibm.com/infocenter/zos/v1r10/index.jsp?topic=/com.ibm.zos.r10.bpxbd00/strfmp.htm
  
    if (typeof number !== 'number') {
      return null;
    }
    var regex = /%((=.|[+^(!-])*?)(\d*?)(#(\d+))?(\.(\d+))?([in%])/g; // 1: flags, 3: width, 5: left, 7: right, 8: conversion
  
    this.setlocale('LC_ALL', 0); // Ensure the locale data we need is set up
    var monetary = this.php_js.locales[this.php_js.localeCategories['LC_MONETARY']]['LC_MONETARY'];
  
    var doReplace = function(n0, flags, n2, width, n4, left, n6, right, conversion) {
      var value = '',
        repl = '';
      if (conversion === '%') { // Percent does not seem to be allowed with intervening content
        return '%';
      }
      var fill = flags && (/=./)
        .test(flags) ? flags.match(/=(.)/)[1] : ' '; // flag: =f (numeric fill)
      var showCurrSymbol = !flags || flags.indexOf('!') === -1; // flag: ! (suppress currency symbol)
      width = parseInt(width, 10) || 0; // field width: w (minimum field width)
  
      var neg = number < 0;
      number = number + ''; // Convert to string
      number = neg ? number.slice(1) : number; // We don't want negative symbol represented here yet
  
      var decpos = number.indexOf('.');
      var integer = decpos !== -1 ? number.slice(0, decpos) : number; // Get integer portion
      var fraction = decpos !== -1 ? number.slice(decpos + 1) : ''; // Get decimal portion
  
      var _str_splice = function(integerStr, idx, thous_sep) {
        var integerArr = integerStr.split('');
        integerArr.splice(idx, 0, thous_sep);
        return integerArr.join('');
      };
  
      var init_lgth = integer.length;
      left = parseInt(left, 10);
      var filler = init_lgth < left;
      if (filler) {
        var fillnum = left - init_lgth;
        integer = new Array(fillnum + 1)
          .join(fill) + integer;
      }
      if (flags.indexOf('^') === -1) { // flag: ^ (disable grouping characters (of locale))
        // use grouping characters
        var thous_sep = monetary.mon_thousands_sep; // ','
        var mon_grouping = monetary.mon_grouping; // [3] (every 3 digits in U.S.A. locale)
  
        if (mon_grouping[0] < integer.length) {
          for (var i = 0, idx = integer.length; i < mon_grouping.length; i++) {
            idx -= mon_grouping[i]; // e.g., 3
            if (idx <= 0) {
              break;
            }
            if (filler && idx < fillnum) {
              thous_sep = fill;
            }
            integer = _str_splice(integer, idx, thous_sep);
          }
        }
        if (mon_grouping[i - 1] > 0) { // Repeating last grouping (may only be one) until highest portion of integer reached
          while (idx > mon_grouping[i - 1]) {
            idx -= mon_grouping[i - 1];
            if (filler && idx < fillnum) {
              thous_sep = fill;
            }
            integer = _str_splice(integer, idx, thous_sep);
          }
        }
      }
  
      // left, right
      if (right === '0') { // No decimal or fractional digits
        value = integer;
      } else {
        var dec_pt = monetary.mon_decimal_point; // '.'
        if (right === '' || right === undefined) {
          right = conversion === 'i' ? monetary.int_frac_digits : monetary.frac_digits;
        }
        right = parseInt(right, 10);
  
        if (right === 0) { // Only remove fractional portion if explicitly set to zero digits
          fraction = '';
          dec_pt = '';
        } else if (right < fraction.length) {
          fraction = Math.round(parseFloat(fraction.slice(0, right) + '.' + fraction.substr(right, 1))) + '';
          if (right > fraction.length) {
            fraction = new Array(right - fraction.length + 1)
              .join('0') + fraction; // prepend with 0's
          }
        } else if (right > fraction.length) {
          fraction += new Array(right - fraction.length + 1)
            .join('0'); // pad with 0's
        }
        value = integer + dec_pt + fraction;
      }
  
      var symbol = '';
      if (showCurrSymbol) {
        symbol = conversion === 'i' ? monetary.int_curr_symbol : monetary.currency_symbol; // 'i' vs. 'n' ('USD' vs. '$')
      }
      var sign_posn = neg ? monetary.n_sign_posn : monetary.p_sign_posn;
  
      // 0: no space between curr. symbol and value
      // 1: space sep. them unless symb. and sign are adjacent then space sep. them from value
      // 2: space sep. sign and value unless symb. and sign are adjacent then space separates
      var sep_by_space = neg ? monetary.n_sep_by_space : monetary.p_sep_by_space;
  
      // p_cs_precedes, n_cs_precedes // positive currency symbol follows value = 0; precedes value = 1
      var cs_precedes = neg ? monetary.n_cs_precedes : monetary.p_cs_precedes;
  
      // Assemble symbol/value/sign and possible space as appropriate
      if (flags.indexOf('(') !== -1) { // flag: parenth. for negative
        // Fix: unclear on whether and how sep_by_space, sign_posn, or cs_precedes have
        // an impact here (as they do below), but assuming for now behaves as sign_posn 0 as
        // far as localized sep_by_space and sign_posn behavior
        repl = (cs_precedes ? symbol + (sep_by_space === 1 ? ' ' : '') : '') + value + (!cs_precedes ? (
          sep_by_space === 1 ? ' ' : '') + symbol : '');
        if (neg) {
          repl = '(' + repl + ')';
        } else {
          repl = ' ' + repl + ' ';
        }
      } else { // '+' is default
        var pos_sign = monetary.positive_sign; // ''
        var neg_sign = monetary.negative_sign; // '-'
        var sign = neg ? (neg_sign) : (pos_sign);
        var otherSign = neg ? (pos_sign) : (neg_sign);
        var signPadding = '';
        if (sign_posn) { // has a sign
          signPadding = new Array(otherSign.length - sign.length + 1)
            .join(' ');
        }
  
        var valueAndCS = '';
        switch (sign_posn) {
          // 0: parentheses surround value and curr. symbol;
          // 1: sign precedes them;
          // 2: sign follows them;
          // 3: sign immed. precedes curr. symbol; (but may be space between)
          // 4: sign immed. succeeds curr. symbol; (but may be space between)
          case 0:
            valueAndCS = cs_precedes ? symbol + (sep_by_space === 1 ? ' ' : '') + value : value + (sep_by_space ===
              1 ? ' ' : '') + symbol;
            repl = '(' + valueAndCS + ')';
            break;
          case 1:
            valueAndCS = cs_precedes ? symbol + (sep_by_space === 1 ? ' ' : '') + value : value + (sep_by_space ===
              1 ? ' ' : '') + symbol;
            repl = signPadding + sign + (sep_by_space === 2 ? ' ' : '') + valueAndCS;
            break;
          case 2:
            valueAndCS = cs_precedes ? symbol + (sep_by_space === 1 ? ' ' : '') + value : value + (sep_by_space ===
              1 ? ' ' : '') + symbol;
            repl = valueAndCS + (sep_by_space === 2 ? ' ' : '') + sign + signPadding;
            break;
          case 3:
            repl = cs_precedes ? signPadding + sign + (sep_by_space === 2 ? ' ' : '') + symbol + (sep_by_space ===
              1 ? ' ' : '') + value : value + (sep_by_space === 1 ? ' ' : '') + sign + signPadding + (
              sep_by_space === 2 ? ' ' : '') + symbol;
            break;
          case 4:
            repl = cs_precedes ? symbol + (sep_by_space === 2 ? ' ' : '') + signPadding + sign + (sep_by_space ===
              1 ? ' ' : '') + value : value + (sep_by_space === 1 ? ' ' : '') + symbol + (sep_by_space === 2 ?
              ' ' : '') + sign + signPadding;
            break;
        }
      }
  
      var padding = width - repl.length;
      if (padding > 0) {
        padding = new Array(padding + 1)
          .join(' ');
        // Fix: How does p_sep_by_space affect the count if there is a space? Included in count presumably?
        if (flags.indexOf('-') !== -1) { // left-justified (pad to right)
          repl += padding;
        } else { // right-justified (pad to left)
          repl = padding + repl;
        }
      }
      return repl;
    };
  
    return format.replace(regex, doReplace);
};

exports.nl_langinfo = function (item) {
  this.setlocale('LC_ALL', 0); // Ensure locale data is available
    var loc = this.php_js.locales[this.php_js.localeCategories.LC_TIME];
    if (item.indexOf('ABDAY_') === 0) {
      return loc.LC_TIME.a[parseInt(item.replace(/^ABDAY_/, ''), 10) - 1];
    } else if (item.indexOf('DAY_') === 0) {
      return loc.LC_TIME.A[parseInt(item.replace(/^DAY_/, ''), 10) - 1];
    } else if (item.indexOf('ABMON_') === 0) {
      return loc.LC_TIME.b[parseInt(item.replace(/^ABMON_/, ''), 10) - 1];
    } else if (item.indexOf('MON_') === 0) {
      return loc.LC_TIME.B[parseInt(item.replace(/^MON_/, ''), 10) - 1];
    } else {
      switch (item) {
        // More LC_TIME
        case 'AM_STR':
          return loc.LC_TIME.p[0];
        case 'PM_STR':
          return loc.LC_TIME.p[1];
        case 'D_T_FMT':
          return loc.LC_TIME.c;
        case 'D_FMT':
          return loc.LC_TIME.x;
        case 'T_FMT':
          return loc.LC_TIME.X;
        case 'T_FMT_AMPM':
          return loc.LC_TIME.r;
        case 'ERA':
          // all fall-throughs
        case 'ERA_YEAR':
        case 'ERA_D_T_FMT':
        case 'ERA_D_FMT':
        case 'ERA_T_FMT':
          return loc.LC_TIME[item];
      }
      loc = this.php_js.locales[this.php_js.localeCategories.LC_MONETARY];
      if (item === 'CRNCYSTR') {
        item = 'CURRENCY_SYMBOL'; // alias
      }
      switch (item) {
        case 'INT_CURR_SYMBOL':
          // all fall-throughs
        case 'CURRENCY_SYMBOL':
        case 'MON_DECIMAL_POINT':
        case 'MON_THOUSANDS_SEP':
        case 'POSITIVE_SIGN':
        case 'NEGATIVE_SIGN':
        case 'INT_FRAC_DIGITS':
        case 'FRAC_DIGITS':
        case 'P_CS_PRECEDES':
        case 'P_SEP_BY_SPACE':
        case 'N_CS_PRECEDES':
        case 'N_SEP_BY_SPACE':
        case 'P_SIGN_POSN':
        case 'N_SIGN_POSN':
          return loc.LC_MONETARY[item.toLowerCase()];
        case 'MON_GROUPING':
          // Same as above, or return something different since this returns an array?
          return loc.LC_MONETARY[item.toLowerCase()];
      }
      loc = this.php_js.locales[this.php_js.localeCategories.LC_NUMERIC];
      switch (item) {
        case 'RADIXCHAR':
          // Fall-through
        case 'DECIMAL_POINT':
          return loc.LC_NUMERIC[item.toLowerCase()];
        case 'THOUSEP':
          // Fall-through
        case 'THOUSANDS_SEP':
          return loc.LC_NUMERIC[item.toLowerCase()];
        case 'GROUPING':
          // Same as above, or return something different since this returns an array?
          return loc.LC_NUMERIC[item.toLowerCase()];
      }
      loc = this.php_js.locales[this.php_js.localeCategories.LC_MESSAGES];
      switch (item) {
        case 'YESEXPR':
          // all fall-throughs
        case 'NOEXPR':
        case 'YESSTR':
        case 'NOSTR':
          return loc.LC_MESSAGES[item];
      }
      loc = this.php_js.locales[this.php_js.localeCategories.LC_CTYPE];
      if (item === 'CODESET') {
        return loc.LC_CTYPE[item];
      }
      return false;
    }
};

exports.strcoll = function (str1, str2) {
  this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    var cmp = this.php_js.locales[this.php_js.localeCategories.LC_COLLATE].LC_COLLATE;
    // return str1.localeCompare(str2); // We don't use this as it doesn't allow us to control it via setlocale()
    return cmp(str1, str2);
};

exports.strval = function (str) {
  var type = '';
  
    if (str === null) {
      return '';
    }
  
    type = this.gettype(str);
  
    // Comment out the entire switch if you want JS-like
    // behavior instead of PHP behavior
    switch (type) {
      case 'boolean':
        if (str === true) {
          return '1';
        }
        return '';
      case 'array':
        return 'Array';
      case 'object':
        return 'Object';
    }
  
    return str;
};

exports.gmstrftime = function (format, timestamp) {
  var dt = ((typeof timestamp === 'undefined') ? new Date() : // Not provided
      (typeof timestamp === 'object') ? new Date(timestamp) : // Javascript Date()
      new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
    );
    timestamp = Date.parse(dt.toUTCString()
      .slice(0, -4)) / 1000;
    return this.strftime(format, timestamp);
};

exports.str_word_count = function (str, format, charlist) {
  var len = str.length,
      cl = charlist && charlist.length,
      chr = '',
      tmpStr = '',
      i = 0,
      c = '',
      wArr = [],
      wC = 0,
      assoc = {},
      aC = 0,
      reg = '',
      match = false;
  
    // BEGIN STATIC
    var _preg_quote = function(str) {
      return (str + '')
        .replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!<>\|\:])/g, '\\$1');
    };
    _getWholeChar = function(str, i) { // Use for rare cases of non-BMP characters
      var code = str.charCodeAt(i);
      if (code < 0xD800 || code > 0xDFFF) {
        return str.charAt(i);
      }
      if (0xD800 <= code && code <= 0xDBFF) { // High surrogate (could change last hex to 0xDB7F to treat high private surrogates as single characters)
        if (str.length <= (i + 1)) {
          throw 'High surrogate without following low surrogate';
        }
        var next = str.charCodeAt(i + 1);
        if (0xDC00 > next || next > 0xDFFF) {
          throw 'High surrogate without following low surrogate';
        }
        return str.charAt(i) + str.charAt(i + 1);
      }
      // Low surrogate (0xDC00 <= code && code <= 0xDFFF)
      if (i === 0) {
        throw 'Low surrogate without preceding high surrogate';
      }
      var prev = str.charCodeAt(i - 1);
      if (0xD800 > prev || prev > 0xDBFF) { // (could change last hex to 0xDB7F to treat high private surrogates as single characters)
        throw 'Low surrogate without preceding high surrogate';
      }
      return false; // We can pass over low surrogates now as the second component in a pair which we have already processed
    };
    // END STATIC
    if (cl) {
      reg = '^(' + _preg_quote(_getWholeChar(charlist, 0));
      for (i = 1; i < cl; i++) {
        if ((chr = _getWholeChar(charlist, i)) === false) {
          continue;
        }
        reg += '|' + _preg_quote(chr);
      }
      reg += ')$';
      reg = new RegExp(reg);
    }
  
    for (i = 0; i < len; i++) {
      if ((c = _getWholeChar(str, i)) === false) {
        continue;
      }
      match = this.ctype_alpha(c) || (reg && c.search(reg) !== -1) || ((i !== 0 && i !== len - 1) && c === '-') || // No hyphen at beginning or end unless allowed in charlist (or locale)
      (i !== 0 && c === "'"); // No apostrophe at beginning unless allowed in charlist (or locale)
      if (match) {
        if (tmpStr === '' && format === 2) {
          aC = i;
        }
        tmpStr = tmpStr + c;
      }
      if (i === len - 1 || !match && tmpStr !== '') {
        if (format !== 2) {
          wArr[wArr.length] = tmpStr;
        } else {
          assoc[aC] = tmpStr;
        }
        tmpStr = '';
        wC++;
      }
    }
  
    if (!format) {
      return wC;
    } else if (format === 1) {
      return wArr;
    } else if (format === 2) {
      return assoc;
    }
  
    throw 'You have supplied an incorrect format';
};

exports.strtr = function (str, from, to) {
  var fr = '',
      i = 0,
      j = 0,
      lenStr = 0,
      lenFrom = 0,
      tmpStrictForIn = false,
      fromTypeStr = '',
      toTypeStr = '',
      istr = '';
    var tmpFrom = [];
    var tmpTo = [];
    var ret = '';
    var match = false;
  
    // Received replace_pairs?
    // Convert to normal from->to chars
    if (typeof from === 'object') {
      tmpStrictForIn = this.ini_set('phpjs.strictForIn', false); // Not thread-safe; temporarily set to true
      from = this.krsort(from);
      this.ini_set('phpjs.strictForIn', tmpStrictForIn);
  
      for (fr in from) {
        if (from.hasOwnProperty(fr)) {
          tmpFrom.push(fr);
          tmpTo.push(from[fr]);
        }
      }
  
      from = tmpFrom;
      to = tmpTo;
    }
  
    // Walk through subject and replace chars when needed
    lenStr = str.length;
    lenFrom = from.length;
    fromTypeStr = typeof from === 'string';
    toTypeStr = typeof to === 'string';
  
    for (i = 0; i < lenStr; i++) {
      match = false;
      if (fromTypeStr) {
        istr = str.charAt(i);
        for (j = 0; j < lenFrom; j++) {
          if (istr == from.charAt(j)) {
            match = true;
            break;
          }
        }
      } else {
        for (j = 0; j < lenFrom; j++) {
          if (str.substr(i, from[j].length) == from[j]) {
            match = true;
            // Fast forward
            i = (i + from[j].length) - 1;
            break;
          }
        }
      }
      if (match) {
        ret += toTypeStr ? to.charAt(j) : to[j];
      } else {
        ret += str.charAt(i);
      }
    }
  
    return ret;
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],28:[function(require,module,exports){
(function (global){
phpjs = require('./build/npm');

phpjs.registerGlobals = function() {
  for (var key in this) {
    global[key] = this[key];
  }
};

module.exports = phpjs;

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./build/npm":27}],29:[function(require,module,exports){
/**
 * Twig.js 0.8.2
 *
 * @copyright 2011-2015 John Roepke and the Twig.js Contributors
 * @license   Available under the BSD 2-Clause License
 * @link      https://github.com/justjohn/twig.js
 */
var Twig=function(Twig){Twig.VERSION="0.8.2";return Twig}(Twig||{});var Twig=function(Twig){"use strict";Twig.trace=false;Twig.debug=false;Twig.cache=true;Twig.placeholders={parent:"{{|PARENT|}}"};Twig.indexOf=function(arr,searchElement){if(Array.prototype.hasOwnProperty("indexOf")){return arr.indexOf(searchElement)}if(arr===void 0||arr===null){throw new TypeError}var t=Object(arr);var len=t.length>>>0;if(len===0){return-1}var n=0;if(arguments.length>0){n=Number(arguments[1]);if(n!==n){n=0}else if(n!==0&&n!==Infinity&&n!==-Infinity){n=(n>0||-1)*Math.floor(Math.abs(n))}}if(n>=len){return-1}var k=n>=0?n:Math.max(len-Math.abs(n),0);for(;k<len;k++){if(k in t&&t[k]===searchElement){return k}}if(arr==searchElement){return 0}return-1};Twig.forEach=function(arr,callback,thisArg){if(Array.prototype.forEach){return arr.forEach(callback,thisArg)}var T,k;if(arr==null){throw new TypeError(" this is null or not defined")}var O=Object(arr);var len=O.length>>>0;if({}.toString.call(callback)!="[object Function]"){throw new TypeError(callback+" is not a function")}if(thisArg){T=thisArg}k=0;while(k<len){var kValue;if(k in O){kValue=O[k];callback.call(T,kValue,k,O)}k++}};Twig.merge=function(target,source,onlyChanged){Twig.forEach(Object.keys(source),function(key){if(onlyChanged&&!(key in target)){return}target[key]=source[key]});return target};Twig.Error=function(message){this.message=message;this.name="TwigException";this.type="TwigException"};Twig.Error.prototype.toString=function(){var output=this.name+": "+this.message;return output};Twig.log={trace:function(){if(Twig.trace&&console){console.log(Array.prototype.slice.call(arguments))}},debug:function(){if(Twig.debug&&console){console.log(Array.prototype.slice.call(arguments))}}};if(typeof console!=="undefined"){if(typeof console.error!=="undefined"){Twig.log.error=function(){console.error.apply(console,arguments)}}else if(typeof console.log!=="undefined"){Twig.log.error=function(){console.log.apply(console,arguments)}}}else{Twig.log.error=function(){}}Twig.ChildContext=function(context){var ChildContext=function ChildContext(){};ChildContext.prototype=context;return new ChildContext};Twig.token={};Twig.token.type={output:"output",logic:"logic",comment:"comment",raw:"raw"};Twig.token.definitions=[{type:Twig.token.type.raw,open:"{% raw %}",close:"{% endraw %}"},{type:Twig.token.type.output,open:"{{",close:"}}"},{type:Twig.token.type.logic,open:"{%",close:"%}"},{type:Twig.token.type.comment,open:"{#",close:"#}"}];Twig.token.strings=['"',"'"];Twig.token.findStart=function(template){var output={position:null,def:null},i,token_template,first_key_position;for(i=0;i<Twig.token.definitions.length;i++){token_template=Twig.token.definitions[i];first_key_position=template.indexOf(token_template.open);Twig.log.trace("Twig.token.findStart: ","Searching for ",token_template.open," found at ",first_key_position);if(first_key_position>=0&&(output.position===null||first_key_position<output.position)){output.position=first_key_position;output.def=token_template}}return output};Twig.token.findEnd=function(template,token_def,start){var end=null,found=false,offset=0,str_pos=null,str_found=null,pos=null,end_offset=null,this_str_pos=null,end_str_pos=null,i,l;while(!found){str_pos=null;str_found=null;pos=template.indexOf(token_def.close,offset);if(pos>=0){end=pos;found=true}else{throw new Twig.Error("Unable to find closing bracket '"+token_def.close+"'"+" opened near template position "+start)}if(token_def.type===Twig.token.type.comment){break}l=Twig.token.strings.length;for(i=0;i<l;i+=1){this_str_pos=template.indexOf(Twig.token.strings[i],offset);if(this_str_pos>0&&this_str_pos<pos&&(str_pos===null||this_str_pos<str_pos)){str_pos=this_str_pos;str_found=Twig.token.strings[i]}}if(str_pos!==null){end_offset=str_pos+1;end=null;found=false;while(true){end_str_pos=template.indexOf(str_found,end_offset);if(end_str_pos<0){throw"Unclosed string in template"}if(template.substr(end_str_pos-1,1)!=="\\"){offset=end_str_pos+1;break}else{end_offset=end_str_pos+1}}}}return end};Twig.tokenize=function(template){var tokens=[],error_offset=0,found_token=null,end=null;while(template.length>0){found_token=Twig.token.findStart(template);Twig.log.trace("Twig.tokenize: ","Found token: ",found_token);if(found_token.position!==null){if(found_token.position>0){tokens.push({type:Twig.token.type.raw,value:template.substring(0,found_token.position)})}template=template.substr(found_token.position+found_token.def.open.length);error_offset+=found_token.position+found_token.def.open.length;end=Twig.token.findEnd(template,found_token.def,error_offset);Twig.log.trace("Twig.tokenize: ","Token ends at ",end);tokens.push({type:found_token.def.type,value:template.substring(0,end).trim()});if(found_token.def.type==="logic"&&template.substr(end+found_token.def.close.length,1)==="\n"){end+=1}template=template.substr(end+found_token.def.close.length);error_offset+=end+found_token.def.close.length}else{tokens.push({type:Twig.token.type.raw,value:template});template=""}}return tokens};Twig.compile=function(tokens){try{var output=[],stack=[],intermediate_output=[],token=null,logic_token=null,unclosed_token=null,prev_token=null,prev_template=null,tok_output=null,type=null,open=null,next=null;while(tokens.length>0){token=tokens.shift();Twig.log.trace("Compiling token ",token);switch(token.type){case Twig.token.type.raw:if(stack.length>0){intermediate_output.push(token)}else{output.push(token)}break;case Twig.token.type.logic:logic_token=Twig.logic.compile.apply(this,[token]);type=logic_token.type;open=Twig.logic.handler[type].open;next=Twig.logic.handler[type].next;Twig.log.trace("Twig.compile: ","Compiled logic token to ",logic_token," next is: ",next," open is : ",open);if(open!==undefined&&!open){prev_token=stack.pop();prev_template=Twig.logic.handler[prev_token.type];if(Twig.indexOf(prev_template.next,type)<0){throw new Error(type+" not expected after a "+prev_token.type)}prev_token.output=prev_token.output||[];prev_token.output=prev_token.output.concat(intermediate_output);intermediate_output=[];tok_output={type:Twig.token.type.logic,token:prev_token};if(stack.length>0){intermediate_output.push(tok_output)}else{output.push(tok_output)}}if(next!==undefined&&next.length>0){Twig.log.trace("Twig.compile: ","Pushing ",logic_token," to logic stack.");if(stack.length>0){prev_token=stack.pop();prev_token.output=prev_token.output||[];prev_token.output=prev_token.output.concat(intermediate_output);stack.push(prev_token);intermediate_output=[]}stack.push(logic_token)}else if(open!==undefined&&open){tok_output={type:Twig.token.type.logic,token:logic_token};if(stack.length>0){intermediate_output.push(tok_output)}else{output.push(tok_output)}}break;case Twig.token.type.comment:break;case Twig.token.type.output:Twig.expression.compile.apply(this,[token]);if(stack.length>0){intermediate_output.push(token)}else{output.push(token)}break}Twig.log.trace("Twig.compile: "," Output: ",output," Logic Stack: ",stack," Pending Output: ",intermediate_output)}if(stack.length>0){unclosed_token=stack.pop();throw new Error("Unable to find an end tag for "+unclosed_token.type+", expecting one of "+unclosed_token.next)}return output}catch(ex){Twig.log.error("Error compiling twig template "+this.id+": ");if(ex.stack){Twig.log.error(ex.stack)}else{Twig.log.error(ex.toString())}if(this.options.rethrow)throw ex}};Twig.parse=function(tokens,context){try{var output=[],chain=true,that=this;Twig.forEach(tokens,function parseToken(token){Twig.log.debug("Twig.parse: ","Parsing token: ",token);switch(token.type){case Twig.token.type.raw:output.push(Twig.filters.raw(token.value));break;case Twig.token.type.logic:var logic_token=token.token,logic=Twig.logic.parse.apply(that,[logic_token,context,chain]);if(logic.chain!==undefined){chain=logic.chain}if(logic.context!==undefined){context=logic.context}if(logic.output!==undefined){output.push(logic.output)}break;case Twig.token.type.comment:break;case Twig.token.type.output:Twig.log.debug("Twig.parse: ","Output token: ",token.stack);output.push(Twig.expression.parse.apply(that,[token.stack,context]));break}});return Twig.output.apply(this,[output])}catch(ex){Twig.log.error("Error parsing twig template "+this.id+": ");if(ex.stack){Twig.log.error(ex.stack)}else{Twig.log.error(ex.toString())}if(this.options.rethrow)throw ex;if(Twig.debug){return ex.toString()}}};Twig.prepare=function(data){var tokens,raw_tokens;Twig.log.debug("Twig.prepare: ","Tokenizing ",data);raw_tokens=Twig.tokenize.apply(this,[data]);Twig.log.debug("Twig.prepare: ","Compiling ",raw_tokens);tokens=Twig.compile.apply(this,[raw_tokens]);Twig.log.debug("Twig.prepare: ","Compiled ",tokens);return tokens};Twig.output=function(output){if(!this.options.autoescape){return output.join("")}var escaped_output=[];Twig.forEach(output,function(str){if(str&&!str.twig_markup){str=Twig.filters.escape(str)}escaped_output.push(str)});return Twig.Markup(escaped_output.join(""))};Twig.Templates={registry:{}};Twig.validateId=function(id){if(id==="prototype"){throw new Twig.Error(id+" is not a valid twig identifier")}else if(Twig.Templates.registry.hasOwnProperty(id)){throw new Twig.Error("There is already a template with the ID "+id)}return true};Twig.Templates.save=function(template){if(template.id===undefined){throw new Twig.Error("Unable to save template with no id")}Twig.Templates.registry[template.id]=template};Twig.Templates.load=function(id){if(!Twig.Templates.registry.hasOwnProperty(id)){return null}return Twig.Templates.registry[id]};Twig.Templates.loadRemote=function(location,params,callback,error_callback){var id=params.id,method=params.method,async=params.async,precompiled=params.precompiled,template=null;if(async===undefined)async=true;if(id===undefined){id=location}params.id=id;if(Twig.cache&&Twig.Templates.registry.hasOwnProperty(id)){if(callback){callback(Twig.Templates.registry[id])}return Twig.Templates.registry[id]}if(method=="ajax"){if(typeof XMLHttpRequest=="undefined"){throw new Twig.Error("Unsupported platform: Unable to do remote requests "+"because there is no XMLHTTPRequest implementation")}var xmlhttp=new XMLHttpRequest;xmlhttp.onreadystatechange=function(){var data=null;if(xmlhttp.readyState==4){if(xmlhttp.status==200){Twig.log.debug("Got template ",xmlhttp.responseText);if(precompiled===true){data=JSON.parse(xmlhttp.responseText)}else{data=xmlhttp.responseText}params.url=location;params.data=data;template=new Twig.Template(params);if(callback){callback(template)}}else{if(error_callback){error_callback(xmlhttp)}}}};xmlhttp.open("GET",location,async);xmlhttp.send()}else{(function(){var fs=require("fs"),path=require("path"),data=null,loadTemplateFn=function(err,data){if(err){if(error_callback){error_callback(err)}return}if(precompiled===true){data=JSON.parse(data)}params.data=data;params.path=location;template=new Twig.Template(params);if(callback){callback(template)}};if(async===true){fs.stat(location,function(err,stats){if(err||!stats.isFile())throw new Twig.Error("Unable to find template file "+location);fs.readFile(location,"utf8",loadTemplateFn)})}else{if(!fs.statSync(location).isFile())throw new Twig.Error("Unable to find template file "+location);data=fs.readFileSync(location,"utf8");loadTemplateFn(undefined,data)}})()}if(async===false){return template}else{return true}};function is(type,obj){var clas=Object.prototype.toString.call(obj).slice(8,-1);return obj!==undefined&&obj!==null&&clas===type}Twig.Template=function(params){var data=params.data,id=params.id,blocks=params.blocks,macros=params.macros||{},base=params.base,path=params.path,url=params.url,options=params.options;this.id=id;this.base=base;this.path=path;this.url=url;this.macros=macros;this.options=options;this.reset(blocks);if(is("String",data)){this.tokens=Twig.prepare.apply(this,[data])}else{this.tokens=data}if(id!==undefined){Twig.Templates.save(this)}};Twig.Template.prototype.reset=function(blocks){Twig.log.debug("Twig.Template.reset","Reseting template "+this.id);this.blocks={};this.importedBlocks=[];this.child={blocks:blocks||{}};this.extend=null};Twig.Template.prototype.render=function(context,params){params=params||{};var output,url;this.context=context||{};this.reset();if(params.blocks){this.blocks=params.blocks}if(params.macros){this.macros=params.macros}output=Twig.parse.apply(this,[this.tokens,this.context]);if(this.extend){var ext_template;if(this.options.allowInlineIncludes){ext_template=Twig.Templates.load(this.extend);if(ext_template){ext_template.options=this.options}}if(!ext_template){url=relativePath(this,this.extend);ext_template=Twig.Templates.loadRemote(url,{method:this.url?"ajax":"fs",base:this.base,async:false,id:url,options:this.options})}this.parent=ext_template;return this.parent.render(this.context,{blocks:this.blocks})}if(params.output=="blocks"){return this.blocks}else if(params.output=="macros"){return this.macros}else{return output}};Twig.Template.prototype.importFile=function(file){var url,sub_template;if(!this.url&&!this.path&&this.options.allowInlineIncludes){sub_template=Twig.Templates.load(file);sub_template.options=this.options;if(sub_template){return sub_template}throw new Twig.Error("Didn't find the inline template by id")}url=relativePath(this,file);sub_template=Twig.Templates.loadRemote(url,{method:this.url?"ajax":"fs",base:this.base,async:false,options:this.options,id:url});return sub_template};Twig.Template.prototype.importBlocks=function(file,override){var sub_template=this.importFile(file),context=this.context,that=this,key;override=override||false;sub_template.render(context);Twig.forEach(Object.keys(sub_template.blocks),function(key){if(override||that.blocks[key]===undefined){that.blocks[key]=sub_template.blocks[key];that.importedBlocks.push(key)}})};Twig.Template.prototype.compile=function(options){return Twig.compiler.compile(this,options)};Twig.Markup=function(content){if(typeof content==="string"&&content.length>0){content=new String(content);content.twig_markup=true}return content};function relativePath(template,file){var base,base_path,sep_chr="/",new_path=[],val;if(template.url){if(typeof template.base!=="undefined"){base=template.base+(template.base.charAt(template.base.length-1)==="/"?"":"/")}else{base=template.url}}else if(template.path){var path=require("path"),sep=path.sep||sep_chr,relative=new RegExp("^\\.{1,2}"+sep.replace("\\","\\\\"));file=file.replace(/\//g,sep);if(template.base!==undefined&&file.match(relative)==null){file=file.replace(template.base,"");base=template.base+sep}else{base=template.path}base=base.replace(sep+sep,sep);sep_chr=sep}else{throw new Twig.Error("Cannot extend an inline template.")}base_path=base.split(sep_chr);base_path.pop();base_path=base_path.concat(file.split(sep_chr));while(base_path.length>0){val=base_path.shift();if(val=="."){}else if(val==".."&&new_path.length>0&&new_path[new_path.length-1]!=".."){new_path.pop()}else{new_path.push(val)}}return new_path.join(sep_chr)}return Twig}(Twig||{});(function(){"use strict";if(!String.prototype.trim){String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")}}if(!Object.keys)Object.keys=function(o){if(o!==Object(o)){throw new TypeError("Object.keys called on non-object")}var ret=[],p;for(p in o)if(Object.prototype.hasOwnProperty.call(o,p))ret.push(p);return ret}})();var Twig=function(Twig){Twig.lib={};var sprintf=function(){function get_type(variable){return Object.prototype.toString.call(variable).slice(8,-1).toLowerCase()}function str_repeat(input,multiplier){for(var output=[];multiplier>0;output[--multiplier]=input){}return output.join("")}var str_format=function(){if(!str_format.cache.hasOwnProperty(arguments[0])){str_format.cache[arguments[0]]=str_format.parse(arguments[0])}return str_format.format.call(null,str_format.cache[arguments[0]],arguments)};str_format.format=function(parse_tree,argv){var cursor=1,tree_length=parse_tree.length,node_type="",arg,output=[],i,k,match,pad,pad_character,pad_length;for(i=0;i<tree_length;i++){node_type=get_type(parse_tree[i]);if(node_type==="string"){output.push(parse_tree[i])}else if(node_type==="array"){match=parse_tree[i];if(match[2]){arg=argv[cursor];for(k=0;k<match[2].length;k++){if(!arg.hasOwnProperty(match[2][k])){throw sprintf('[sprintf] property "%s" does not exist',match[2][k])}arg=arg[match[2][k]]}}else if(match[1]){arg=argv[match[1]]}else{arg=argv[cursor++]}if(/[^s]/.test(match[8])&&get_type(arg)!="number"){throw sprintf("[sprintf] expecting number but found %s",get_type(arg))}switch(match[8]){case"b":arg=arg.toString(2);break;case"c":arg=String.fromCharCode(arg);break;case"d":arg=parseInt(arg,10);break;case"e":arg=match[7]?arg.toExponential(match[7]):arg.toExponential();break;case"f":arg=match[7]?parseFloat(arg).toFixed(match[7]):parseFloat(arg);break;case"o":arg=arg.toString(8);break;case"s":arg=(arg=String(arg))&&match[7]?arg.substring(0,match[7]):arg;break;case"u":arg=Math.abs(arg);break;case"x":arg=arg.toString(16);break;case"X":arg=arg.toString(16).toUpperCase();break}var sign="";if(/[def]/.test(match[8])){if(match[3]){sign=arg>=0?"+":"-"}else{sign=arg>=0?"":"-"}arg=Math.abs(arg)}pad_character=match[4]?match[4]=="0"?"0":match[4].charAt(1):" ";pad_length=match[6]-String(arg).length-sign.length;pad=match[6]?str_repeat(pad_character,pad_length):"";if(match[5]){output.push(sign);output.push(arg);output.push(pad)}else if("0"==pad_character){output.push(sign);output.push(pad);output.push(arg)}else{output.push(pad);output.push(sign);output.push(arg)}}}return output.join("")};str_format.cache={};str_format.parse=function(fmt){var _fmt=fmt,match=[],parse_tree=[],arg_names=0;while(_fmt){if((match=/^[^\x25]+/.exec(_fmt))!==null){parse_tree.push(match[0])}else if((match=/^\x25{2}/.exec(_fmt))!==null){parse_tree.push("%")}else if((match=/^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt))!==null){if(match[2]){arg_names|=1;var field_list=[],replacement_field=match[2],field_match=[];if((field_match=/^([a-z_][a-z_\d]*)/i.exec(replacement_field))!==null){field_list.push(field_match[1]);while((replacement_field=replacement_field.substring(field_match[0].length))!==""){if((field_match=/^\.([a-z_][a-z_\d]*)/i.exec(replacement_field))!==null){field_list.push(field_match[1])}else if((field_match=/^\[(\d+)\]/.exec(replacement_field))!==null){field_list.push(field_match[1])}else{throw"[sprintf] huh?"}}}else{throw"[sprintf] huh?"}match[2]=field_list}else{arg_names|=2}if(arg_names===3){throw"[sprintf] mixing positional and named placeholders is not (yet) supported"}parse_tree.push(match)}else{throw"[sprintf] huh?"}_fmt=_fmt.substring(match[0].length)}return parse_tree};return str_format}();var vsprintf=function(fmt,argv){argv.unshift(fmt);return sprintf.apply(null,argv)};Twig.lib.sprintf=sprintf;Twig.lib.vsprintf=vsprintf;(function(){var shortDays="Sun,Mon,Tue,Wed,Thu,Fri,Sat".split(",");var fullDays="Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(",");var shortMonths="Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(",");var fullMonths="January,February,March,April,May,June,July,August,September,October,November,December".split(",");function getOrdinalFor(intNum){return(intNum=Math.abs(intNum)%100)%10==1&&intNum!=11?"st":intNum%10==2&&intNum!=12?"nd":intNum%10==3&&intNum!=13?"rd":"th"}function getISO8601Year(aDate){var d=new Date(aDate.getFullYear()+1,0,4);if((d-aDate)/864e5<7&&(aDate.getDay()+6)%7<(d.getDay()+6)%7)return d.getFullYear();if(aDate.getMonth()>0||aDate.getDate()>=4)return aDate.getFullYear();return aDate.getFullYear()-((aDate.getDay()+6)%7-aDate.getDate()>2?1:0)}function getISO8601Week(aDate){var d=new Date(getISO8601Year(aDate),0,4);d.setDate(d.getDate()-(d.getDay()+6)%7);return parseInt((aDate-d)/6048e5)+1}Twig.lib.formatDate=function(date,format){if(typeof format!=="string"||/^\s*$/.test(format))return date+"";var jan1st=new Date(date.getFullYear(),0,1);var me=date;return format.replace(/[dDjlNSwzWFmMntLoYyaABgGhHisuU]/g,function(option){switch(option){case"d":return("0"+me.getDate()).replace(/^.+(..)$/,"$1");case"D":return shortDays[me.getDay()];case"j":return me.getDate();case"l":return fullDays[me.getDay()];case"N":return(me.getDay()+6)%7+1;case"S":return getOrdinalFor(me.getDate());case"w":return me.getDay();case"z":return Math.ceil((jan1st-me)/864e5);case"W":return("0"+getISO8601Week(me)).replace(/^.(..)$/,"$1");case"F":return fullMonths[me.getMonth()];case"m":return("0"+(me.getMonth()+1)).replace(/^.+(..)$/,"$1");case"M":return shortMonths[me.getMonth()];case"n":return me.getMonth()+1;case"t":return new Date(me.getFullYear(),me.getMonth()+1,-1).getDate();case"L":return new Date(me.getFullYear(),1,29).getDate()==29?1:0;case"o":return getISO8601Year(me);case"Y":return me.getFullYear();case"y":return(me.getFullYear()+"").replace(/^.+(..)$/,"$1");case"a":return me.getHours()<12?"am":"pm";case"A":return me.getHours()<12?"AM":"PM";case"B":return Math.floor(((me.getUTCHours()+1)%24+me.getUTCMinutes()/60+me.getUTCSeconds()/3600)*1e3/24);case"g":return me.getHours()%12!=0?me.getHours()%12:12;case"G":return me.getHours();case"h":return("0"+(me.getHours()%12!=0?me.getHours()%12:12)).replace(/^.+(..)$/,"$1");case"H":return("0"+me.getHours()).replace(/^.+(..)$/,"$1");case"i":return("0"+me.getMinutes()).replace(/^.+(..)$/,"$1");case"s":return("0"+me.getSeconds()).replace(/^.+(..)$/,"$1");case"u":return me.getMilliseconds();case"U":return me.getTime()/1e3}})}})();Twig.lib.strip_tags=function(input,allowed){allowed=(((allowed||"")+"").toLowerCase().match(/<[a-z][a-z0-9]*>/g)||[]).join("");var tags=/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,commentsAndPhpTags=/<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;return input.replace(commentsAndPhpTags,"").replace(tags,function($0,$1){return allowed.indexOf("<"+$1.toLowerCase()+">")>-1?$0:""})};Twig.lib.parseISO8601Date=function(s){var re=/(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(\.\d+)?(Z|([+-])(\d\d):(\d\d))/;var d=[];d=s.match(re);if(!d){throw"Couldn't parse ISO 8601 date string '"+s+"'"}var a=[1,2,3,4,5,6,10,11];for(var i in a){d[a[i]]=parseInt(d[a[i]],10)}d[7]=parseFloat(d[7]);var ms=Date.UTC(d[1],d[2]-1,d[3],d[4],d[5],d[6]);if(d[7]>0){ms+=Math.round(d[7]*1e3)}if(d[8]!="Z"&&d[10]){var offset=d[10]*60*60*1e3;if(d[11]){offset+=d[11]*60*1e3}if(d[9]=="-"){ms-=offset}else{ms+=offset}}return new Date(ms)};Twig.lib.strtotime=function(text,now){var parsed,match,today,year,date,days,ranges,len,times,regex,i,fail=false;if(!text){return fail}text=text.replace(/^\s+|\s+$/g,"").replace(/\s{2,}/g," ").replace(/[\t\r\n]/g,"").toLowerCase();match=text.match(/^(\d{1,4})([\-\.\/\:])(\d{1,2})([\-\.\/\:])(\d{1,4})(?:\s(\d{1,2}):(\d{2})?:?(\d{2})?)?(?:\s([A-Z]+)?)?$/);if(match&&match[2]===match[4]){if(match[1]>1901){switch(match[2]){case"-":{if(match[3]>12||match[5]>31){return fail}return new Date(match[1],parseInt(match[3],10)-1,match[5],match[6]||0,match[7]||0,match[8]||0,match[9]||0)/1e3}case".":{return fail}case"/":{if(match[3]>12||match[5]>31){return fail}return new Date(match[1],parseInt(match[3],10)-1,match[5],match[6]||0,match[7]||0,match[8]||0,match[9]||0)/1e3}}}else if(match[5]>1901){switch(match[2]){case"-":{if(match[3]>12||match[1]>31){return fail}return new Date(match[5],parseInt(match[3],10)-1,match[1],match[6]||0,match[7]||0,match[8]||0,match[9]||0)/1e3}case".":{if(match[3]>12||match[1]>31){return fail}return new Date(match[5],parseInt(match[3],10)-1,match[1],match[6]||0,match[7]||0,match[8]||0,match[9]||0)/1e3}case"/":{if(match[1]>12||match[3]>31){return fail}return new Date(match[5],parseInt(match[1],10)-1,match[3],match[6]||0,match[7]||0,match[8]||0,match[9]||0)/1e3}}}else{switch(match[2]){case"-":{if(match[3]>12||match[5]>31||match[1]<70&&match[1]>38){return fail}year=match[1]>=0&&match[1]<=38?+match[1]+2e3:match[1];return new Date(year,parseInt(match[3],10)-1,match[5],match[6]||0,match[7]||0,match[8]||0,match[9]||0)/1e3}case".":{if(match[5]>=70){if(match[3]>12||match[1]>31){return fail}return new Date(match[5],parseInt(match[3],10)-1,match[1],match[6]||0,match[7]||0,match[8]||0,match[9]||0)/1e3}if(match[5]<60&&!match[6]){if(match[1]>23||match[3]>59){return fail}today=new Date;return new Date(today.getFullYear(),today.getMonth(),today.getDate(),match[1]||0,match[3]||0,match[5]||0,match[9]||0)/1e3}return fail}case"/":{if(match[1]>12||match[3]>31||match[5]<70&&match[5]>38){return fail}year=match[5]>=0&&match[5]<=38?+match[5]+2e3:match[5];return new Date(year,parseInt(match[1],10)-1,match[3],match[6]||0,match[7]||0,match[8]||0,match[9]||0)/1e3}case":":{if(match[1]>23||match[3]>59||match[5]>59){return fail}today=new Date;return new Date(today.getFullYear(),today.getMonth(),today.getDate(),match[1]||0,match[3]||0,match[5]||0)/1e3}}}}if(text==="now"){return now===null||isNaN(now)?(new Date).getTime()/1e3|0:now|0}if(!isNaN(parsed=Date.parse(text))){return parsed/1e3|0}date=now?new Date(now*1e3):new Date;days={sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6};ranges={yea:"FullYear",mon:"Month",day:"Date",hou:"Hours",min:"Minutes",sec:"Seconds"};function lastNext(type,range,modifier){var diff,day=days[range];if(typeof day!=="undefined"){diff=day-date.getDay();if(diff===0){diff=7*modifier}else if(diff>0&&type==="last"){diff-=7}else if(diff<0&&type==="next"){diff+=7}date.setDate(date.getDate()+diff)}}function process(val){var splt=val.split(" "),type=splt[0],range=splt[1].substring(0,3),typeIsNumber=/\d+/.test(type),ago=splt[2]==="ago",num=(type==="last"?-1:1)*(ago?-1:1);if(typeIsNumber){num*=parseInt(type,10)}if(ranges.hasOwnProperty(range)&&!splt[1].match(/^mon(day|\.)?$/i)){return date["set"+ranges[range]](date["get"+ranges[range]]()+num)}if(range==="wee"){return date.setDate(date.getDate()+num*7)}if(type==="next"||type==="last"){lastNext(type,range,num)}else if(!typeIsNumber){return false}return true}times="(years?|months?|weeks?|days?|hours?|minutes?|min|seconds?|sec"+"|sunday|sun\\.?|monday|mon\\.?|tuesday|tue\\.?|wednesday|wed\\.?"+"|thursday|thu\\.?|friday|fri\\.?|saturday|sat\\.?)";regex="([+-]?\\d+\\s"+times+"|"+"(last|next)\\s"+times+")(\\sago)?";match=text.match(new RegExp(regex,"gi"));if(!match){return fail}for(i=0,len=match.length;i<len;i++){if(!process(match[i])){return fail}}return date.getTime()/1e3};Twig.lib.is=function(type,obj){var clas=Object.prototype.toString.call(obj).slice(8,-1);return obj!==undefined&&obj!==null&&clas===type};Twig.lib.copy=function(src){var target={},key;for(key in src)target[key]=src[key];return target};Twig.lib.replaceAll=function(string,search,replace){return string.split(search).join(replace)};Twig.lib.chunkArray=function(arr,size){var returnVal=[],x=0,len=arr.length;if(size<1||!Twig.lib.is("Array",arr)){return[]}while(x<len){returnVal.push(arr.slice(x,x+=size))}return returnVal};Twig.lib.round=function round(value,precision,mode){var m,f,isHalf,sgn;precision|=0;m=Math.pow(10,precision);value*=m;sgn=value>0|-(value<0);isHalf=value%1===.5*sgn;f=Math.floor(value);if(isHalf){switch(mode){case"PHP_ROUND_HALF_DOWN":value=f+(sgn<0);break;case"PHP_ROUND_HALF_EVEN":value=f+f%2*sgn;break;case"PHP_ROUND_HALF_ODD":value=f+!(f%2);break;default:value=f+(sgn>0)}}return(isHalf?value:Math.round(value))/m};return Twig}(Twig||{});var Twig=function(Twig){"use strict";Twig.logic={};Twig.logic.type={if_:"Twig.logic.type.if",endif:"Twig.logic.type.endif",for_:"Twig.logic.type.for",endfor:"Twig.logic.type.endfor",else_:"Twig.logic.type.else",elseif:"Twig.logic.type.elseif",set:"Twig.logic.type.set",setcapture:"Twig.logic.type.setcapture",endset:"Twig.logic.type.endset",filter:"Twig.logic.type.filter",endfilter:"Twig.logic.type.endfilter",block:"Twig.logic.type.block",endblock:"Twig.logic.type.endblock",extends_:"Twig.logic.type.extends",use:"Twig.logic.type.use",include:"Twig.logic.type.include",spaceless:"Twig.logic.type.spaceless",endspaceless:"Twig.logic.type.endspaceless",macro:"Twig.logic.type.macro",endmacro:"Twig.logic.type.endmacro",import_:"Twig.logic.type.import",from:"Twig.logic.type.from",embed:"Twig.logic.type.embed",endembed:"Twig.logic.type.endembed"};Twig.logic.definitions=[{type:Twig.logic.type.if_,regex:/^if\s+([\s\S]+)$/,next:[Twig.logic.type.else_,Twig.logic.type.elseif,Twig.logic.type.endif],open:true,compile:function(token){var expression=token.match[1];token.stack=Twig.expression.compile.apply(this,[{type:Twig.expression.type.expression,value:expression}]).stack;delete token.match;return token},parse:function(token,context,chain){var output="",result=Twig.expression.parse.apply(this,[token.stack,context]);chain=true;if(result){chain=false;output=Twig.parse.apply(this,[token.output,context])}return{chain:chain,output:output}}},{type:Twig.logic.type.elseif,regex:/^elseif\s+([^\s].*)$/,next:[Twig.logic.type.else_,Twig.logic.type.elseif,Twig.logic.type.endif],open:false,compile:function(token){var expression=token.match[1];token.stack=Twig.expression.compile.apply(this,[{type:Twig.expression.type.expression,value:expression}]).stack;delete token.match;return token},parse:function(token,context,chain){var output="";if(chain&&Twig.expression.parse.apply(this,[token.stack,context])===true){chain=false;output=Twig.parse.apply(this,[token.output,context])}return{chain:chain,output:output}}},{type:Twig.logic.type.else_,regex:/^else$/,next:[Twig.logic.type.endif,Twig.logic.type.endfor],open:false,parse:function(token,context,chain){var output="";if(chain){output=Twig.parse.apply(this,[token.output,context])}return{chain:chain,output:output}}},{type:Twig.logic.type.endif,regex:/^endif$/,next:[],open:false},{type:Twig.logic.type.for_,regex:/^for\s+([a-zA-Z0-9_,\s]+)\s+in\s+([^\s].*?)(?:\s+if\s+([^\s].*))?$/,next:[Twig.logic.type.else_,Twig.logic.type.endfor],open:true,compile:function(token){var key_value=token.match[1],expression=token.match[2],conditional=token.match[3],kv_split=null;token.key_var=null;token.value_var=null;if(key_value.indexOf(",")>=0){kv_split=key_value.split(",");if(kv_split.length===2){token.key_var=kv_split[0].trim();token.value_var=kv_split[1].trim()}else{throw new Twig.Error("Invalid expression in for loop: "+key_value)}}else{token.value_var=key_value}token.expression=Twig.expression.compile.apply(this,[{type:Twig.expression.type.expression,value:expression}]).stack;if(conditional){token.conditional=Twig.expression.compile.apply(this,[{type:Twig.expression.type.expression,value:conditional}]).stack}delete token.match;return token},parse:function(token,context,continue_chain){var result=Twig.expression.parse.apply(this,[token.expression,context]),output=[],len,index=0,keyset,that=this,conditional=token.conditional,buildLoop=function(index,len){var isConditional=conditional!==undefined;return{index:index+1,index0:index,revindex:isConditional?undefined:len-index,revindex0:isConditional?undefined:len-index-1,first:index===0,last:isConditional?undefined:index===len-1,length:isConditional?undefined:len,parent:context}},loop=function(key,value){var inner_context=Twig.ChildContext(context);inner_context[token.value_var]=value;if(token.key_var){inner_context[token.key_var]=key}inner_context.loop=buildLoop(index,len);if(conditional===undefined||Twig.expression.parse.apply(that,[conditional,inner_context])){output.push(Twig.parse.apply(that,[token.output,inner_context]));index+=1}delete inner_context["loop"];delete inner_context[token.value_var];delete inner_context[token.key_var];Twig.merge(context,inner_context,true)};if(result instanceof Array){len=result.length;Twig.forEach(result,function(value){var key=index;loop(key,value)})}else if(result instanceof Object){if(result._keys!==undefined){keyset=result._keys}else{keyset=Object.keys(result)}len=keyset.length;Twig.forEach(keyset,function(key){if(key==="_keys")return;loop(key,result[key])})}continue_chain=output.length===0;return{chain:continue_chain,output:Twig.output.apply(this,[output])}}},{type:Twig.logic.type.endfor,regex:/^endfor$/,next:[],open:false},{type:Twig.logic.type.set,regex:/^set\s+([a-zA-Z0-9_,\s]+)\s*=\s*([\s\S]+)$/,next:[],open:true,compile:function(token){var key=token.match[1].trim(),expression=token.match[2],expression_stack=Twig.expression.compile.apply(this,[{type:Twig.expression.type.expression,value:expression}]).stack;
token.key=key;token.expression=expression_stack;delete token.match;return token},parse:function(token,context,continue_chain){var value=Twig.expression.parse.apply(this,[token.expression,context]),key=token.key;context[key]=value;return{chain:continue_chain,context:context}}},{type:Twig.logic.type.setcapture,regex:/^set\s+([a-zA-Z0-9_,\s]+)$/,next:[Twig.logic.type.endset],open:true,compile:function(token){var key=token.match[1].trim();token.key=key;delete token.match;return token},parse:function(token,context,continue_chain){var value=Twig.parse.apply(this,[token.output,context]),key=token.key;this.context[key]=value;context[key]=value;return{chain:continue_chain,context:context}}},{type:Twig.logic.type.endset,regex:/^endset$/,next:[],open:false},{type:Twig.logic.type.filter,regex:/^filter\s+(.+)$/,next:[Twig.logic.type.endfilter],open:true,compile:function(token){var expression="|"+token.match[1].trim();token.stack=Twig.expression.compile.apply(this,[{type:Twig.expression.type.expression,value:expression}]).stack;delete token.match;return token},parse:function(token,context,chain){var unfiltered=Twig.parse.apply(this,[token.output,context]),stack=[{type:Twig.expression.type.string,value:unfiltered}].concat(token.stack);var output=Twig.expression.parse.apply(this,[stack,context]);return{chain:chain,output:output}}},{type:Twig.logic.type.endfilter,regex:/^endfilter$/,next:[],open:false},{type:Twig.logic.type.block,regex:/^block\s+([a-zA-Z0-9_]+)$/,next:[Twig.logic.type.endblock],open:true,compile:function(token){token.block=token.match[1].trim();delete token.match;return token},parse:function(token,context,chain){var block_output="",output="",isImported=this.importedBlocks.indexOf(token.block)>-1,hasParent=this.blocks[token.block]&&this.blocks[token.block].indexOf(Twig.placeholders.parent)>-1;if(this.blocks[token.block]===undefined||isImported||hasParent||context.loop){block_output=Twig.expression.parse.apply(this,[{type:Twig.expression.type.string,value:Twig.parse.apply(this,[token.output,context])},context]);if(isImported){this.importedBlocks.splice(this.importedBlocks.indexOf(token.block),1)}if(hasParent){this.blocks[token.block]=Twig.Markup(this.blocks[token.block].replace(Twig.placeholders.parent,block_output))}else{this.blocks[token.block]=block_output}}if(this.child.blocks[token.block]){output=this.child.blocks[token.block]}else{output=this.blocks[token.block]}return{chain:chain,output:output}}},{type:Twig.logic.type.endblock,regex:/^endblock(?:\s+([a-zA-Z0-9_]+))?$/,next:[],open:false},{type:Twig.logic.type.extends_,regex:/^extends\s+(.+)$/,next:[],open:true,compile:function(token){var expression=token.match[1].trim();delete token.match;token.stack=Twig.expression.compile.apply(this,[{type:Twig.expression.type.expression,value:expression}]).stack;return token},parse:function(token,context,chain){var file=Twig.expression.parse.apply(this,[token.stack,context]);this.extend=file;return{chain:chain,output:""}}},{type:Twig.logic.type.use,regex:/^use\s+(.+)$/,next:[],open:true,compile:function(token){var expression=token.match[1].trim();delete token.match;token.stack=Twig.expression.compile.apply(this,[{type:Twig.expression.type.expression,value:expression}]).stack;return token},parse:function(token,context,chain){var file=Twig.expression.parse.apply(this,[token.stack,context]);this.importBlocks(file);return{chain:chain,output:""}}},{type:Twig.logic.type.include,regex:/^include\s+(ignore missing\s+)?(.+?)\s*(?:with\s+([\S\s]+?))?\s*(only)?$/,next:[],open:true,compile:function(token){var match=token.match,includeMissing=match[1]!==undefined,expression=match[2].trim(),withContext=match[3],only=match[4]!==undefined&&match[4].length;delete token.match;token.only=only;token.includeMissing=includeMissing;token.stack=Twig.expression.compile.apply(this,[{type:Twig.expression.type.expression,value:expression}]).stack;if(withContext!==undefined){token.withStack=Twig.expression.compile.apply(this,[{type:Twig.expression.type.expression,value:withContext.trim()}]).stack}return token},parse:function(token,context,chain){var innerContext={},withContext,i,template;if(!token.only){innerContext=Twig.ChildContext(context)}if(token.withStack!==undefined){withContext=Twig.expression.parse.apply(this,[token.withStack,context]);for(i in withContext){if(withContext.hasOwnProperty(i))innerContext[i]=withContext[i]}}var file=Twig.expression.parse.apply(this,[token.stack,innerContext]);if(file instanceof Twig.Template){template=file}else{template=this.importFile(file)}return{chain:chain,output:template.render(innerContext)}}},{type:Twig.logic.type.spaceless,regex:/^spaceless$/,next:[Twig.logic.type.endspaceless],open:true,parse:function(token,context,chain){var unfiltered=Twig.parse.apply(this,[token.output,context]),rBetweenTagSpaces=/>\s+</g,output=unfiltered.replace(rBetweenTagSpaces,"><").trim();return{chain:chain,output:output}}},{type:Twig.logic.type.endspaceless,regex:/^endspaceless$/,next:[],open:false},{type:Twig.logic.type.macro,regex:/^macro\s+([a-zA-Z0-9_]+)\s*\(\s*((?:[a-zA-Z0-9_]+(?:,\s*)?)*)\s*\)$/,next:[Twig.logic.type.endmacro],open:true,compile:function(token){var macroName=token.match[1],parameters=token.match[2].split(/[\s,]+/);for(var i=0;i<parameters.length;i++){for(var j=0;j<parameters.length;j++){if(parameters[i]===parameters[j]&&i!==j){throw new Twig.Error("Duplicate arguments for parameter: "+parameters[i])}}}token.macroName=macroName;token.parameters=parameters;delete token.match;return token},parse:function(token,context,chain){var template=this;this.macros[token.macroName]=function(){var macroContext={_self:template.macros};for(var i=0;i<token.parameters.length;i++){var prop=token.parameters[i];if(typeof arguments[i]!=="undefined"){macroContext[prop]=arguments[i]}else{macroContext[prop]=undefined}}return Twig.parse.apply(template,[token.output,macroContext])};return{chain:chain,output:""}}},{type:Twig.logic.type.endmacro,regex:/^endmacro$/,next:[],open:false},{type:Twig.logic.type.import_,regex:/^import\s+(.+)\s+as\s+([a-zA-Z0-9_]+)$/,next:[],open:true,compile:function(token){var expression=token.match[1].trim(),contextName=token.match[2].trim();delete token.match;token.expression=expression;token.contextName=contextName;token.stack=Twig.expression.compile.apply(this,[{type:Twig.expression.type.expression,value:expression}]).stack;return token},parse:function(token,context,chain){if(token.expression!=="_self"){var file=Twig.expression.parse.apply(this,[token.stack,context]);var template=this.importFile(file||token.expression);context[token.contextName]=template.render({},{output:"macros"})}else{context[token.contextName]=this.macros}return{chain:chain,output:""}}},{type:Twig.logic.type.from,regex:/^from\s+(.+)\s+import\s+([a-zA-Z0-9_, ]+)$/,next:[],open:true,compile:function(token){var expression=token.match[1].trim(),macroExpressions=token.match[2].trim().split(/[ ,]+/),macroNames={};for(var i=0;i<macroExpressions.length;i++){var res=macroExpressions[i];var macroMatch=res.match(/^([a-zA-Z0-9_]+)\s+(.+)\s+as\s+([a-zA-Z0-9_]+)$/);if(macroMatch){macroNames[macroMatch[1].trim()]=macroMatch[2].trim()}else if(res.match(/^([a-zA-Z0-9_]+)$/)){macroNames[res]=res}else{}}delete token.match;token.expression=expression;token.macroNames=macroNames;token.stack=Twig.expression.compile.apply(this,[{type:Twig.expression.type.expression,value:expression}]).stack;return token},parse:function(token,context,chain){var macros;if(token.expression!=="_self"){var file=Twig.expression.parse.apply(this,[token.stack,context]);var template=this.importFile(file||token.expression);macros=template.render({},{output:"macros"})}else{macros=this.macros}for(var macroName in token.macroNames){if(macros.hasOwnProperty(macroName)){context[token.macroNames[macroName]]=macros[macroName]}}return{chain:chain,output:""}}},{type:Twig.logic.type.embed,regex:/^embed\s+(ignore missing\s+)?(.+?)\s*(?:with\s+(.+?))?\s*(only)?$/,next:[Twig.logic.type.endembed],open:true,compile:function(token){var match=token.match,includeMissing=match[1]!==undefined,expression=match[2].trim(),withContext=match[3],only=match[4]!==undefined&&match[4].length;delete token.match;token.only=only;token.includeMissing=includeMissing;token.stack=Twig.expression.compile.apply(this,[{type:Twig.expression.type.expression,value:expression}]).stack;if(withContext!==undefined){token.withStack=Twig.expression.compile.apply(this,[{type:Twig.expression.type.expression,value:withContext.trim()}]).stack}return token},parse:function(token,context,chain){var innerContext={},withContext,i,template;if(!token.only){for(i in context){if(context.hasOwnProperty(i))innerContext[i]=context[i]}}if(token.withStack!==undefined){withContext=Twig.expression.parse.apply(this,[token.withStack,context]);for(i in withContext){if(withContext.hasOwnProperty(i))innerContext[i]=withContext[i]}}var file=Twig.expression.parse.apply(this,[token.stack,innerContext]);if(file instanceof Twig.Template){template=file}else{template=this.importFile(file)}this.blocks={};var output=Twig.parse.apply(this,[token.output,innerContext]);return{chain:chain,output:template.render(innerContext,{blocks:this.blocks})}}},{type:Twig.logic.type.endembed,regex:/^endembed$/,next:[],open:false}];Twig.logic.handler={};Twig.logic.extendType=function(type,value){value=value||"Twig.logic.type"+type;Twig.logic.type[type]=value};Twig.logic.extend=function(definition){if(!definition.type){throw new Twig.Error("Unable to extend logic definition. No type provided for "+definition)}if(Twig.logic.type[definition.type]){throw new Twig.Error("Unable to extend logic definitions. Type "+definition.type+" is already defined.")}else{Twig.logic.extendType(definition.type)}Twig.logic.handler[definition.type]=definition};while(Twig.logic.definitions.length>0){Twig.logic.extend(Twig.logic.definitions.shift())}Twig.logic.compile=function(raw_token){var expression=raw_token.value.trim(),token=Twig.logic.tokenize.apply(this,[expression]),token_template=Twig.logic.handler[token.type];if(token_template.compile){token=token_template.compile.apply(this,[token]);Twig.log.trace("Twig.logic.compile: ","Compiled logic token to ",token)}return token};Twig.logic.tokenize=function(expression){var token={},token_template_type=null,token_type=null,token_regex=null,regex_array=null,regex=null,match=null;expression=expression.trim();for(token_template_type in Twig.logic.handler){if(Twig.logic.handler.hasOwnProperty(token_template_type)){token_type=Twig.logic.handler[token_template_type].type;token_regex=Twig.logic.handler[token_template_type].regex;regex_array=[];if(token_regex instanceof Array){regex_array=token_regex}else{regex_array.push(token_regex)}while(regex_array.length>0){regex=regex_array.shift();match=regex.exec(expression.trim());if(match!==null){token.type=token_type;token.match=match;Twig.log.trace("Twig.logic.tokenize: ","Matched a ",token_type," regular expression of ",match);return token}}}}throw new Twig.Error("Unable to parse '"+expression.trim()+"'")};Twig.logic.parse=function(token,context,chain){var output="",token_template;context=context||{};Twig.log.debug("Twig.logic.parse: ","Parsing logic token ",token);token_template=Twig.logic.handler[token.type];if(token_template.parse){output=token_template.parse.apply(this,[token,context,chain])}return output};return Twig}(Twig||{});var Twig=function(Twig){"use strict";Twig.expression={};Twig.expression.reservedWords=["true","false","null","TRUE","FALSE","NULL","_context"];Twig.expression.type={comma:"Twig.expression.type.comma",operator:{unary:"Twig.expression.type.operator.unary",binary:"Twig.expression.type.operator.binary"},string:"Twig.expression.type.string",bool:"Twig.expression.type.bool",array:{start:"Twig.expression.type.array.start",end:"Twig.expression.type.array.end"},object:{start:"Twig.expression.type.object.start",end:"Twig.expression.type.object.end"},parameter:{start:"Twig.expression.type.parameter.start",end:"Twig.expression.type.parameter.end"},key:{period:"Twig.expression.type.key.period",brackets:"Twig.expression.type.key.brackets"},filter:"Twig.expression.type.filter",_function:"Twig.expression.type._function",variable:"Twig.expression.type.variable",number:"Twig.expression.type.number",_null:"Twig.expression.type.null",context:"Twig.expression.type.context",test:"Twig.expression.type.test"};Twig.expression.set={operations:[Twig.expression.type.filter,Twig.expression.type.operator.unary,Twig.expression.type.operator.binary,Twig.expression.type.array.end,Twig.expression.type.object.end,Twig.expression.type.parameter.end,Twig.expression.type.comma,Twig.expression.type.test],expressions:[Twig.expression.type._function,Twig.expression.type.bool,Twig.expression.type.string,Twig.expression.type.variable,Twig.expression.type.number,Twig.expression.type._null,Twig.expression.type.context,Twig.expression.type.parameter.start,Twig.expression.type.array.start,Twig.expression.type.object.start]};Twig.expression.set.operations_extended=Twig.expression.set.operations.concat([Twig.expression.type.key.period,Twig.expression.type.key.brackets]);Twig.expression.fn={compile:{push:function(token,stack,output){output.push(token)},push_both:function(token,stack,output){output.push(token);stack.push(token)}},parse:{push:function(token,stack,context){stack.push(token)},push_value:function(token,stack,context){stack.push(token.value)}}};Twig.expression.definitions=[{type:Twig.expression.type.test,regex:/^is\s+(not)?\s*([a-zA-Z_][a-zA-Z0-9_]*)/,next:Twig.expression.set.operations.concat([Twig.expression.type.parameter.start]),compile:function(token,stack,output){token.filter=token.match[2];token.modifier=token.match[1];delete token.match;delete token.value;output.push(token)},parse:function(token,stack,context){var value=stack.pop(),params=token.params&&Twig.expression.parse.apply(this,[token.params,context]),result=Twig.test(token.filter,value,params);if(token.modifier=="not"){stack.push(!result)}else{stack.push(result)}}},{type:Twig.expression.type.comma,regex:/^,/,next:Twig.expression.set.expressions.concat([Twig.expression.type.array.end,Twig.expression.type.object.end]),compile:function(token,stack,output){var i=stack.length-1,stack_token;delete token.match;delete token.value;for(;i>=0;i--){stack_token=stack.pop();if(stack_token.type===Twig.expression.type.object.start||stack_token.type===Twig.expression.type.parameter.start||stack_token.type===Twig.expression.type.array.start){stack.push(stack_token);break}output.push(stack_token)}output.push(token)}},{type:Twig.expression.type.operator.binary,regex:/(^[\+\-~%\?\:]|^[!=]==?|^[!<>]=?|^\*\*?|^\/\/?|^and\s+|^or\s+|^in\s+|^not in\s+|^\.\.)/,next:Twig.expression.set.expressions.concat([Twig.expression.type.operator.unary]),compile:function(token,stack,output){delete token.match;token.value=token.value.trim();var value=token.value,operator=Twig.expression.operator.lookup(value,token);Twig.log.trace("Twig.expression.compile: ","Operator: ",operator," from ",value);while(stack.length>0&&(stack[stack.length-1].type==Twig.expression.type.operator.unary||stack[stack.length-1].type==Twig.expression.type.operator.binary)&&(operator.associativity===Twig.expression.operator.leftToRight&&operator.precidence>=stack[stack.length-1].precidence||operator.associativity===Twig.expression.operator.rightToLeft&&operator.precidence>stack[stack.length-1].precidence)){var temp=stack.pop();output.push(temp)}if(value===":"){if(stack[stack.length-1]&&stack[stack.length-1].value==="?"){}else{var key_token=output.pop();if(key_token.type===Twig.expression.type.string||key_token.type===Twig.expression.type.variable||key_token.type===Twig.expression.type.number){token.key=key_token.value}else{throw new Twig.Error("Unexpected value before ':' of "+key_token.type+" = "+key_token.value)}output.push(token);return}}else{stack.push(operator)}},parse:function(token,stack,context){if(token.key){stack.push(token)}else{Twig.expression.operator.parse(token.value,stack)}}},{type:Twig.expression.type.operator.unary,regex:/(^not\s+)/,next:Twig.expression.set.expressions,compile:function(token,stack,output){delete token.match;token.value=token.value.trim();var value=token.value,operator=Twig.expression.operator.lookup(value,token);Twig.log.trace("Twig.expression.compile: ","Operator: ",operator," from ",value);while(stack.length>0&&(stack[stack.length-1].type==Twig.expression.type.operator.unary||stack[stack.length-1].type==Twig.expression.type.operator.binary)&&(operator.associativity===Twig.expression.operator.leftToRight&&operator.precidence>=stack[stack.length-1].precidence||operator.associativity===Twig.expression.operator.rightToLeft&&operator.precidence>stack[stack.length-1].precidence)){var temp=stack.pop();output.push(temp)}stack.push(operator)},parse:function(token,stack,context){Twig.expression.operator.parse(token.value,stack)}},{type:Twig.expression.type.string,regex:/^(["'])(?:(?=(\\?))\2[\s\S])*?\1/,next:Twig.expression.set.operations,compile:function(token,stack,output){var value=token.value;delete token.match;if(value.substring(0,1)==='"'){value=value.replace('\\"','"')}else{value=value.replace("\\'","'")}token.value=value.substring(1,value.length-1).replace(/\\n/g,"\n").replace(/\\r/g,"\r");Twig.log.trace("Twig.expression.compile: ","String value: ",token.value);output.push(token)},parse:Twig.expression.fn.parse.push_value},{type:Twig.expression.type.parameter.start,regex:/^\(/,next:Twig.expression.set.expressions.concat([Twig.expression.type.parameter.end]),compile:Twig.expression.fn.compile.push_both,parse:Twig.expression.fn.parse.push},{type:Twig.expression.type.parameter.end,regex:/^\)/,next:Twig.expression.set.operations_extended,compile:function(token,stack,output){var stack_token,end_token=token;stack_token=stack.pop();while(stack.length>0&&stack_token.type!=Twig.expression.type.parameter.start){output.push(stack_token);stack_token=stack.pop()}var param_stack=[];while(token.type!==Twig.expression.type.parameter.start){param_stack.unshift(token);token=output.pop()}param_stack.unshift(token);var is_expression=false;token=output[output.length-1];if(token===undefined||token.type!==Twig.expression.type._function&&token.type!==Twig.expression.type.filter&&token.type!==Twig.expression.type.test&&token.type!==Twig.expression.type.key.brackets&&token.type!==Twig.expression.type.key.period){end_token.expression=true;param_stack.pop();param_stack.shift();end_token.params=param_stack;output.push(end_token)}else{end_token.expression=false;token.params=param_stack}},parse:function(token,stack,context){var new_array=[],array_ended=false,value=null;if(token.expression){value=Twig.expression.parse.apply(this,[token.params,context]);stack.push(value)}else{while(stack.length>0){value=stack.pop();if(value&&value.type&&value.type==Twig.expression.type.parameter.start){array_ended=true;break}new_array.unshift(value)}if(!array_ended){throw new Twig.Error("Expected end of parameter set.")}stack.push(new_array)}}},{type:Twig.expression.type.array.start,regex:/^\[/,next:Twig.expression.set.expressions.concat([Twig.expression.type.array.end]),compile:Twig.expression.fn.compile.push_both,parse:Twig.expression.fn.parse.push},{type:Twig.expression.type.array.end,regex:/^\]/,next:Twig.expression.set.operations_extended,compile:function(token,stack,output){var i=stack.length-1,stack_token;for(;i>=0;i--){stack_token=stack.pop();if(stack_token.type===Twig.expression.type.array.start){break}output.push(stack_token)}output.push(token)},parse:function(token,stack,context){var new_array=[],array_ended=false,value=null;while(stack.length>0){value=stack.pop();if(value.type&&value.type==Twig.expression.type.array.start){array_ended=true;break}new_array.unshift(value)}if(!array_ended){throw new Twig.Error("Expected end of array.")}stack.push(new_array)}},{type:Twig.expression.type.object.start,regex:/^\{/,next:Twig.expression.set.expressions.concat([Twig.expression.type.object.end]),compile:Twig.expression.fn.compile.push_both,parse:Twig.expression.fn.parse.push},{type:Twig.expression.type.object.end,regex:/^\}/,next:Twig.expression.set.operations_extended,compile:function(token,stack,output){var i=stack.length-1,stack_token;for(;i>=0;i--){stack_token=stack.pop();if(stack_token&&stack_token.type===Twig.expression.type.object.start){break}output.push(stack_token)}output.push(token)},parse:function(end_token,stack,context){var new_object={},object_ended=false,token=null,token_key=null,has_value=false,value=null;while(stack.length>0){token=stack.pop();if(token&&token.type&&token.type===Twig.expression.type.object.start){object_ended=true;break}if(token&&token.type&&(token.type===Twig.expression.type.operator.binary||token.type===Twig.expression.type.operator.unary)&&token.key){if(!has_value){throw new Twig.Error("Missing value for key '"+token.key+"' in object definition.")}new_object[token.key]=value;if(new_object._keys===undefined)new_object._keys=[];new_object._keys.unshift(token.key);value=null;has_value=false}else{has_value=true;value=token}}if(!object_ended){throw new Twig.Error("Unexpected end of object.")}stack.push(new_object)}},{type:Twig.expression.type.filter,regex:/^\|\s?([a-zA-Z_][a-zA-Z0-9_\-]*)/,next:Twig.expression.set.operations_extended.concat([Twig.expression.type.parameter.start]),compile:function(token,stack,output){token.value=token.match[1];output.push(token)},parse:function(token,stack,context){var input=stack.pop(),params=token.params&&Twig.expression.parse.apply(this,[token.params,context]);stack.push(Twig.filter.apply(this,[token.value,input,params]))}},{type:Twig.expression.type._function,regex:/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/,next:Twig.expression.type.parameter.start,transform:function(match,tokens){return"("},compile:function(token,stack,output){var fn=token.match[1];token.fn=fn;delete token.match;delete token.value;output.push(token)},parse:function(token,stack,context){var params=token.params&&Twig.expression.parse.apply(this,[token.params,context]),fn=token.fn,value;if(Twig.functions[fn]){value=Twig.functions[fn].apply(this,params)}else if(typeof context[fn]=="function"){value=context[fn].apply(context,params)}else{throw new Twig.Error(fn+" function does not exist and is not defined in the context")}stack.push(value)}},{type:Twig.expression.type.variable,regex:/^[a-zA-Z_][a-zA-Z0-9_]*/,next:Twig.expression.set.operations_extended.concat([Twig.expression.type.parameter.start]),compile:Twig.expression.fn.compile.push,validate:function(match,tokens){return Twig.indexOf(Twig.expression.reservedWords,match[0])<0},parse:function(token,stack,context){var value=Twig.expression.resolve(context[token.value],context);stack.push(value)}},{type:Twig.expression.type.key.period,regex:/^\.([a-zA-Z0-9_]+)/,next:Twig.expression.set.operations_extended.concat([Twig.expression.type.parameter.start]),compile:function(token,stack,output){token.key=token.match[1];delete token.match;delete token.value;output.push(token)},parse:function(token,stack,context){var params=token.params&&Twig.expression.parse.apply(this,[token.params,context]),key=token.key,object=stack.pop(),value;if(object===null||object===undefined){if(this.options.strict_variables){throw new Twig.Error("Can't access a key "+key+" on an null or undefined object.")}else{return null}}var capitalize=function(value){return value.substr(0,1).toUpperCase()+value.substr(1)};if(typeof object==="object"&&key in object){value=object[key]}else if(object["get"+capitalize(key)]!==undefined){value=object["get"+capitalize(key)]}else if(object["is"+capitalize(key)]!==undefined){value=object["is"+capitalize(key)]}else{value=null}stack.push(Twig.expression.resolve(value,object,params))}},{type:Twig.expression.type.key.brackets,regex:/^\[([^\]]*)\]/,next:Twig.expression.set.operations_extended.concat([Twig.expression.type.parameter.start]),compile:function(token,stack,output){var match=token.match[1];delete token.value;delete token.match;token.stack=Twig.expression.compile({value:match}).stack;output.push(token)},parse:function(token,stack,context){var params=token.params&&Twig.expression.parse.apply(this,[token.params,context]),key=Twig.expression.parse.apply(this,[token.stack,context]),object=stack.pop(),value;if(object===null||object===undefined){if(this.options.strict_variables){throw new Twig.Error("Can't access a key "+key+" on an null or undefined object.")}else{return null}}if(typeof object==="object"&&key in object){value=object[key]}else{value=null}stack.push(Twig.expression.resolve(value,object,params))}},{type:Twig.expression.type._null,regex:/^(null|NULL|none|NONE)/,next:Twig.expression.set.operations,compile:function(token,stack,output){delete token.match;token.value=null;output.push(token)},parse:Twig.expression.fn.parse.push_value},{type:Twig.expression.type.context,regex:/^_context/,next:Twig.expression.set.operations_extended.concat([Twig.expression.type.parameter.start]),compile:Twig.expression.fn.compile.push,parse:function(token,stack,context){stack.push(context)}},{type:Twig.expression.type.number,regex:/^\-?\d+(\.\d+)?/,next:Twig.expression.set.operations,compile:function(token,stack,output){token.value=Number(token.value);output.push(token)},parse:Twig.expression.fn.parse.push_value},{type:Twig.expression.type.bool,regex:/^(true|TRUE|false|FALSE)/,next:Twig.expression.set.operations,compile:function(token,stack,output){token.value=token.match[0].toLowerCase()==="true";delete token.match;output.push(token)},parse:Twig.expression.fn.parse.push_value}];Twig.expression.resolve=function(value,context,params){if(typeof value=="function"){return value.apply(context,params||[])}else{return value}};Twig.expression.handler={};Twig.expression.extendType=function(type){Twig.expression.type[type]="Twig.expression.type."+type};Twig.expression.extend=function(definition){if(!definition.type){throw new Twig.Error("Unable to extend logic definition. No type provided for "+definition)}Twig.expression.handler[definition.type]=definition};while(Twig.expression.definitions.length>0){Twig.expression.extend(Twig.expression.definitions.shift())}Twig.expression.tokenize=function(expression){var tokens=[],exp_offset=0,next=null,type,regex,regex_array,token_next,match_found,invalid_matches=[],match_function;match_function=function(){var match=Array.prototype.slice.apply(arguments),string=match.pop(),offset=match.pop();Twig.log.trace("Twig.expression.tokenize","Matched a ",type," regular expression of ",match);if(next&&Twig.indexOf(next,type)<0){invalid_matches.push(type+" cannot follow a "+tokens[tokens.length-1].type+" at template:"+exp_offset+" near '"+match[0].substring(0,20)+"...'");return match[0]}if(Twig.expression.handler[type].validate&&!Twig.expression.handler[type].validate(match,tokens)){return match[0]}invalid_matches=[];tokens.push({type:type,value:match[0],match:match});match_found=true;next=token_next;exp_offset+=match[0].length;if(Twig.expression.handler[type].transform){return Twig.expression.handler[type].transform(match,tokens)}return""};Twig.log.debug("Twig.expression.tokenize","Tokenizing expression ",expression);while(expression.length>0){expression=expression.trim();for(type in Twig.expression.handler){if(Twig.expression.handler.hasOwnProperty(type)){token_next=Twig.expression.handler[type].next;regex=Twig.expression.handler[type].regex;if(regex instanceof Array){regex_array=regex}else{regex_array=[regex]}match_found=false;while(regex_array.length>0){regex=regex_array.pop();expression=expression.replace(regex,match_function)}if(match_found){break}}}if(!match_found){if(invalid_matches.length>0){throw new Twig.Error(invalid_matches.join(" OR "))}else{throw new Twig.Error("Unable to parse '"+expression+"' at template position"+exp_offset)}}}Twig.log.trace("Twig.expression.tokenize","Tokenized to ",tokens);return tokens};Twig.expression.compile=function(raw_token){var expression=raw_token.value,tokens=Twig.expression.tokenize(expression),token=null,output=[],stack=[],token_template=null;Twig.log.trace("Twig.expression.compile: ","Compiling ",expression);while(tokens.length>0){token=tokens.shift();token_template=Twig.expression.handler[token.type];Twig.log.trace("Twig.expression.compile: ","Compiling ",token);token_template.compile&&token_template.compile(token,stack,output);Twig.log.trace("Twig.expression.compile: ","Stack is",stack);Twig.log.trace("Twig.expression.compile: ","Output is",output)}while(stack.length>0){output.push(stack.pop())}Twig.log.trace("Twig.expression.compile: ","Final output is",output);raw_token.stack=output;delete raw_token.value;return raw_token};Twig.expression.parse=function(tokens,context){var that=this;if(!(tokens instanceof Array)){tokens=[tokens]}var stack=[],token_template=null;Twig.forEach(tokens,function(token){token_template=Twig.expression.handler[token.type];token_template.parse&&token_template.parse.apply(that,[token,stack,context])});return stack.pop()};return Twig}(Twig||{});var Twig=function(Twig){"use strict";Twig.expression.operator={leftToRight:"leftToRight",rightToLeft:"rightToLeft"};var containment=function(a,b){if(b.indexOf!==undefined){return a===b||a!==""&&b.indexOf(a)>-1}else{var el;for(el in b){if(b.hasOwnProperty(el)&&b[el]===a){return true}}return false}};Twig.expression.operator.lookup=function(operator,token){switch(operator){case"..":case"not in":case"in":token.precidence=20;token.associativity=Twig.expression.operator.leftToRight;break;case",":token.precidence=18;token.associativity=Twig.expression.operator.leftToRight;break;case"?":case":":token.precidence=16;token.associativity=Twig.expression.operator.rightToLeft;break;case"or":token.precidence=14;token.associativity=Twig.expression.operator.leftToRight;break;case"and":token.precidence=13;token.associativity=Twig.expression.operator.leftToRight;break;case"==":case"!=":token.precidence=9;token.associativity=Twig.expression.operator.leftToRight;break;case"<":case"<=":case">":case">=":token.precidence=8;token.associativity=Twig.expression.operator.leftToRight;break;case"~":case"+":case"-":token.precidence=6;token.associativity=Twig.expression.operator.leftToRight;break;case"//":case"**":case"*":case"/":case"%":token.precidence=5;token.associativity=Twig.expression.operator.leftToRight;break;case"not":token.precidence=3;token.associativity=Twig.expression.operator.rightToLeft;break;default:throw new Twig.Error(operator+" is an unknown operator.")}token.operator=operator;return token};Twig.expression.operator.parse=function(operator,stack){Twig.log.trace("Twig.expression.operator.parse: ","Handling ",operator);var a,b,c;switch(operator){case":":break;case"?":c=stack.pop();b=stack.pop();a=stack.pop();if(a){stack.push(b)}else{stack.push(c)}break;case"+":b=parseFloat(stack.pop());a=parseFloat(stack.pop());stack.push(a+b);break;case"-":b=parseFloat(stack.pop());a=parseFloat(stack.pop());stack.push(a-b);break;case"*":b=parseFloat(stack.pop());a=parseFloat(stack.pop());stack.push(a*b);break;case"/":b=parseFloat(stack.pop());a=parseFloat(stack.pop());stack.push(a/b);break;case"//":b=parseFloat(stack.pop());a=parseFloat(stack.pop());stack.push(parseInt(a/b));break;case"%":b=parseFloat(stack.pop());a=parseFloat(stack.pop());stack.push(a%b);break;case"~":b=stack.pop();a=stack.pop();stack.push((a!=null?a.toString():"")+(b!=null?b.toString():""));break;case"not":case"!":stack.push(!stack.pop());break;case"<":b=stack.pop();a=stack.pop();stack.push(a<b);break;case"<=":b=stack.pop();a=stack.pop();stack.push(a<=b);break;case">":b=stack.pop();a=stack.pop();stack.push(a>b);break;case">=":b=stack.pop();a=stack.pop();stack.push(a>=b);break;case"===":b=stack.pop();a=stack.pop();stack.push(a===b);break;case"==":b=stack.pop();a=stack.pop();stack.push(a==b);break;case"!==":b=stack.pop();a=stack.pop();stack.push(a!==b);break;case"!=":b=stack.pop();a=stack.pop();stack.push(a!=b);break;case"or":b=stack.pop();a=stack.pop();stack.push(a||b);break;case"and":b=stack.pop();a=stack.pop();stack.push(a&&b);break;case"**":b=stack.pop();a=stack.pop();stack.push(Math.pow(a,b));
break;case"not in":b=stack.pop();a=stack.pop();stack.push(!containment(a,b));break;case"in":b=stack.pop();a=stack.pop();stack.push(containment(a,b));break;case"..":b=stack.pop();a=stack.pop();stack.push(Twig.functions.range(a,b));break;default:throw new Twig.Error(operator+" is an unknown operator.")}};return Twig}(Twig||{});var Twig=function(Twig){function is(type,obj){var clas=Object.prototype.toString.call(obj).slice(8,-1);return obj!==undefined&&obj!==null&&clas===type}Twig.filters={upper:function(value){if(typeof value!=="string"){return value}return value.toUpperCase()},lower:function(value){if(typeof value!=="string"){return value}return value.toLowerCase()},capitalize:function(value){if(typeof value!=="string"){return value}return value.substr(0,1).toUpperCase()+value.toLowerCase().substr(1)},title:function(value){if(typeof value!=="string"){return value}return value.toLowerCase().replace(/(^|\s)([a-z])/g,function(m,p1,p2){return p1+p2.toUpperCase()})},length:function(value){if(Twig.lib.is("Array",value)||typeof value==="string"){return value.length}else if(Twig.lib.is("Object",value)){if(value._keys===undefined){return Object.keys(value).length}else{return value._keys.length}}else{return 0}},reverse:function(value){if(is("Array",value)){return value.reverse()}else if(is("String",value)){return value.split("").reverse().join("")}else if(value instanceof Object){var keys=value._keys||Object.keys(value).reverse();value._keys=keys;return value}},sort:function(value){if(is("Array",value)){return value.sort()}else if(value instanceof Object){delete value._keys;var keys=Object.keys(value),sorted_keys=keys.sort(function(a,b){return value[a]>value[b]});value._keys=sorted_keys;return value}},keys:function(value){if(value===undefined||value===null){return}var keyset=value._keys||Object.keys(value),output=[];Twig.forEach(keyset,function(key){if(key==="_keys")return;if(value.hasOwnProperty(key)){output.push(key)}});return output},url_encode:function(value){if(value===undefined||value===null){return}return encodeURIComponent(value)},join:function(value,params){if(value===undefined||value===null){return}var join_str="",output=[],keyset=null;if(params&&params[0]){join_str=params[0]}if(value instanceof Array){output=value}else{keyset=value._keys||Object.keys(value);Twig.forEach(keyset,function(key){if(key==="_keys")return;if(value.hasOwnProperty(key)){output.push(value[key])}})}return output.join(join_str)},"default":function(value,params){if(params===undefined||params.length!==1){throw new Twig.Error("default filter expects one argument")}if(value===undefined||value===null||value===""){return params[0]}else{return value}},json_encode:function(value){if(value&&value.hasOwnProperty("_keys")){delete value._keys}if(value===undefined||value===null){return"null"}return JSON.stringify(value)},merge:function(value,params){var obj=[],arr_index=0,keyset=[];if(!(value instanceof Array)){obj={}}else{Twig.forEach(params,function(param){if(!(param instanceof Array)){obj={}}})}if(!(obj instanceof Array)){obj._keys=[]}if(value instanceof Array){Twig.forEach(value,function(val){if(obj._keys)obj._keys.push(arr_index);obj[arr_index]=val;arr_index++})}else{keyset=value._keys||Object.keys(value);Twig.forEach(keyset,function(key){obj[key]=value[key];obj._keys.push(key);var int_key=parseInt(key,10);if(!isNaN(int_key)&&int_key>=arr_index){arr_index=int_key+1}})}Twig.forEach(params,function(param){if(param instanceof Array){Twig.forEach(param,function(val){if(obj._keys)obj._keys.push(arr_index);obj[arr_index]=val;arr_index++})}else{keyset=param._keys||Object.keys(param);Twig.forEach(keyset,function(key){if(!obj[key])obj._keys.push(key);obj[key]=param[key];var int_key=parseInt(key,10);if(!isNaN(int_key)&&int_key>=arr_index){arr_index=int_key+1}})}});if(params.length===0){throw new Twig.Error("Filter merge expects at least one parameter")}return obj},date:function(value,params){if(value===undefined||value===null){return}var date=Twig.functions.date(value);return Twig.lib.formatDate(date,params[0])},date_modify:function(value,params){if(value===undefined||value===null){return}if(params===undefined||params.length!==1){throw new Twig.Error("date_modify filter expects 1 argument")}var modifyText=params[0],time;if(Twig.lib.is("Date",value)){time=Twig.lib.strtotime(modifyText,value.getTime()/1e3)}if(Twig.lib.is("String",value)){time=Twig.lib.strtotime(modifyText,Twig.lib.strtotime(value))}if(Twig.lib.is("Number",value)){time=Twig.lib.strtotime(modifyText,value)}return new Date(time*1e3)},replace:function(value,params){if(value===undefined||value===null){return}var pairs=params[0],tag;for(tag in pairs){if(pairs.hasOwnProperty(tag)&&tag!=="_keys"){value=Twig.lib.replaceAll(value,tag,pairs[tag])}}return value},format:function(value,params){if(value===undefined||value===null){return}return Twig.lib.vsprintf(value,params)},striptags:function(value){if(value===undefined||value===null){return}return Twig.lib.strip_tags(value)},escape:function(value){if(value===undefined||value===null){return}var raw_value=value.toString().replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");return Twig.Markup(raw_value)},e:function(value){return Twig.filters.escape(value)},nl2br:function(value){if(value===undefined||value===null){return}var linebreak_tag="BACKSLASH_n_replace",br="<br />"+linebreak_tag;value=Twig.filters.escape(value).replace(/\r\n/g,br).replace(/\r/g,br).replace(/\n/g,br);return Twig.lib.replaceAll(value,linebreak_tag,"\n")},number_format:function(value,params){var number=value,decimals=params&&params[0]?params[0]:undefined,dec=params&&params[1]!==undefined?params[1]:".",sep=params&&params[2]!==undefined?params[2]:",";number=(number+"").replace(/[^0-9+\-Ee.]/g,"");var n=!isFinite(+number)?0:+number,prec=!isFinite(+decimals)?0:Math.abs(decimals),s="",toFixedFix=function(n,prec){var k=Math.pow(10,prec);return""+Math.round(n*k)/k};s=(prec?toFixedFix(n,prec):""+Math.round(n)).split(".");if(s[0].length>3){s[0]=s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g,sep)}if((s[1]||"").length<prec){s[1]=s[1]||"";s[1]+=new Array(prec-s[1].length+1).join("0")}return s.join(dec)},trim:function(value,params){if(value===undefined||value===null){return}var str=Twig.filters.escape(""+value),whitespace;if(params&&params[0]){whitespace=""+params[0]}else{whitespace=" \n\r	\f            ​\u2028\u2029　"}for(var i=0;i<str.length;i++){if(whitespace.indexOf(str.charAt(i))===-1){str=str.substring(i);break}}for(i=str.length-1;i>=0;i--){if(whitespace.indexOf(str.charAt(i))===-1){str=str.substring(0,i+1);break}}return whitespace.indexOf(str.charAt(0))===-1?str:""},truncate:function(value,params){var length=30,preserve=false,separator="...";value=value+"";if(params){if(params[0]){length=params[0]}if(params[1]){preserve=params[1]}if(params[2]){separator=params[2]}}if(value.length>length){if(preserve){length=value.indexOf(" ",length);if(length===-1){return value}}value=value.substr(0,length)+separator}return value},slice:function(value,params){if(value===undefined||value===null){return}if(params===undefined||params.length<1){throw new Twig.Error("slice filter expects at least 1 argument")}var start=params[0]||0;var length=params.length>1?params[1]:value.length;var startIndex=start>=0?start:Math.max(value.length+start,0);if(Twig.lib.is("Array",value)){var output=[];for(var i=startIndex;i<startIndex+length&&i<value.length;i++){output.push(value[i])}return output}else if(Twig.lib.is("String",value)){return value.substr(startIndex,length)}else{throw new Twig.Error("slice filter expects value to be an array or string")}},abs:function(value){if(value===undefined||value===null){return}return Math.abs(value)},first:function(value){if(value instanceof Array){return value[0]}else if(value instanceof Object){if("_keys"in value){return value[value._keys[0]]}}else if(typeof value==="string"){return value.substr(0,1)}return},split:function(value,params){if(value===undefined||value===null){return}if(params===undefined||params.length<1||params.length>2){throw new Twig.Error("split filter expects 1 or 2 argument")}if(Twig.lib.is("String",value)){var delimiter=params[0],limit=params[1],split=value.split(delimiter);if(limit===undefined){return split}else if(limit<0){return value.split(delimiter,split.length+limit)}else{var limitedSplit=[];if(delimiter==""){while(split.length>0){var temp="";for(var i=0;i<limit&&split.length>0;i++){temp+=split.shift()}limitedSplit.push(temp)}}else{for(var i=0;i<limit-1&&split.length>0;i++){limitedSplit.push(split.shift())}if(split.length>0){limitedSplit.push(split.join(delimiter))}}return limitedSplit}}else{throw new Twig.Error("split filter expects value to be a string")}},last:function(value){if(Twig.lib.is("Object",value)){var keys;if(value._keys===undefined){keys=Object.keys(value)}else{keys=value._keys}return value[keys[keys.length-1]]}return value[value.length-1]},raw:function(value){return Twig.Markup(value)},batch:function(items,params){var size=params.shift(),fill=params.shift(),result,last,missing;if(!Twig.lib.is("Array",items)){throw new Twig.Error("batch filter expects items to be an array")}if(!Twig.lib.is("Number",size)){throw new Twig.Error("batch filter expects size to be a number")}size=Math.ceil(size);result=Twig.lib.chunkArray(items,size);if(fill&&items.length%size!=0){last=result.pop();missing=size-last.length;while(missing--){last.push(fill)}result.push(last)}return result},round:function(value,params){params=params||[];var precision=params.length>0?params[0]:0,method=params.length>1?params[1]:"common";value=parseFloat(value);if(precision&&!Twig.lib.is("Number",precision)){throw new Twig.Error("round filter expects precision to be a number")}if(method==="common"){return Twig.lib.round(value,precision)}if(!Twig.lib.is("Function",Math[method])){throw new Twig.Error("round filter expects method to be 'floor', 'ceil', or 'common'")}return Math[method](value*Math.pow(10,precision))/Math.pow(10,precision)}};Twig.filter=function(filter,value,params){if(!Twig.filters[filter]){throw"Unable to find filter "+filter}return Twig.filters[filter].apply(this,[value,params])};Twig.filter.extend=function(filter,definition){Twig.filters[filter]=definition};return Twig}(Twig||{});var Twig=function(Twig){function is(type,obj){var clas=Object.prototype.toString.call(obj).slice(8,-1);return obj!==undefined&&obj!==null&&clas===type}Twig.functions={range:function(low,high,step){var matrix=[];var inival,endval,plus;var walker=step||1;var chars=false;if(!isNaN(low)&&!isNaN(high)){inival=parseInt(low,10);endval=parseInt(high,10)}else if(isNaN(low)&&isNaN(high)){chars=true;inival=low.charCodeAt(0);endval=high.charCodeAt(0)}else{inival=isNaN(low)?0:low;endval=isNaN(high)?0:high}plus=inival>endval?false:true;if(plus){while(inival<=endval){matrix.push(chars?String.fromCharCode(inival):inival);inival+=walker}}else{while(inival>=endval){matrix.push(chars?String.fromCharCode(inival):inival);inival-=walker}}return matrix},cycle:function(arr,i){var pos=i%arr.length;return arr[pos]},dump:function(){var EOL="\n",indentChar="  ",indentTimes=0,out="",args=Array.prototype.slice.call(arguments),indent=function(times){var ind="";while(times>0){times--;ind+=indentChar}return ind},displayVar=function(variable){out+=indent(indentTimes);if(typeof variable==="object"){dumpVar(variable)}else if(typeof variable==="function"){out+="function()"+EOL}else if(typeof variable==="string"){out+="string("+variable.length+') "'+variable+'"'+EOL}else if(typeof variable==="number"){out+="number("+variable+")"+EOL}else if(typeof variable==="boolean"){out+="bool("+variable+")"+EOL}},dumpVar=function(variable){var i;if(variable===null){out+="NULL"+EOL}else if(variable===undefined){out+="undefined"+EOL}else if(typeof variable==="object"){out+=indent(indentTimes)+typeof variable;indentTimes++;out+="("+function(obj){var size=0,key;for(key in obj){if(obj.hasOwnProperty(key)){size++}}return size}(variable)+") {"+EOL;for(i in variable){out+=indent(indentTimes)+"["+i+"]=> "+EOL;displayVar(variable[i])}indentTimes--;out+=indent(indentTimes)+"}"+EOL}else{displayVar(variable)}};if(args.length==0)args.push(this.context);Twig.forEach(args,function(variable){dumpVar(variable)});return out},date:function(date,time){var dateObj;if(date===undefined){dateObj=new Date}else if(Twig.lib.is("Date",date)){dateObj=date}else if(Twig.lib.is("String",date)){dateObj=new Date(Twig.lib.strtotime(date)*1e3)}else if(Twig.lib.is("Number",date)){dateObj=new Date(date*1e3)}else{throw new Twig.Error("Unable to parse date "+date)}return dateObj},block:function(block){return this.blocks[block]},parent:function(){return Twig.placeholders.parent},attribute:function(object,method,params){if(object instanceof Object){if(object.hasOwnProperty(method)){if(typeof object[method]==="function"){return object[method].apply(undefined,params)}else{return object[method]}}}return object[method]||undefined},template_from_string:function(template){if(template===undefined){template=""}return new Twig.Template({options:this.options,data:template})},random:function(value){var LIMIT_INT31=2147483648;function getRandomNumber(n){var random=Math.floor(Math.random()*LIMIT_INT31);var limits=[0,n];var min=Math.min.apply(null,limits),max=Math.max.apply(null,limits);return min+Math.floor((max-min+1)*random/LIMIT_INT31)}if(Twig.lib.is("Number",value)){return getRandomNumber(value)}if(Twig.lib.is("String",value)){return value.charAt(getRandomNumber(value.length-1))}if(Twig.lib.is("Array",value)){return value[getRandomNumber(value.length-1)]}if(Twig.lib.is("Object",value)){var keys=Object.keys(value);return value[keys[getRandomNumber(keys.length-1)]]}return getRandomNumber(LIMIT_INT31-1)}};Twig._function=function(_function,value,params){if(!Twig.functions[_function]){throw"Unable to find function "+_function}return Twig.functions[_function](value,params)};Twig._function.extend=function(_function,definition){Twig.functions[_function]=definition};return Twig}(Twig||{});var Twig=function(Twig){"use strict";Twig.tests={empty:function(value){if(value===null||value===undefined)return true;if(typeof value==="number")return false;if(value.length&&value.length>0)return false;for(var key in value){if(value.hasOwnProperty(key))return false}return true},odd:function(value){return value%2===1},even:function(value){return value%2===0},divisibleby:function(value,params){return value%params[0]===0},defined:function(value){return value!==undefined},none:function(value){return value===null},"null":function(value){return this.none(value)},sameas:function(value,params){return value===params[0]},iterable:function(value){return value&&(Twig.lib.is("Array",value)||Twig.lib.is("Object",value))}};Twig.test=function(test,value,params){if(!Twig.tests[test]){throw"Test "+test+" is not defined."}return Twig.tests[test](value,params)};Twig.test.extend=function(test,definition){Twig.tests[test]=definition};return Twig}(Twig||{});var Twig=function(Twig){"use strict";Twig.exports={VERSION:Twig.VERSION};Twig.exports.twig=function twig(params){"use strict";var id=params.id,options={strict_variables:params.strict_variables||false,autoescape:params.autoescape!=null&&params.autoescape||false,allowInlineIncludes:params.allowInlineIncludes||false,rethrow:params.rethrow||false};if(id){Twig.validateId(id)}if(params.debug!==undefined){Twig.debug=params.debug}if(params.trace!==undefined){Twig.trace=params.trace}if(params.data!==undefined){return new Twig.Template({data:params.data,module:params.module,id:id,options:options})}else if(params.ref!==undefined){if(params.id!==undefined){throw new Twig.Error("Both ref and id cannot be set on a twig.js template.")}return Twig.Templates.load(params.ref)}else if(params.href!==undefined){return Twig.Templates.loadRemote(params.href,{id:id,method:"ajax",base:params.base,module:params.module,precompiled:params.precompiled,async:params.async,options:options},params.load,params.error)}else if(params.path!==undefined){return Twig.Templates.loadRemote(params.path,{id:id,method:"fs",base:params.base,module:params.module,precompiled:params.precompiled,async:params.async,options:options},params.load,params.error)}};Twig.exports.extendFilter=function(filter,definition){Twig.filter.extend(filter,definition)};Twig.exports.extendFunction=function(fn,definition){Twig._function.extend(fn,definition)};Twig.exports.extendTest=function(test,definition){Twig.test.extend(test,definition)};Twig.exports.extendTag=function(definition){Twig.logic.extend(definition)};Twig.exports.extend=function(fn){fn(Twig)};Twig.exports.compile=function(markup,options){var id=options.filename,path=options.filename,template;template=new Twig.Template({data:markup,path:path,id:id,options:options.settings["twig options"]});return function(context){return template.render(context)}};Twig.exports.renderFile=function(path,options,fn){if("function"==typeof options){fn=options;options={}}options=options||{};var params={path:path,base:options.settings["views"],load:function(template){fn(null,template.render(options))}};var view_options=options.settings["twig options"];if(view_options){for(var option in view_options)if(view_options.hasOwnProperty(option)){params[option]=view_options[option]}}Twig.exports.twig(params)};Twig.exports.__express=Twig.exports.renderFile;Twig.exports.cache=function(cache){Twig.cache=cache};return Twig}(Twig||{});var Twig=function(Twig){Twig.compiler={module:{}};Twig.compiler.compile=function(template,options){var tokens=JSON.stringify(template.tokens),id=template.id,output;if(options.module){if(Twig.compiler.module[options.module]===undefined){throw new Twig.Error("Unable to find module type "+options.module)}output=Twig.compiler.module[options.module](id,tokens,options.twig)}else{output=Twig.compiler.wrap(id,tokens)}return output};Twig.compiler.module={amd:function(id,tokens,pathToTwig){return'define(["'+pathToTwig+'"], function (Twig) {\n	var twig, templates;\ntwig = Twig.twig;\ntemplates = '+Twig.compiler.wrap(id,tokens)+"\n	return templates;\n});"},node:function(id,tokens){return'var twig = require("twig").twig;\n'+"exports.template = "+Twig.compiler.wrap(id,tokens)},cjs2:function(id,tokens,pathToTwig){return'module.declare([{ twig: "'+pathToTwig+'" }], function (require, exports, module) {\n'+'	var twig = require("twig").twig;\n'+"	exports.template = "+Twig.compiler.wrap(id,tokens)+"\n});"}};Twig.compiler.wrap=function(id,tokens){return'twig({id:"'+id.replace('"','\\"')+'", data:'+tokens+", precompiled: true});\n"};return Twig}(Twig||{});if(typeof module!=="undefined"&&module.declare){module.declare([],function(require,exports,module){for(key in Twig.exports){if(Twig.exports.hasOwnProperty(key)){exports[key]=Twig.exports[key]}}})}else if(typeof define=="function"&&define.amd){define(function(){return Twig.exports})}else if(typeof module!=="undefined"&&module.exports){module.exports=Twig.exports}else{window.twig=Twig.exports.twig;window.Twig=Twig.exports}
//# sourceMappingURL=twig.min.js.map
},{"fs":21,"path":22}],30:[function(require,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}]},{},[1])