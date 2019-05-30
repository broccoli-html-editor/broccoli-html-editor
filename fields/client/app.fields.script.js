module.exports = function(broccoli){
	var php = require('phpjs');
	var utils79 = require('utils79');
	var editorLib = null;
	try {
		if(window.ace){
			editorLib = 'ace';
		}
	} catch (e) {
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
			rtn.lang = 'javascript';
		}
		rtn.src = rtn.src||'';
		rtn.lang = rtn.lang||'';
		return rtn;
	}

	/**
	 * エディタUIを生成
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var _this = this;
		var fixedLang = mod.lang || null;

		if( typeof(data) !== typeof({}) ){
			data = {
				'src': ''+(typeof(data) === typeof('') ? data : ''),
				'lang': (fixedLang ? fixedLang : 'javascript')
			};
		}
		if( fixedLang ){
			data.lang = fixedLang;
		}
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
				.val(data.src)
				.css({'width':'100%'})
			;
			$rtn.append( $formElm );

		}else if( editorLib == 'ace' ){
			$formElm = $('<div>')
				.text(data.src)
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

			if( data.lang == 'javascript' ){
				mod.aceEditor.setTheme("ace/theme/monokai");
				mod.aceEditor.getSession().setMode("ace/mode/javascript");
			}else if( data.lang == 'css' ){
				mod.aceEditor.setTheme("ace/theme/github");
				mod.aceEditor.getSession().setMode("ace/mode/css");
			}else if( data.lang == 'php' ){
				mod.aceEditor.setTheme("ace/theme/github");
				mod.aceEditor.getSession().setMode("ace/mode/php");
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
				.css({
					'width':'100%',
					'height':'auto'
				})
				.val(data.src)
			;
			$rtn.append( $formElm );

		}

		if( !fixedLang ){
			$rtn
				.append( $('<p>')
					.append($('<span style="margin-right: 10px;"><label><input type="radio" name="editor-'+php.htmlspecialchars(mod.name)+'" value="javascript" /> JavaScript</label></span>'))
					.append($('<span style="margin-right: 10px;"><label><input type="radio" name="editor-'+php.htmlspecialchars(mod.name)+'" value="css" /> CSS</label></span>'))
					.append($('<span style="margin-right: 10px;"><label><input type="radio" name="editor-'+php.htmlspecialchars(mod.name)+'" value="php" /> PHP</label></span>'))
					.append($('<span style="margin-right: 10px;"><label><input type="radio" name="editor-'+php.htmlspecialchars(mod.name)+'" value="" /> その他</label></span>'))
				)
			;
			$rtn.find('input[type=radio][name=editor-'+mod.name+'][value="'+data.lang+'"]').attr({'checked':'checked'});
		}

		if( editorLib == 'ace' && mod.aceEditor ){
			$rtn.find('input[type=radio][name=editor-'+mod.name+']').change(function(){
				var $this = $(this);
				var val = $this.val();
				if( val == 'javascript' ){
					mod.aceEditor.setTheme("ace/theme/monokai");
					mod.aceEditor.getSession().setMode("ace/mode/javascript");
				}else if( val == 'css' ){
					mod.aceEditor.setTheme("ace/theme/github");
					mod.aceEditor.getSession().setMode("ace/mode/css");
				}else if( val == 'php' ){
					mod.aceEditor.setTheme("ace/theme/github");
					mod.aceEditor.getSession().setMode("ace/mode/php");
				}else{
					mod.aceEditor.setTheme("ace/theme/katzenmilch");
					mod.aceEditor.getSession().setMode("ace/mode/plain_text");
				}
			});
		}

		$(elm).html($rtn);

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback();
		}); });
		return;
	}

	/**
	 * エディタUIで編集した内容を保存
	 */
	this.saveEditorContent = function( elm, data, mod, callback ){
		var $dom = $(elm);
		// console.log($dom.html());
		if(typeof(data) !== typeof({})){
			data = {};
		}
		if( $dom.find('input[type=text]').size() ){
			data.src = $dom.find('input[type=text]').val();
		}else if( editorLib == 'ace' && mod.aceEditor ){
			data.src = mod.aceEditor.getValue();
		}else{
			data.src = $dom.find('textarea').val();
		}
		data.src = JSON.parse( JSON.stringify(data.src) );
		if(mod.lang){
			data.lang = mod.lang;
		}else{
			data.lang = $dom.find('input[type=radio][name=editor-'+mod.name+']:checked').val();
		}

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback(data);
		}); });
		return;
	}

}
