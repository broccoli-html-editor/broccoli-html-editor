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

}
