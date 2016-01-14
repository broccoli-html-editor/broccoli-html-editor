/**
 * buildModuleResources.js
 */
module.exports = function(broccoli){
	delete(require.cache[require('path').resolve(__filename)]);

	var _this = this;
	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var twig = require('twig');
	var glob = require('glob');
	var fs = require('fs');

	/**
	 * ドキュメントモジュール定義のスタイルを統合
	 */
	this.buildCss = function( callback ){
		callback = callback || function(){};
		var $rtn = '';

		// var $conf = $this->main->get_px2dtconfig();
		// var $array_files = [];
		// foreach( $conf->paths_module_template as $key=>$row ){
		// 	$array_files[$key] = [];
		// 	$array_files[$key] = array_merge( $array_files[$key], glob($row."**/**/module.css") );
		// 	$array_files[$key] = array_merge( $array_files[$key], glob($row."**/**/module.css.scss") );
		// }
		//
		// foreach( $array_files as $packageId=>$array_files_row ){
		// 	foreach( $array_files_row as $path ){
		// 		preg_match( '/\/([a-zA-Z0-9\.\-\_]+?)\/([a-zA-Z0-9\.\-\_]+?)\/[a-zA-Z0-9\.\-\_]+?$/i', $path, $matched );
		// 		$rtn += '/**'."\n";
		// 		$rtn += ' * module: '.$packageId.':'.$matched[1].'/'.$matched[2]."\n";
		// 		$rtn += ' */'."\n";
		// 		$tmp_bin = $this->px->fs()->read_file( $path );
		// 		if( $this->px->fs()->get_extension( $path ) == 'scss' ){
		// 			$tmp_current_dir = realpath('./');
		// 			chdir( dirname( $path ) );
		// 			$scss = new \scssc();
		// 			$tmp_bin = $scss->compile( $tmp_bin );
		// 			chdir( $tmp_current_dir );
		// 		}
		//
		// 		buildCssResources( $path, $tmp_bin function($tmp_bin){
		//
		// 		} );
		//
		// 		$rtn += $tmp_bin;
		// 		$rtn += "\n"."\n";
		//
		// 		unset($tmp_bin);
		// 	}
		// }
		// $rtn = trim($rtn);

		callback($rtn);
		return this;
	}
	/**
	 * CSSリソースをビルドする
	 */
	function buildCssResources( $path, $bin, callback ){
		callback = callback || function(){};

		var $rtn = '';

		// while( 1 ){
		// 	if( !preg_match( '/^(.*?)url\s*\\((.*?)\\)(.*)$/si', $bin, $matched ) ){
		// 		$rtn += $bin;
		// 		break;
		// 	}
		// 	$rtn += $matched[1];
		// 	$rtn += 'url("';
		// 	$res = trim( $matched[2] );
		// 	if( preg_match( '/^(\"|\')(.*)\1$/si', $res, $matched2 ) ){
		// 		$res = trim( $matched2[2] );
		// 	}
		// 	$res = preg_replace('/#.*$/si', '', $res);
		// 	$res = preg_replace('/\\?.*$/si', '', $res);
		// 	if( is_file( dirname($path).'/'.$res ) ){
		// 		$ext = $this->px->fs()->get_extension( dirname($path).'/'.$res );
		// 		$ext = strtolower( $ext );
		// 		$mime = 'image/png';
		// 		switch( $ext ){
		// 			// styles
		// 			case 'css': $mime = 'text/css'; break;
		// 			// images
		// 			case 'png': $mime = 'image/png'; break;
		// 			case 'gif': $mime = 'image/gif'; break;
		// 			case 'jpg': case 'jpeg': case 'jpe': $mime = 'image/jpeg'; break;
		// 			case 'svg': $mime = 'image/svg+xml'; break;
		// 			// fonts
		// 			case 'eot': $mime = 'application/vnd.ms-fontobject'; break;
		// 			case 'woff': $mime = 'application/x-woff'; break;
		// 			case 'otf': $mime = 'application/x-font-opentype'; break;
		// 			case 'ttf': $mime = 'application/x-font-truetype'; break;
		// 		}
		// 		$res = 'data:'.$mime.';base64,'.base64_encode($this->px->fs()->read_file(dirname($path).'/'.$res));
		// 	}
		// 	$rtn += $res;
		// 	$rtn += '")';
		// 	$bin = $matched[3];
		// }

		callback($rtn);
		return this;
	}

	/**
	 * ドキュメントモジュール定義のスクリプトを統合
	 */
	this.buildJs = function( callback ){
		callback = callback || function(){};
		var $rtn = '';

		// var $conf = $this->main->get_px2dtconfig();
		// var $array_files = [];
		// foreach( $conf->paths_module_template as $row ){
		// 	$array_files = array_merge( $array_files, glob($row."**/**/module.js") );
		// }
		// foreach( $array_files as $path ){
		// 	$rtn += $this->px->fs()->read_file( $path );
		// }
		// $rtn = trim($rtn);

		callback($rtn);
		return this;
	}


	return;
}
