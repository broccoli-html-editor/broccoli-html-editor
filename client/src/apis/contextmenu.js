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
		.addClass('broccoli--contextmenu')
		.on('click', function(e){
			e.stopPropagation();
			e.preventDefault();
		})
	;


	/**
	 * context menu を表示する
	 */
	this.show = function(menu, x, y, callback){
		callback = callback || function(){};
		_this.close(function(){
			setTimeout(function(){
				if( menu === false ){
					menu = mkAutoMenu();
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
								.on('click', function(){
									menu.function();
									_this.close();
								})
							;
						})($a, menu[i]);
						$li.append( $a )
					}
					$ul.append( $li );
				}
				$contextmenu.append($ul);
			}, 600);

			callback();
		});
		return;
	} // show()

	/**
	 * context menu を表示しているか調べる
	 */
	this.isShow = function(){
		if( $('.broccoli--contextmenu').size() ){
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
	function mkAutoMenu(){
		var instancePath = broccoli.getSelectedInstance();
		var selectedInstanceRegion = broccoli.getSelectedInstanceRegion();
		var menu = [];
		var isDeletable = true;
		var isCopyable = true;

		// 選択されたインスタンスが1つのみで、
		// かつ、それが Appender だったら。
		if( selectedInstanceRegion.length === 1 ){
			if( !broccoli.contentsSourceData.get(instancePath) ){
				isDeletable = false;
				isCopyable = false;
			}
		}

		if( isCopyable ){
			menu.push({
				"label": "コピー",
				"function": function(){
					broccoli.copy(function(){
						// nothing to do.
					});
				}
			});
		}

		menu.push({
			"label": "この直前にペースト",
			"function": function(){
				broccoli.paste(function(){
					// nothing to do.
				});
			}
		});

		if( isDeletable ){
			menu.push({
				"type": "hr"
			});
			menu.push({
				"label": "削除する",
				"function": function(){
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
