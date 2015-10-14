module.exports = function(broccoli){
	var php = require('phpjs');

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = ''
		if(typeof(fieldData)===typeof('')){
			rtn = php.htmlspecialchars( fieldData ); // ←HTML特殊文字変換
			// rtn = rtn.replace(new RegExp('\r\n|\r|\n','g'), '<br />'); // ← 属性値などに使うので、改行コードは改行コードのままじゃないとマズイ。
		}
		if( mode == 'canvas' && !rtn.length ){
			rtn = '';
		}
		setTimeout(function(){ callback(rtn); }, 0);
		return;
	}

	/**
	 * エディタUIを生成
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var $input = $('<input>')
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
		setTimeout(function(){ callback(); }, 0);
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
