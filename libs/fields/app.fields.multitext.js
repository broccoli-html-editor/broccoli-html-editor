module.exports = function(broccoli){

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode ){
		var rtn = ''
		if(typeof(fieldData)===typeof({}) && typeof(fieldData.src)===typeof('')){
			switch( fieldData.editor ){
				case 'text':
					rtn = px.$('<div>').text( fieldData.src ).html(); // ←HTML特殊文字変換
					rtn = rtn.replace(new RegExp('\"','g'), '&quot;'); // ← jqueryで `.html()` しても、ダブルクオートは変換してくれないみたい。
					rtn = rtn.replace(new RegExp('\r\n|\r|\n','g'), '<br />'); // ← 改行コードは改行タグに変換
					break;
				case 'markdown':
					rtn = px.utils.markdown( fieldData.src );
					break;
				case 'html':
				default:
					rtn = fieldData.src;
					break;
			}
		}
		if( mode == 'canvas' && !rtn.length ){
			rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;white-space:nowrap;">(ダブルクリックしてテキストを編集してください)</span>';
		}
		return rtn;
	}

	/**
	 * データを正規化する
	 */
	this.normalizeData = function( fieldData, mode ){
		// 編集画面用にデータを初期化。
		var rtn = {};
		if( typeof(fieldData) === typeof({}) ){
			rtn = fieldData;
		}else if( typeof(fieldData) === typeof('') ){
			rtn.src = fieldData;
			rtn.editor = 'markdown';
		}
		rtn.src = rtn.src||'';
		rtn.editor = rtn.editor||'';
		return rtn;
	}

	/**
	 * エディタUIを生成
	 */
	this.mkEditor = function( mod, data ){
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
				.css({'width':'100%','height':'auto'})
			)
			.append($('<ul class="horizontal">')
				.append($('<li class="horizontal-li"><label><input type="radio" name="editor-'+mod.name+'" value="" /> HTML</label></li>'))
				.append($('<li class="horizontal-li"><label><input type="radio" name="editor-'+mod.name+'" value="text" /> テキスト</label></li>'))
				.append($('<li class="horizontal-li"><label><input type="radio" name="editor-'+mod.name+'" value="markdown" /> Markdown</label></li>'))
			)
		;
		rtn.find('textarea').val(data.src);
		rtn.find('input[type=radio][name=editor-'+mod.name+'][value="'+data.editor+'"]').attr({'checked':'checked'});

		return rtn;
	}

	/**
	 * エディタUIが描画されたら呼ばれるコールバック
	 */
	this.onEditorUiDrawn = function( $dom, mod, data ){
		px.textEditor.attachTextEditor(
			$dom.find('textarea').get(0),
			'md'
		);
		$dom.find('.CodeMirror').css({
			'border': '1px solid #ccc',
			'border-radius': '3px'
		});
		return;
	}

	/**
	 * エディタUIで編集した内容を保存
	 */
	this.saveEditorContent = function( $dom, data, mod ){
		if(typeof(data) !== typeof({})){
			data = {};
		}
		data.src = $dom.find('textarea').val();
		data.src = JSON.parse( JSON.stringify(data.src) );
		data.editor = $dom.find('input[type=radio][name=editor-'+mod.name+']:checked').val();
		return data;
	}

}
