module.exports = function(broccoli){

	/**
	 * エディタUIを生成 (Client Side)
	 */
	this.mkEditor = function( mod, data, elm, callback ){

		var presetString = data;
		if( typeof(presetString) === typeof({}) && presetString.src !== undefined ){
			presetString = presetString.src;
		}

		var $input = $('<input type="text" class="px2-input px2-input--block">')
			.attr({
				"name":mod.name
			})
			.val(presetString)
			.css({'width':'100%','height':'auto'})
		;
		var rtn = $('<div>')
			.append( $input )
		;
		$(elm).html(rtn);

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback();
		}); });
		return;
	}

	/**
	 * エディタUIで編集した内容を保存
	 */
	this.saveEditorContent = function( elm, data, mod, callback ){
		var $dom = $(elm);
		var src = $dom.find('input').val();
		src = JSON.parse( JSON.stringify(src) );

		var finData = {
			"src": src
		};

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback(finData);
		}); });
		return;
	}

}
