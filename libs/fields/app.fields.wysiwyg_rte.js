/**
 * WYSIWYG Editor "wkrte" field
 * @see https://code.google.com/p/wkrte/
 */
module.exports = function(broccoli){
	var editors;
	// var $iframe = $('<iframe>');
	// var $textarea = px.$('<textarea>');

	/**
	 * エディタUIを生成
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var rows = 12;
		if( mod.rows ){
			rows = mod.rows;
		}
		var rtn = $('<div>')
			.append( $iframe
				.attr({
					"src": px2dtGuiEditor.path_base+'/fields/app.fields.wysiwyg_rte.form.html'
				})
				.css({'width':'100%'})
				.load(function(){
					var $this = $(this);
					var win = $this.get(0).contentWindow;
					var $textarea = win.$(win.document).find('textarea');
					$textarea.val(data);

					// ↓UTODO: この処理で落ちている
					editors = $textarea.rte({
						width: 720,
						height: 520,
						controls_rte: win.rte_toolbar,
						controls_html: win.html_toolbar
					});
					setTimeout(function(){
						$this
							.css({'height':$(win.document).find('html').height()})
						;
					}, 500);
				})
			)
		;
		// var rtn = px.$('<div>')
		// 	.append($textarea
		// 		.attr({
		// 			"name":mod.name,
		// 			"rows":rows
		// 		})
		// 		.val(data)
		// 		.css({'width':'100%','height':'auto'})
		// );

		$(elm).html(rtn);
		setTimeout(function(){
			// editors = $textarea.rte({
			// 	width: 720,
			// 	height: 520,
			// 	controls_rte: window.top.rte_toolbar,
			// 	controls_html: window.top.html_toolbar
			// });
			callback();
		}, 0);
		return;
	}

	/**
	 * エディタUIで編集した内容を保存
	 */
	this.saveEditorContent = function( elm, data, mod, callback ){
		var $dom = $(elm);
		// var win = $iframe.get(0).contentWindow;
		// var src = win.tinymce.get('tinymce_editor').getContent()
		var src = editors[0].get_content();
		if( typeof(src) !== typeof('') ){ src = ''; }
		src = JSON.parse( JSON.stringify(src) );
		callback(src);
		return;
	}


}
