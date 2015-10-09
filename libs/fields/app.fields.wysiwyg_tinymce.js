/**
 * WYSIWYG Editor "TinyMCE" field
 * @see http://www.tinymce.com/
 */
module.exports = function(broccoli){
	var editors;
	// var $iframe = $('<iframe>');

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
					"src": px2dtGuiEditor.path_base+'/fields/app.fields.wysiwyg_tinymce.form.html'
				})
				.css({'width':'100%'})
				.load(function(){
					var $this = $(this);
					var win = $this.get(0).contentWindow;
					$(win.document).find('textarea').val(data);
					win.tinymce.init({
						selector:'textarea',
						plugins: "table",
						tools: "inserttable"
					});
					setTimeout(function(){
						$this
							.css({'height':$(win.document).find('html').height()})
						;
					}, 500);
				})
			)
		;

		$(elm).html(rtn);
		setTimeout(function(){ callback(); }, 0);
		return;
	}

	/**
	 * エディタUIが描画されたら呼ばれるコールバック
	 */
	this.onEditorUiDrawn = function( $dom, mod, data ){
		// window.top.tinymce = tinymce;
		return;
	}

	/**
	 * エディタUIで編集した内容を保存
	 */
	this.saveEditorContent = function( $dom, data, mod ){
		var win = $iframe.get(0).contentWindow;
		var src = win.tinymce.get('tinymce_editor').getContent()
		if( typeof(src) !== typeof('') ){ src = ''; }
		src = JSON.parse( JSON.stringify(src) );
		return src;
	}


}
