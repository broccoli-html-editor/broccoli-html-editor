module.exports = function(broccoli){

	/**
	 * エディタUIを生成 (Client Side)
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var rows = 12;
		if( mod.rows ){
			rows = mod.rows;
		}
		var $rtn = $('<div>');

		var valDate, valTime;
		if( data ){
			var tmpDate = new Date(data);
			valDate = 'Y-m-d';
			valDate = valDate.replace(/Y/g, tmpDate.getFullYear());
			valDate = valDate.replace(/m/g, ('0' + (tmpDate.getMonth() + 1)).slice(-2));
			valDate = valDate.replace(/d/g, ('0' + tmpDate.getDate()).slice(-2));
			valTime = 'H:i:s';
			valTime = valTime.replace(/H/g, ('0' + tmpDate.getHours()).slice(-2));
			valTime = valTime.replace(/i/g, ('0' + tmpDate.getMinutes()).slice(-2));
			valTime = valTime.replace(/s/g, ('0' + tmpDate.getSeconds()).slice(-2));
		}

		$rtn
			.append( $('<input type="date" class="form-control">')
				.attr({ "name": mod.name + "__date" })
				.val(valDate)
				.css({'width':'180px', 'max-width': '100%'})
			)
			.append( $('<input type="time" step="1" class="form-control">')
				.attr({ "name": mod.name + "__time" })
				.val(valTime)
				.css({'width':'130px', 'max-width': '100%'})
			)
		;

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
		var valDate = $dom.find('input[type=date]').val();
		var valTime = $dom.find('input[type=time]').val();
		var src = '';
		if( valDate && valTime ){
			src = valDate + ' ' + valTime;
			src = new Date(src).toISOString();
		}
		src = JSON.parse( JSON.stringify(src) );

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback(src);
		}); });
		return this;
	}

}
