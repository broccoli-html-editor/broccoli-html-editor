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
				event.dataTransfer.setData("data-broccoli-is-appender", $(this).attr('data-broccoli-is-appender') );
			})
			.bind('drop', function(e){
				e.stopPropagation();
				$(this).removeClass('broccoli--panel__drag-entered');
				var method = event.dataTransfer.getData("method");
				// options.drop($(this).attr('data-broccoli-instance-path'), method);
				// console.log(method);
				var subModNameFrom = event.dataTransfer.getData("data-broccoli-sub-mod-name");
				var subModName = $(this).attr('data-broccoli-sub-mod-name');
				var isAppenderFrom = (event.dataTransfer.getData("data-broccoli-is-appender") == 'yes');
				var isAppender = ($(this).attr('data-broccoli-is-appender') == 'yes');
				if( subModNameFrom.length ){
					if( method === 'moveTo' ){
						// これはloop要素(=subModNameがある場合)を並べ替えるための moveTo です。
						// その他のインスタンスをここに移動したり、作成することはできません。
						var moveFrom = event.dataTransfer.getData("data-broccoli-instance-path");
						var moveTo = $(this).attr('data-broccoli-instance-path');
						if( moveFrom === moveTo ){
							// 移動元と移動先が同一の場合、キャンセルとみなす
							$(this).removeClass('broccoli--panel__drag-entered');
							return;
						}

						function removeNum(str){
							return str.replace(new RegExp('[0-9]+$'),'');
						}
						if( removeNum(moveFrom) !== removeNum(moveTo) ){
							broccoli.message('並べ替え以外の移動操作はできません。');
							$(this).removeClass('broccoli--panel__drag-entered');
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
					broccoli.message('ダブルクリックしてください。ドロップできません。');
				}else{
					if( method === 'moveTo' ){
						var moveFrom = event.dataTransfer.getData("data-broccoli-instance-path");
						var moveTo = $(this).attr('data-broccoli-instance-path');
						if( moveFrom === moveTo ){
							// 移動元と移動先が同一の場合、キャンセルとみなす
							$(this).removeClass('broccoli--panel__drag-entered');
							return;
						}
						if(subModName){
							broccoli.message('loopフィールドへの移動はできません。');
							$(this).removeClass('broccoli--panel__drag-entered');
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
						broccoli.message('追加するモジュールをドラッグしてください。ここに移動することはできません。');
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
				}
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
