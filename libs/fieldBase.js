/**
 * fieldBase.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	var $ = require('jquery');

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = '';
		try {
			if( typeof(fieldData) === typeof([]) ){
				rtn += fieldData.join('');
			}else{
				rtn += fieldData;
			}
		} catch (e) {
			rtn += '[error]'
		}
		if( mode == 'canvas' && !rtn.length ){
			rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;white-space:nowrap;">(ダブルクリックしてHTMLコードを編集してください)</span>';
		}
		setTimeout(function(){ callback(rtn); }, 0);
		return;
	}

	/**
	 * プレビュー用の簡易なHTMLを生成する
	 */
	this.mkPreviewHtml = function( fieldData, mod ){
		// InstanceTreeViewで利用する
		var rtn = this.bind(fieldData, 'finalize', mod);
		var $rtn = $('<div>').append(rtn);
		$rtn.find('*').each(function(){
			$(this)
				.removeAttr('style') //スタイル削除しちゃう
			;
		});
		$rtn.find('style').remove(); // styleタグも削除しちゃう
		return $rtn.html();
	}

	/**
	 * データを正規化する
	 */
	this.normalizeData = function( fieldData, mode ){
		// 編集画面用にデータを初期化。
		var rtn = fieldData;
		return rtn;
	}

	/**
	 * エディタUIを生成
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var rows = 12;
		if( mod.rows ){
			rows = mod.rows;
		}
		var rtn = $('<div>')
			.append($('<textarea>')
				.attr({
					"name":mod.name,
					"rows":rows
				})
				.val(data)
				.css({'width':'100%','height':'auto'})
		);

		$(elm).html(rtn);
		setTimeout(function(){ callback(); }, 0);
		return;
	}

	/**
	 * エディタUIが描画されたら呼ばれるコールバック
	 * mkEditor() の非同期化の仕様変更に伴い、mkEditor() 内に含められるようになりました。
	 * 不要になるので、削除します。
	 */
	this.onEditorUiDrawn = function( $dom, mod, data ){
		return;
	}

	/**
	 * データを複製する
	 */
	this.duplicateData = function( data, callback ){
		data = JSON.parse( JSON.stringify( data ) );
		callback(data);
		return;
	}

	/**
	 * エディタUIで編集した内容を保存
	 */
	this.saveEditorContent = function( $dom, data, mod, callback ){
		var src = $dom.find('textarea').val();
		src = JSON.parse( JSON.stringify(src) );
		callback(src);
		return;
	}

}
