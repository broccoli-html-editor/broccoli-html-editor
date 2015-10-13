(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * node-iterate79
 */
(function(exports){

	/**
	 * 配列の直列処理
	 */
	exports.ary = function(ary, fnc, fncComplete){
		return new (function( ary, fnc, fncComplete ){
			this.idx = -1;
			this.idxs = [];
			for( var i in ary ){
				this.idxs.push(i);
			}
			this.ary = ary||[];
			this.fnc = fnc||function(){};
			this.fncComplete = fncComplete||function(){};

			this.next = function(){
				if( this.idx+1 >= this.idxs.length ){
					this.fncComplete();
					return this;
				}
				this.idx ++;
				this.fnc( this, this.ary[this.idxs[this.idx]], this.idxs[this.idx] );
				return this;
			}
			this.next();
		})(ary, fnc, fncComplete);
	}

	/**
	 * 関数の直列処理
	 */
	exports.fnc = function(aryFuncs){
		var mode = 'explicit';
		var defaultArg = undefined;
		if( arguments.length >= 2 ){
			mode = 'implicit';
			defaultArg = arguments[0];
			aryFuncs = arguments[arguments.length-1];
		}


		function iterator( aryFuncs ){
			aryFuncs = aryFuncs||[];

			var idx = 0;
			var funcs = aryFuncs;
			var isStarted = false;//2重起動防止

			this.start = function(arg){
				if(isStarted){return this;}
				isStarted = true;
				return this.next(arg);
			}

			this.next = function(arg){
				arg = arg||{};
				if(funcs.length <= idx){return this;}
				(funcs[idx++])(this, arg);
				return this;
			};
		}
		var rtn = new iterator(aryFuncs);
		if( mode == 'implicit' ){
			return rtn.start(defaultArg);
		}
		return rtn;
	}


})(exports);

},{}],2:[function(require,module,exports){
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
				'elmCanvas': $('.canvas').get(0),
				'elmModulePalette': $('.palette').get(0),
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
				$(window).resize(function(){
					broccoli.redraw();
				});
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

},{"iterate79":1}]},{},[2])