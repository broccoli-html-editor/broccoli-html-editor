/**
 * contextmenu.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ callback(); return false; }

	var _this = this;
	var it79 = require('iterate79');
	var $ = require('jquery');

	var $contextmenu = $('<div>')
		.addClass('broccoli')
		.addClass(`broccoli--appearance-${broccoli.options.appearance}`)
		.addClass('broccoli--contextmenu')
		.on('click', function(e){
			e.stopPropagation();
			e.preventDefault();
		})
	;


	/**
	 * context menu を表示する
	 */
	this.show = function(menu, options, callback){
		options = options || {};
		callback = callback || function(){};
		var x = options.x;
		var y = options.y;
		_this.close(function(){
			setTimeout(function(){
				if( menu === false ){
					menu = mkAutoMenu(options);
				}

				$('body').append($contextmenu.html(''));
				$contextmenu.css({
					"top": y,
					"left": x
				});
				var $ul = $('<ul>');
				for(var i = 0; i < menu.length; i ++){
					var $li = $('<li>');
					if( menu[i].type == 'hr' ){
						$li.append( '<hr>' )
					}else{
						var $a = $('<a>');
						(function($a, menu){
							$a
								.text(menu.label)
								.attr({"href": "javascript:;"})
								.on('click', function(e){
									menu.function(e.originalEvent);
									_this.close();
								})
							;
						})($a, menu[i]);
						$li.append( $a )
					}
					$ul.append( $li );
				}
				$contextmenu.append($ul);
			}, 210);

			callback();
		});
		return;
	} // show()

	/**
	 * context menu を表示しているか調べる
	 */
	this.isShow = function(){
		if( $('.broccoli--contextmenu').length ){
			return true;
		}
		return false;
	}

	/**
	 * context menu を閉じる
	 */
	this.close = function(callback){
		callback = callback || function(){};
		$('.broccoli--contextmenu').remove();
		callback();
		return;
	} // close()

	/**
	 * context menu の自動生成
	 */
	function mkAutoMenu( options ){
		options = options || {};
		var selectedInstancePath = broccoli.getSelectedInstance();;
		var instancePath = selectedInstancePath;
		if( options.baseInstancePath ){
			instancePath = options.baseInstancePath;
		}
		var selectedInstanceRegion = broccoli.getSelectedInstanceRegion();
		var panelElement = options.currentElement || broccoli.panels.getPanelElement( instancePath );
		// var contentsData = broccoli.contentsSourceData.get(instancePath);
		var menu = [];
		var isEditable = false;
		var isDeletable = true;
		var isCopyable = true;
		var isPastable = true;
		var isLoopField = false;
		var isAppender = false;
		var isEditWindow = false;

		if( $(panelElement).attr('data-broccoli-sub-mod-name') ){
			isLoopField = true;
		}
		if( $(panelElement).attr('data-broccoli-is-appender') == 'yes' ){
			isAppender = true;
		}
		if( $(panelElement).attr('data-broccoli-is-edit-window') == 'yes' ){
			isEditWindow = true;
		}

		if( selectedInstanceRegion.length === 1 ){
			if( isAppender ){
				// 選択されたインスタンスが1つのみで、
				// かつ、それが Appender だったら。
				isDeletable = false;
				isCopyable = false;
			}else{
				isEditable = true;
			}
		}
		if( isEditWindow ){
			// 編集ウィンドウ中の module/loop field から呼び出されている場合
			isDeletable = false;
			isCopyable = false;
			isPastable = false;
		}

		if( isEditable ){
			menu.push({
				"label": "編集",
				"function": function(event){
					broccoli.editInstance(instancePath);
				}
			});
		}

		if( isCopyable ){
			menu.push({
				"label": "コピー",
				"function": function(event){
					broccoli.copy(function(){
						// nothing to do.
					}, event);
				}
			});
		}

		if( isPastable ){
			menu.push({
				"label": "この直前にペースト",
				"function": function(event){
					broccoli.paste(function(){
						// nothing to do.
					}, event);
				}
			});
		}

		if( !isLoopField ){
			menu.push({
				"label": "この直前に挿入",
				"function": function(event){
					broccoli.insertInstance(instancePath);
				}
			});
		}

		if( isDeletable ){
			menu.push({
				"type": "hr"
			});
			menu.push({
				"label": "削除する",
				"function": function(event){
					broccoli.remove(function(){
						// nothing to do.
					});
				}
			});
		}
		return menu;
	}

	return;
}
