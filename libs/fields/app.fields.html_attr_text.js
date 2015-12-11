module.exports = function(broccoli){
	var php = require('phpjs');
	var utils79 = require('utils79');

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = '';
		if(typeof(fieldData)===typeof('')){
			rtn = utils79.toStr(fieldData);
			rtn = php.htmlspecialchars( rtn ); // ←HTML特殊文字変換
			// rtn = rtn.replace(new RegExp('\r\n|\r|\n','g'), '<br />'); // ← 属性値などに使うので、改行コードは改行コードのままじゃないとマズイ。
		}
		if( mode == 'canvas' && !rtn.length ){
			rtn = '(ダブルクリックしてテキストを編集してください)';
		}
		setTimeout(function(){
			// px.textEditor.attachTextEditor(
			// 	$dom.find('textarea').get(0),
			// 	'text'
			// );
			// $dom.find('.CodeMirror').css({
			// 	'border': '1px solid #ccc',
			// 	'border-radius': '3px'
			// });
			callback(rtn);
		}, 0);
		return;
	}

}
