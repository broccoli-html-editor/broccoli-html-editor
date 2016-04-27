/**
 * fieldBase.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	this.__fieldId__ = null;
	var $ = require('jquery');
	var utils79 = require('utils79');
	var editorLib = null;
	try {
		if(window.ace){
			editorLib = 'ace';
		}
	} catch (e) {
	}

	/**
	 * データをバインドする (Server Side)
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = '';
		try {
			rtn = utils79.toStr(fieldData);
		} catch (e) {
			rtn = '[error]'
		}
		if( mode == 'canvas' && !rtn.length ){
			rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;white-space:nowrap;">(ダブルクリックしてHTMLコードを編集してください)</span>';
		}
		// setTimeout(function(){
			callback(rtn);
		// }, 0);
		return this;
	}

	/**
	 * プレビュー用の簡易なHTMLを生成する (Client Side)
	 * InstanceTreeViewで利用する。
	 */
	this.mkPreviewHtml = function( fieldData, mod, callback ){
		var rtn = '';
		this.bind(fieldData, 'finalize', mod, function(rtn){
			// console.log(rtn);
			var $rtn = $('<div>').append(rtn);
			$rtn.find('*').each(function(){
				$(this)
					.removeAttr('style') //スタイル削除しちゃう
				;
			});
			$rtn.find('style').remove(); // styleタグも削除しちゃう
			rtn = $rtn.html();

			callback( rtn );
		});
		return this;
	}

	/**
	 * データを正規化する (Server Side/Client Side)
	 * このメソッドは、同期的に振る舞います。
	 */
	this.normalizeData = function( fieldData, mode ){
		// 編集画面用にデータを初期化。
		var rtn = fieldData;
		return rtn;
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
			this.aceEditor = ace.edit( $formElm.get(0) );
			if( mod.type == 'html' ){
				this.aceEditor.getSession().setMode("ace/mode/html");
			}else if( mod.type == 'markdown' ){
				this.aceEditor.getSession().setMode("ace/mode/markdown");
			}else{
				this.aceEditor.getSession().setMode("ace/mode/plain_text");
			}
			this.aceEditor.$blockScrolling = Infinity;

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

		callback();
		return this;
	}

	/**
	 * エディタUIにフォーカス (Client Side)
	 */
	this.focus = function( elm, callback ){
		callback = callback || function(){};
		$(elm).find('textarea, input').eq(0).focus();
		callback();
		return this;
	}

	/**
	 * データを複製する (Client Side)
	 */
	this.duplicateData = function( data, callback, resources ){
		callback = callback||function(){};
		data = JSON.parse( JSON.stringify( data ) );
		callback(data);
		return this;
	}

	/**
	 * データから使用するリソースのリソースIDを抽出する (Client Side)
	 */
	this.extractResourceId = function( data, callback ){
		callback = callback||function(){};
		data = [];
		callback(data);
		return this;
	}


	/**
	 * エディタUIで編集した内容を保存 (Client Side)
	 */
	this.saveEditorContent = function( elm, data, mod, callback ){
		var $dom = $(elm);
		var src;
		if( $dom.find('input[type=text]').size() ){
			src = $dom.find('input[type=text]').val();
		}else if( editorLib == 'ace' && this.aceEditor ){
			src = this.aceEditor.getValue();
		}else{
			src = $dom.find('textarea').val();
		}
		src = JSON.parse( JSON.stringify(src) );

		callback(src);
		return this;
	}

	/**
	 * GPI (Server Side)
	 */
	this.gpi = function(options, callback){
		callback = callback || function(){};
		callback(options);
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
