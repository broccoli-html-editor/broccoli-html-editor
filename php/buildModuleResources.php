<?php
/**
 * broccoli-html-editor
 */
namespace broccoliHtmlEditor;

/**
 * buildModuleResources
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class buildModuleResources{

	/** $broccoli */
	private $broccoli;

	/**
	 * Constructor
	 */
	public function __construct($broccoli){
		$this->broccoli = $broccoli;
	}

	/**
	 * ドキュメントモジュール定義のスタイルを統合
	 */
	public function buildCss(){
		$rtn = '';

		$array_files = array();
		$module_templates = $this->broccoli->options['paths_module_template'];
		foreach( $module_templates as $idx=>$row ){
			$array_files[$idx] = array();
			$array_files[$idx] = array_merge( $array_files[$idx], glob($module_templates[$idx]."**/**/module.css") );
			$array_files[$idx] = array_merge( $array_files[$idx], glob($module_templates[$idx]."**/**/module.css.scss") );
		}

		foreach($array_files as $packageId=>$array_files_row){
			foreach($array_files_row as $idx=>$path){

				preg_match('/\/([a-zA-Z0-9\.\-\_]+?)\/([a-zA-Z0-9\.\-\_]+?)\/[a-zA-Z0-9\.\-\_]+?$/i', $this->broccoli->fs()->normalize_path($path), $matched);

				$tmp_bin = file_get_contents( $path );

				if( preg_match( '/\.scss$/i', $path ) ){
					$scss = null;
					if (class_exists('\ScssPhp\ScssPhp\Compiler')) {
						$scss = new \ScssPhp\ScssPhp\Compiler();
					} elseif (class_exists('\Leafo\ScssPhp\Compiler')) {
						$scss = new \Leafo\ScssPhp\Compiler();
					}else{
						trigger_error('SCSS Proccessor is NOT available.');
						continue;
					}
					if( method_exists( $scss, 'compileString' ) ){
						$tmp_bin = $scss->compileString( $tmp_bin )->getCss();
					}elseif( method_exists( $scss, 'compile' ) ){
						// 古い ScssPhp への対応
						$tmp_bin = $scss->compile( $tmp_bin );
					}
				}

				$tmp_bin = trim( $tmp_bin );
				if( !strlen(''.$tmp_bin) ){ continue; }

				$rtn .= '/**'."\n";
				$rtn .= ' * module: '.$packageId.':'.$matched[1].'/'.$matched[2]."\n";
				$rtn .= ' */'."\n";

				$tmp_bin = $this->buildCssResources( $path, $tmp_bin );
				$rtn .= trim( $tmp_bin )."\n"."\n";
			}
		}

		$rtn = trim($rtn)."\n";
		return $rtn;
	}

	/**
	 * CSSリソースをビルドする
	 */
	private function buildCssResources( $path, $bin ){
		$rtn = '';
		while(1){
			if( !preg_match( '/^([\s\S]*?)url\s*\(([\s\S]*?)\)([\s\S]*)$/i', $bin, $matched ) ){
				$rtn .= $bin;
				break;
			}
			$rtn .= $matched[1];
			$rtn .= 'url(';
			$originalRes = $matched[2];
			$res = trim( $originalRes );
			$bin = $matched[3];
			if( preg_match( '/^(\"|\')([\s\S]*)\1$/i', $res, $matched ) ){
				$res = trim( $matched[2] );
			}
			$res = preg_replace( '/\#[\s\S]*$/i' , '', $res);
			$res = preg_replace( '/\?[\s\S]*$/i' , '', $res);
			if( is_file( dirname($path).'/'.$res ) ){
				$rtn .= '"';
				$ext = preg_replace( '/^[\s\S]*?\.([a-zA-Z0-9\_\-]+)$/', '$1', $res );
				$ext = strtolower($ext);
				$mime = 'image/png';
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
				$res = 'data:'.$mime.';base64,'.base64_encode( file_get_contents(dirname($path).'/'.$res) );
				$rtn .= $res;
				$rtn .= '"';
			}else{
				$rtn .= $originalRes;
			}
			$rtn .= ')';

		}

		return $rtn;
	}

	/**
	 * ドキュメントモジュール定義のスクリプトを統合
	 */
	public function buildJs(){
		$rtn = '';

		$array_files = [];
		$module_templates = $this->broccoli->options['paths_module_template'];
		foreach( $module_templates as $packageId=>$package  ){
			$array_files = glob($module_templates[$packageId]."**/**/module.js");

			foreach( $array_files as $idx=>$row ){
				$path = $array_files[$idx];
				$bin = trim( ''.file_get_contents( $path ) );
				if( !strlen($bin) ){continue;}

				preg_match( '/\/([a-zA-Z0-9\.\-\_]+?)\/([a-zA-Z0-9\.\-\_]+?)\/[a-zA-Z0-9\.\-\_]+?$/i', $this->broccoli->fs()->normalize_path($path), $matched);

				$rtn .= '/**'."\n";
				$rtn .= ' * module: '.$packageId.':'.$matched[1].'/'.$matched[2]."\n";
				$rtn .= ' */'."\n";

				$rtn .= 'try{'."\n";
				$rtn .= '	(function(){'."\n"."\n";
				$rtn .= $bin."\n"."\n";
				$rtn .= '	})();'."\n"."\n";
				$rtn .= '}catch(err){'."\n";
				$rtn .= '	console.error(\'Module Error:\', '.json_encode($packageId.':'.$matched[1].'/'.$matched[2], JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE).', err);'."\n";
				$rtn .= '}'."\n"."\n"."\n";
			}
		}

		$rtn = trim($rtn)."\n";
		return $rtn;
	}

}
