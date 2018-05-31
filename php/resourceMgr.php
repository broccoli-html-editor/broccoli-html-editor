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

	/**
	 * save resources
	 * @param  {Object} newResourceDb resource Database
	 * @param  {Function} callback Callback function.
	 * @return {boolean}	 Always true.
	 */
	public function save( $newResourceDb ){
		// var logStartTime = Date.now(); // debug code
		$this->resourceDb = $newResourceDb;

		// 公開リソースディレクトリ 一旦削除して作成
		$this->broccoli->fs()->rm($this->resourcesPublishDirPath);
		$this->broccoli->fs()->mkdir_r($this->resourcesPublishDirPath);
		// var_dump($this->resourcesPublishDirPath);

		// 使われていないリソースを削除
		$jsonSrc = file_get_contents( $this->dataJsonPath );
		foreach( $this->resourceDb as $resKey=>$res ){
			if( strpos($jsonSrc, $resKey) === false ){// TODO: JSONファイルを文字列として検索しているが、この方法は完全ではない。
				$this->removeResource($resKey);
			}
		}

		// リソースデータの保存と公開領域への設置
		foreach($this->resourceDb as $resKey=>$res){
			$this->broccoli->fs()->mkdir( $this->resourcesDirPath.'/'.$resKey );

			if( !strlen($this->resourceDb[$resKey]->base64) ){
				// base64がセットされていなかったら終わり
				continue;
			}

			$bin = base64_decode($this->resourceDb[$resKey]->base64);

			// 違う拡張子のファイルが存在していたら削除
			$filelist = $this->broccoli->fs()->ls( $this->resourcesDirPath . '/' . $resKey );
			foreach( $filelist as $idx=>$row ){
				if($filelist[$idx] === 'bin.'.$this->resourceDb[$resKey]->ext){continue;}
				if($filelist[$idx] === 'res.json'){continue;}
				$this->broccoli->fs()->rm( $this->resourcesDirPath . '/' . $resKey . '/' . $filelist[$idx] );
			}

			$this->resourceDb[$resKey]->md5 = md5($bin);

			// オリジナルファイルを保存
			$this->broccoli->fs()->save_file(
				$this->resourcesDirPath.'/'.$resKey.'/bin.'.$this->resourceDb[$resKey]->ext,
				$bin
			);

			// 公開ファイル
			if( $this->resourceDb[$resKey]->isPrivateMaterial ){
				// 非公開ファイルなら終わり
				continue;
			}

			$filename = $resKey;
			if( is_string(@$this->resourceDb[$resKey]->publicFilename) && strlen($this->resourceDb[$resKey]->publicFilename) ){
				$filename = $this->resourceDb[$resKey]->publicFilename;
			}

			if( $this->resourceDb[$resKey]->field ){
				$fieldDefinition = $this->broccoli->getFieldDefinition( $this->resourceDb[$resKey]->field );
				if( $fieldDefinition !== false ){
					$fieldDefinition->resourceProcessor(
						$this->resourcesDirPath.'/'.$resKey.'/bin.'.$this->resourceDb[$resKey]->ext ,
						$this->resourcesPublishDirPath.'/'.$filename.'.'.$this->resourceDb[$resKey]->ext ,
						$this->resourceDb[$resKey]
					);
					continue;
				}
			}

			// フィールド名が記録されていない場合のデフォルトの処理
			copy(
				$this->resourcesDirPath.'/'.$resKey.'/bin.'.$this->resourceDb[$resKey]->ext,
				$this->resourcesPublishDirPath.'/'.$filename.'.'.$this->resourceDb[$resKey]->ext
			);

			// res.json を保存する
			$json_str = json_encode( $this->resourceDb[$resKey], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES );
			$json_str = preg_replace('/^(    )+/m', ' ', $json_str);
			$this->broccoli->fs()->save_file(
				$this->resourcesDirPath.'/'.$resKey.'/res.json',
				$json_str
			);
		}

		return true;
	} // save()

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

	/**
	 * get resource DB
	 */
	public function getResourceDb(){
		return $this->resourceDb;
	}

	/**
	 * get resource
	 */
	public function getResource( $resKey ){
		if( !is_object(@$this->resourceDb[$resKey]) ){
			// 未登録の resKey
			return false;
		}

		return $this->resourceDb[$resKey];
	}

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

	/**
	 * Reset bin from base64
	 */
	public function resetBinFromBase64( $resKey ){

		if( !is_object(@$this->resourceDb[$resKey]) ){
			// 未登録の resKey
			return false;
		}
		$realpath = $this->getResourceOriginalRealpath( $resKey );
		$bin = base64_decode($this->resourceDb[$resKey]->base64);
		file_put_contents( $realpath, $bin );

		return true;
	}

	/**
	 * Reset base64 from bin
	 */
	public function resetBase64FromBin( $resKey ){

		if( !is_object(@$this->resourceDb[$resKey]) ){
			// 未登録の resKey
			return false;
		}
		$realpath = $this->getResourceOriginalRealpath( $resKey );

		$bin = file_get_contents( $realpath );
		$this->resourceDb[$resKey]->base64 = base64_encode($bin);
		$this->resourceDb[$resKey]->size = strlen($bin);

		$json_str = json_encode( $this->resourceDb[$resKey], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES );
		$json_str = preg_replace('/^(    )+/m', ' ', $json_str);
		file_put_contents(
			$this->resourcesDirPath.'/'.$resKey.'/res.json',
			$json_str
		);

		return true;
	}

	/**
	 * get resource public path
	 */
	public function getResourcePublicPath( $resKey ){
		$filename = $resKey;
		$res = $this->getResource( $resKey );

		if( is_string(@$res->publicFilename) && strlen(@$res->publicFilename) ){
			$filename = $res->publicFilename;
		}
		$contentsPath = $this->broccoli->options['pathHtml'];
		$resourcesPublishDirPath = $this->broccoli->options['pathResourceDir'];

		if(!strlen($filename)){$filename = 'noname';}
		$ext = @$res->ext;
		if(!strlen($ext)){$ext = 'unknown';}
		$rtn = $this->broccoli->fs()->get_relatedpath('/'.$resourcesPublishDirPath.'/'.$filename.'.'.$ext, dirname($contentsPath));
		$rtn = $this->broccoli->fs()->normalize_path($rtn);
		$rtn = preg_replace('/\\\\/s', '/', $rtn); // <= convert Windows path to Linux path

		return $rtn;
	}

	/**
	 * get resource public realpath
	 */
	public function getResourcePublicRealpath( $resKey ){
		$filename = $resKey;
		$res = $this->getResource( $resKey );
		if($res === false){return false;}

		if( is_string($res->publicFilename) && strlen($res->publicFilename) ){
			$filename = $res->publicFilename;
		}

		if(!strlen($filename)){$filename = 'noname';}
		$ext = $res->ext;
		if(!strlen($ext)){$ext = 'unknown';}
		$rtn = $this->broccoli->fs()->get_realpath($this->resourcesPublishDirPath.'/'.$filename.'.'.$ext);

		return $rtn;
	}

	/**
	 * get resource original realpath
	 */
	public function getResourceOriginalRealpath( $resKey ){
		$rtn = false;

		$res = $this->getResource( $resKey );
		if(!$res){
			return false;
		}
		$rtn = $this->broccoli->fs()->get_realpath($this->resourcesDirPath.'/'.$resKey.'/bin.'.$res->ext);

		return $rtn;
	}

	/**
	 * remove resource
	 */
	public function removeResource( $resKey ){
		$this->resourceDb[$resKey] = null;
		unset( $this->resourceDb[$resKey] );
		$result = false;
		if( is_dir($this->resourcesDirPath.'/'.$resKey.'/') ){
			$result = $this->broccoli-fs()->rm( $this->resourcesDirPath.'/'.$resKey.'/' );
		}
		return $result;
	}

}
