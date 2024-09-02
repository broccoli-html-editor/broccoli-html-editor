/**
 * postMessenger.js
 * iframeに展開されるプレビューHTMLとの通信を仲介します。
 */
module.exports = function(broccoli, iframe){
	var $ = require('jquery');
	var it79 = require('iterate79');
	var _this = this;

	var __dirname = broccoli.__dirname;
	var callbackMemory = {};

	function createUUID(){
		return "uuid-"+((new Date).getTime().toString(16)+Math.floor(1E7*Math.random()).toString(16));
	}
	function getTargetOrigin(iframe){
		if(window.location.origin=='file://' || window.location.origin.match(/^chrome\-extension\:\/\//)){
			return '*';
		}

		var url = $(iframe).attr('src');
		var parser = document.createElement('a');
		parser.href=url;
		return parser.protocol+'//'+parser.host
	}

	/**
	 * 初期化
	 */
	this.init = function(callback){
		var targetWindowOrigin = getTargetOrigin(iframe);
		var win = $(iframe).get(0).contentWindow;

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
					console.info('postMessenger.init(): No direct DOM manipulation of previews.');
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

						try {
							var event;
							event = document.createEvent("Event");
							event.initEvent("message", false, false);
							event.data = {'scriptUrl':'data:text/javascript;base64,'+base64};
							event.origin = targetWindowOrigin;
							win.dispatchEvent(event);
						}catch(e){
							win.postMessage({'scriptUrl':'data:text/javascript;base64,'+base64}, targetWindowOrigin);
						}

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

		callbackMemory[callbackId] = callback; // callbackは送信先から呼ばれる。

		var message = {
			'api': api,
			'callback': callbackId,
			'options': options
		};

		var win = $(iframe).get(0).contentWindow;
		var targetWindowOrigin = getTargetOrigin(iframe);

		try {
			var event;
			event = document.createEvent("Event");
			event.initEvent("message", false, false);
			event.data = message;
			event.origin = targetWindowOrigin;
			win.dispatchEvent(event);
		}catch(e){
			win.postMessage(message, targetWindowOrigin);
		}

		return;
	}

	/**
	 * メッセージを受信する
	 */
	window.addEventListener('message',function(event){
		var data=event.data;

		if(data.api == 'unselectInstance'){
			broccoli.unselectInstance();
			return;

		}else if(data.api == 'unfocusInstance'){
			broccoli.unfocusInstance();
			return;

		}else if(data.api == 'onClickContentsLink'){
			var data = event.data.options;
			broccoli.options.onClickContentsLink(data.url, data);
			return;

		}else if(data.api == 'redraw'){
			broccoli.redraw();
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
