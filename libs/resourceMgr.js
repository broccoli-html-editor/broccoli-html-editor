/**
 * resourceMgr.js
 */
module.exports = function(broccoli){
	delete(require.cache[require('path').resolve(__filename)]);

	var path = require('path');
	var fs = require('fs');
	var fsEx = require('fs-extra');
	var it79 = require('iterate79');
	var utils79 = require('utils79');
	var php = require('phpjs');
	var mkdirp = require('mkdirp');
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
		fsEx.mkdirpSync(path);
		return true;
	}
	function rmdir( path ){
		if( isFile(path) ){ return false; }
		if( !isDirectory(path) ){ return true; }
		fs.rmdirSync( path );
		return !isDirectory(path);
	}
	function rmdir_r( $path ){
		$path = fs.realpathSync( $path );

		if( isFile( $path ) ){
			// ファイルまたはシンボリックリンクの場合の処理
			// ディレクトリ以外は削除できません。
			return false;

		}else if( isDirectory( $path ) ){
			// ディレクトリの処理
			var $filelist = ls($path);
			// console.log($filelist);
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
		callback = callback || function(){};
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
		callback = callback || function(){};
		_resourceDb = {};
		try {
			if( !isDirectory( _resourcesDirPath ) ){
				// リソースディレクトリが存在しない場合、
				// この段階ではムリに作成しない。
				callback();
				return;
			}

			var list = fs.readdirSync( _resourcesDirPath );
			for( var idx in list ){
				var resKey = list[idx];
				if( !isDirectory( _resourcesDirPath+'/'+resKey ) ){ continue; }
				_resourceDb[resKey] = {};
				if( isFile( _resourcesDirPath+'/'+resKey+'/res.json' ) ){
					var jsonStr = fs.readFileSync( _resourcesDirPath+'/'+resKey+'/res.json' );
					try {
						_resourceDb[resKey] = JSON.parse( jsonStr );
					} catch (e) {
						_resourceDb[resKey] = {};
					}
				}
			}
		} catch (e) {
		}
		callback();
		return;
	}

	/**
	 * save resources
	 * @param  {Object} newResourceDb resource Database
	 * @param  {Function} callback Callback function.
	 * @return {boolean}     Always true.
	 */
	this.save = function( newResourceDb, callback ){
		callback = callback || function(){};
		_resourceDb = newResourceDb;

		function resetDirectory(dir){
			if( isDirectory( dir ) ){ // 一旦削除
				rmdir_r( dir );
			}
			if( !isDirectory( dir ) ){ // 作成
				mkdir( dir );
			}
			return;
		}
		resetDirectory(_resourcesDirPath);// 公開リソースディレクトリ 一旦削除して作成
		resetDirectory(_resourcesPublishDirPath);// 公開リソースディレクトリ 一旦削除して作成

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

			if(_resourceDb[resKey].base64 !== undefined){
				var bin = '';
				try {
					bin = new Buffer(_resourceDb[resKey].base64, 'base64');
				} catch (e) {
					bin = '';
				}

				fs.writeFileSync(
					_resourcesDirPath+'/'+resKey+'/bin.'+_resourceDb[resKey].ext,
					bin
				);

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
		callback(true);
		return this;
	}

	/**
	 * add resource
	 * リソースの登録を行い、resKeyを生成して返す。
	 */
	this.addResource = function(callback){
		callback = callback || function(){};
		var newResKey;
		while(1){
			newResKey = php.md5( (new Date).getTime() );
			if( typeof(_resourceDb[newResKey]) === typeof({}) ){
				// 登録済みの resKey
				continue;
			}
			_resourceDb[newResKey] = { //予約
				'ext': 'txt',
				'size': 0,
				'base64': '',
				'isPrivateMaterial': false,
				'publicFilename': ''
			};
			break;
		}

		var resKey = newResKey;
		if( !isDirectory( _resourcesDirPath ) ){ // 作成
			mkdir( _resourcesDirPath );
		}
		mkdir( _resourcesDirPath+'/'+resKey );
		fs.writeFileSync(
			_resourcesDirPath+'/'+resKey+'/res.json',
			JSON.stringify( _resourceDb[resKey], null, 1 )
		);
		fs.writeFileSync(
			_resourcesDirPath+'/'+resKey+'/bin.'+_resourceDb[resKey].ext,
			''
		);

		callback( newResKey );
		return this;
	}

	/**
	 * get resource DB
	 */
	this.getResourceDb = function( callback ){
		callback = callback || function(){};
		callback(_resourceDb);
		return this;
	}

	/**
	 * get resource
	 */
	this.getResource = function( resKey, callback ){
		callback = callback || function(){};
		if( typeof(_resourceDb[resKey]) !== typeof({}) ){
			// 未登録の resKey
			callback(false);
			return this;
		}
		callback(_resourceDb[resKey]);
		return this;
	}

	/**
	 * duplicate resource
	 * @return 複製された新しいリソースのキー
	 */
	this.duplicateResource = function( resKey, callback ){
		callback = callback || function(){};
		if( typeof(_resourceDb[resKey]) !== typeof({}) ){
			// 未登録の resKey
			callback(false);
			return this;
		}
		this.addResource(function(newResKey){
			_resourceDb[newResKey] = JSON.parse( JSON.stringify( _resourceDb[resKey] ) );
			fsEx.copySync( _resourcesDirPath+'/'+resKey, _resourcesDirPath+'/'+newResKey );

			callback( newResKey );
		});
		return this;
	}

	/**
	 * update resource
	 *
	 * このメソッドは、resKey が指すリソースの新しい情報を受け取り、更新します。
	 * 保存されたファイル本体とJSONを上書き保存します。
	 *
	 * @param  {string} resKey  Resource Key
	 * @param  {object} resInfo Resource Information.
	 * <dl>
	 * <dt>ext</dt><dd>ファイル拡張子名。</dd>
	 * <dt>type</dt><dd>mimeタイプ。</dd>
	 * <dt>base64</dt><dd>ファイルのBase64エンコードされた値</dd>
	 * <dt>publicFilename</dt><dd>公開時のファイル名</dd>
	 * <dt>isPrivateMaterial</dt><dd>非公開ファイル。</dd>
	 * </dl>
	 * @return {boolean}        always true.
	 */
	this.updateResource = function( resKey, resInfo, callback ){
		callback = callback || function(){};
		if( typeof(_resourceDb[resKey]) !== typeof({}) ){
			// 未登録の resKey
			callback(false);
			return this;
		}
		_resourceDb[resKey] = resInfo;

		mkdir( _resourcesDirPath+'/'+resKey );
		fs.writeFileSync(
			_resourcesDirPath+'/'+resKey+'/res.json',
			JSON.stringify( _resourceDb[resKey], null, 1 )
		);
		var bin = '';
		try {
			bin = (new Buffer(_resourceDb[resKey].base64, 'base64')).toString();
		} catch (e) {
			bin = '';
		}
		fs.writeFileSync(
			_resourcesDirPath+'/'+resKey+'/bin.'+_resourceDb[resKey].ext,
			bin
		);

		callback(true);
		return this;
	}

	/**
	 * Reset bin from base64
	 */
	this.resetBinFromBase64 = function( resKey, callback ){
		callback = callback || function(){};
		if( typeof(_resourceDb[resKey]) !== typeof({}) ){
			// 未登録の resKey
			callback(false);
			return this;
		}
		this.getResourceOriginalRealpath( resKey, function(realpath){
			// console.log(_resourceDb[resKey].base64);
			// var bin = php.base64_decode( _resourceDb[resKey].base64 );
			var bin = (new Buffer(_resourceDb[resKey].base64, 'base64'));
			fs.writeFileSync( realpath, bin, {} );
			callback(true);
		} );

		return this;
	}

	/**
	 * Reset base64 from bin
	 */
	this.resetBase64FromBin = function( resKey, callback ){
		callback = callback || function(){};
		if( typeof(_resourceDb[resKey]) !== typeof({}) ){
			// 未登録の resKey
			callback(false);
			return this;
		}
		this.getResourceOriginalRealpath( resKey, function(realpath){
			var bin = fs.readFileSync( realpath, {} );
			_resourceDb[resKey].base64 = (new Buffer(bin)).toString('base64');
			_resourceDb[resKey].size = bin.length;

			fs.writeFileSync(
				_resourcesDirPath+'/'+resKey+'/res.json',
				JSON.stringify( _resourceDb[resKey], null, 1 )
			);

			callback(true);
		} );

		return this;
	}

	/**
	 * get resource public path
	 */
	this.getResourcePublicPath = function( resKey, callback ){
		callback = callback || function(){};
		var filename = resKey;
		this.getResource( resKey, function(res){
			// console.log(res);
			if( typeof(res.publicFilename) == typeof('') && res.publicFilename.length ){
				filename = res.publicFilename;
			}
			// console.log(filename);
			var contentsPath = broccoli.options.pathHtml;
			var resourcesPublishDirPath = broccoli.options.pathResourceDir;

			filename = utils79.toStr(filename);
			if(!filename.length){filename = 'noname';}
			var ext = utils79.toStr(res.ext);
			if(!ext.length){ext = 'unknown';}
			var rtn = './' + path.relative(path.dirname(contentsPath), resourcesPublishDirPath+'/'+filename+'.'+ext);

			callback(rtn);
		} );
		return this;
	}

	/**
	 * get resource public path
	 */
	this.getResourceOriginalRealpath = function( resKey, callback ){
		callback = callback || function(){};
		this.getResource( resKey, function(res){
			if(!res){
				callback(false);
				return;
			}
			var rtn = path.resolve(_resourcesDirPath+'/'+resKey+'/bin.'+res.ext);
			callback(rtn);
			return;
		} );

		return this;
	}

	/**
	 * remove resource
	 */
	this.removeResource = function( resKey, callback ){
		callback = callback || function(){};
		_resourceDb[resKey] = undefined;
		delete( _resourceDb[resKey] );
		if( isDirectory(_resourcesDirPath+'/'+resKey+'/') ){
			rmdir_r( _resourcesDirPath+'/'+resKey+'/' );
		}

		callback(true);
		return this;
	}

}
