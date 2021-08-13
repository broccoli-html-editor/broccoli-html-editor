/**
 * insertWindow.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ return false; }

	var _this = this;

	var it79 = require('iterate79');
	var LangBank = require('langbank');
	var $ = require('jquery');

	var $insertWindow;
	var tplFrame = ''
		+ '<div class="broccoli__insert-window">'
		+ '<h2>モジュールを挿入します</h2>'
		+ '<p>挿入するモジュールを選択してください。</p>'
		+ '<p>この機能は開発中です。</p>'
		+ '<p><button class="px2-btn" type="button">キャンセル</button></p>'
		+ '</div>'
	;

	/**
	 * 初期化
	 */
	this.init = function(instancePath, elmInsertWindow, callback){
		$insertWindow = $(elmInsertWindow);
		$insertWindow.html(tplFrame);
		$insertWindow.find('.px2-btn').on('click', function(){
			callback(false);
		});
		return;
	}

	return;
}
