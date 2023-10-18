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
		if( !strlen(''.$options['lang']) ){
			$options['lang'] = 'en';
		}

		try {

			$this->broccoli->lb()->setLang( $options['lang'] );

			switch($api){
				case "getBootupInfomations":
					// broccoli の初期起動時に必要なすべての情報を取得する
					$bootup = array();
					$bootup['result'] = true;
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
					$bootup['userData'] = json_decode('{}');
					$bootup['userData']->modPaletteCondition = $this->broccoli->userStorage()->load('modPaletteCondition');
					$bootup['errors'] = $this->broccoli->get_errors();
					if( is_array($bootup['errors']) && count($bootup['errors']) ){
						$bootup['result'] = false;
					}
					return $bootup;

				case "getConfig":
					// broccoli の設定を取得する
					$conf = (object) array(
						"result" => true,
						"config" => (object) array(
							'appMode' => $this->broccoli->getAppMode(),
							'errors' => $this->broccoli->get_errors(),
						),
					);
					return $conf;

				case "getLanguageCsv":
					// 言語ファイル(CSV)を取得
					$csv = file_get_contents( __DIR__.'/../data/language.csv' );
					return (object) array(
						"result" => true,
						"language" => $csv,
					);

				case "getModulePackageList":
					// モジュールパッケージ一覧を取得する
					$list = $this->broccoli->getPackageList();
					return (object) array(
						"result" => true,
						"modulePackageList" => $list,
					);

				case "getModule":
					// モジュール情報を取得する
					$moduleId = false;
					if( array_key_exists('moduleId', $options) ){
						$moduleId = $options['moduleId'];
					}
					if( !strlen(''.$moduleId) ){
						return false;
					}
					$module = $this->broccoli->getModule($moduleId);
					$moduleInfo = array();
					$moduleInfo['id'] = $moduleId;
					$moduleInfo['internalId'] = $module->internalId;
					$moduleInfo['name'] = $module->info['name'];
					$moduleInfo['thumb'] = $module->thumb;
					$moduleInfo['areaSizeDetection'] = $module->info['areaSizeDetection'];
					$moduleInfo['isSystemModule'] = $module->isSystemModule;
					$moduleInfo['isSubModule'] = $module->isSubModule;
					$moduleInfo['isSingleRootElement'] = $module->isSingleRootElement;
					$moduleInfo['isClipModule'] = $module->isClipModule;
					$moduleInfo['hidden'] = $module->hidden;
					$moduleInfo['deprecated'] = $module->deprecated;
					$moduleInfo['pics'] = $module->getPics();
					$moduleInfo['readme'] = $module->getReadme();
					return (object) array(
						"result" => true,
						"moduleInfo" => $moduleInfo,
					);

				case "getClipModuleContents":
					// クリップモジュールの内容を取得する
					$moduleId = false;
					if( array_key_exists('moduleId', $options) ){
						$moduleId = $options['moduleId'];
					}
					if( !strlen($moduleId ?? '') ){
						return (object) array(
							"result" => false,
							"errors" => array("moduleId is required."),
						);
					}
					$module = $this->broccoli->getModule($moduleId);
					$clip = $module->getClipContents();
					if( array_key_exists('resourceMode', $options) && $options['resourceMode'] == 'temporaryHash' ){
						foreach($clip->resources as $resKey=>$resInfo){
							if(!strlen(''.$resKey)){continue;}
							if(!is_object($resInfo)){continue;}
							$resInfo->base64 = base64_encode('-----broccoli-resource-temporary-hash='.$resKey);
						}
					}
					return (object) array(
						"result" => true,
						"clipContents" => $clip,
					);

				case "replaceClipModuleResources":
					// クリップモジュールのリソースを取得し、コンテンツのリソースを更新する
					$moduleId = false;
					if( array_key_exists('moduleId', $options) ){
						$moduleId = $options['moduleId'];
					}
					if( !strlen($moduleId ?? '') ){
						return (object) array(
							"result" => false,
							"errors" => array("moduleId is required."),
						);
					}
					$module = $this->broccoli->getModule($moduleId);
					$clip = $module->getClipContents();
					$resourceDb = $this->broccoli->resourceMgr()->getResourceDb();
					$tmpMetaInitial = '-----broccoli-resource-temporary-hash=';
					$tmpBase64Initial = 'LS0tLS1icm9jY29saS1yZXNvdXJjZS10ZW1wb3JhcnktaGFz';
					$rtn = array();
					foreach( $resourceDb as $resKey=>$resInfo ){
						if(!strlen($resKey ?? '')){
							continue;
						}
						if(!is_object($resInfo)){
							continue;
						}
						if( property_exists($resInfo, 'base64') && preg_match('/^'.preg_quote($tmpBase64Initial,'/').'/', $resInfo->base64) ){
							$bin = base64_decode($resInfo->base64);
							$hash = preg_replace('/^'.preg_quote($tmpMetaInitial, '/').'/', '', $bin);
							$this->broccoli->resourceMgr()->updateResource($resKey, $clip->resources->{$hash});
							$rtn[$resKey] = $clip->resources->{$hash};
						}
					}
					return (object) array(
						"result" => true,
						"affectedResources" => $rtn,
					);

				case "getAllModuleList":
					// 全モジュールの一覧を取得する
					$list = $this->broccoli->getAllModuleList();
					return (object) array(
						"result" => true,
						"moduleList" => $list,
					);

				case "getContentsDataJson":
					$dataJson = json_decode( file_get_contents($this->broccoli->realpathDataDir.'/data.json') );
					if(!is_object($dataJson)){
						$dataJson = json_decode('{}');
					}
					return (object) array(
						"result" => true,
						"data" => $dataJson,
					);

				case "saveContentsData":
					$jsonString = json_encode( $options['data'], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES );
					$result = $this->broccoli->fs()->save_file(
						$this->broccoli->realpathDataDir.'/data.json',
						$jsonString
					);
					return $result ? (object) array(
						"result" => true,
					) : (object) array(
						"result" => false,
						"errors" => array("Failed to save contents data."),
					);

				case "buildHtml":
					$bowlList = $options['bowlList'];
					$htmls = $this->broccoli->buildHtml( array(
						'mode' => 'canvas',
						'bowlList' => $bowlList,
					) );
					return (object) array(
						"result" => true,
						"htmls" => $htmls,
					);

				case "buildModuleCss":
					$css = $this->broccoli->buildModuleCss();
					return (object) array(
						"result" => true,
						"css" => $css,
					);

				case "buildModuleJs":
					$js = $this->broccoli->buildModuleJs();
					return (object) array(
						"result" => true,
						"js" => $js,
					);

				case "updateContents":
					$result = $this->broccoli->updateContents();
					return $result ? (object) array(
						"result" => true,
					) : (object) array(
						"result" => false,
						"errors" => array("Failed to update contents data."),
					);

				case "resourceMgr.getResource":
					$resInfo = $this->broccoli->resourceMgr()->getResource( $options['resKey'] );
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

				case "resourceMgr.addNewResource":
					$rtn = (object) $this->broccoli->resourceMgr()->addNewResource($options['resInfo']);
					$rtn->result = true;
					return $rtn;

				case "resourceMgr.getResourcePublicPath":
					$publicPath = $this->broccoli->resourceMgr()->getResourcePublicPath( $options['resKey'] );
					return $publicPath;

				case "resourceMgr.getResourceOriginalRealpath":
					$publicPath = $this->broccoli->resourceMgr()->getResourceOriginalRealpath( $options['resKey'] );
					return $publicPath;

				case "resourceMgr.updateResource":
					$result = $this->broccoli->resourceMgr()->updateResource( $options['resKey'] , $options['resInfo'] );
					return $result ? (object) array(
						"result" => true,
					) : (object) array(
						"result" => false,
						"errors" => array("Failed to update resource data."),
					);

				case "resourceMgr.resetBinFromBase64":
					$result = $this->broccoli->resourceMgr()->resetBinFromBase64( $options['resKey'] );
					return $result;

				case "resourceMgr.resetBase64FromBin":
					$result = $this->broccoli->resourceMgr()->resetBase64FromBin( $options['resKey'] );
					return $result;

				case "resourceMgr.save":
					foreach( $options['resourceDb'] as $key=>$val ){
						$options['resourceDb'][$key] = (object) $val;
					}
					$result = $this->broccoli->resourceMgr()->save( $options['resourceDb'] );
					return $result ? (object) array(
						"result" => true,
					) : (object) array(
						"result" => false,
						"errors" => array("Failed to save resource DB."),
					);

				case "resourceMgr.removeResource":
					$result = $this->broccoli->resourceMgr()->removeResource( $options['resKey'] ?? null );
					return $result ? (object) array(
						"result" => true,
					) : (object) array(
						"result" => false,
						"errors" => array("Failed to remove resource."),
					);

				case "fieldGpi":
					$result = $this->broccoli->getFieldDefinition( $options['__fieldId__'] )->gpi( $options['options'] );
					return $result;

				case "saveUserData":
					$result = true;
					if( array_key_exists( 'modPaletteCondition', $options ) && $options['modPaletteCondition'] ){
						if( !$this->broccoli->userStorage()->save('modPaletteCondition', $options['modPaletteCondition']) ){
							$result = false;
						}
					}
					return $result ? (object) array(
						"result" => true,
					) : (object) array(
						"result" => false,
						"errors" => array("Failed to save user data."),
					);

				default:
					return (object) array(
						'result' => false,
						'errors' => array('Unknown GPI function. ('.$api.')'),
					);
			}

		} catch( \Exception $e ) {

			$this->broccoli->log( $e->getMessage() );
			return array(
				'result' => false,
				'errors' => array($e->getMessage()),
			);

		}

		return false;
	}

}
