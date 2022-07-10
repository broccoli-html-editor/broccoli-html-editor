module.exports = function(broccoli){

	var $ = require('jquery');
	var php = require('phpjs');
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
			rtn.editor = 'markdown';
		}
		rtn.src = rtn.src||'';
		rtn.editor = rtn.editor||'';
		return rtn;
	}

	/**
	 * エディタUIを生成
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var _this = this;
		if( typeof(data) !== typeof({}) ){
			data = {
				'src':'' + ( typeof(data) === typeof('') ? data : '' ),
				'editor':'markdown'
			};
		}
		var rows = 12;
		if( mod.rows ){
			rows = mod.rows;
		}

		var $rtn = $('<div>'),
			$formElm
		;

		if( rows == 1 ){
			$formElm = $('<input type="text" class="px2-input px2-input--block">')
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

			if( data.editor == 'text' ){
				mod.aceEditor.setTheme("ace/theme/katzenmilch");
				mod.aceEditor.getSession().setMode("ace/mode/plain_text");
			}else if( data.editor == 'markdown' ){
				mod.aceEditor.setTheme("ace/theme/github");
				mod.aceEditor.getSession().setMode("ace/mode/markdown");
			}else{
				mod.aceEditor.setTheme("ace/theme/monokai");
				mod.aceEditor.getSession().setMode("ace/mode/html");
			}

			// 編集中のコンテンツ量に合わせて、
			// AceEditor編集欄のサイズを広げる
			var updateAceHeight = function() {
				var h =
					mod.aceEditor.getSession().getScreenLength()
					* mod.aceEditor.renderer.lineHeight
					+ mod.aceEditor.renderer.scrollBar.getWidth()
				;
				if( h < mod.aceEditor.renderer.lineHeight * rows ){
					h = mod.aceEditor.renderer.lineHeight * rows;
				}
				$formElm.eq(0).height(h.toString() + "px");
				mod.aceEditor.resize();
			};

			// スクロール位置の調整
			var updateAceScroll = function() {
				var $lightbox = $formElm.closest('.broccoli__lightbox-inner-body');
				var lightbox_scrollTop = $lightbox.scrollTop();
				var lightbox_offsetTop = $lightbox.offset().top;
				var lightbox_height = $lightbox.height();
				var form_offsetTop = $formElm.offset().top;
				var selection = mod.aceEditor.getSelection();
				var cursorRow = selection.getSelectionAnchor().row;
				var cursorTop = mod.aceEditor.renderer.lineHeight * cursorRow;
				var cursorOffsetTop = form_offsetTop + cursorTop;
				var form_position_top = lightbox_scrollTop - lightbox_offsetTop + form_offsetTop;
				var focusBuffer = 120;
				if( cursorOffsetTop < 60 ){
					// 上へ行きすぎた
					$lightbox.scrollTop( form_position_top + cursorTop - focusBuffer );
				}else if( cursorOffsetTop > lightbox_height - 40 ){
					// 下へ行きすぎた
					$lightbox.scrollTop( form_position_top + cursorTop - lightbox_height + focusBuffer + 100 );
				}
			};
			mod.aceEditor.getSession().on('change', function(){
				updateAceHeight();
				updateAceScroll();
			});
			mod.aceEditor.getSelection().on('changeCursor', function(){
				updateAceHeight();
				updateAceScroll();
			});
			setTimeout(updateAceHeight, 200);

		}else{
			$formElm = $('<textarea class="px2-input px2-input--block">')
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

		$rtn
			.append( $('<p>')
				.append($('<span style="margin-right: 10px;"><label><input type="radio" name="editor-'+php.htmlspecialchars(mod.name)+'" value="" /> HTML</label></span>'))
				.append($('<span style="margin-right: 10px;"><label><input type="radio" name="editor-'+php.htmlspecialchars(mod.name)+'" value="text" /> テキスト</label></span>'))
				.append($('<span style="margin-right: 10px;"><label><input type="radio" name="editor-'+php.htmlspecialchars(mod.name)+'" value="markdown" /> Markdown</label></span>'))
			)
		;
		$rtn.find('input[type=radio][name=editor-'+mod.name+'][value="'+data.editor+'"]').attr({'checked':'checked'});

		if( editorLib == 'ace' && mod.aceEditor ){
			$rtn.find('input[type=radio][name=editor-'+mod.name+']').on('change', function(){
				var $this = $(this);
				var val = $this.val();
				if( val == 'text' ){
					mod.aceEditor.setTheme("ace/theme/katzenmilch");
					mod.aceEditor.getSession().setMode("ace/mode/plain_text");
				}else if( val == 'markdown' ){
					mod.aceEditor.setTheme("ace/theme/github");
					mod.aceEditor.getSession().setMode("ace/mode/markdown");
				}else{
					mod.aceEditor.setTheme("ace/theme/monokai");
					mod.aceEditor.getSession().setMode("ace/mode/html");
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
		if( $dom.find('input[type=text]').length ){
			data.src = $dom.find('input[type=text]').val();
		}else if( editorLib == 'ace' && mod.aceEditor ){
			data.src = mod.aceEditor.getValue();
		}else{
			data.src = $dom.find('textarea').val();
		}
		data.src = JSON.parse( JSON.stringify(data.src) );
		data.editor = $dom.find('input[type=radio][name=editor-'+mod.name+']:checked').val();

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback(data);
		}); });
		return;
	}

	/**
	 * エディタUIで編集した内容を検証する (Client Side)
	 */
	this.validateEditorContent = function( elm, mod, callback ){
		var $dom = $(elm);
		// console.log($dom.html());
		if(typeof(data) !== typeof({})){
			data = {};
		}
		if( $dom.find('input[type=text]').length ){
			data.src = $dom.find('input[type=text]').val();
		}else if( editorLib == 'ace' && mod.aceEditor ){
			data.src = mod.aceEditor.getValue();
		}else{
			data.src = $dom.find('textarea').val();
		}
		data.src = JSON.parse( JSON.stringify(data.src) );
		data.editor = $dom.find('input[type=radio][name=editor-'+mod.name+']:checked').val();

		// Validation
		broccoli.validate((mod.label||mod.name), data.src, mod.validate, mod, function(errorMsgs){
			callback( errorMsgs );
		});
		return this;
	}

}
