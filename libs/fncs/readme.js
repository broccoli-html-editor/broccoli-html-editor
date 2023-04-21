/**
 * readme.js
 */
module.exports = function(broccoli){
	delete(require.cache[require('path').resolve(__filename)]);
    var _this = this;
	var path = require('path');
	var fs = require('fs');
	var utils79 = require('utils79');

	function isFile(path){
		if( !fs.existsSync(path) || !fs.statSync(path).isFile() ){
			return false;
		}
		return true;
	}
	function base64_encode( bin ){
		var base64 = bin.toString('base64');
		return base64;
	}
	function trim(text){
		text = text.replace(/^\s*/i, '');
		text = text.replace(/\s*$/i, '');
		return text;
	}
	function htmlspecialchars(text){
		text = text.split(/\&/).join('&amp;');
		text = text.split(/\"/).join('&quot;');
		text = text.split(/\</).join('&lt;');
		text = text.split(/\>/).join('&gt;');
		return text;
	}
	function htmlspecialchars_decode(text){
		text = text.split(/\&gt\;/).join('>');
		text = text.split(/\&lt\;/).join('<');
		text = text.split(/\&quot\;/).join('"');
		text = text.split(/\&amp\;/).join('&');
		return text;
	}

	/**
	 * READMEをHTMLコードとして取得する
	 */
	this.get_html = function($realpath_module){
		var realpathReadme = path.resolve( $realpath_module, 'README' );
		var readme = '';
		var $langs = [
			'-' + broccoli.lb.lang,
			'',
		];

		try{
			readme = '';
			for( var idx in $langs ){
				var $lang_prefix = $langs[idx];
				if( isFile(realpathReadme+$lang_prefix+'.html') ){
					readme = fs.readFileSync( realpathReadme+$lang_prefix+'.html' ).toString();
					break;
				}else if( isFile(realpathReadme+$lang_prefix+'.md') ){
					readme = fs.readFileSync( realpathReadme+$lang_prefix+'.md' ).toString();
					var marked = require('marked');
					marked.setOptions({
						renderer: new marked.Renderer(),
						gfm: true,
						headerIds: false,
						tables: true,
						breaks: false,
						pedantic: false,
						sanitize: false,
						smartLists: true,
						smartypants: false,
						xhtml: true
					});
					readme = marked.parse(readme);
					break;
				}
			}
		} catch (e) {
			readme = '';
		}


		readme = bind_images(readme, $realpath_module);
		readme = sanitize(readme);

		return readme;
	}

	/**
	 * READMEに画像を統合する
	 */
	function bind_images($html, $realpath_module){
		var $rtn = '';
		while(1){
			if( !$html.match(/^([\s\S]*?\<img\s[\s\S]*?)src\=\"([\s\S]*?)\"([\s\S]*?\>[\s\S]*)$/si) ){
				$rtn += $html;
				break;
			}
			$rtn += RegExp.$1;
			var $img_src = RegExp.$2;
			$html = RegExp.$3;

			if( !$img_src.match(/^[a-zA-Z0-9]+\:/si) && isFile($realpath_module+'/'+$img_src) ){
				var $ext = $img_src.split( /^[\s\S]*?\.([a-zA-Z0-9\_\-]+)$/si).join(RegExp.$1);
				$ext = $ext.toLowerCase();
				var $mime = 'image/png';
				switch( $ext ){
					// styles
					case 'css': $mime = 'text/css'; break;
					// images
					case 'png': $mime = 'image/png'; break;
					case 'gif': $mime = 'image/gif'; break;
					case 'jpg': case 'jpeg': case 'jpe': $mime = 'image/jpeg'; break;
					case 'webp': $mime = 'image/webp'; break;
					case 'svg': $mime = 'image/svg+xml'; break;
					// fonts
					case 'eot': $mime = 'application/vnd.ms-fontobject'; break;
					case 'woff': $mime = 'application/x-woff'; break;
					case 'otf': $mime = 'application/x-font-opentype'; break;
					case 'ttf': $mime = 'application/x-font-truetype'; break;
				}
				var $bin = fs.readFileSync($realpath_module+'/'+$img_src);
				$img_src = 'data:'+$mime+';base64,'+base64_encode($bin);
			}
			$rtn += 'src="'+($img_src)+'"';
		}
		return $rtn;
	}

	/**
	 * README HTML の毒抜き
	 */
	function sanitize($html){

		// 禁止のタグを削除
		var $rtn = '';
		while(1){
			if( !$html.match(/^([\s\S]*?)\<\/?(?:html|head|body|title|base|script|style|link|meta|form|fieldset|output|input|isindex|keygen|select|option|optgroup|textarea|button|object|applet|param|embed|iframe|frameset|frame|font|fontbase|audio|video)(?:[\s\S]*?)\>([\s\S]*)$/si) ){
				$rtn += $html;
				break;
			}
			$rtn += RegExp.$1;
			$html = RegExp.$2;
		}

		// リンクタグを無害化
		$html = $rtn;
		var $rtn = '';
		while(1){
			if( !$html.match(/^([\s\S]*?)\<a\s+([\s\S]*?)\>([\s\S]*)$/si) ){
				$rtn += $html;
				break;
			}
			$rtn += RegExp.$1;
			var $attributes = RegExp.$2;
			$html = RegExp.$3;

			var $attrs = '';
			if($attributes.match(/href\=(\"|\')([\s\S]*?)\1/si)){
				var $href = RegExp.$2;
				$href = htmlspecialchars_decode(trim($href));
				if( $href.match(/^(?:http|https)\:\/\//si) ){
					// http, https 以外のリンクは許容しない
					// 必ず `_blank` で開く
					$attrs = ' href="'+htmlspecialchars($href)+'" target="_blank"';
				}
			}

			$rtn += '<a'+$attrs+'>';
		}

		// 属性を無害化
		$html = $rtn;
		var $rtn = '';
		while(1){
			if( !$html.match(/^([\s\S]*?)\<([a-zA-Z0-9\:\_\-]+)\s+([\s\S]*?)\>([\s\S]*)$/si) ){
				$rtn += $html;
				break;
			}

			$rtn += RegExp.$1;
			var $tagname = RegExp.$2;
			var $attributes = RegExp.$3;
			$html = RegExp.$4;

			var $attrs = ' '+trim($attributes);
			$attrs = $attrs.split(/\s+(?:on[a-zA-Z]*|data\-[\S]*|xmlns|style|class|challenge|allowpaymentrequest|formaction|form|for|name|crossorigin)(?:\=(\"|\')(?:[\s\S]*?)\1)?/si).join('');
			$attrs = trim($attrs);
			if( $attrs.length ){
				$attrs = ' '+$attrs;
			}
			$rtn += '<'+trim($tagname)+$attrs+'>';
		}

		return $rtn;
	}

	return;
}
