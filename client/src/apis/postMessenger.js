/**
 * postMessenger.js
 * iframeに展開されるプレビューHTMLとの通信を仲介します。
 */
module.exports = function(broccoli, iframe){
	var $ = require('jquery');

	var __dirname = broccoli.__dirname;
	// console.log(__dirname);
	var callbackMemory = {};

	function createUUID(){
		return "uuid-"+((new Date).getTime().toString(16)+Math.floor(1E7*Math.random()).toString(16));
	}
	function getTargetOrigin(iframe){
		if(window.location.origin=='file://' || window.location.origin.match(/^chrome\-extension\:\/\//)){
			return '*';
		}

		var url = $(iframe).attr('src');
		// console.log(url);
		var parser = document.createElement('a');
		parser.href=url;
		// console.log(parser);
		return parser.protocol+'//'+parser.host
	}

	/**
	 * 初期化
	 */
	this.init = function(callback){
		console.info('postMessenger.init() called');

		var targetWindowOrigin = getTargetOrigin(iframe);
		// console.log(targetWindowOrigin);

		var win = $(iframe).get(0).contentWindow;
		$.ajax({
			"url": __dirname+'/broccoli-preview-contents.js',
			"complete": function(XMLHttpRequest, textStatus){
				var base64 = new Buffer(XMLHttpRequest.responseText).toString('base64');
				win.postMessage({'scriptUrl':'data:text/javascript;base64,'+base64}, targetWindowOrigin);
				setTimeout(function(){
					// TODO: より確実な方法が欲しい。
					// 子ウィンドウに走らせるスクリプトの準備が整うまで若干のタイムラグが生じる。
					// 一旦 50ms あけて callback するようにしたが、より確実に完了を拾える方法が必要。
					callback();
				}, 50);
			}
		});
		return this;
	}

	/**
	 * メッセージを送る
	 */
	this.send = function(api, options, callback){
		callback = callback||function(){};

		var callbackId = createUUID();
		// console.log(callbackId);

		callbackMemory[callbackId] = callback; // callbackは送信先から呼ばれる。

		var message = {
			'api': api,
			'callback': callbackId,
			'options': options
		};
		// console.log(callbackMemory);

		var win = $(iframe).get(0).contentWindow;
		var targetWindowOrigin = getTargetOrigin(iframe);
		win.postMessage(message, targetWindowOrigin);
		return this;
	}

	/**
	 * メッセージを受信する
	 */
	window.addEventListener('message',function(event){
		var data=event.data;
		// console.log(event);
		// console.log(callbackMemory);

		if(data.api == 'unselectInstance'){
			broccoli.unselectInstance();
			return;

		}else if(data.api == 'unfocusInstance'){
			broccoli.unfocusInstance();
			return;

		}else if(data.api == 'onClickContentsLink'){
			// console.log(event.data.options);
			var data = event.data.options;
			broccoli.options.onClickContentsLink(data.url, data);
			return;

		}else{
			if(!callbackMemory[data.api]){return;}
			callbackMemory[data.api](data.options);
			callbackMemory[data.api] = undefined;
			delete callbackMemory[data.api];
		}
		return;

	});

	return;
}
