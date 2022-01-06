<?php
/**
 * broccoli-html-editor
 */
namespace broccoliHtmlEditor;

/**
 * README Processor
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class fncs_readme{

	private $broccoli;

	/**
	 * Constructor
	 */
	public function __construct($broccoli){
		$this->broccoli = $broccoli;
	}

	/**
	 * READMEをHTMLコードとして取得する
	 * @param string $realpath_module モジュールのパス
	 * @return string READMEのHTMLコード
	 */
	public function get_html($realpath_module){
		$realpathReadme = $this->broccoli->fs()->normalize_path($this->broccoli->fs()->get_realpath( $realpath_module.'/README' ));
		$readme = '';
		$langs = array(
			'-'.$this->broccoli->lb()->lang,
			'',
		);
		foreach( $langs as $lang_prefix ){
			if( is_file($realpathReadme.$lang_prefix.'.html') ){
				$readme = file_get_contents( $realpathReadme.$lang_prefix.'.html' );
				break;
			}elseif( is_file($realpathReadme.$lang_prefix.'.md') ){
				$readme = file_get_contents( $realpathReadme.$lang_prefix.'.md' );
				$readme = \Michelf\MarkdownExtra::defaultTransform($readme);
				break;
			}
		}

		$readme = $this->bind_images($readme, $realpath_module);
		$readme = $this->sanitize($readme);

		return $readme;
	}

	/**
	 * READMEに画像を統合する
	 * @param string $html HTML
	 * @param string $realpath_module モジュールのパス
	 * @return string 統合済みのHTMLコード
	 */
	private function bind_images($html, $realpath_module){
		$rtn = '';
		while(1){
			if( !preg_match('/^(.*?\<img\s.*?)src\=\"(.*?)\"(.*?\>.*)$/si', $html, $matched) ){
				$rtn .= $html;
				break;
			}
			$rtn .= $matched[1];
			$img_src = $matched[2];
			$html = $matched[3];

			if( !preg_match('/^[a-zA-Z0-9]+\:/si', $img_src) && is_file($realpath_module.'/'.$img_src) ){
				$ext = preg_replace( '/^[\s\S]*?\.([a-zA-Z0-9\_\-]+)$/', '$1', $img_src );
				$ext = strtolower($ext);
				$mime = 'image/png';
				switch( $ext ){
					// styles
					case 'css': $mime = 'text/css'; break;
					// images
					case 'png': $mime = 'image/png'; break;
					case 'gif': $mime = 'image/gif'; break;
					case 'jpg': case 'jpeg': case 'jpe': $mime = 'image/jpeg'; break;
					case 'svg': $mime = 'image/svg+xml'; break;
					// fonts
					case 'eot': $mime = 'application/vnd.ms-fontobject'; break;
					case 'woff': $mime = 'application/x-woff'; break;
					case 'otf': $mime = 'application/x-font-opentype'; break;
					case 'ttf': $mime = 'application/x-font-truetype'; break;
				}
				$bin = file_get_contents($realpath_module.'/'.$img_src);
				$img_src = 'data:'.$mime.';base64,'.base64_encode($bin);
			}
			$rtn .= 'src="'.htmlspecialchars($img_src).'"';
		}
		return $rtn;
	}

	/**
	 * README HTML の毒抜き
	 * @param string $html HTML
	 * @return string 加工後のHTMLコード
	 */
	private function sanitize($html){

		// 禁止のタグを削除
		$rtn = '';
		while(1){
			if( !preg_match('/^(.*?)\<\/?(?:html|head|body|title|base|script|style|link|meta|form|fieldset|output|input|isindex|keygen|select|option|optgroup|textarea|button|object|applet|param|embed|iframe|frameset|frame|font|fontbase|audio|video)(?:.*?)\>(.*)$/si', $html, $matched) ){
				$rtn .= $html;
				break;
			}
			$rtn .= $matched[1];
			$html = $matched[2];
		}

		// リンクタグを無害化
		$html = $rtn;
		$rtn = '';
		while(1){
			if( !preg_match('/^(.*?)\<a\s+(.*?)\>(.*)$/si', $html, $matched) ){
				$rtn .= $html;
				break;
			}
			$rtn .= $matched[1];
			$attributes = $matched[2];
			$html = $matched[3];

			$attrs = '';
			if(preg_match('/href\=(\"|\')(.*?)\1/si', $attributes, $matched)){
				$href = $matched[2];
				$href = htmlspecialchars_decode(trim($href));
				if( preg_match('/^(?:http|https)\:\/\//si', $href) ){
					// http, https 以外のリンクは許容しない
					// 必ず `_blank` で開く
					$attrs = ' href="'.htmlspecialchars($href).'" target="_blank"';
				}
			}

			$rtn .= '<a'.$attrs.'>';
		}

		// 属性を無害化
		$html = $rtn;
		$rtn = '';
		while(1){
			if( !preg_match('/^(.*?)\<([a-zA-Z0-9\:\_\-]+)\s+(.*?)\>(.*)$/si', $html, $matched) ){
				$rtn .= $html;
				break;
			}
			$rtn .= $matched[1];
			$tagname = $matched[2];
			$attributes = $matched[3];
			$html = $matched[4];

			$attrs = ' '.trim($attributes);
			$attrs = preg_replace('/\s+(?:on[a-zA-Z]*|data\-[\S]*|xmlns|style|class|challenge|allowpaymentrequest|formaction|form|for|name|crossorigin)(?:\=(\"|\')(?:.*?)\1)?/si', '', $attrs);
			$attrs = trim(''.$attrs);
			if( strlen($attrs) ){
				$attrs = ' '.$attrs;
			}
			$rtn .= '<'.trim($tagname).$attrs.'>';
		}

		return $rtn;
	}

}
