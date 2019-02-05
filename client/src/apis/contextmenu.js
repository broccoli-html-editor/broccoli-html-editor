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
	 * context menu を閉じる
	 */
	this.close = function(callback){
		callback = callback || function(){};
		$('.broccoli--contextmenu').remove();
		callback();
		return;
	} // close()

	return;
}
