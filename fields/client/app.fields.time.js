module.exports = function(broccoli){

	/**
	 * エディタUIを生成 (Client Side)
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var rows = 12;
		if( mod.rows ){
			rows = mod.rows;
		}
		var $rtn = $('<div>'),
			$formElm
		;

		$formElm = $('<input type="time" class="form-control">')
			.attr({
				"name": mod.name
			})
			.val(data)
			.css({'width':'100px', 'max-width': '100%'})
		;
		$rtn.append( $formElm );

		$(elm).html($rtn);

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback();
		}); });
		return this;
	}

	/**
	 * エディタUIで編集した内容を保存 (Client Side)
	 */
	this.saveEditorContent = function( elm, data, mod, callback, options ){
		options = options || {};
		options.message = options.message || function(msg){};//ユーザーへのメッセージテキストを送信
		var $dom = $(elm);
		var src = $dom.find('input[type=time]').val();
		src = JSON.parse( JSON.stringify(src) );

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback(src);
		}); });
		return this;
	}

}
