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
			case "getBootupInfomations":
				// broccoli の初期起動時に必要なすべての情報を取得する
				$bootup = array();
				$bootup['conf'] = array();
				$bootup['conf']['appMode'] = $this->broccoli->getAppMode();
				$bootup['languageCsv'] = file_get_contents( __DIR__.'/../data/language.csv' );
				$bootup['allModuleList'] = $this->broccoli->getAllModuleList();
				$bootup['contentsDataJson'] = json_decode( file_get_contents($this->broccoli->realpathDataDir.'/data.json') );
				if(!is_object($bootup['contentsDataJson'])){
					$bootup['contentsDataJson'] = json_decode('{}');
				}
				$resourceDb = $this->broccoli->resourceMgr()->getResourceDb();
				$bootup['resourceDb'] = $resourceDb;
				$bootup['resourceList'] = array();
				foreach($resourceDb as $resKey=>$res ){
					array_push($bootup['resourceList'], $resKey);
				}
				$bootup['modulePackageList'] = $this->broccoli->getPackageList();
				$bootup['errors'] = $this->broccoli->get_errors();
				return $bootup;

			case "getConfig":
				// broccoli の設定を取得する
				$conf = array();
				$conf['appMode'] = $this->broccoli->getAppMode();
				$conf['errors'] = $this->broccoli->get_errors();
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
				$dataJson = json_decode( file_get_contents($this->broccoli->realpathDataDir.'/data.json') );
				if(!is_object($dataJson)){
					$dataJson = json_decode('{}');
				}
				return $dataJson;

			case "saveContentsData":
				$jsonString = json_encode( $options['data'], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES );
				// var_dump($jsonString);
				$result = $this->broccoli->fs()->save_file(
					$this->broccoli->realpathDataDir.'/data.json',
					$jsonString
				);
				return $result;

			case "buildHtml":
				$htmls = $this->broccoli->buildHtml( array(
					'mode' => 'canvas',
					'bowlList' => $options['bowlList']
				) );
				return $htmls;

			case "buildModuleCss":
				$css = $this->broccoli->buildModuleCss();
				return $css;

			case "buildModuleJs":
				$js = $this->broccoli->buildModuleJs();
				return $js;

			case "updateContents":
				$result = $this->broccoli->updateContents();
				return $result;

			case "resourceMgr.getResource":
				$resInfo = $this->broccoli->resourceMgr()->getResource( $options['resKey'] );
				// var_dump($resInfo);
				return $resInfo;

			case "resourceMgr.duplicateResource":
				$newResKey = $this->broccoli->resourceMgr()->duplicateResource( $options['resKey'] );
				return $newResKey;

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

			case "resourceMgr.addResource":
				$newResKey = $this->broccoli->resourceMgr()->addResource();
				return $newResKey;

			case "resourceMgr.getResourcePublicPath":
				$publicPath = $this->broccoli->resourceMgr()->getResourcePublicPath( $options['resKey'] );
				return $publicPath;

			case "resourceMgr.getResourceOriginalRealpath":
				$publicPath = $this->broccoli->resourceMgr()->getResourceOriginalRealpath( $options['resKey'] );
				return $publicPath;

			case "resourceMgr.updateResource":
				// var_dump('GPI resourceMgr.updateResource');
				// var_dump(options);
				$result = $this->broccoli->resourceMgr()->updateResource( $options['resKey'] , $options['resInfo'] );
				return $result;

			case "resourceMgr.resetBinFromBase64":
				// var_dump('GPI resourceMgr.resetBinFromBase64');
				// var_dump(options);
				$result = $this->broccoli->resourceMgr()->resetBinFromBase64( $options['resKey'] );
				return $result;

			case "resourceMgr.resetBase64FromBin":
				// var_dump('GPI resourceMgr.resetBase64FromBin');
				// var_dump(options);
				$result = $this->broccoli->resourceMgr()->resetBase64FromBin( $options['resKey'] );
				return $result;

			case "resourceMgr.save":
				// var_dump('GPI resourceMgr.save');
				// var_dump(options);
				$result = $this->broccoli->resourceMgr()->save( $options['resourceDb'] );
				return $result;

			case "resourceMgr.removeResource":
				// var_dump('GPI resourceMgr.save');
				// var_dump(options);
				$result = $this->broccoli->resourceMgr()->removeResource( $options['resKey'] );
				return $result;

			case "fieldGpi":
				$result = $this->broccoli->getFieldDefinition( $options['__fieldId__'] )->gpi( $options['options'] );
				return $result;

			default:
				return true;
		}

		return true;
	}

}
