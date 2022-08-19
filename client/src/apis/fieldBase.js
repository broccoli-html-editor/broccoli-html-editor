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
		if(window.CodeMirror){
			editorLib = 'codemirror';
		}
		else if(window.ace){
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
					if( typeof(fieldData)===typeof({}) && fieldData.src ){
						rtn = utils79.toStr(fieldData.src);
					}else{
						rtn = utils79.toStr(fieldData);
					}
				} catch (e) {
					rtn = '[error]';
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
		return;
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
		var presetString = data;
		if( typeof(presetString) === typeof({}) && presetString.src !== undefined ){
			presetString = presetString.src;
		}

		if( rows == 1 ){
			$formElm = $('<input type="text" class="px2-input px2-input--block">')
				.attr({
					"name": mod.name
				})
				.val(presetString)
				.css({'width':'100%'})
			;
			$rtn.append( $formElm );

		}else if( editorLib == 'codemirror' ){
			$formElm = $('<textarea>')
				.attr({
					"name": mod.name,
					"rows": rows,
				})
				.css({
					'width':'100%',
					'height':'auto'
				})
				.val(presetString)
			;
			$rtn.append( $formElm );

			// CodeMirror は、 textarea が DOMツリーに配置されたあとに初期化する。
			// なので、ここではまだ初期化しない。

		}else if( editorLib == 'ace' ){
			$formElm = $('<div>')
				.text(presetString)
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
					'height':'auto',
				})
				.val(presetString)
			;
			$rtn.append( $formElm );

		}
		$(elm).html($rtn);

		if( editorLib == 'codemirror' && rows > 1 ){
			// CodeMirror は、 textarea が DOMツリーに配置されたあとに初期化する。
			mod.codeMirror = CodeMirror.fromTextArea(
				$formElm.get(0),
				{
					lineNumbers: true,
					mode: (function(ext){
						switch(ext){
							case 'php': return 'php'; break;
							case 'html': return 'htmlmixed'; break;
							case 'markdown': return 'markdown'; break;
						}
						return 'text';
					})(mod.type),
					tabSize: 4,
					indentUnit: 4,
					indentWithTabs: true,
					styleActiveLine: true,
					showCursorWhenSelecting: true,
					lineWrapping : true,

					extraKeys: {
						"Ctrl-E": "autocomplete",
						"Ctrl-S": function(){
							mod.codeMirror.save();
						},
						"Cmd-S": function(){
							mod.codeMirror.save();
						},
					},

					theme: (function(ext){
						switch(ext){
							case 'markdown': return 'ttcn';break;
						}
						return 'monokai';
					})(mod.type),
				}
			);
			mod.codeMirror.on('blur',function(){
				mod.codeMirror.save();
			});
			mod.codeMirror.setSize('100%', rows * 16);

			// 編集中のコンテンツ量に合わせて、
			// CodeMirror編集欄のサイズを広げる
			var updateCodeMirrorHeight = function() {
				var h =
					mod.codeMirror.getDoc().lineCount()
					* mod.codeMirror.defaultTextHeight()
				;
				if( h < mod.codeMirror.defaultTextHeight() * rows ){
					h = mod.codeMirror.defaultTextHeight() * rows;
				}
				mod.codeMirror.setSize(null, h.toString() + "px");
				mod.codeMirror.refresh();
			};

			// スクロール位置の調整
			var updateCodeMirrorScroll = function() {
				var $lightbox = $formElm.closest('.broccoli__lightbox-inner-body');
				var lightbox_scrollTop = $lightbox.scrollTop();
				var lightbox_offsetTop = $lightbox.offset().top;
				var lightbox_height = $lightbox.height();
				var form_offsetTop = $formElm.offset().top;
				var cursorTop = mod.codeMirror.cursorCoords().top;
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
			mod.codeMirror.on('change', function(){
				updateCodeMirrorHeight();
				updateCodeMirrorScroll();
				mod.codeMirror.save();
			});
			mod.codeMirror.on('cursorActivity', function(){
				updateCodeMirrorHeight();
				updateCodeMirrorScroll();
			});
			setTimeout(updateCodeMirrorHeight, 200);
		}

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback();
		}); });
		return;
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
		return;
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
		return;
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
		return;
	}


	/**
	 * エディタUIで編集した内容を検証する (Client Side)
	 */
	this.validateEditorContent = function( elm, mod, callback ){
		var $dom = $(elm);
		var src = '';
		if( $dom.find('input[type=text]').length ){
			src = $dom.find('input[type=text]').val();
		}else if( editorLib == 'codemirror' && mod.codeMirror ){
			src = $dom.find('textarea').val();
		}else if( editorLib == 'ace' && mod.aceEditor ){
			src = mod.aceEditor.getValue();
		}else if( $dom.find('textarea').length ){
			src = $dom.find('textarea').val();
		}
		src = JSON.parse( JSON.stringify(src) );

		var rules = mod.validate;
		var attr = (mod.label || mod.name);

		// Validation
		broccoli.validate(attr, src, rules, mod, function(errorMsgs){
			callback( errorMsgs );
		});
		return;
	}

	/**
	 * エディタUIで編集した内容を保存 (Client Side)
	 */
	this.saveEditorContent = function( elm, data, mod, callback, options ){
		options = options || {};
		options.message = options.message || function(msg){};//ユーザーへのメッセージテキストを送信
		var $dom = $(elm);
		var src = '';
		if( $dom.find('input[type=text]').length ){
			src = $dom.find('input[type=text]').val();
		}else if( editorLib == 'codemirror' && mod.codeMirror ){
			src = $dom.find('textarea').val();
		}else if( editorLib == 'ace' && mod.aceEditor ){
			src = mod.aceEditor.getValue();
		}else if( $dom.find('textarea').length ){
			src = $dom.find('textarea').val();
		}
		src = JSON.parse( JSON.stringify(src) );

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback(src);
		}); });
		return;
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
		return;
	}

}
