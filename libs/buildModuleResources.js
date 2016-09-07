/**
 * buildModuleResources.js
 */
module.exports = function(broccoli){
	delete(require.cache[require('path').resolve(__filename)]);

	var _this = this;
	var Promise = require('es6-promise').Promise;
	var utils79 = require('utils79');
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

		it79.ary(
			$array_files,
			function(it1, $array_files_row, $packageId){

				it79.ary(
					$array_files_row,
					function(it2, $path, idx){

						var $matched = $path.match( new RegExp('\\/([a-zA-Z0-9\\.\\-\\_]+?)\\/([a-zA-Z0-9\\.\\-\\_]+?)\\/[a-zA-Z0-9\\.\\-\\_]+?$','i') );

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

						buildCssResources( $path, $tmp_bin, function( $tmp_bin ){
							$rtn += $tmp_bin;
							$rtn += "\n"+"\n";
							it2.next();
							return;
						} );
						return;
					},
					function(){
						it1.next();
						return;
					}
				);

			},
			function(){
				callback($rtn);
				return;
			}
		);

		// console.log($rtn);
		// $rtn = trim($rtn);
		return this;
	}

	/**
	 * CSSリソースをビルドする
	 */
	function buildCssResources( $path, $bin, callback ){
		callback = callback || function(){};

		var $rtn = '';

		function replaceLoop(){
			if( !$bin.match( /^([\s\S]*?)url\s*\(([\s\S]*?)\)([\s\S]*)$/i ) ){
				$rtn += $bin;
				callback( $rtn );
				return;
			}
			$rtn += RegExp.$1;
			$rtn += 'url(';
			var $originalRes = RegExp.$2;
			var $res = php.trim( $originalRes );
			$bin = RegExp.$3;
			if( $res.match( /^(\"|\')([\s\S]*)\1$/i ) ){
				$res = php.trim( RegExp.$2 );
			}
			$res = $res.replace( /\#[\s\S]*$/i , '');
			$res = $res.replace( /\?[\s\S]*$/i , '');
			if( utils79.is_file( utils79.dirname($path) + '/' + $res ) ){
				$rtn += '"';
				var $ext = $res.replace( /^[\s\S]*?\.([a-zA-Z0-9\_\-]+)$/ , '$1' );
				$ext = $ext.toLowerCase();
				var $mime = 'image/png';
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
				$res = 'data:'+$mime+';base64,'+utils79.base64_encode( fs.readFileSync(utils79.dirname($path) + '/' + $res) );
				$rtn += $res;
				$rtn += '"';
			}else{
				$rtn += $originalRes;
			}
			$rtn += ')';

			new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
				replaceLoop();
			}); });
		}

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			replaceLoop();
		}); });
		return;
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

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback($rtn);
		}); });
		return this;
	}


	return;
}
