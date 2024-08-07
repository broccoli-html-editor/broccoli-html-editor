/**
 * resourceMgr.js
 */
module.exports = function(broccoli){
	delete(require.cache[require('path').resolve(__filename)]);

	var Promise = require('es6-promise').Promise;
	var path = require('path');
	var fs = require('fs');
	var fsEx = require('fs-extra');
	var it79 = require('iterate79');
	var utils79 = require('utils79');
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
			// ↑Windows で path を作る過程で、途中にディレクトリ名として "C:" が含まれるようなパスを渡してしまうと、
			// 　「Uncaught RangeError: Maximum call stack size exceeded」が起きて落ちる。
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
	}

	function md5(bin){
		var md5 = require('crypto').createHash('md5');
		md5.update(bin, 'binary');
		return md5.digest('hex');
	} // md5()

	function md5file(path){
		if(!utils79.is_file(path)){return false;}
		var content = require('fs').readFileSync( path );
		return md5(content);
	} // md5file()

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
		return;
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
				new Promise(function(rlv){rlv();})
					.then(function(){ return new Promise(function(rlv, rjt){
						callback();
					}); })
				;
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
						console.error('ERROR: FAILED to parse res.json', _resourcesDirPath+'/'+resKey+'/res.json');
						_resourceDb[resKey] = {};
					}
				}
			}
		} catch (e) {
		}
		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				callback();
			}); })
		;
		return;
	}

	/**
	 * save resources
	 *
	 * @param  {Object} newResourceDb resource Database
	 * @param  {Function} callback Callback function.
	 * @return {boolean}	`callback()` の第1引数に、成功時に true, 失敗時に false を返します。
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
		resetDirectory(_resourcesPublishDirPath); // 公開リソースディレクトリ 一旦削除して作成

		// 使われていないリソースを削除
		collectGarbage();

		// リソースデータの保存と公開領域への設置
		it79.ary(
			_resourceDb,
			function(it1, res, resKey){

				it79.fnc(
					res,
					[
						function(it2, res){
							mkdir( _resourcesDirPath+'/'+resKey );
							it2.next(res);
							return;
						},
						function(it2, res){
							if(_resourceDb[resKey].base64 === undefined){
								// base64がセットされていなかったら終わり
								it2.next();
								return;
							}

							var bin = '';
							try {
								bin = new Buffer(_resourceDb[resKey].base64, 'base64');
							} catch (e) {
								bin = '';
							}

							(function(){
								// 違う拡張子のファイルが存在していたら削除
								var filelist = fs.readdirSync( _resourcesDirPath + '/' + resKey );
								for( var idx in filelist ){
									if(filelist[idx] === 'bin.'+_resourceDb[resKey].ext){continue;}
									if(filelist[idx] === 'res.json'){continue;}
									fs.unlinkSync( _resourcesDirPath + '/' + resKey + '/' + filelist[idx] );
								}
							})();

							_resourceDb[resKey].md5 = md5(bin);

							// オリジナルファイルを保存
							fs.writeFileSync(
								_resourcesDirPath+'/'+resKey+'/bin.'+_resourceDb[resKey].ext,
								bin
							);

							// 公開ファイル
							if( _resourceDb[resKey].isPrivateMaterial ){
								// 非公開ファイルなら終わり
								it2.next(res);
								return;
							}

							var filename = resKey;
							if( typeof(_resourceDb[resKey].publicFilename) == typeof('') && _resourceDb[resKey].publicFilename.length ){
								filename = _resourceDb[resKey].publicFilename;
							}
							if( _resourceDb[resKey].field ){
								var fieldDefinition = broccoli.getFieldDefinition( _resourceDb[resKey].field );
								if( fieldDefinition !== false ){
									fieldDefinition.resourceProcessor(
										_resourcesDirPath+'/'+resKey+'/bin.'+_resourceDb[resKey].ext ,
										_resourcesPublishDirPath+'/'+filename+'.'+_resourceDb[resKey].ext ,
										_resourceDb[resKey],
										function(){
											it2.next(res);
										}
									);
									return;
								}
							}

							// フィールド名が記録されていない場合のデフォルトの処理
							fsEx.copy(
								_resourcesDirPath+'/'+resKey+'/bin.'+_resourceDb[resKey].ext,
								_resourcesPublishDirPath+'/'+filename+'.'+_resourceDb[resKey].ext,
								function(err){
									it2.next(res);
								}
							);
							return;
						},
						function(it2, res){
							// res.json を保存する
							fs.writeFileSync(
								_resourcesDirPath+'/'+resKey+'/res.json',
								JSON.stringify( _resourceDb[resKey], null, 4 )
							);
							it2.next(res);
							return;
						},
						function(it2, res){
							it1.next();
							return;
						}
					]
				);

				return;
			},
			function(){
				new Promise(function(rlv){rlv();})
					.then(function(){ return new Promise(function(rlv, rjt){
						callback(true);
					}); })
				;
				return;
			}
		);

		return;
	}

	/**
	 * add resource
	 * リソースの登録を行い、resKeyを生成して返す。
	 */
	this.addResource = function(callback){
		callback = callback || function(){};
		var newResKey;
		while(1){
			newResKey = md5( ''+(new Date).getTime() );
			if( typeof(_resourceDb[newResKey]) === typeof({}) ){
				// 登録済みの resKey
				continue;
			}
			_resourceDb[newResKey] = { //予約
				'ext': 'txt',
				'size': 0,
				'base64': '',
				'md5': md5(''),
				'isPrivateMaterial': false,
				'publicFilename': '',
				'field': '', // <= フィールド名 (ex: image, multitext)
				'fieldNote': {} // <= フィールドが記録する欄
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
			JSON.stringify( _resourceDb[resKey], null, 4 )
		);
		fs.writeFileSync(
			_resourcesDirPath+'/'+resKey+'/bin.'+_resourceDb[resKey].ext,
			''
		);

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				callback( newResKey );
			}); })
		;
		return;
	}

	/**
	 * add new resource
	 * リソースの登録を行い、リソースを保存し、新しい ResourceKey と publicPath 等を生成して返す。
	 */
	this.addNewResource = function(resInfo, callback){
		callback = callback || function(){};
		var rtn = {
			'newResourceKey': null,
			'updateResult': null,
			'publicPath': null
		};
		_this.addResource(
			function(newResourceKey){
				rtn.newResourceKey = newResourceKey;
				_this.updateResource(
					rtn.newResourceKey ,
					resInfo ,
					function(updateResult){
						rtn.updateResult = updateResult;
						_this.getResourcePublicPath(
							rtn.newResourceKey ,
							function(publicPath){
								rtn.publicPath = publicPath;
								callback(rtn);
							}
						);
					}
				);
			}
		);
		return;
	}

	/**
	 * get resource DB
	 */
	this.getResourceDb = function( callback ){
		callback = callback || function(){};

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				callback(_resourceDb);
			}); })
		;
		return;
	}

	/**
	 * get resource
	 */
	this.getResource = function( resKey, callback ){
		callback = callback || function(){};
		if( typeof(_resourceDb[resKey]) !== typeof({}) ){
			// 未登録の resKey
			callback(false);
			return;
		}
		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				callback(_resourceDb[resKey]);
			}); })
		;
		return;
	}

	/**
	 * duplicate resource
	 * @return 複製された新しいリソースのキー
	 */
	this.duplicateResource = function( resKey, callback ){
		callback = callback || function(){};
		if( typeof(_resourceDb[resKey]) !== typeof({}) ){
			// 未登録の resKey
			new Promise(function(rlv){rlv();})
				.then(function(){ return new Promise(function(rlv, rjt){
					callback(false);
				}); })
			;
			return;
		}
		this.addResource(function(newResKey){
			_resourceDb[newResKey] = JSON.parse( JSON.stringify( _resourceDb[resKey] ) );
			fs.mkdir( _resourcesDirPath+newResKey+'/', {}, function(err){
				fsEx.copy(
					_resourcesDirPath+resKey+'/' ,
					_resourcesDirPath+newResKey+'/' ,
					function(err){
						if(err){
							console.error(err);
						}
						callback( newResKey );
					}
				);
			} );
		});
		return;
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
	 * @return {boolean}	成功時に true, 失敗時に false を返します。
	 */
	this.updateResource = function( resKey, resInfo, callback ){
		callback = callback || function(){};
		if( typeof(_resourceDb[resKey]) !== typeof({}) ){
			// 未登録の resKey
			new Promise(function(rlv){rlv();})
				.then(function(){ return new Promise(function(rlv, rjt){
					callback(false);
				}); })
			;
			return;
		}
		_resourceDb[resKey] = resInfo;

		mkdir( _resourcesDirPath+'/'+resKey );
		if(!fs.writeFileSync(
			_resourcesDirPath+'/'+resKey+'/res.json',
			JSON.stringify( _resourceDb[resKey], null, 4 )
		)){
			callback(false);
			return;
		}

		var bin = '';
		try {
			bin = (new Buffer(_resourceDb[resKey].base64, 'base64'));
		} catch (e) {
			bin = '';
		}
		if(!fs.writeFileSync(
			_resourcesDirPath+'/'+resKey+'/bin.'+_resourceDb[resKey].ext,
			bin
		)){
			callback(false);
			return;
		}

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				callback(true);
			}); })
		;
		return;
	}

	/**
	 * Reset bin from base64
	 */
	this.resetBinFromBase64 = function( resKey, callback ){
		callback = callback || function(){};
		if( typeof(_resourceDb[resKey]) !== typeof({}) ){
			// 未登録の resKey
			callback(false);
			return;
		}
		this.getResourceOriginalRealpath( resKey, function(realpath){
			var bin = (new Buffer(_resourceDb[resKey].base64, 'base64'));
			fs.writeFileSync( realpath, bin, {} );
			callback(true);
		} );

		return;
	}

	/**
	 * Reset base64 from bin
	 */
	this.resetBase64FromBin = function( resKey, callback ){
		callback = callback || function(){};
		if( typeof(_resourceDb[resKey]) !== typeof({}) ){
			// 未登録の resKey
			new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
				callback(false);
			}); });
			return;
		}
		this.getResourceOriginalRealpath( resKey, function(realpath){
			var bin = fs.readFileSync( realpath, {} );
			_resourceDb[resKey].base64 = (new Buffer(bin)).toString('base64');
			_resourceDb[resKey].size = bin.length;

			fs.writeFileSync(
				_resourcesDirPath+'/'+resKey+'/res.json',
				JSON.stringify( _resourceDb[resKey], null, 4 )
			);

			callback(true);
		} );

		return;
	}

	/**
	 * get resource public path
	 */
	this.getResourcePublicPath = function( resKey, callback ){
		callback = callback || function(){};
		var filename = resKey;
		this.getResource( resKey, function(res){
			if( typeof(res.publicFilename) == typeof('') && res.publicFilename.length ){
				filename = res.publicFilename;
			}
			var contentsPath = broccoli.options.pathHtml;
			var resourcesPublishDirPath = broccoli.options.pathResourceDir;

			filename = utils79.toStr(filename);
			if(!filename.length){
				filename = 'noname';
			}
			var ext = utils79.toStr(res.ext);
			if(!ext.length){
				ext = 'unknown';
			}
			var rtn = './' + path.relative(path.dirname(contentsPath), resourcesPublishDirPath+'/'+filename+'.'+ext);
			rtn = rtn.replace(/\\/g, '/'); // <= convert Windows path to Linux path

			callback(rtn);
		} );
		return;
	}

	/**
	 * get resource public realpath
	 */
	this.getResourcePublicRealpath = function( resKey, callback ){
		callback = callback || function(){};
		var filename = resKey;
		this.getResource( resKey, function(res){
			if( typeof(res.publicFilename) == typeof('') && res.publicFilename.length ){
				filename = res.publicFilename;
			}

			filename = utils79.toStr(filename);
			if(!filename.length){
				filename = 'noname';
			}
			var ext = utils79.toStr(res.ext);
			if(!ext.length){
				ext = 'unknown';
			}
			var rtn = path.resolve(_resourcesPublishDirPath+'/'+filename+'.'+ext);

			callback(rtn);
		} );
		return;
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

		return;
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

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback(true);
		}); });
		return;
	}

	/**
	 * 使われていないリソースを削除
	 */
	function collectGarbage(){
		var jsonSrc = fs.readFileSync( _dataJsonPath );
		jsonSrc = JSON.parse( JSON.stringify(jsonSrc.toString()) );
		for( var resKey in _resourceDb ){
			if( !jsonSrc.match(resKey) ){// TODO: JSONファイルを文字列として検索しているが、この方法は完全ではない。
				_this.removeResource(resKey);
			}
		}
		return;
	}
}
