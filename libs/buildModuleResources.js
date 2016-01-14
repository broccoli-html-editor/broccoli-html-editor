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
	var sass = require('node-sass');

	/**
	 * ドキュメントモジュール定義のスタイルを統合
	 */
	this.buildCss = function( callback ){
		callback = callback || function(){};
		var $rtn = '';

		var $array_files = {};
		var module_templates = broccoli.options.paths_module_template;
		for( var idx in module_templates ){
			$array_files[idx] = [];
			$array_files[idx] = $array_files[idx].concat( glob.sync(module_templates[idx]+"**/**/module.css") );
			$array_files[idx] = $array_files[idx].concat( glob.sync(module_templates[idx]+"**/**/module.css.scss") );
		}
		// console.log($array_files);

		for( var $packageId in $array_files ){
			var $array_files_row = $array_files[$packageId];

			for( var idx in $array_files_row ){
				var $path = $array_files_row[idx];
				$matched = $path.match( new RegExp('\\/([a-zA-Z0-9\\.\\-\\_]+?)\\/([a-zA-Z0-9\\.\\-\\_]+?)\\/[a-zA-Z0-9\\.\\-\\_]+?$','i') );

				// console.log($path);
				// console.log($matched);

				$rtn += '/**'+"\n";
				$rtn += ' * module: '+$packageId+':'+$matched[1]+'/'+$matched[2]+"\n";
				$rtn += ' */'+"\n";

				var $tmp_bin = fs.readFileSync( $path ).toString();
				if( $path.match( new RegExp('\\.scss$', 'i') ) ){
					// console.log($tmp_bin);

					$tmp_bin = sass.renderSync({
						'file': $path,
						'data': $tmp_bin
					});
					$tmp_bin = $tmp_bin.css.toString();
				}

				// $tmp_bin = buildCssResources( $path, $tmp_bin );

				$rtn += $tmp_bin;
				$rtn += "\n"+"\n";
			}
		}
		// console.log($rtn);
		// $rtn = trim($rtn);

		callback($rtn);
		return this;
	}
	/**
	 * CSSリソースをビルドする (TODO: 未実装)
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

		return $rtn;
	}

	/**
	 * ドキュメントモジュール定義のスクリプトを統合
	 */
	this.buildJs = function( callback ){
		callback = callback || function(){};
		var $rtn = '';

		var $array_files = [];
		var module_templates = broccoli.options.paths_module_template;
		for( var idx in module_templates ){
			$array_files = $array_files.concat( glob.sync(module_templates[idx]+"**/**/module.js") );
		}

		for( var idx in $array_files ){
			var $path = $array_files[idx];
			 $rtn += fs.readFileSync( $path ).toString();
		}
		// $rtn = trim($rtn);

		callback($rtn);
		return this;
	}


	return;
}
