/**
 * clipboard.js
 * クリップボード管理オブジェクト
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	var $ = require('jquery');
	var clipboard = '';

	// clipboardに値をセットする
	this.set = function( text ){
		clipboard = text;

		var copyArea = $("<textarea/>");
		copyArea.text(text);
		$("body").append(copyArea);
		copyArea.select();
		document.execCommand("copy");
		// console.log('copied.');
		// console.log(text);
		copyArea.remove();
		return this;
	}// broccoli.clipboard.set();

	// clipboardから値を取得する
	this.get = function(){
		var copyArea = $("<textarea/>");
		$("body").append(copyArea);
		copyArea.select();
		document.execCommand("paste");
		var rtn = copyArea.text();
		copyArea.remove();

		if( typeof(rtn) !== typeof('') || !rtn.length ){
			rtn = clipboard;
		}
		return rtn;
	}// broccoli.clipboard.get();

}
