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

		// if( $this.instancePath.match(new RegExp('^\\/bowl\\.[^\\/]+$')) ){
		// 		// bowl自体は選択も操作もできないので、パネルを描画しない。
		// 	return;
		// }

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
			.bind('click', function(e){
				e.stopPropagation();
				var $this = $(this);
				var instancePath = $this.attr('data-broccoli-instance-path');
				// if( $this.attr('data-broccoli-is-appender') == 'yes' ){
				// 	instancePath = php.dirname(instancePath);
				// }
				broccoli.selectInstance( instancePath, function(){
					broccoli.instanceTreeView.focusInstance( instancePath, function(){} );
				} );
			})
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
	 * パネルの ondrop イベントハンドラ
	 * このメソッドは、 this.setPanelEventHandlers() の他、
	 * editWindow からもコールされています。
	 */
	this.onDrop = function(e, elm, callback){
		callback = callback || function(){};
		e.stopPropagation();
		var event = e.originalEvent;
		$(elm).removeClass('broccoli--panel__drag-entered');
		var method = event.dataTransfer.getData("method");
		// options.drop($(elm).attr('data-broccoli-instance-path'), method);
		// console.log(method);
		var subModNameFrom = event.dataTransfer.getData("data-broccoli-sub-mod-name");
		var subModName = $(elm).attr('data-broccoli-sub-mod-name');
		var isAppenderFrom = (event.dataTransfer.getData("data-broccoli-is-appender") == 'yes');
		var isAppender = ($(elm).attr('data-broccoli-is-appender') == 'yes');
		var moveFrom = event.dataTransfer.getData("data-broccoli-instance-path");
		var moveTo = $(elm).attr('data-broccoli-instance-path');
		var isInstanceTreeView = $(elm).attr('data-broccoli-is-instance-tree-view') == 'yes';
		var isEditWindow = $(elm).attr('data-broccoli-is-edit-window') == 'yes';

		if( moveFrom === moveTo ){
			// 移動元と移動先が同一の場合、キャンセルとみなす
			$(elm).removeClass('broccoli--panel__drag-entered');
			callback();
			return;
		}
		if( subModNameFrom.length ){ // ドロップ元のインスタンスがサブモジュールだったら

			if( method === 'moveTo' ){
				// これはloop要素(=subModNameがある場合)を並べ替えるための moveTo です。
				// その他のインスタンスをここに移動したり、作成することはできません。

				function removeNum(str){
					return str.replace(new RegExp('[0-9]+$'),'');
				}
				if( removeNum(moveFrom) !== removeNum(moveTo) ){
					broccoli.message('並べ替え以外の移動操作はできません。');
					$(elm).removeClass('broccoli--panel__drag-entered');
					callback();
					return;
				}

				broccoli.contentsSourceData.moveInstanceTo( moveFrom, moveTo, function(){
					// コンテンツを保存
					broccoli.contentsSourceData.save(function(){
						// alert('インスタンスを移動しました。');
						broccoli.redraw();
						callback();
					});
				} );
				return;
			}
			broccoli.message('ダブルクリックしてください。ドロップできません。');
			callback();
			return;
		}else{
			if( method === 'moveTo' ){
				if(subModName){
					broccoli.message('loopフィールドへの移動はできません。');
					$(elm).removeClass('broccoli--panel__drag-entered');
					callback();
					return;
				}
				broccoli.contentsSourceData.moveInstanceTo( moveFrom, moveTo, function(){
					// コンテンツを保存
					broccoli.contentsSourceData.save(function(){
						// alert('インスタンスを移動しました。');
						broccoli.redraw();
						callback();
					});
				} );
				return;
			}
			if( subModName && method === 'add' ){
				// loopフィールドのサブモジュールに新しいモジュールを追加しようとした場合の処理
				broccoli.message('loopフィールドに新しいモジュールを追加することはできません。');
				callback();
				return;
			}
			if( method !== 'add' ){
				// 移動(moveTo)でも追加(add)でもない場合の処理
				broccoli.message('追加するモジュールをドラッグしてください。ここに移動することはできません。');
				callback();
				return;
			}
			var modId = event.dataTransfer.getData("modId");
			var modClip = event.dataTransfer.getData("modClip");
			try {
				modClip = JSON.parse(modClip);
			} catch (e) {
				modClip = false;
			}
			// console.log(modId);
			// console.log(modClip);
			if( modClip !== false ){
				console.log('クリップがドロップされました。');
				// console.log(modId);
				// console.log(modClip);
				var parsedModId = broccoli.parseModuleId(modId);
				// console.log(parsedModId.package);

				it79.ary(
					modClip.data ,
					function(it1, row1, idx1){
						broccoli.contentsSourceData.duplicateInstance(modClip.data[idx1], modClip.resources, {'supplementModPackage': parsedModId.package}, function(newData){
							// console.log(newData);

							broccoli.contentsSourceData.addInstance( newData, moveTo, function(){
								// 上から順番に挿入していくので、
								// moveTo を1つインクリメントしなければいけない。
								// (そうしないと、天地逆さまに積み上げられることになる。)
								moveTo = broccoli.incrementInstancePath(moveTo);
								it1.next();
							} );

						});
					} ,
					function(){
						broccoli.contentsSourceData.save(function(){
							broccoli.message('クリップを挿入しました。');
							broccoli.redraw();
							callback();
						});
					}
				);

			}else{
				broccoli.contentsSourceData.addInstance( modId, $(elm).attr('data-broccoli-instance-path'), function(){
					// コンテンツを保存
					broccoli.contentsSourceData.save(function(){
						// alert('インスタンスを追加しました。');
						broccoli.redraw();
						callback();
					});
				} );

			}
			return;
		}
		return;
	}

	/**
	 * パネルにイベントハンドラをセットする
	 */
	this.setPanelEventHandlers = function($panel){
		$panel
			.bind('dblclick', function(e){
				e.stopPropagation();
				var $this = $(this);
				var instancePath = $this.attr('data-broccoli-instance-path');

				if( $this.attr('data-broccoli-sub-mod-name') && $this.attr('data-broccoli-is-appender') == 'yes' ){
					// loopモジュールの繰り返し要素を増やします。
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
					broccoli.message('編集できません。ここには、モジュールをドロップして追加または移動することができます。');
					// instancePath = php.dirname(instancePath);
					return;
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
				var instancePath = $(this).attr('data-broccoli-instance-path');
				if( instancePath.match(new RegExp('^\\/bowl\\.[^\\/]+$')) ){
					// bowl に追加することはできません。アペンダーに追加してください。
					return;
				}

				$(this).addClass('broccoli--panel__drag-entered');
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
				var event = e.originalEvent;
				event.dataTransfer.setData("method", 'moveTo' );
				event.dataTransfer.setData("data-broccoli-instance-path", $(this).attr('data-broccoli-instance-path') );
				var subModName = $(this).attr('data-broccoli-sub-mod-name');
				if( typeof(subModName) === typeof('') && subModName.length ){
					event.dataTransfer.setData("data-broccoli-sub-mod-name", subModName );
				}
				event.dataTransfer.setData("data-broccoli-is-appender", $(this).attr('data-broccoli-is-appender') );
			})
			.bind('drop', function(e){
				_this.onDrop(e, this, function(){
					console.log('drop event done.');
				});
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
