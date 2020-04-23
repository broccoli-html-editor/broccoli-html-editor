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
		if( !domElm.visible ){
			return;
		}
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
		return;
	}

	/**
	 * パネルの ondrop イベントハンドラ
	 * このメソッドは、 this.setPanelEventHandlers() の他、
	 * editWindow からもコールされています。
	 */
	this.onDrop = function(e, elm, callback){
		callback = callback || function(){};
		e.stopPropagation();
		e.preventDefault();
		var event = e.originalEvent;
		$(elm).removeClass('broccoli--panel__drag-entered');
		$(elm).removeClass('broccoli--panel__drag-entered-u');
		$(elm).removeClass('broccoli--panel__drag-entered-d');

		var ud = getUd(e, elm);
		console.info(ud);

		var transferData = event.dataTransfer.getData("text/json");
		try {
			transferData = JSON.parse(transferData);
		} catch (e) {}
		var method = transferData.method;
		// options.drop($(elm).attr('data-broccoli-instance-path'), method);
		// console.log(method);
		var subModNameFrom = transferData["data-broccoli-sub-mod-name"] || '';
		var subModName = $(elm).attr('data-broccoli-sub-mod-name');
		var isAppenderFrom = (transferData["data-broccoli-is-appender"] == 'yes');
		var isAppender = ($(elm).attr('data-broccoli-is-appender') == 'yes');
		var moveFrom = transferData["data-broccoli-instance-path"] || '';
		var moveTo = $(elm).attr('data-broccoli-instance-path');
		var isInstanceTreeView = $(elm).attr('data-broccoli-is-instance-tree-view') == 'yes';
		var isEditWindow = $(elm).attr('data-broccoli-is-edit-window') == 'yes';

		if( !isAppender && ud.y == 'd' ){
			moveTo = (function(moveTo){
				console.log(moveTo);
				if(!moveTo.match(/^([\S]+)\@([0-9]+)$/)){
					console.error('FATAL: Instance path has an illegal format.');
					return moveTo;
				}

				var moveToPath = RegExp.$1;
				var moveToIdx = RegExp.$2;

				return moveToPath + '@' + (Number(moveToIdx)+1);
			})(moveTo);
		}

		if( moveFrom === moveTo ){
			// 移動元と移動先が同一の場合、キャンセルとみなす
			$(elm).removeClass('broccoli--panel__drag-entered');
			$(elm).removeClass('broccoli--panel__drag-entered-u');
			$(elm).removeClass('broccoli--panel__drag-entered-d');
			callback();
			return;
		}

		var newInstancePath = (function(moveFrom, moveTo){
			// 移動・挿入後の選択状態を更新する際、
			// 移動元が抜けることで移動先の番号が変わる場合に、選択状態が乱れる。
			// この関数では、移動先のパスを計算し直し、移動したインスタンス自身の新しいパスを返す。
			// これを `broccoli.selectInstance()` すれば、移動・挿入成功後の選択状態を自然な結果にできる。
			if(!moveFrom){
				// 新規の場合
				return moveTo;
			}
			if(!moveFrom.match(/^([\S]+)\@([0-9]+)$/)){
				console.error('FATAL: Instance path has an illegal format.');
				return moveTo;
			}

			var moveFromPath = RegExp.$1;
			var moveFromIdx = RegExp.$2;

			var idx = moveTo.indexOf(moveFromPath+'@');
			if( idx !== 0 ){
				return moveTo;
			}
			var tmpMoveToStr = moveTo.substring((moveFromPath+'@').length);
			if(!tmpMoveToStr.match(/^([0-9]+)([\S]*)$/)){
				return moveTo;
			}
			var moveToIdx = RegExp.$1;
			var moveToPath = RegExp.$2;
			if( moveToIdx > moveFromIdx ){
				return moveFromPath + '@' + (moveToIdx-1) + moveToPath;
			}

			return moveTo;
		})(moveFrom, moveTo);

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
					$(elm).removeClass('broccoli--panel__drag-entered-u');
					$(elm).removeClass('broccoli--panel__drag-entered-d');
					callback();
					return;
				}

				broccoli.progress(function(){
					broccoli.contentsSourceData.moveInstanceTo( moveFrom, moveTo, function(result){
						if(!result){
							broccoli.closeProgress(function(){
								callback();
							});
							return;
						}
						// コンテンツを保存
						broccoli.unselectInstance(function(){
							broccoli.saveContents(function(){
								// alert('インスタンスを移動しました。');
								broccoli.redraw(function(){
									broccoli.closeProgress(function(){
										broccoli.selectInstance(newInstancePath, function(){
											callback();
										});
									});
								});
							});
						});
					} );
				});
				return;
			}
			broccoli.message('ダブルクリックしてください。ドロップできません。');
			callback();
			return;
		}
		if( method === 'moveTo' ){
			if(subModName){
				broccoli.message('loopフィールドへの移動はできません。');
				$(elm).removeClass('broccoli--panel__drag-entered');
				$(elm).removeClass('broccoli--panel__drag-entered-u');
				$(elm).removeClass('broccoli--panel__drag-entered-d');
				callback();
				return;
			}
			broccoli.progress(function(){
				broccoli.contentsSourceData.moveInstanceTo( moveFrom, moveTo, function(result){
					if(!result){
						broccoli.closeProgress(function(){
							callback();
						});
						return;
					}
					// コンテンツを保存
					broccoli.unselectInstance(function(){
						broccoli.saveContents(function(){
							// alert('インスタンスを移動しました。');
							broccoli.redraw(function(){
								broccoli.closeProgress(function(){
									broccoli.selectInstance(newInstancePath, function(){
										callback();
									});
								});
							});
						});
					});
				} );
			});
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

		broccoli.progress(function(){

			var transferData = event.dataTransfer.getData("text/json");
			try {
				transferData = JSON.parse(transferData);
			} catch (e) {}
			var modId = transferData["modId"];
			var modClip = transferData["modClip"];
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

				broccoli.gpi(
					'getClipModuleContents',
					{
						'moduleId': modId
					} ,
					function(clipContents){
						console.log('------ clipModuleContents --', clipContents);

						it79.ary(
							clipContents.data ,
							function(it1, row1, idx1){
								broccoli.contentsSourceData.duplicateInstance(clipContents.data[idx1], clipContents.resources, {'supplementModPackage': parsedModId.package}, function(newData){
									// console.log(newData);

									broccoli.contentsSourceData.addInstance( newData, moveTo, function(result){
										// 上から順番に挿入していくので、
										// moveTo を1つインクリメントしなければいけない。
										// (そうしないと、天地逆さまに積み上げられることになる。)
										moveTo = broccoli.incrementInstancePath(moveTo);
										it1.next();
									} );

								});
							} ,
							function(){
								broccoli.unselectInstance(function(){
									broccoli.saveContents(function(){
										broccoli.message('クリップを挿入しました。');
										broccoli.redraw(function(){
											broccoli.closeProgress(function(){
												broccoli.selectInstance(newInstancePath, function(){
													callback();
												});
											});
										});
									});
								});
							}
						);

					}
				);


			}else{
				broccoli.contentsSourceData.addInstance( modId, moveTo, function(result){
					if(!result){
						broccoli.closeProgress(function(){
							callback();
						});
						return;
					}

					// コンテンツを保存
					broccoli.unselectInstance(function(){
						broccoli.saveContents(function(){
							// alert('インスタンスを追加しました。');
							broccoli.redraw(function(){
								broccoli.closeProgress(function(){
									broccoli.selectInstance(newInstancePath, function(){
										callback();
									});
								});
							});
						});
					});
				} );

			}
			return;
		});
		return;
	} // onDrop()

	/**
	 * パネルの ondblclick イベントハンドラ
	 * このメソッドは、 this.setPanelEventHandlers() の他、
	 * editWindow からもコールされています。
	 */
	this.onDblClick = function(e, elm, callback){
		callback = callback || function(){};

		e.stopPropagation();
		var $this = $(elm);
		var instancePath = $this.attr('data-broccoli-instance-path');

		if( $this.attr('data-broccoli-sub-mod-name') && $this.attr('data-broccoli-is-appender') == 'yes' ){
			// loopモジュールの繰り返し要素を増やします。
			var modId = $this.attr("data-broccoli-mod-id");
			var subModName = $this.attr("data-broccoli-sub-mod-name");
			broccoli.contentsSourceData.addInstance( modId, instancePath, function(result){
				if(!result){
					callback();
					return;
				}
				broccoli.saveContents(function(){
					broccoli.redraw(function(){
						callback();
					});
				});
			}, subModName );
			e.preventDefault();
			return;
		}

		if( $this.attr('data-broccoli-is-appender') == 'yes' ){
			broccoli.message('編集できません。ここには、モジュールをドロップして追加または移動することができます。');
			// instancePath = php.dirname(instancePath);
			callback();
			return;
		}
		broccoli.editInstance( instancePath );
		callback();
		return;
	} // onDblClick()

	/**
	 * パネルの oncontextmenu イベントハンドラ
	 * このメソッドは、 this.setPanelEventHandlers() からコールされています。
	 */
	function onContextMenu(e, elm, callback){
		// console.log(e);
		callback = callback || function(){};
		broccoli.contextmenu.show(
			false,
			e.clientX,
			e.clientY,
			callback
		);
		return;
	} // onDblClick()

	/**
	 * パネルにイベントハンドラをセットする
	 */
	this.setPanelEventHandlers = function($panel){
		var timerTouchStart;
		var isTouchStartHold = false;
		var timerFocus;
		$panel
			.attr({
				'tabindex': 1
			})
			.on('click', function(e){
				e.preventDefault();
				e.stopPropagation();
				// console.log(e);
				clearTimeout(timerFocus);
				var $this = $(this);
				var instancePath = $this.attr('data-broccoli-instance-path');
				var selectedInstancePath = broccoli.getSelectedInstance();

				if( e.shiftKey ){
					broccoli.selectInstanceRegion( instancePath, function(){
					} );
					return;
				}

				broccoli.selectInstance( instancePath, function(){
					if( $this.hasClass('broccoli--instance-tree-view-panel-item') ){
						// インスタンスツリービュー上での処理
						broccoli.focusInstance( instancePath );
						return;
					}
					// プレビューカンヴァス上での処理
					broccoli.instanceTreeView.focusInstance( instancePath, function(){} );
				} );
			})
			.on('contextmenu', function(e){
				e.preventDefault();
				e.stopPropagation();
				onContextMenu(e, this, function(){
					// nothing to do.
				});
			})
			.on('focus', function(e){
				e.preventDefault();
				e.stopPropagation();
				var $this = $(this);
				clearTimeout(timerFocus);
				timerFocus = setTimeout(function(){
					$this.click();
				}, 200);
			})
			.on('keypress', function(e){
				// console.log(e);
				try {
					if( e.key.toLowerCase() == 'enter' ){
						_this.onDblClick(e, this, function(){
							// console.log('dblclick event done.');
						});
					}
				} catch (e) {
				}
				return;
			})
			.on('dblclick', function(e){
				_this.onDblClick(e, this, function(){
					// console.log('dblclick event done.');
				});
				return;
			})
			.on('touchstart', function(e){
				// タッチデバイス向けの処理
				clearTimeout(timerTouchStart);
				if( isTouchStartHold ){
					_this.onDblClick(e, this, function(){
						// console.log('dblclick event done.');
					});
					return;
				}
				isTouchStartHold = true;
				timerTouchStart = setTimeout(function(){
					isTouchStartHold = false;
				}, 250);
				return;
			})
			.on('dragleave', function(e){
				e.stopPropagation();
				e.preventDefault();
				$(this).removeClass('broccoli--panel__drag-entered');
				$(this).removeClass('broccoli--panel__drag-entered-u');
				$(this).removeClass('broccoli--panel__drag-entered-d');
			})
			.on('dragover', function(e){
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
						// if( $(this).attr('data-broccoli-is-appender') == 'yes' ){
						// 	instancePath = php.dirname(instancePath);
						// }
						dragOvered = instancePath;
						broccoli.focusInstance( instancePath );
					}
				}

				if( $(this).attr('data-broccoli-is-appender') != 'yes' ){
					var ud = getUd(e, this);
					// console.info(ud);
					if( ud.y == 'u' ){
						$(this).addClass('broccoli--panel__drag-entered-u');
						$(this).removeClass('broccoli--panel__drag-entered-d');
					}else{
						$(this).addClass('broccoli--panel__drag-entered-d');
						$(this).removeClass('broccoli--panel__drag-entered-u');
					}
				}
			})
			.on('dragstart', function(e){
				e.stopPropagation();
				var event = e.originalEvent;
				var transferData = {
					'method': 'moveTo',
					'data-broccoli-instance-path': $(this).attr('data-broccoli-instance-path'),
					'data-broccoli-is-appender': $(this).attr('data-broccoli-is-appender')
				};
				var subModName = $(this).attr('data-broccoli-sub-mod-name');
				if( typeof(subModName) === typeof('') && subModName.length ){
					transferData['data-broccoli-sub-mod-name'] = subModName;
				}
				event.dataTransfer.setData("text/json", JSON.stringify(transferData) );
			})
			.on('drop', function(e){
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
					// console.log($contentsElements.length;
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
	this.updateInstanceSelection = function( callback ){
		callback = callback || function(){};
		var instancePath = broccoli.getSelectedInstance();
		var instancePathRegion = broccoli.getSelectedInstanceRegion();
		this.unselectInstance(function(){
			$panels.find('[data-broccoli-instance-path]')
				.filter(function (index) {
					var isPathSelected = $.inArray($(this).attr("data-broccoli-instance-path"), instancePathRegion);
					if( isPathSelected === false || isPathSelected < 0 ){
						return false;
					}
					return true;
				})
				.addClass('broccoli--panel__selected')
			;
			// this.updateInstancePathView();
			callback();
		});
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
	 * マウス座標の四象限の位置を得る
	 */
	function getUd(e, elm){
		var posx = 0;
		var posy = 0;
		if (!e) e = window.event;
		if (e.pageX || e.pageY)     {
			posx = e.pageX;
			posy = e.pageY;
		}else if (e.clientX || e.clientY)    {
			posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		var mousepos = { x : posx, y : posy };
		// console.info(instancePath, mousepos);

		var docScrolls = {
			left : document.body.scrollLeft + document.documentElement.scrollLeft,
			top : document.body.scrollTop + document.documentElement.scrollTop
		};
		var bounds = elm.getBoundingClientRect();//対象要素の情報取得
		var relmousepos = {
			x : mousepos.x - bounds.left - docScrolls.left,
			y : mousepos.y - bounds.top - docScrolls.top
		};
		// console.info(instancePath, relmousepos);

		var ud = {};
		if( relmousepos.y < $(elm).height()/2 ){
			ud.y = 'u';
		}else{
			ud.y = 'd';
		}
		if( relmousepos.x < $(elm).width()/2 ){
			ud.x = 'l';
		}else{
			ud.x = 'r';
		}
		return ud;
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
