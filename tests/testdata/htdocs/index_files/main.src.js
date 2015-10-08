// console.log(broccoli);

/**
 * main.js
 */
window.main = new (function(){
	var _this = this;
	var it79 = require('iterate79');
	var socket = this.socket = window.baobabFw
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

	// broccoli をインスタンス化
	var broccoli = new Broccoli();
	this.broccoli = broccoli;

	this.init = function(callback){
		callback = callback||function(){};
		// this.socketTest();
		// broccoli を初期化
		broccoli.init(
			{
				'elmIframeWindow': $('iframe').get(0).contentWindow,
				'elmPanels': document.getElementById('panels'),
				'elmModulePalette': document.getElementById('palette'),
				'contents_area_selector': '[data-contents]',
				'contents_bowl_name_by': 'data-contents',
				'gpiBridge': function(api, options, callback){
					// General Purpose Interface Bridge
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
					return;
				}
			} ,
			function(){
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
