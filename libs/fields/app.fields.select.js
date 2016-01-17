module.exports = function(broccoli){
	var utils79 = require('utils79');

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = '';
		rtn = utils79.toStr(fieldData);

		if( !rtn.length && mod.options ){
			var isHit = false;
			for( var idx in mod.options ){
				if( rtn == mod.options[idx].value ){
					isHit = true;
					break;
				}
			}
			if( !isHit ){
				// 選択値が空白で、空白の選択肢がなければ、1件目のオプションを選ぶ。
				for( var idx in mod.options ){
					rtn = mod.options[idx].value;
					break;
				}
			}
		}
		if( mode == 'canvas' && !rtn.length ){
			// rtn = '(ダブルクリックして選択してください)';
				// ↑未選択時のダミー文はなしにした。
				// 　クラス名の modifier 部分の拡張などに使用する場合に、
				// 　クラス名とダミー文が合体して存在しないクラス名になってしまうので。
		}
		// setTimeout(function(){
			callback(rtn);
		// }, 0);
		return;
	}

	/**
	 * エディタUIを生成
	 */
	this.mkEditor = function( mod, data, elm, callback ){

		var $select = $('<select>')
			.attr({
				"name":mod.name
			})
			.css({'max-width':'100%'})
		;
		if( mod.options ){
			for( var idx in mod.options ){
				var $option = $('<option>')
					.attr({
						'value':mod.options[idx].value
					})
					.text(mod.options[idx].label)
				;
				if( data==mod.options[idx].value ){
					$option.attr({
						'selected': 'selected'
					});
				}
				$select.append( $option );
			}
		}
		var rtn = $('<div>')
			.append($('<div>')
				.text( (mod.description ? mod.description : '') )
			)
			.append( $select )
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
		var src = $dom.find('select').val();
		src = JSON.parse( JSON.stringify(src) );
		callback(src);
		return;
	}

}
