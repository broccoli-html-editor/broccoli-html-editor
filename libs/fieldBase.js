/**
 * fieldBase.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	this.__fieldId__ = null;
	var $ = require('jquery');
	var utils79 = require('utils79');

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
	 * プレビュー用の簡易なHTMLを生成する (Server Side)
	 */
	this.mkPreviewHtml = function( fieldData, mod, callback ){
		// InstanceTreeViewで利用する
		var cheerio = require('cheerio');
		var rtn = '- not provided -';
		// console.log(fieldData.type);
		// console.log(234567890);
		this.bind(fieldData, 'finalize', mod, function(rtn){
			// console.log(rtn);
			// var $rtn = $('<div>').append(rtn);
			var $rtn = cheerio.load(rtn, {decodeEntities: false});
			$rtn('*').each(function(i, elem){
				$rtn(this)
					.removeAttr('style') //スタイル削除しちゃう
				;
			});
			$rtn('style').remove(); // styleタグも削除しちゃう
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
		var rtn = $('<div>')
			.append($('<textarea class="form-control">')
				.attr({
					"name":mod.name,
					"rows":rows
				})
				.val(data)
				.css({'width':'100%','height':'auto'})
			)
		;

		$(elm).html(rtn);
		// setTimeout(function(){
			callback();
		// }, 0);
		return this;
	}

	/**
	 * データを複製する (Client Side)
	 */
	this.duplicateData = function( data, callback ){
		callback = callback||function(){};
		data = JSON.parse( JSON.stringify( data ) );
		callback(data);
		return this;
	}

	/**
	 * エディタUIで編集した内容を保存 (Client Side)
	 */
	this.saveEditorContent = function( elm, data, mod, callback ){
		var src = $(elm).find('textarea').val();
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
