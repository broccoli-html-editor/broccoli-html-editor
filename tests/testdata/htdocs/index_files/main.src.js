// console.log(broccoli);

/**
 * main.js
 */
window.main = new (function(){
	var _this = this;
	var it79 = require('iterate79');
	var socket;
	if(window.biflora){
		socket = this.socket = window.biflora
			.createSocket(
				this,
				io,
				{
					'showSocketTest': function( data, callback, main, socket ){
						// console.log(data);
						// alert(data.message);
						// console.log(callback);
						callback(data);
						return;
					}
				}
			)
		;
	}
	var serverType = 'biflora';

	// broccoli をインスタンス化
	var broccoli = new Broccoli();
	this.broccoli = broccoli;

	this.init = function(options, callback){
		callback = callback||function(){};
		options = options||{};
		if(options.serverType){
			serverType = options.serverType;
		}
		// this.socketTest();
		// broccoli を初期化
		broccoli.init(
			{
				'elmCanvas': $('.canvas').get(0),
				'elmModulePalette': $('.palette').get(0),
				'elmInstancePathView': $('.instancePathView').get(0),
				'elmInstanceTreeView': $('.instanceTreeView').get(0),
				'contents_area_selector': '[data-contents]',
				'contents_bowl_name_by': 'data-contents',
				'lang': 'ja',
				'customFields': {
					'custom1': function(broccoli){
						/**
						 * データをバインドする
						 */
						this.bind = function( fieldData, mode, mod, callback ){
							var php = require('phpjs');
							var rtn = ''
							if(typeof(fieldData)===typeof('')){
								rtn = php.htmlspecialchars( fieldData ); // ←HTML特殊文字変換
								rtn = rtn.replace(new RegExp('\r\n|\r|\n','g'), '<br />'); // ← 改行コードは改行タグに変換
							}
							if( mode == 'canvas' && !rtn.length ){
								rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;white-space:nowrap;">(ダブルクリックしてテキストを編集してください)</span>';
							}
							rtn = '<div style="background-color:#993; color:#fff; padding:1em;">'+rtn+'</div>';
							setTimeout(function(){
								callback(rtn);
							}, 0);
							return;
						}

					}
				},
				'gpiBridge': function(api, options, callback){
					// General Purpose Interface Bridge
					if(serverType == 'biflora'){
						socket.send(
							'broccoli',
							{
								'api': 'gpiBridge' ,
								'bridge': {
									'api': api ,
									'options': options
								}
							} ,
							function(rtn){
								// console.log(rtn);
								callback(rtn);
							}
						);
					}else if(serverType == 'php'){
						alert(123);
						callback(null);
					}
					return;
				},
				'onClickContentsLink': function( uri, data ){
					alert(uri + ' へ移動');
					console.log(data);
					return false;
				},
				'onMessage': function(message){
					console.info('message: '+message);
				}
			} ,
			function(){
				console.log('broccoli standby.');
				$(window).resize(function(){
					var h = $(window).height() - 70;
					$('.instanceTreeView').css({'height':h});
					$('.canvas').css({'height':h});
					$('.palette').css({'height':h});
					broccoli.redraw();
				}).resize();
				callback();
			}
		);
	}

	/**
	 * WebSocket疎通確認
	 */
	this.socketTest = function(){
		socket.send(
			'socketTest',
			{'message': 'socketTest from frontend.'} ,
			function(data){
				console.log(data);
				// alert('callback function is called!');
			}
		);
		return this;
	}

})();
