/**
 * resourceMgr.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);

	var path = require('path');
	var fs = require('fs');
	var php = require('phpjs');
	var DIRECTORY_SEPARATOR = '/';

	var _this = this;
	var _resourcesDirPath;
	var _resourcesPublishDirPath;
	var _dataJsonPath;

	var _resourceDb = {};

	function isFile(path){
		if( !fs.existsSync(path) || !fs.statSync(path).isFile() ){
			return false;
		}
		return true;
	}
	function isDirectory(path){
		if( !fs.existsSync(path) || !fs.statSync(path).isDirectory() ){
			return false;
		}
		return true;
	}
	function ls(path){
		if( !isDirectory(path) ){ return false; }
		return fs.readdirSync(path);
	}
	function rm(path){
		if( isDirectory(path) ){ return false; }
		if( !isFile(path) ){ return true; }
		fs.unlinkSync(path);
		return !isFile(path);
	}
	function mkdir(path){
		if( fs.existsSync(path) ){
			return true;
		}
		fs.mkdirSync(path, 0777);
		return true;
	}
	function rmdir_r( $path ){
		$path = fs.realpathSync( $path );

		if( isFile( $path ) ){
			// ファイルまたはシンボリックリンクの場合の処理
			// ディレクトリ以外は削除できません。
			return false;

		}else if( isDirectory( $path ) ){
			// ディレクトリの処理
			var $filelist = this.ls($path);
			for( var idx in $filelist ){
				var $basename = $filelist[idx];
				if( isFile( $path+DIRECTORY_SEPARATOR+$basename ) ){
					if( !rm( $path+DIRECTORY_SEPARATOR+$basename ) ){
						console.log('FAILED to delete file: '+ $path+DIRECTORY_SEPARATOR+$basename);
					}
				}else if( isDirectory( $path+DIRECTORY_SEPARATOR+$basename ) ){
					if( !rmdir_r( $path+DIRECTORY_SEPARATOR+$basename ) ){
						console.log('FAILED to delete directory: '+ $path+DIRECTORY_SEPARATOR+$basename);
					}
				}
			}
			return rmdir( $path );
		}

		return false;
	}//rmdir_r()

	/**
	 * initialize resource Manager
	 */
	this.init = function( callback ){
		_dataJsonPath = path.resolve( broccoli.realpathDataDir, 'data.json' );
		_resourcesDirPath = path.resolve(broccoli.realpathDataDir, 'resources/')+'/';
		_resourcesPublishDirPath = broccoli.realpathResourceDir;
		loadResourceList( function(){
			callback();
		} );
		return this;
	}

	/**
	 * Loading resource list
	 */
	function loadResourceList( callback ){
		_resourceDb = {};
		if( !isDirectory( _resourcesDirPath ) ){
			mkdir( _resourcesDirPath );
		}

		var list = fs.readdirSync( _resourcesDirPath );
		for( var idx in list ){
			var resKey = list[idx];
			if( !isDirectory( _resourcesDirPath+'/'+resKey ) ){ continue; }
			_resourceDb[resKey] = {};
			if( isFile( _resourcesDirPath+'/'+resKey+'/res.json' ) ){
				var jsonStr = fs.readFileSync( _resourcesDirPath+'/'+resKey+'/res.json' );
				_resourceDb[resKey] = JSON.parse( jsonStr );
			}
		}
		callback();
		return;
	}

	/**
	 * save resources
	 * @param  {Function} cb Callback function.
	 * @return {boolean}     Always true.
	 */
	this.save = function( cb ){
		cb = cb || function(){};

		if( isDirectory( _resourcesPublishDirPath ) ){
			// 公開リソースディレクトリを一旦削除
			rmdir_r( _resourcesPublishDirPath );
		}
		if( !isDirectory( _resourcesPublishDirPath ) ){
			// 公開リソースディレクトリ作成
			mkdir( _resourcesPublishDirPath );
		}

		// 使われていないリソースを削除
		var jsonSrc = fs.readFileSync( _dataJsonPath );
		jsonSrc = JSON.parse( JSON.stringify(jsonSrc.toString()) );
		for( var resKey in _resourceDb ){
			if( !jsonSrc.match(resKey) ){// TODO: JSONファイルを文字列として検索しているが、この方法は完全ではない。
				this.removeResource(resKey);
			}
		}

		// リソースデータの保存と公開領域への設置
		for( var resKey in _resourceDb ){
			mkdir( _resourcesDirPath+'/'+resKey );
			fs.writeFileSync(
				_resourcesDirPath+'/'+resKey+'/res.json',
				JSON.stringify( _resourceDb[resKey], null, 1 )
			);

			if(_resourceDb[resKey].base64){
				var bin = new Buffer(_resourceDb[resKey].base64, 'base64');
				fs.writeFileSync(
					_resourcesDirPath+'/'+resKey+'/bin.'+_resourceDb[resKey].ext,
					bin
				);

				// 公開ファイル
				if( !_resourceDb[resKey].isPrivateMaterial ){
					var filename = resKey;
					if( typeof(_resourceDb[resKey].publicFilename) == typeof('') && _resourceDb[resKey].publicFilename.length ){
						filename = _resourceDb[resKey].publicFilename;
					}
					fs.writeFileSync(
						_resourcesPublishDirPath+'/'+filename+'.'+_resourceDb[resKey].ext,
						bin
					);
				}
			}
		}
		cb();
		return true;
	}

	/**
	 * add resource
	 * リソースの登録を行い、resKeyを生成して返す。
	 */
	this.addResource = function(){
		var newResKey;
		while(1){
			newResKey = php.md5( (new Date).getTime() );
			if( typeof(_resourceDb[newResKey]) === typeof({}) ){
				// 登録済みの resKey
				continue;
			}
			_resourceDb[newResKey] = {};//予約
			break;
		}
		return newResKey;
	}

	/**
	 * get resource
	 */
	this.getResource = function( resKey ){
		if( typeof(_resourceDb[resKey]) !== typeof({}) ){
			// 未登録の resKey
			return false;
		}
		return _resourceDb[resKey];
	}

	/**
	 * duplicate resource
	 * @return 複製された新しいリソースのキー
	 */
	this.duplicateResource = function( resKey ){
		if( typeof(_resourceDb[resKey]) !== typeof({}) ){
			// 未登録の resKey
			return false;
		}
		var newResKey = this.addResource();
		_resourceDb[newResKey] = JSON.parse( JSON.stringify( _resourceDb[resKey] ) );
		fsEx.copySync( _resourcesDirPath+'/'+resKey, _resourcesDirPath+'/'+newResKey );
		return newResKey;
	}

	/**
	 * update resource
	 * @param  {string} resKey  Resource Key
	 * @param  {object} resInfo Resource Information.
	 * <dl>
	 * <dt>ext</dt><dd>ファイル拡張子名。</dd>
	 * <dt>type</dt><dd>mimeタイプ。</dd>
	 * <dt>base64</dt><dd>ファイルのBase64エンコードされた値</dd>
	 * <dt>publicFilename</dt><dd>公開時のファイル名</dd>
	 * <dt>isPrivateMaterial</dt><dd>非公開ファイル。</dd>
	 * </dl>
	 * @param  {string} realpath Resource Realpath. - ファイルが置かれていた絶対パス
	 * @return {boolean}        always true.
	 */
	this.updateResource = function( resKey, resInfo, realpath ){
		if( typeof(_resourceDb[resKey]) !== typeof({}) ){
			// 未登録の resKey
			return false;
		}
		_resourceDb[resKey] = resInfo;

		if(realpath){
			var bin = fs.readFileSync( realpath, {} );
			_resourceDb[resKey].base64 = php.base64_encode( bin );
		}

		return true;
	}

	/**
	 * Reset bin from base64
	 */
	this.resetBinFromBase64 = function( resKey ){
		if( typeof(_resourceDb[resKey]) !== typeof({}) ){
			// 未登録の resKey
			return false;
		}
		var realpath = this.getResourceOriginalRealpath( resKey );

		var bin = php.base64_decode( _resourceDb[resKey].base64 );
		return fs.writeFileSync( realpath, bin, {} );
	}

	/**
	 * Reset base64 from bin
	 */
	this.resetBase64FromBin = function( resKey ){
		if( typeof(_resourceDb[resKey]) !== typeof({}) ){
			// 未登録の resKey
			return false;
		}
		var realpath = this.getResourceOriginalRealpath( resKey );

		var bin = fs.readFileSync( realpath, {} );
		_resourceDb[resKey].base64 = php.base64_encode( bin );

		return true;
	}

	/**
	 * get resource public path
	 */
	this.getResourcePublicPath = function( resKey ){
		var res = this.getResource( resKey );
		var filename = resKey;
		if( typeof(res.publicFilename) == typeof('') && res.publicFilename.length ){
			filename = res.publicFilename;
		}
		var contentsPath = broccoli.options.pathHtml;
		var resourcesPublishDirPath = broccoli.options.pathResourceDir;
		var rtn = './'+path.relative(path.dirname(contentsPath), resourcesPublishDirPath+'/'+filename+'.'+res.ext);
		return rtn;
	}

	/**
	 * get resource public path
	 */
	this.getResourceOriginalRealpath = function( resKey ){
		var res = this.getResource( resKey );
		var rtn = _resourcesDirPath+'/'+resKey+'/bin.'+_resourceDb[resKey].ext;
		return rtn;
	}

	/**
	 * remove resource
	 */
	this.removeResource = function( resKey ){
		_resourceDb[resKey] = undefined;
		delete( _resourceDb[resKey] );
		if( isDirectory(_resourcesDirPath+'/'+resKey+'/') ){
			rmdir_r( _resourcesDirPath+'/'+resKey+'/' );
		}
		return true;
	}

}
