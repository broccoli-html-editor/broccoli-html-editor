/**
 * clipboard.js
 * クリップボード管理オブジェクト
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	var $ = require('jquery');
	var clipboard = '';

	/**
	 * clipboardに値をセットする
	 */
	this.set = function( text, type, event, callback ){
		var async = false;
		if(callback){
			async = true;
		}
		callback = callback || function(){};

		clipboard = text;

		try {
			if( broccoli.options.clipboard.set ){
				if( async ){
					return broccoli.options.clipboard.set( text, type, event, callback );
				}else{
					return broccoli.options.clipboard.set( text, type, event );
				}
				return;
			}
		} catch (e) {
			console.error(e);
		}

		if( !type ){
			type = "text/plain";
		}

		if( event && event.clipboardData ){
			try{
				event.clipboardData.setData( type, text );
				callback();
				return;
			}catch(e){
				console.error(e);

				try{
					navigator.clipboard.writeText(text).then(function() {
						console.log('navigator.clipboard: Copying to clipboard was successful!');
						callback();
					}, function(err) {
						console.error('navigator.clipboard: Could not copy text:', err);
						callback();
					});
					return;
				}catch(e){
					console.error(e);
				}
			}
		}
	
		var copyArea = $("<textarea/>");
		copyArea.text(text);
		$("body").append(copyArea);
		copyArea.select();
		document.execCommand("copy");
		// console.log('copied.');
		// console.log(text);
		copyArea.remove();

		callback();
		return;
	} // broccoli.clipboard.set();


	/**
	 * clipboardから値を取得する
	 */
	this.get = function( type, event, callback ){
		var async = false;
		if(callback){
			async = true;
		}
		callback = callback || function(){};
		var rtn;

		try {
			if( broccoli.options.clipboard.get ){
				if( async ){
					return broccoli.options.clipboard.get( type, event, callback );
				}else{
					return broccoli.options.clipboard.get( type, event );
				}
				return;
			}
		} catch (e) {
			console.error(e);
		}

		if( !type ){
			type = "text/plain";
		}

		if( event && event.clipboardData ){
			try{
				rtn = event.clipboardData.getData( type );
				callback(rtn);
				return rtn;
			}catch(e){
				console.error(e);

				try{
					if(async){
						navigator.clipboard.readText().then(
							function(clipText){
								rtn = clipText;
								console.log('===========================', rtn);
								callback(rtn);
							}, function(err) {
								console.error('navigator.clipboard: Could not get clipboard contents:', err);
								callback(clipboard);
							}
						);
						return;
					}
				}catch(e){
					console.error(e);
				}
			}
		}

		var copyArea = $("<textarea/>");
		$("body").append(copyArea);
		copyArea.select();
		document.execCommand("paste");
		rtn = copyArea.text();
		copyArea.remove();

		console.log('clipboard get', rtn);

		if( typeof(rtn) !== typeof('') || !rtn.length ){
			console.log('clipboard: クリップボードの読み込みが失敗した可能性があります。ローカル変数のコピーが返されます。');
			rtn = clipboard;
		}

		callback(rtn);
		return rtn;
	} // broccoli.clipboard.get();

}
