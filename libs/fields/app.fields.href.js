module.exports = function(broccoli){
	var php = require('phpjs');

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = ''
		if(typeof(fieldData)===typeof('')){
			rtn = php.htmlspecialchars( fieldData ); // ←HTML特殊文字変換
			// rtn = rtn.replace(new RegExp('\r\n|\r|\n','g'), '<br />'); // ← 属性値などに使うので、改行コードは改行コードのままじゃないとマズイ。
		}
		if( mode == 'canvas' && !rtn.length ){
			rtn = '';
		}
		setTimeout(function(){ callback(rtn); }, 0);
		return;
	}

	/**
	 * エディタUIを生成
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var changeTimer;
		var blurTimer;
		function onChange(){
			clearTimeout(changeTimer);
			var $this = $(this);
			changeTimer = setTimeout(function(){
				var pages = $this.data('pages');
				var $html = $('<ul>');
				for( var idx in pages ){
					if( !pages[idx].path.match( new RegExp('^'+px.utils.escapeRegExp($this.val())) ) ){
						continue;
					}
					$html
						.append( $('<li>')
							.append( $('<a>')
								.css({
									'display':'block'
								})
								.attr({
									'href': 'javascript:;',
									'data-path': pages[idx].path
								})
								.text( pages[idx].path +' ('+pages[idx].title+')' )
								.click(function(){
									$input
										.val( $(this).attr('data-path') )
										.focus()
									;
								})
							)
						)
					;
				}
				$palatte.html('').append( $html );
			}, 100);
		}
		var $input = $('<input>')
			.attr({
				"name":mod.name
			})
			.val(data)
			// .data( 'pages', px.getCurrentProject().site.getSitemap() )
			.css({'width':'100%','height':'auto'})
			.change( onChange )
			.keyup( onChange )
			.focus(function(){
				clearTimeout( blurTimer );
				$palatte.show('fast');
			})
			.blur(function(){
				clearTimeout( blurTimer );
				blurTimer = setTimeout( function(){
					$palatte.hide();
				}, 10 );
			})
			.change()
		;
		var $palatte = $('<div>')
			.css({
				'height':200,
				'overflow':'auto',
				'position':'absolute',
				'background':'#f9f9f9',
				'opacity':'0.9',
				'width':'100%',
				'z-index': 1000
			})
			.hide()
		;
		var rtn = $('<div>')
			.append( $input )
			.append( $('<div>')
				.css({
					'position':'relative'
				})
				.click(function(){
					clearTimeout( blurTimer );
				})
				.append( $palatte )
			)
		;
		$(elm).html(rtn);
		setTimeout(function(){ callback(); }, 0);
		return;
	}

	/**
	 * エディタUIで編集した内容を保存
	 */
	this.saveEditorContent = function( elm, data, mod, callback ){
		var $dom = $(elm);
		var src = $dom.find('input').val();
		src = JSON.parse( JSON.stringify(src) );
		callback(src);
		return;
	}

}
