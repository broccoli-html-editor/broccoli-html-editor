module.exports = function(broccoli){

	/**
	 * エディタUIを生成 (Client Side)
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var $input = $('<input class="form-control">')
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
		// setTimeout(function(){
			callback();
		// }, 0);
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
