<?php
/**
 * broccoli-html-editor
 */
namespace broccoliHtmlEditor;

/**
 * Resource Manager
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class resourceMgr{

	private $resourcesDirPath;
	private $resourcesPublishDirPath;
	private $dataJsonPath;

	private $resourceDb = array();

	/** $broccoli */
	private $broccoli;

	/**
	 * Constructor
	 */
	public function __construct($broccoli){
		$this->broccoli = $broccoli;
	}

	/**
	 * initialize resource Manager
	 */
	public function init(){
		$this->dataJsonPath = $this->broccoli->fs()->get_realpath( $this->broccoli->realpathDataDir.'/data.json' );
		$this->resourcesDirPath = $this->broccoli->fs()->get_realpath( $this->broccoli->realpathDataDir.'/resources/' );
		$this->resourcesPublishDirPath = $this->broccoli->realpathResourceDir;

		$this->resourceDb = array();

		// リソースの一覧を読み込む
		if( !is_dir( $this->resourcesDirPath ) ){
			// リソースディレクトリが存在しない場合、
			// この段階ではムリに作成しない。
			return;
		}else{
			$list = $this->broccoli->fs()->ls( $this->resourcesDirPath );
			foreach( $list as $idx=>$resKey ){
				if( !is_dir( $this->resourcesDirPath.'/'.$resKey ) ){ continue; }
				$this->resourceDb[$resKey] = array();
				if( is_file( $this->resourcesDirPath.'/'.$resKey.'/res.json' ) ){
					$jsonStr = file_get_contents( $this->resourcesDirPath.'/'.$resKey.'/res.json' );
					$this->resourceDb[$resKey] = @json_decode( $jsonStr );
					if( is_null($this->resourceDb[$resKey]) ){
						$this->resourceDb[$resKey] = array();
					}
				}
			}
		}
		return;
	}

	// /**
	//  * save resources
	//  * @param  {Object} newResourceDb resource Database
	//  * @param  {Function} callback Callback function.
	//  * @return {boolean}	 Always true.
	//  */
	// this.save = function( newResourceDb, callback ){
	// 	// var logStartTime = Date.now(); // debug code
	// 	callback = callback || function(){};
	// 	$this->resourceDb = newResourceDb;

	// 	function md5(bin){
	// 		var md5 = require('crypto').createHash('md5');
	// 		md5.update(bin);
	// 		return md5.digest('hex');
	// 	}
	// 	function md5file(path){
	// 		if(!utils79.is_file(path)){return false;}
	// 		var content = require('fs').readFileSync( path );
	// 		return md5(content);
	// 	}


	// 	function resetDirectory(dir){
	// 		if( is_dir( dir ) ){ // 一旦削除
	// 			rmdir_r( dir );
	// 		}
	// 		if( !is_dir( dir ) ){ // 作成
	// 			mkdir( dir );
	// 		}
	// 		return;
	// 	}
	// 	resetDirectory($this->resourcesPublishDirPath);// 公開リソースディレクトリ 一旦削除して作成
	// 	// console.log($this->resourcesPublishDirPath);

	// 	// 使われていないリソースを削除
	// 	var jsonSrc = fs.readFileSync( $this->dataJsonPath );
	// 	jsonSrc = JSON.parse( JSON.stringify(jsonSrc.toString()) );
	// 	for( var resKey in $this->resourceDb ){
	// 		if( !jsonSrc.match(resKey) ){// TODO: JSONファイルを文字列として検索しているが、この方法は完全ではない。
	// 			this.removeResource(resKey);
	// 		}
	// 	}

	// 	// リソースデータの保存と公開領域への設置
	// 	it79.ary(
	// 		$this->resourceDb,
	// 		function(it1, res, resKey){

	// 			it79.fnc(
	// 				res,
	// 				[
	// 					function(it2, res){
	// 						mkdir( $this->resourcesDirPath+'/'+resKey );
	// 						it2.next(res);
	// 						return;
	// 					},
	// 					function(it2, res){
	// 						if($this->resourceDb[resKey].base64 === undefined){
	// 							// base64がセットされていなかったら終わり
	// 							it2.next();
	// 							return;
	// 						}

	// 						var bin = '';
	// 						try {
	// 							bin = new Buffer($this->resourceDb[resKey].base64, 'base64');
	// 						} catch (e) {
	// 							bin = '';
	// 						}

	// 						(function(){
	// 							// 違う拡張子のファイルが存在していたら削除
	// 							var filelist = fs.readdirSync( $this->resourcesDirPath + '/' + resKey );
	// 							for( var idx in filelist ){
	// 								if(filelist[idx] === 'bin.'+$this->resourceDb[resKey].ext){continue;}
	// 								if(filelist[idx] === 'res.json'){continue;}
	// 								fs.unlinkSync( $this->resourcesDirPath + '/' + resKey + '/' + filelist[idx] );
	// 							}
	// 						})();

	// 						$this->resourceDb[resKey].md5 = md5(bin);

	// 						// オリジナルファイルを保存
	// 						fs.writeFileSync(
	// 							$this->resourcesDirPath+'/'+resKey+'/bin.'+$this->resourceDb[resKey].ext,
	// 							bin
	// 						);

	// 						// 公開ファイル
	// 						if( $this->resourceDb[resKey].isPrivateMaterial ){
	// 							// 非公開ファイルなら終わり
	// 							it2.next(res);
	// 							return;
	// 						}

	// 						var filename = resKey;
	// 						if( typeof($this->resourceDb[resKey].publicFilename) == typeof('') && $this->resourceDb[resKey].publicFilename.length ){
	// 							filename = $this->resourceDb[resKey].publicFilename;
	// 						}
	// 						if( $this->resourceDb[resKey].field ){
	// 							var fieldDefinition = broccoli.getFieldDefinition( $this->resourceDb[resKey].field );
	// 							if( fieldDefinition !== false ){
	// 								fieldDefinition.resourceProcessor(
	// 									$this->resourcesDirPath+'/'+resKey+'/bin.'+$this->resourceDb[resKey].ext ,
	// 									$this->resourcesPublishDirPath+'/'+filename+'.'+$this->resourceDb[resKey].ext ,
	// 									$this->resourceDb[resKey],
	// 									function(){
	// 										it2.next(res);
	// 									}
	// 								);
	// 								return;
	// 							}
	// 						}

	// 						// フィールド名が記録されていない場合のデフォルトの処理
	// 						fsEx.copy(
	// 							$this->resourcesDirPath+'/'+resKey+'/bin.'+$this->resourceDb[resKey].ext,
	// 							$this->resourcesPublishDirPath+'/'+filename+'.'+$this->resourceDb[resKey].ext,
	// 							function(err){
	// 								it2.next(res);
	// 							}
	// 						);
	// 						return;
	// 					},
	// 					function(it2, res){
	// 						// res.json を保存する
	// 						fs.writeFileSync(
	// 							$this->resourcesDirPath+'/'+resKey+'/res.json',
	// 							JSON.stringify( $this->resourceDb[resKey], null, 1 )
	// 						);
	// 						it2.next(res);
	// 						return;
	// 					},
	// 					function(it2, res){
	// 						it1.next();
	// 						return;
	// 					}
	// 				]
	// 			);

	// 			return;
	// 		},
	// 		function(){
	// 			// console.log('resourceMgr.save() done.');
	// 			// console.log( (Date.now() - logStartTime)/1000 ); // debug code
	// 			new Promise(function(rlv){rlv();})
	// 				.then(function(){ return new Promise(function(rlv, rjt){
	// 					callback(true);
	// 				}); })
	// 			;
	// 			return;
	// 		}
	// 	);

	// 	return this;
	// } // save()

	// /**
	//  * add resource
	//  * リソースの登録を行い、resKeyを生成して返す。
	//  */
	// this.addResource = function(callback){
	// 	callback = callback || function(){};
	// 	var newResKey;
	// 	while(1){
	// 		newResKey = php.md5( (new Date).getTime() );
	// 		if( typeof($this->resourceDb[newResKey]) === typeof({}) ){
	// 			// 登録済みの resKey
	// 			continue;
	// 		}
	// 		$this->resourceDb[newResKey] = { //予約
	// 			'ext': 'txt',
	// 			'size': 0,
	// 			'base64': '',
	// 			'md5': '',
	// 			'isPrivateMaterial': false,
	// 			'publicFilename': '',
	// 			'field': '', // <= フィールド名 (ex: image, multitext)
	// 			'fieldNote': {} // <= フィールドが記録する欄
	// 		};
	// 		break;
	// 	}

	// 	var resKey = newResKey;
	// 	if( !is_dir( $this->resourcesDirPath ) ){ // 作成
	// 		mkdir( $this->resourcesDirPath );
	// 	}
	// 	mkdir( $this->resourcesDirPath+'/'+resKey );
	// 	fs.writeFileSync(
	// 		$this->resourcesDirPath+'/'+resKey+'/res.json',
	// 		JSON.stringify( $this->resourceDb[resKey], null, 1 )
	// 	);
	// 	fs.writeFileSync(
	// 		$this->resourcesDirPath+'/'+resKey+'/bin.'+$this->resourceDb[resKey].ext,
	// 		''
	// 	);

	// 	new Promise(function(rlv){rlv();})
	// 		.then(function(){ return new Promise(function(rlv, rjt){
	// 			callback( newResKey );
	// 		}); })
	// 	;
	// 	return this;
	// }

	// /**
	//  * get resource DB
	//  */
	// this.getResourceDb = function( callback ){
	// 	callback = callback || function(){};
	// 	new Promise(function(rlv){rlv();})
	// 		.then(function(){ return new Promise(function(rlv, rjt){
	// 			callback($this->resourceDb);
	// 		}); })
	// 	;
	// 	return this;
	// }

	// /**
	//  * get resource
	//  */
	// this.getResource = function( resKey, callback ){
	// 	callback = callback || function(){};
	// 	if( typeof($this->resourceDb[resKey]) !== typeof({}) ){
	// 		// 未登録の resKey
	// 		callback(false);
	// 		return this;
	// 	}
	// 	new Promise(function(rlv){rlv();})
	// 		.then(function(){ return new Promise(function(rlv, rjt){
	// 			callback($this->resourceDb[resKey]);
	// 		}); })
	// 	;
	// 	return this;
	// }

	// /**
	//  * duplicate resource
	//  * @return 複製された新しいリソースのキー
	//  */
	// this.duplicateResource = function( resKey, callback ){
	// 	callback = callback || function(){};
	// 	// console.log( resKey );
	// 	if( typeof($this->resourceDb[resKey]) !== typeof({}) ){
	// 		// 未登録の resKey
	// 		new Promise(function(rlv){rlv();})
	// 			.then(function(){ return new Promise(function(rlv, rjt){
	// 				callback(false);
	// 			}); })
	// 		;
	// 		return this;
	// 	}
	// 	this.addResource(function(newResKey){
	// 		$this->resourceDb[newResKey] = JSON.parse( JSON.stringify( $this->resourceDb[resKey] ) );
	// 		// console.log( $this->resourcesDirPath+resKey+'/' + ' => ' + $this->resourcesDirPath+newResKey+'/' );
	// 		fs.mkdir( $this->resourcesDirPath+newResKey+'/', {}, function(err){
	// 			fsEx.copy(
	// 				$this->resourcesDirPath+resKey+'/' ,
	// 				$this->resourcesDirPath+newResKey+'/' ,
	// 				function(err){
	// 					if(err){
	// 						// console.log( '++ ERROR ++' );
	// 						console.error(err);
	// 					}
	// 					// console.log( newResKey );
	// 					callback( newResKey );
	// 				}
	// 			);
	// 		} );
	// 	});
	// 	return this;
	// }

	// /**
	//  * update resource
	//  *
	//  * このメソッドは、resKey が指すリソースの新しい情報を受け取り、更新します。
	//  * 保存されたファイル本体とJSONを上書き保存します。
	//  *
	//  * @param  {string} resKey  Resource Key
	//  * @param  {object} resInfo Resource Information.
	//  * <dl>
	//  * <dt>ext</dt><dd>ファイル拡張子名。</dd>
	//  * <dt>type</dt><dd>mimeタイプ。</dd>
	//  * <dt>base64</dt><dd>ファイルのBase64エンコードされた値</dd>
	//  * <dt>publicFilename</dt><dd>公開時のファイル名</dd>
	//  * <dt>isPrivateMaterial</dt><dd>非公開ファイル。</dd>
	//  * </dl>
	//  * @return {boolean}		always true.
	//  */
	// this.updateResource = function( resKey, resInfo, callback ){
	// 	callback = callback || function(){};
	// 	if( typeof($this->resourceDb[resKey]) !== typeof({}) ){
	// 		// 未登録の resKey
	// 		new Promise(function(rlv){rlv();})
	// 			.then(function(){ return new Promise(function(rlv, rjt){
	// 				callback(false);
	// 			}); })
	// 		;
	// 		return this;
	// 	}
	// 	$this->resourceDb[resKey] = resInfo;

	// 	mkdir( $this->resourcesDirPath+'/'+resKey );
	// 	fs.writeFileSync(
	// 		$this->resourcesDirPath+'/'+resKey+'/res.json',
	// 		JSON.stringify( $this->resourceDb[resKey], null, 1 )
	// 	);
	// 	var bin = '';
	// 	try {
	// 		bin = (new Buffer($this->resourceDb[resKey].base64, 'base64'));
	// 	} catch (e) {
	// 		bin = '';
	// 	}
	// 	fs.writeFileSync(
	// 		$this->resourcesDirPath+'/'+resKey+'/bin.'+$this->resourceDb[resKey].ext,
	// 		bin
	// 	);

	// 	new Promise(function(rlv){rlv();})
	// 		.then(function(){ return new Promise(function(rlv, rjt){
	// 			callback(true);
	// 		}); })
	// 	;
	// 	return this;
	// }

	// /**
	//  * Reset bin from base64
	//  */
	// this.resetBinFromBase64 = function( resKey, callback ){
	// 	callback = callback || function(){};
	// 	if( typeof($this->resourceDb[resKey]) !== typeof({}) ){
	// 		// 未登録の resKey
	// 		callback(false);
	// 		return this;
	// 	}
	// 	this.getResourceOriginalRealpath( resKey, function(realpath){
	// 		// console.log($this->resourceDb[resKey].base64);
	// 		// var bin = php.base64_decode( $this->resourceDb[resKey].base64 );
	// 		var bin = (new Buffer($this->resourceDb[resKey].base64, 'base64'));
	// 		fs.writeFileSync( realpath, bin, {} );
	// 		callback(true);
	// 	} );

	// 	return this;
	// }

	// /**
	//  * Reset base64 from bin
	//  */
	// this.resetBase64FromBin = function( resKey, callback ){
	// 	callback = callback || function(){};
	// 	if( typeof($this->resourceDb[resKey]) !== typeof({}) ){
	// 		// 未登録の resKey
	// 		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
	// 			callback(false);
	// 		}); });
	// 		return this;
	// 	}
	// 	this.getResourceOriginalRealpath( resKey, function(realpath){
	// 		var bin = fs.readFileSync( realpath, {} );
	// 		$this->resourceDb[resKey].base64 = (new Buffer(bin)).toString('base64');
	// 		$this->resourceDb[resKey].size = bin.length;

	// 		fs.writeFileSync(
	// 			$this->resourcesDirPath+'/'+resKey+'/res.json',
	// 			JSON.stringify( $this->resourceDb[resKey], null, 1 )
	// 		);

	// 		callback(true);
	// 	} );

	// 	return this;
	// }

	// /**
	//  * get resource public path
	//  */
	// this.getResourcePublicPath = function( resKey, callback ){
	// 	callback = callback || function(){};
	// 	var filename = resKey;
	// 	this.getResource( resKey, function(res){
	// 		// console.log(res);
	// 		if( typeof(res.publicFilename) == typeof('') && res.publicFilename.length ){
	// 			filename = res.publicFilename;
	// 		}
	// 		// console.log(filename);
	// 		var contentsPath = broccoli.options.pathHtml;
	// 		var resourcesPublishDirPath = broccoli.options.pathResourceDir;

	// 		filename = utils79.toStr(filename);
	// 		if(!filename.length){filename = 'noname';}
	// 		var ext = utils79.toStr(res.ext);
	// 		if(!ext.length){ext = 'unknown';}
	// 		var rtn = './' + path.relative(path.dirname(contentsPath), resourcesPublishDirPath+'/'+filename+'.'+ext);
	// 		rtn = rtn.replace(/\\/g, '/'); // <= convert Windows path to Linux path

	// 		callback(rtn);
	// 	} );
	// 	return this;
	// }

	// /**
	//  * get resource public realpath
	//  */
	// this.getResourcePublicRealpath = function( resKey, callback ){
	// 	callback = callback || function(){};
	// 	var filename = resKey;
	// 	this.getResource( resKey, function(res){
	// 		// console.log(res);
	// 		if( typeof(res.publicFilename) == typeof('') && res.publicFilename.length ){
	// 			filename = res.publicFilename;
	// 		}
	// 		// console.log(filename);

	// 		filename = utils79.toStr(filename);
	// 		if(!filename.length){filename = 'noname';}
	// 		var ext = utils79.toStr(res.ext);
	// 		if(!ext.length){ext = 'unknown';}
	// 		var rtn = path.resolve($this->resourcesPublishDirPath+'/'+filename+'.'+ext);

	// 		callback(rtn);
	// 	} );
	// 	return this;
	// }

	// /**
	//  * get resource public path
	//  */
	// this.getResourceOriginalRealpath = function( resKey, callback ){
	// 	callback = callback || function(){};
	// 	this.getResource( resKey, function(res){
	// 		if(!res){
	// 			callback(false);
	// 			return;
	// 		}
	// 		var rtn = path.resolve($this->resourcesDirPath+'/'+resKey+'/bin.'+res.ext);
	// 		callback(rtn);
	// 		return;
	// 	} );

	// 	return this;
	// }

	// /**
	//  * remove resource
	//  */
	// this.removeResource = function( resKey, callback ){
	// 	callback = callback || function(){};
	// 	$this->resourceDb[resKey] = undefined;
	// 	delete( $this->resourceDb[resKey] );
	// 	if( is_dir($this->resourcesDirPath+'/'+resKey+'/') ){
	// 		rmdir_r( $this->resourcesDirPath+'/'+resKey+'/' );
	// 	}

	// 	new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
	// 		callback(true);
	// 	}); });
	// 	return this;
	// }


}
