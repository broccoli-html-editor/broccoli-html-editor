<?php
/**
 * broccoli-html-editor
 */
namespace broccoliHtmlEditor;


/**
 * gpi.php (General Purpose Interface)
 */
class gpi{

	/** $broccoli */
	private $broccoli;

	/**
	 * Constructor
	 */
	public function __construct($broccoli){
		$this->broccoli = $broccoli;
	}


	/**
	 * General Purpose Interface
	 */
	public function gpi($api, $options){

		// var_dump('broccoli: set language "'.$options['lang'].'"');
		$this->broccoli->lb()->setLang( $options['lang'] );
		// var_dump( $this->broccoli->lb()->get('ui_label.close') );

		switch($api){
			case "getConfig":
				// broccoli の設定を取得する
				$conf = array();
				$conf['appMode'] = $this->broccoli->getAppMode();
				return $conf;
			case "getLanguageCsv":
				// 言語ファイル(CSV)を取得
				$csv = file_get_contents( __DIR__.'/../data/language.csv' );
				return $csv;
			case "getModulePackageList":
				// モジュールパッケージ一覧を取得する
				$list = $this->broccoli->getPackageList();
				return $list;
			case "getAllModuleList":
				// 全モジュールの一覧を取得する
				$list = $this->broccoli->getAllModuleList();
				return $list;
			case "getContentsDataJson":
				$dataJson = json_decode( file_get_contents($this->broccoli->realpathDataDir.'/data.json'), true );
				if(!is_array($dataJson)){
					$dataJson = array();
				}
				return $dataJson;
			// case "saveContentsData":
			// 	var jsonString = JSON.stringify( options.data, null, 1 );
			// 	// var_dump(jsonString);
			// 	it79.fnc(
			// 		{},
			// 		[
			// 			function(it1, data){
			// 				// contentsSourceData を保存する
			// 				fs.writeFile(
			// 					$this->broccoli->realpathDataDir+'/data.json' ,
			// 					jsonString ,
			// 					function(){
			// 						it1.next(data);
			// 					}
			// 				);
			// 			} ,
			// 			function(it1, data){
			// 				callback(true);
			// 			}
			// 		]
			// 	);
			// 	break;
			case "buildHtml":
				$htmls = $this->broccoli->buildHtml( array(
					'mode' => 'canvas',
					'bowlList' => $options['bowlList']
				) );
				return $htmls;

			case "updateContents":
				$result = $this->broccoli->updateContents();
				return $result;

			case "resourceMgr.getResource":
				$resInfo = $this->broccoli->resourceMgr()->getResource( $options['resKey'] );
				// var_dump($resInfo);
				return $resInfo;

			// case "resourceMgr.duplicateResource":
			// 	$this->broccoli->resourceMgr()->duplicateResource(
			// 		options.resKey ,
			// 		function(newResKey){
			// 			// var_dump(newResKey);
			// 			callback(newResKey);
			// 		}
			// 	);
			// 	break;

			case "resourceMgr.getResourceDb":
				$resourceDb = $this->broccoli->resourceMgr()->getResourceDb();
				return $resourceDb;

			case "resourceMgr.getResourceList":
				$resourceDb = $this->broccoli->resourceMgr()->getResourceDb();
				$resourceList = array();
				foreach($resourceDb as $resKey=>$res ){
					array_push($resourceList, $resKey);
				}
				return $resourceList;

			// case "resourceMgr.addResource":
			// 	$this->broccoli->resourceMgr()->addResource(
			// 		function(newResKey){
			// 			// var_dump(newResKey);
			// 			callback(newResKey);
			// 		}
			// 	);
			// 	break;

			case "resourceMgr.getResourcePublicPath":
				$publicPath = $this->broccoli->resourceMgr()->getResourcePublicPath( $options['resKey'] );
				return $publicPath;

			case "resourceMgr.getResourceOriginalRealpath":
				$publicPath = $this->broccoli->resourceMgr()->getResourceOriginalRealpath( $options['resKey'] );
				return $publicPath;

			// case "resourceMgr.updateResource":
			// 	// var_dump('GPI resourceMgr.updateResource');
			// 	// var_dump(options);
			// 	$this->broccoli->resourceMgr()->updateResource(
			// 		$options['resKey'] ,
			// 		options.resInfo ,
			// 		function(result){
			// 			// var_dump(result);
			// 			callback(result);
			// 		}
			// 	);
			// 	break;

			// case "resourceMgr.resetBinFromBase64":
			// 	// var_dump('GPI resourceMgr.resetBinFromBase64');
			// 	// var_dump(options);
			// 	$this->broccoli->resourceMgr()->resetBinFromBase64(
			// 		$options['resKey'] ,
			// 		function(result){
			// 			// var_dump(result);
			// 			callback(result);
			// 		}
			// 	);
			// 	break;

			// case "resourceMgr.resetBase64FromBin":
			// 	// var_dump('GPI resourceMgr.resetBase64FromBin');
			// 	// var_dump(options);
			// 	$this->broccoli->resourceMgr()->resetBase64FromBin(
			// 		$options['resKey'] ,
			// 		function(result){
			// 			// var_dump(result);
			// 			callback(result);
			// 		}
			// 	);
			// 	break;

			// case "resourceMgr.save":
			// 	// var_dump('GPI resourceMgr.save');
			// 	// var_dump(options);
			// 	$this->broccoli->resourceMgr()->save(
			// 		options.resourceDb ,
			// 		function(result){
			// 			// var_dump(result);
			// 			callback(result);
			// 		}
			// 	);
			// 	break;

			// case "resourceMgr.removeResource":
			// 	// var_dump('GPI resourceMgr.save');
			// 	// var_dump(options);
			// 	$this->broccoli->resourceMgr()->removeResource(
			// 		$options['resKey'] ,
			// 		function(result){
			// 			// var_dump(result);
			// 			callback(result);
			// 		}
			// 	);
			// 	break;

			case "fieldGpi":
				$result = $this->broccoli->fieldDefinitions[$options['__fieldId__']]->gpi( $options['options'] );
				return $result;

			default:
				return true;
		}

		return true;
	}

}
