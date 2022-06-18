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
	var glob = require('glob');
	var fs = require('fs');
	var sass;
	try {
		sass = require('node-sass');
	} catch (e) {
		console.error('Failed to load "node-sass"', e);
	}

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

						var $tmp_bin = fs.readFileSync( $path ).toString();
						if( $path.match( new RegExp('\\.scss$', 'i') ) ){
							// console.log($tmp_bin);

							try {
								$tmp_bin = sass.renderSync({
									'file': $path,
									'data': $tmp_bin
								});
								$tmp_bin = $tmp_bin.css.toString();
							} catch (e) {
								console.error('Failed to process "SASS" content.', e);
								callback(false);
								return;
							}
						}

						$tmp_bin = php.trim( $tmp_bin );
						if( !$tmp_bin.length ){ it2.next(); return; }

						$rtn += '/**'+"\n";
						$rtn += ' * module: '+$packageId+':'+$matched[1]+'/'+$matched[2]+"\n";
						$rtn += ' */'+"\n";

						buildCssResources( $path, $tmp_bin, function( $tmp_bin ){
							$rtn += php.trim( $tmp_bin )+"\n"+"\n";
							// $rtn += "\n"+"\n";
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
				// console.log($rtn);
				$rtn = php.trim($rtn)+"\n";
				callback($rtn);
				return;
			}
		);

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
		for( var $packageId in module_templates ){
			$array_files = glob.sync(module_templates[$packageId]+"**/**/module.js");

			for( var idx in $array_files ){
				var $path = $array_files[idx];
				var bin = php.trim( fs.readFileSync( $path ).toString() );
				if( !bin.length ){continue;}

				var $matched = $path.match( new RegExp('\\/([a-zA-Z0-9\\.\\-\\_]+?)\\/([a-zA-Z0-9\\.\\-\\_]+?)\\/[a-zA-Z0-9\\.\\-\\_]+?$','i') );

				// console.log($path);
				// console.log($matched);

				$rtn += '/**'+"\n";
				$rtn += ' * module: '+$packageId+':'+$matched[1]+'/'+$matched[2]+"\n";
				$rtn += ' */'+"\n";

				$rtn += 'try{'+"\n";
				$rtn += '	(function(){'+"\n"+"\n";
				$rtn += bin+"\n"+"\n";
				$rtn += '	})();'+"\n"+"\n";
				$rtn += '}catch(err){'+"\n";
				$rtn += '	console.error(\'Module Error:\', '+JSON.stringify($packageId+':'+$matched[1]+'/'+$matched[2])+', err);'+"\n";
				$rtn += '}'+"\n"+"\n"+"\n";
			}
		}


		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			$rtn = php.trim($rtn)+"\n";
			callback($rtn);
		}); });
		return this;
	}


	return;
}
