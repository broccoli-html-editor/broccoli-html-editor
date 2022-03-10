module.exports = function(broccoli){

	var $ = require('jquery');

	/**
	 * エディタUIで編集した内容を保存 (Client Side)
	 */
	this.saveEditorContent = function( elm, data, mod, callback, options ){
		options = options || {};
		options.message = options.message || function(msg){};//ユーザーへのメッセージテキストを送信
		var $dom = $(elm);
		var src = '';
		if( $dom.find('input[type=text]').length ){
			src = $dom.find('input[type=text]').val();
		}else if( window.ace && mod.aceEditor ){
			src = mod.aceEditor.getValue();
		}else if( $dom.find('textarea').length ){
			src = $dom.find('textarea').val();
		}
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
