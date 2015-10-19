/**
 * postMessenger.js
 * iframeに展開されるプレビューHTMLとの通信を仲介します。
 */

module.exports = function(broccoli, iframe){

	var __dirname = broccoli.__dirname;
	// console.log(__dirname);

	var _targetWindowOrigin = (function(url){
		var parser = document.createElement('a');
		parser.href=url;
		return parser.protocol+'//'+parser.host
	})($(iframe).attr('src'));
	// console.log(_targetWindowOrigin);

	var callbackMemory = {};

	function createUUID(){
		return "uuid-"+((new Date).getTime().toString(16)+Math.floor(1E7*Math.random()).toString(16));
	}

	/**
	 * 初期化
	 */
	this.init = function(callback){
		// console.info('postMessenger.init() called');
		var win = $(iframe).get(0).contentWindow;
		win.postMessage({'scriptUrl':__dirname+'/broccoli-preview-contents.js'}, _targetWindowOrigin);
		callback();
		return this;
	}

	/**
	 * メッセージを送る
	 */
	this.send = function(api, options, callback){
		callback = callback||function(){};

		var callbackId = createUUID();
		// console.log(callbackId);

		callbackMemory[callbackId] = callback;

		var message = {
			'api': api,
			'callback': callbackId,
			'options': options
		};
		console.log(callbackMemory);

		var win = $(iframe).get(0).contentWindow;
		win.postMessage(message, _targetWindowOrigin);

		// callback();//TODO: 仮実装。本当は、iframe側からコールバックされる。
		return this;
	}

	/**
	 * メッセージを受信する
	 */
	window.addEventListener('message',function(event){
		var data=event.data;
		console.log(event);
		console.log(callbackMemory);

		if(data.api == 'unselectInstance'){
			broccoli.unselectInstance();
			return;

		}else if(data.api == 'unfocusInstance'){
			broccoli.unfocusInstance();
			return;

		}else{
			if(!callbackMemory[data.api]){return;}
			callbackMemory[data.api](data.options);
			callbackMemory[data.api] = undefined;
			delete callbackMemory[data.api];
		}

	});

	return;
}
