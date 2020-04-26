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
		$options = (array) $options;
		if( !array_key_exists('lang', $options) ){
			$options['lang'] = null;
		}
		if( !strlen($options['lang']) ){
			$options['lang'] = 'en';
		}

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

			case "getModule":
				// モジュール情報を取得する
				$moduleId = false;
				if( array_key_exists('moduleId', $options) ){
					$moduleId = $options['moduleId'];
				}
				if( !strlen($moduleId) ){
					return false;
				}
				$module = $this->broccoli->getModule($moduleId);
				$moduleInfo = array();
				$moduleInfo['id'] = $moduleId;
				$moduleInfo['name'] = $module->info['name'];
				$moduleInfo['thumb'] = $module->thumb;
				$moduleInfo['areaSizeDetection'] = $module->info['areaSizeDetection'];
				$moduleInfo['isSystemModule'] = $module->isSystemModule;
				$moduleInfo['isSubModule'] = $module->isSubModule;
				$moduleInfo['isSingleRootElement'] = $module->isSingleRootElement;
				$moduleInfo['isClipModule'] = $module->isClipModule;
				$moduleInfo['deprecated'] = $module->deprecated;
				$moduleInfo['pics'] = $module->getPics();
				$moduleInfo['readme'] = $module->getReadme();
				return $moduleInfo;

			case "getClipModuleContents":
				// クリップモジュールの内容を取得する
				$moduleId = false;
				if( array_key_exists('moduleId', $options) ){
					$moduleId = $options['moduleId'];
				}
				if( !strlen($moduleId) ){
					return false;
				}
				$module = $this->broccoli->getModule($moduleId);
				$clip = $module->getClipContents();
				if( array_key_exists('resourceMode', $options) && $options['resourceMode'] == 'temporaryHash' ){
					foreach($clip->resources as $resKey=>$resInfo){
						if(!strlen($resKey)){continue;}
						if(!is_object($resInfo)){continue;}
						$resInfo->base64 = base64_encode('-----broccoli-resource-temporary-hash='.$resKey);
					}
				}
				return $clip;

			case "replaceClipModuleResources":
				// クリップモジュールのリソースを取得し、コンテンツのリソースを更新する
				$moduleId = false;
				if( array_key_exists('moduleId', $options) ){
					$moduleId = $options['moduleId'];
				}
				if( !strlen($moduleId) ){
					return false;
				}
				$module = $this->broccoli->getModule($moduleId);
				$clip = $module->getClipContents();
				$resourceDb = $this->broccoli->resourceMgr()->getResourceDb();
				$tmpMetaInitial = '-----broccoli-resource-temporary-hash=';
				$tmpBase64Initial = 'LS0tLS1icm9jY29saS1yZXNvdXJjZS10ZW1wb3JhcnktaGFz';
				$rtn = array();
				foreach( $resourceDb as $resKey=>$resInfo ){
					if(!strlen($resKey)){continue;}
					if(!is_object($resInfo)){continue;}
					if( property_exists($resInfo, 'base64') && preg_match('/^'.preg_quote($tmpBase64Initial,'/').'/', $resInfo->base64) ){
						$bin = base64_decode($resInfo->base64);
						$hash = preg_replace('/^'.preg_quote($tmpMetaInitial, '/').'/', '', $bin);
						$this->broccoli->resourceMgr()->updateResource($resKey, $clip->resources->{$hash});
						$rtn[$resKey] = $clip->resources->{$hash};
					}
				}
				return $rtn;

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
				$bowlList = $options['bowlList'];
				$htmls = $this->broccoli->buildHtml( array(
					'mode' => 'canvas',
					'bowlList' => $bowlList,
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
