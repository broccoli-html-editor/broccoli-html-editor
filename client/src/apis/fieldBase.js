/**
 * fieldBase.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	this.__fieldId__ = null;
	var Promise = require('es6-promise').Promise;
	var _this = this;
	var $ = require('jquery');
	var utils79 = require('utils79');
	var it79 = require('iterate79');
	var editorLib = null;
	try {
		if(window.ace){
			editorLib = 'ace';
		}
	} catch (e) {
	}

	/**
	 * データを正規化する (Client Side)
	 * このメソッドは、同期的に振る舞います。
	 */
	this.normalizeData = function( fieldData, mode ){
		// 編集画面用にデータを初期化。
		var rtn = fieldData;
		return rtn;
	}

	/**
	 * プレビュー用の簡易なHTMLを生成する (Client Side)
	 * InstanceTreeViewで利用する。
	 */
	this.mkPreviewHtml = function( fieldData, mod, callback ){
		var rtn = '';
		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){

				// サーバーサイドの bind() に相当する処理
				try {
					rtn = utils79.toStr(fieldData);
				} catch (e) {
					rtn = '[error]'
				}
				rlv();

			}); })
			.then(function(){ return new Promise(function(rlv, rjt){

				// console.log(rtn);
				var $rtn = $('<div>').append(rtn);
				$rtn.find('*').each(function(){
					$(this)
						.removeAttr('style') //スタイル削除しちゃう
					;
				});
				$rtn.find('style').remove(); // styleタグも削除しちゃう
				rtn = $rtn.html();

				rlv();

			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				callback( rtn );
			}); })
		;
		return this;
	}

	/**
	 * エディタUIを生成 (Client Side)
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var rows = 12;
		if( mod.rows ){
			rows = mod.rows;
		}
		var $rtn = $('<div>'),
			$formElm
		;

		if( rows == 1 ){
			$formElm = $('<input type="text" class="form-control">')
				.attr({
					"name": mod.name
				})
				.val(data)
				.css({'width':'100%'})
			;
			$rtn.append( $formElm );

		}else if( editorLib == 'ace' ){
			$formElm = $('<div>')
				.text(data)
				.css({
					'position': 'relative',
					'width': '100%',
					'height': 16 * rows,
					'border': '1px solid #ccc',
					'box-shadow': 'inset 0px 1px 1px rgba(0,0,0,0.075)',
					'border-radius': '4px',
					'overflow': 'hidden'
				})
			;
			$rtn.append( $formElm );
			mod.aceEditor = ace.edit( $formElm.get(0) );
			// Ace Snippets - https://ace.c9.io/build/kitchen-sink.html
			mod.aceEditor.setFontSize(16);
			mod.aceEditor.getSession().setUseWrapMode(true);// Ace 自然改行
			mod.aceEditor.setShowInvisibles(true);// Ace 不可視文字の可視化
			mod.aceEditor.$blockScrolling = Infinity;
			mod.aceEditor.setTheme("ace/theme/github");
			mod.aceEditor.getSession().setMode("ace/mode/html");

			if( mod.type == 'html' ){
				mod.aceEditor.setTheme("ace/theme/monokai");
				mod.aceEditor.getSession().setMode("ace/mode/html");
			}else if( mod.type == 'markdown' ){
				mod.aceEditor.setTheme("ace/theme/github");
				mod.aceEditor.getSession().setMode("ace/mode/markdown");
			}else{
				mod.aceEditor.setTheme("ace/theme/katzenmilch");
				mod.aceEditor.getSession().setMode("ace/mode/plain_text");
			}

		}else{
			$formElm = $('<textarea class="form-control">')
				.attr({
					"name": mod.name,
					"rows": rows
				})
				.val(data)
				.css({'width':'100%','height':'auto'})
			;
			$rtn.append( $formElm );

		}
		$(elm).html($rtn);

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback();
		}); });
		return this;
	}

	/**
	 * エディタUIにフォーカス (Client Side)
	 */
	this.focus = function( elm, callback ){
		callback = callback || function(){};
		$(elm).find('textarea, input').eq(0).focus();
		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback();
		}); });
		return this;
	}

	/**
	 * データを複製する (Client Side)
	 */
	this.duplicateData = function( data, callback, resources ){
		callback = callback||function(){};
		try{
			data = JSON.parse( JSON.stringify( data ) );
		}catch(e){}
		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback(data);
		}); });
		return this;
	}

	/**
	 * データから使用するリソースのリソースIDを抽出する (Client Side)
	 */
	this.extractResourceId = function( data, callback ){
		callback = callback||function(){};
		data = [];
		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback(data);
		}); });
		return this;
	}


	/**
	 * エディタUIで編集した内容を検証する (Client Side)
	 */
	this.validateEditorContent = function( elm, mod, callback ){
		var $dom = $(elm);
		var src = '';
		if( $dom.find('input[type=text]').length ){
			src = $dom.find('input[type=text]').val();
		}else if( editorLib == 'ace' && mod.aceEditor ){
			src = mod.aceEditor.getValue();
		}else if( $dom.find('textarea').length ){
			src = $dom.find('textarea').val();
		}
		src = JSON.parse( JSON.stringify(src) );

		// Validation
		broccoli.validate(src, mod.validate, function(errorMsgs){
			callback( errorMsgs );
		});
		return this;
	}

	/**
	 * エディタUIで編集した内容を保存 (Client Side)
	 */
	this.saveEditorContent = function( elm, data, mod, callback, options ){
		options = options || {};
		options.message = options.message || function(msg){};//ユーザーへのメッセージテキストを送信
		var $dom = $(elm);
		var src;
		if( $dom.find('input[type=text]').length ){
			src = $dom.find('input[type=text]').val();
		}else if( editorLib == 'ace' && mod.aceEditor ){
			src = mod.aceEditor.getValue();
		}else{
			src = $dom.find('textarea').val();
		}
		src = JSON.parse( JSON.stringify(src) );

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback(src);
		}); });
		return this;
	}

	/**
	 * GPIを呼び出す (Cliend Side)
	 */
	this.callGpi = function(options, callback){
		callback = callback || function(){};
		broccoli.gpi(
			'fieldGpi',
			{
				'__fieldId__': this.__fieldId__,
				'options': options
			},
			function(result){
				// console.log(result);
				callback(result);
			}
		);
		return this;
	}

}
