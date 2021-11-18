/**
 * postMessenger.js
 * iframeに展開されるプレビューHTMLとの通信を仲介します。
 */
module.exports = function(broccoli, iframe){
	var $ = require('jquery');
	var it79 = require('iterate79');
	var _this = this;

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
		// console.log(win);

		it79.fnc({}, [
			function(it1){
				try {
					if(!win.document.querySelector('script[data-broccoli-receive-message="yes"]')){
						win.addEventListener('message',(function() {
							return function f(event) {
								if(!event.data.scriptUrl){return;}
								var s=document.createElement('script');
								win.document.querySelector('body').appendChild(s);s.src=event.data.scriptUrl;
								win.removeEventListener('message', f, false);
							}
						})(),false);
					}

				} catch(e){
					console.log('postMessenger.init(): プレビューの直接のDOM操作は行われません。');
				}
				it1.next();
			},
			function(it1){
				setTimeout(function(){
					// TODO: より確実な方法が欲しい。
					// 子ウィンドウに走らせるスクリプトの準備が整うまで若干のタイムラグが生じる。
					// 一旦 200ms あけて callback するようにしたが、より確実に完了を拾える方法が必要。
					it1.next();
				}, 200);
			},
			function(it1){
				$.ajax({
					"url": __dirname+'/broccoli-preview-contents.js',
					"dataType": "text",
					"complete": function(XMLHttpRequest, textStatus){
						var base64 = new Buffer(XMLHttpRequest.responseText).toString('base64');

						var event;
						event = document.createEvent("Event");
						event.initEvent("message", false, false);
						event.data = {'scriptUrl':'data:text/javascript;base64,'+base64};
						event.origin = targetWindowOrigin;
						win.dispatchEvent(event);
						// win.postMessage({'scriptUrl':'data:text/javascript;base64,'+base64}, targetWindowOrigin);

						it1.next();
					}
				});
			},
			function(it1){
				setTimeout(function(){
					// TODO: より確実な方法が欲しい。
					// 子ウィンドウに走らせるスクリプトの準備が整うまで若干のタイムラグが生じる。
					// 一旦 50ms あけて callback するようにしたが、より確実に完了を拾える方法が必要。
					it1.next();
				}, 50);
			},
			function(it1){
				// 接続を確認
				var timeout = setTimeout(function(){
					console.error('postMessenger: ping error: Timeout');
				}, 5000);
				_this.send('ping', {}, function(res){
					try {
						console.log('postMessenger: ping:', res);
						if( !res.result ){
							console.error('postMessenger: ping got a error', res);
						}

					} catch(e) {
						console.error('postMessenger: ping problem:', e);
					}
					clearTimeout(timeout);
					it1.next();
				});
			},
			function(){
				callback();
			},
		]);


		return;
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

		var event;
		event = document.createEvent("Event");
		event.initEvent("message", false, false);
		event.data = message;
		event.origin = targetWindowOrigin;
		win.dispatchEvent(event);
		// win.postMessage(message, targetWindowOrigin);

		return;
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
