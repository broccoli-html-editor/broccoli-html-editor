/**
 * drawPanels.js
 */
module.exports = function(broccoli, panelsElm, contentsElm, options, callback){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ callback(); return false; }
	if(!panelsElm){ callback(); return false; }
	if(!contentsElm){ callback(); return false; }
	// console.log(options);

	var _this = this;
	options = options||{};
	options.select = options.select||function(){};
	options.edit = options.edit||function(){};
	options.remove = options.remove||function(){};
	options.drop = options.drop||function(){};
	callback = callback || function(){};

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var twig = require('twig');
	var $ = require('jquery');

	var $panels = $(panelsElm);
	var $contents = $(contentsElm);
	var $contentsElements = $contents.find('[data-broccoli-instance-path]');

	it79.fnc(
		{},
		[
			function( it1, data ){
				$panels.html('').removeClass('broccoli').addClass('broccoli');
				it1.next(data);
			} ,
			function( it1, data ){
				function calcHeight($me, idx){
					var $nextElm = $contentsElements.eq(idx+1);
					if( !$nextElm.length ){
						return $me.height();
					}
					var rtn = ($nextElm.offset().top - $me.offset().top);
					if( $me.height() > rtn ){
						return $me.height();
					}
					return rtn;
				}

				// console.log($contentsElements.size());
				$contentsElements.each(function(idx, domElm){
					var $this = $(domElm);
					var $panel = $('<div>');
					$panels.append($panel);
					$panel
						.css({
							'width': $this.width(),
							'height': calcHeight($this, idx),
							'position': 'absolute',
							'left': $this.offset().left,
							'top': $this.offset().top
						})
						.addClass('broccoli--panel')
						.attr({
							'data-broccoli-instance-path': $this.attr('data-broccoli-instance-path'),
							'draggable': true // <- HTML5のAPI http://www.htmq.com/dnd/
						})
						.bind('click', function(){
							options.select($(this).attr('data-broccoli-instance-path'));
						})
						.bind('dblclick', function(){
							options.edit($(this).attr('data-broccoli-instance-path'));
						})
						.bind('dragstart', function(){
							event.dataTransfer.setData("method", 'moveTo' );
							event.dataTransfer.setData("data-broccoli-instance-path", $(this).attr('data-broccoli-instance-path') );
							var subModName = $(this).attr('data-broccoli-sub-mod-name');
							if( typeof(subModName) === typeof('') && subModName.length ){
								event.dataTransfer.setData("data-broccoli-sub-mod-name", subModName );
							}
						})
						.bind('drop', function(){
							var method = event.dataTransfer.getData("method");
							options.drop($(this).attr('data-broccoli-instance-path'), method);
							// var modId = event.dataTransfer.getData("modId");
							// var moveFrom = event.dataTransfer.getData("data-broccoli-instance-path");
							// var moveTo = $(this).attr('data-broccoli-instance-path');
							// var subModNameTo = $(this).attr('data-guieditor-sub-mod-name');
							// var subModNameFrom = event.dataTransfer.getData('data-guieditor-sub-mod-name');
							//
							// // px.message( 'modId "'+modId+'" が "'+method+'" のためにドロップされました。' );
							// if( method == 'add' ){
							// 	if( typeof(subModNameTo) === typeof('') ){
							// 		// loopフィールドの配列を追加するエリアの場合
							// 		px.message('ここにモジュールを追加することはできません。');
							// 		return;
							// 	}
							// 	px2dtGuiEditor.contentsSourceData.addInstance( modId, moveTo, function(){
							// 		// px.message('インスタンスを追加しました。');
							// 		px2dtGuiEditor.ui.onEditEnd();
							// 	} );
							// }else if( method == 'moveTo' ){
							// 	function isSubMod( subModName ){
							// 		if( typeof(subModName) === typeof('') && subModName.length ){
							// 			return true;
							// 		}
							// 		return false;
							// 	}
							// 	function removeNum(str){
							// 		return str.replace(new RegExp('[0-9]+$'),'');
							// 	}
							// 	if( (isSubMod(subModNameFrom) || isSubMod(subModNameTo)) && removeNum(moveFrom) !== removeNum(moveTo) ){
							// 		px.message('並べ替え以外の移動操作はできません。');
							// 		return;
							// 	}
							// 	if( moveFrom === moveTo ){
							// 		// 移動元と移動先が同一の場合、キャンセルとみなす
							// 		$(this).removeClass('cont_instanceCtrlPanel-dragentered');
							// 		return;
							// 	}
							// 	px2dtGuiEditor.contentsSourceData.moveInstanceTo( moveFrom, moveTo, function(){
							// 		// px.message('インスタンスを移動しました。');
							// 		px2dtGuiEditor.ui.onEditEnd();
							// 	} );
							// }
						})
					;

				});
				it1.next(data);
			} ,
			function( it1, data ){
				callback();
				it1.next(data);
			}
		]
	);

	return;
}
