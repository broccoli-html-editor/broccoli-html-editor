<?php
/**
 * broccoli-html-editor
 */
namespace broccoliHtmlEditor;

/**
 * README Helper
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class helper_readme{

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
		if( is_file($realpathReadme.'.html') ){
			$readme = file_get_contents( $realpathReadme.'.html' );
		}elseif( is_file($realpathReadme.'.md') ){
			$readme = file_get_contents( $realpathReadme.'.md' );
			$readme = \Michelf\MarkdownExtra::defaultTransform($readme);
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
			if( !preg_match('/^(.*?)\<\/?(?:script|style|link|meta|form|input|select|option|textarea|button|object|embed|iframe)(?:.*?)\>(.*)$/si', $html, $matched) ){
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
			if(preg_match('/href\=(\"|\')(.*?)\1/', $attributes, $matched)){
				$href = $matched[2];
				$href = htmlspecialchars_decode(trim($href));
				if( preg_match('/^(?:http|https)\:\/\//', $href) ){
					// http, https 以外のリンクは許容しない
					// 必ず `_blank` で開く
					$attrs = ' href="'.htmlspecialchars($href).'" target="_blank"';
				}
			}

			$rtn .= '<a'.$attrs.'>';
		}

		return $rtn;
	}

}
