<?php
/**
 * broccoli-html-editor
 */
namespace broccoliHtmlEditor;

/**
 * classModule.php
 * モジュールを解析・構造化するオブジェクトクラスです。
 * 1つのモジュールを単位として表現します。
 * コンテンツデータは含みません。よって、bind() のような機能は持ちません。
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class classModule{

	/** $broccoli */
	private $broccoli;

	/** $options */
	private $options;

	/** realpath module */
	private $realpath;

	/** values */
	public	$subModName,
			$isSingleRootElement,
			$isSystemModule,
			$isSubModule,
			$isClipModule,
			$deprecated,
			$templateFilename,
			$templateType,
			$info,
			$id,
			$internalId,
			$fields,
			$subModule,
			$topThis,
			$finalize,
			$thumb;

	/**
	 * Constructor
	 */
	public function __construct($broccoli, $moduleId, $options = array()){
		$this->broccoli = $broccoli;
		$this->options = ($options ? $options : array());

		$this->realpath = $this->broccoli->getModuleRealpath($moduleId);
		if( $this->realpath !== false ){
			$this->realpath = $this->broccoli->fs()->get_realpath( $this->realpath.'/' );
		}
		$this->isSystemModule = $this->broccoli->isSystemMod($moduleId);
		$this->isSubModule = false;
		$this->isSingleRootElement = false;
		$this->isClipModule = false;

		if( !$this->isSystemModule && !is_string(@$options['src']) && !is_string($this->realpath) ){
			$moduleId = '_sys/unknown';
			$this->isSystemModule = true;
		}
		$this->id = $moduleId;
		$this->internalId = $moduleId;
		$this->fields = json_decode('{}');
		$this->subModule = json_decode('{}');
		$this->templateType = 'broccoli';
		$this->finalize = function($html, $data){ return $html; };

		$this->info = array(
			'name' => null,
			'areaSizeDetection' => 'shallow',
			'enabledParents' => array(),
			'enabledBowls' => array(),
			'interface' => array(),
			'deprecated' => false
		);

		if($this->isSystemModule){
			if($this->id == '_sys/root'){
				$this->info['name'] = 'ルート';
			}elseif($this->id == '_sys/unknown'){
				$this->info['name'] = '不明なモジュール';
			}elseif($this->id == '_sys/html'){
				$this->info['name'] = 'HTML';
			}elseif($this->id == '_sys/image'){
				$this->info['name'] = '画像';
			}
		}

		if( array_key_exists('topThis', $this->options) && $this->options['topThis'] ){
			$this->topThis = $this->options['topThis'];
			$this->templateType = $this->topThis->templateType;
			$this->info['name'] = ($this->topThis->info['name'] ? $this->topThis->info['name'] : 'null');
			$this->isSubModule = true;
			if( $options['modName'] ){
				$this->info['name'] = $options['modName'];
			}
			$this->info['name'] = $this->info['name'].' *';
			// $this->nameSpace = $this->options['topThis']->nameSpace;
			if( $options['subModName'] ){
				$this->subModName = $options['subModName'];
				if( property_exists($this->topThis->subModule, $this->subModName) && $this->topThis->subModule->{$this->subModName} ){
					// var_dump($this->topThis->subModule->{$this->subModName});
					$this->fields = $this->topThis->subModule->{$this->subModName}->fields;
				}
			}
		}else{
			$this->topThis = $this;
			// $this->nameSpace = array("vars" => array());
		}
	}

	/**
	 * 初期化する
	 */
	public function init(){

		if( $this->realpath === false && !$this->isSystemModule ){
			return false;
		}

		if( $this->id == '_sys/root' ){
			return $this->parseTpl( '{&{"module":{"name":"main","label":"コンテンツエリア"}}&}', $this );
		}elseif( $this->id == '_sys/unknown' ){
			return $this->parseTpl( '<div style="background:#f00;padding:10px;color:#fff;text-align:center;border:1px solid #fdd;">[ERROR] 未知のモジュールテンプレートです。<!-- .error --></div>'."\n", $this );
		}elseif( $this->id == '_sys/html' ){
			return $this->parseTpl( '{&{"input":{"type":"html","name":"main","label":"HTML"}}&}', $this );
		}elseif( $this->id == '_sys/image' ){
			return $this->parseTpl( '<img src="{&{"input":{"type":"image","name":"src","label":"画像"}}&}" alt="{&{"input":{"type":"html_attr_text","name":"alt","label":"代替テキスト","rows":1}}&}" />', $this );
		}elseif( is_string(@$this->options['src']) ){
			return $this->parseTpl( $this->options['src'], $this->options['topThis'] );
		}elseif( $this->topThis->templateType != 'broccoli' && is_string($this->subModName) ){
			return $this->parseTpl( null, $this->options['topThis'] );
		}elseif( $this->realpath ){
			$tmpTplSrc = null;
			if( is_file( $this->realpath.'/finalize.php' ) ){
				$tmpRealathFinalizePhp = $this->broccoli->fs()->get_realpath($this->realpath.'/finalize.php');
				$this->finalize = include($tmpRealathFinalizePhp);
			}
			$this->isClipModule = false;
			if( is_file( $this->realpath.'/clip.json' ) ){
				$this->isClipModule = true;
			}
			if( is_file( $this->realpath.'/template.html' ) ){
				$this->templateFilename = $this->realpath.'/template.html';
				$this->templateType = 'broccoli';
				$tmpTplSrc = file_get_contents( $this->templateFilename );
			}elseif( is_file( $this->realpath.'/template.html.twig' ) ){
				$this->templateFilename = $this->realpath.'/template.html.twig';
				$this->templateType = 'twig';
				$tmpTplSrc = file_get_contents( $this->templateFilename );
			}
			if( !is_string($tmpTplSrc) ){
				$tmpTplSrc = '<div style="background:#f00;padding:10px;color:#fff;text-align:center;border:1px solid #fdd;">[ERROR] モジュールテンプレートの読み込みエラーです。<!-- .error --></div>'."\n";
			}
			$tmpTplSrc = json_decode( json_encode( $tmpTplSrc ) );
			return $this->parseTpl( $tmpTplSrc, $this );
		}

		return true;
	}


	/**
	 * $fields
	 */
	public function fields(){
		return $this->fields;
	}

	/**
	 * $templateType
	 */
	public function getTemplateType(){
		return $this->templateType;
	}

	/**
	 * Markdown 文法を処理する
	 */
	private function markdownSync($str){
		if( !is_string($str) ){return $str;}
		$str = \Michelf\MarkdownExtra::defaultTransform($str);
		return $str;
	}

	/**
	 * description を正規化する
	 * @param {*} description 
	 */
	private function normalizeDescription($description){
		$description = ($description ? $description : '');
		$description = $this->markdownSync( $description );
		return $description;
	}

	/**
	 * broccoliテンプレートを解析する
	 */
	private function parseBroccoliTemplate( $src, $_topThis ){
		if( !preg_match( '/^((?:.|\r|\n)*?)\\{\\&((?:.|\r|\n)*?)\\&\\}((?:.|\r|\n)*)$/', $src, $matched ) ){
			return $src;
		}
		$field = $matched[2];
		$src = $matched[3];

		$field = json_decode( $field );
		if( is_null($field) ){
			$tmp_targetfile = preg_split('/\/+/', $this->templateFilename);
			$tmp_targetfile = array_slice( $tmp_targetfile, count($tmp_targetfile)-4, count($tmp_targetfile)-1 );
			$tmp_targetfile = implode('/', $tmp_targetfile);
			$this->broccoli->error( 'module template parse error: ' . $tmp_targetfile );
			$field = json_decode(json_encode(array(
				'input' => array(
					'type' => 'html',
					'name' => '__error__',
				)
			)));
		}

		if( is_string($field) ){
			// end系：無視
			return $this->parseBroccoliTemplate( $src, $_topThis );

		}elseif( @$field->input ){
			@$this->fields->{$field->input->name} = $field->input;
			@$this->fields->{$field->input->name}->fieldType = 'input';
			@$this->fields->{$field->input->name}->description = $this->normalizeDescription(@$this->fields->{$field->input->name}->description);
			@$this->fields->{$field->input->name} = $this->applyFieldConfig( @$this->fields->{$field->input->name} );

			return $this->parseBroccoliTemplate( $src, $_topThis );
		}elseif( @$field->module ){
			@$this->fields->{$field->module->name} = $field->module;
			@$this->fields->{$field->module->name}->fieldType = 'module';
			@$this->fields->{$field->module->name}->description = $this->normalizeDescription(@$this->fields->{$field->module->name}->description);

			@$this->fields->{$field->module->name}->enabledChildren = $this->broccoli->normalizeEnabledParentsOrChildren(@$this->fields->{$field->module->name}->enabledChildren, $this->id);

			return $this->parseBroccoliTemplate( $src, $_topThis );
		}elseif( @$field->loop ){
			@$this->fields->{$field->loop->name} = $field->loop;
			@$this->fields->{$field->loop->name}->fieldType = 'loop';
			@$this->fields->{$field->loop->name}->description = $this->normalizeDescription(@$this->fields->{$field->loop->name}->description);

			$tmpSearchResult = $this->searchEndTag( $src, 'loop' );
			$src = $tmpSearchResult['nextSrc'];
			if( !is_array($this->subModule) ){
				$this->subModule = json_decode('{}');
			}
			// var_dump(' <------- ');
			// var_dump($field->loop->name);
			// var_dump('on '.$_topThis->moduleId);
			// var_dump($tmpSearchResult['content']);
			// var_dump(' =======> ');
			@$_topThis->subModule->{$field->loop->name} = $this->broccoli->createModuleInstance( $this->id, array(
				"src" => $tmpSearchResult['content'],
				"subModName" => $field->loop->name,
				"modName" => ($field->loop->label ? $field->loop->label : $field->loop->name),
				"topThis" => $_topThis
			));
			$_topThis->subModule->{$field->loop->name}->init();

			return $this->parseBroccoliTemplate( $src, $_topThis );

		}else{
			return $this->parseBroccoliTemplate( $src, $_topThis );
		}
	} // parseBroccoliTemplate()

	/** 閉じタグを探す */
	public function searchEndTag($src, $fieldType){

		$rtn = array(
			'content' => '',
			'nextSrc' => $src
		);
		$depth = 0;
		while( 1 ){
			if( !preg_match('/^((?:.|\r|\n)*?)\\{\\&((?:.|\r|\n)*?)\\&\\}((?:.|\r|\n)*)$/', $rtn['nextSrc'], $matched) ){
				break;
			}
			$rtn['content'] .= $matched[1];
			$fieldSrc = $matched[2];
			$field = json_decode( $fieldSrc );
			if( is_null($field) ){
				$this->broccoli->log('ERROR: Failed to parse field. '.$fieldSrc);
			}
			$rtn['nextSrc'] = $matched[3];

			if( $field == 'end'.$fieldType ){
				if( $depth ){
					$depth --;
					$rtn['content'] .= '{&'.$fieldSrc.'&}';
					continue;
				}
				return $rtn;
			}elseif( @$field->{$fieldType} ){
				$depth ++;
				$rtn['content'] .= '{&'.$fieldSrc.'&}';
				continue;
			}else{
				$rtn['content'] .= '{&'.$fieldSrc.'&}';
				continue;
			}
		}
		return $rtn;

	}

	/**
	 * テンプレートを解析する
	 * @return boolean 成否
	 */
	private function parseTpl($src, $_topThis = null){
		if( is_null($_topThis) ){
			$_topThis = $this;
		}
		if( !is_null($src) ){
			$src = json_decode( json_encode( $src ) );
		}
		$this->template = $src;

		if( $this->realpath && is_dir( $this->realpath ) ){
			if( is_file( $this->realpath.'/info.json' ) ){
				$tmpJson = json_decode( file_get_contents( $this->realpath.'/info.json' ) );
				if(is_null($tmpJson)){
					$tmp_targetfile = preg_split('/\/+/', $this->realpath.'/info.json');
					$tmp_targetfile = array_slice( $tmp_targetfile, count($tmp_targetfile)-4, count($tmp_targetfile)-1 );
					$tmp_targetfile = implode('/', $tmp_targetfile);
					$this->broccoli->error( 'module info.json parse error: '.$tmp_targetfile );
					$tmpJson = json_decode('{}');
				}

				if( property_exists($tmpJson, 'id') && strlen($tmpJson->id) ){
					$this->internalId = $this->broccoli->getModuleInternalId($this->id, $tmpJson->id);
				}

				if( !strlen($this->info['name']) && @$tmpJson->name ){
					$this->info['name'] = $tmpJson->name;
				}
				if( @$tmpJson->areaSizeDetection ){
					$this->info['areaSizeDetection'] = $tmpJson->areaSizeDetection;
				}
				$this->info['enabledParents'] = $this->broccoli->normalizeEnabledParentsOrChildren(@$tmpJson->enabledParents, $this->id);
				if( is_string(@$tmpJson->enabledBowls) ){
					$this->info['enabledBowls'] = [$tmpJson->enabledBowls];
				}elseif( is_object(@$tmpJson->enabledBowls) || is_array(@$tmpJson->enabledBowls) ){
					$this->info['enabledBowls'] = $tmpJson->enabledBowls;
				}


				if( @$tmpJson->interface ){
					if( @$tmpJson->interface->fields ){
						// $this->fields = $tmpJson->interface->fields;
						foreach( $tmpJson->interface->fields as $tmpIdx=>$tmpRow  ){
							@$this->fields->{$tmpIdx} = $tmpRow;
							// name属性を自動補完
							@$this->fields->{$tmpIdx}->name = $tmpIdx;
							@$this->fields->{$tmpIdx} = $this->applyFieldConfig( @$this->fields->{$tmpIdx} );
						}
					}
					if( @$tmpJson->interface->subModule ){
						// $this->subModule = $tmpJson->interface->subModule;
						foreach( $tmpJson->interface->subModule as $tmpIdx=>$tmpRow  ){
							@$this->subModule->{$tmpIdx} = json_decode(json_encode($tmpRow));
							@$this->subModule->{$tmpIdx}->fields = array();
							if( property_exists($tmpRow, 'fields') && (is_object($tmpRow->fields) || is_array($tmpRow->fields)) ){
								foreach( $tmpRow->fields as $tmpIdx2=>$tmpRow2 ){
									@$this->subModule->{$tmpIdx}->fields[$tmpIdx2] = $tmpRow2;
									// name属性を自動補完
									@$this->subModule->{$tmpIdx}->fields[$tmpIdx2]->name = $tmpIdx2;
									@$this->subModule->{$tmpIdx}->fields[$tmpIdx2] = $this->applyFieldConfig( @$this->subModule->{$tmpIdx}->fields[$tmpIdx2] );
								}
							}
						}
					}
				}
				if( property_exists($tmpJson, 'deprecated') && $tmpJson->deprecated ){
					$this->info['deprecated'] = $tmpJson->deprecated;
				}
			}
			$this->deprecated = ($this->info['deprecated'] ? true : false);
			$this->thumb = null;
			if( is_file( $this->realpath.'/thumb.png' ) ){
				$tmpBin = file_get_contents( $this->realpath.'/thumb.png' );
				$tmpBase64 = base64_encode( $tmpBin );
				$this->thumb = 'data:image/png;base64,'.$tmpBase64;
			}
		}

		if( $src ){
			// 単一のルート要素を持っているかどうか判定。
			$this->isSingleRootElement = false;
			$tplSrc = $src;
			$tplSrc = json_decode( json_encode($tplSrc) );
			$tplSrc = preg_replace( '/'.preg_quote('<!--','/').'.*?'.preg_quote('-->','/').'/s', '', $tplSrc );
			$tplSrc = preg_replace( '/\{\&.*?\&\}/s', '', $tplSrc );
			$tplSrc = preg_replace( '/\r\n|\r|\n/s', '', $tplSrc );
			$tplSrc = preg_replace( '/\t/s', '', $tplSrc );
			$tplSrc = preg_replace( '/^[\s\r\n]*/', '', $tplSrc );
			$tplSrc = preg_replace( '/[\s\r\n]*$/', '', $tplSrc );
			if( strlen($tplSrc) && strpos($tplSrc, '<') === 0 && preg_match('/\\>$/s', $tplSrc) ){
				// HTMLをパース
				$simple_html_dom = str_get_html(
					$tplSrc ,
					false, // $lowercase
					false, // $forceTagsClosed
					DEFAULT_TARGET_CHARSET, // $target_charset
					false, // $stripRN
					DEFAULT_BR_TEXT, // $defaultBRText
					DEFAULT_SPAN_TEXT // $defaultSpanText
				);

				if($simple_html_dom === false){
					// HTMLパースに失敗
				}else{
					$simple_html_dom_ret = $simple_html_dom->find('>*');
					if( count($simple_html_dom_ret) === 1 ){
						$this->isSingleRootElement = true;
					}
				}
			}
		}

		$field = null;

		if( $_topThis->templateType != 'broccoli' ){
			// テンプレートエンジン(Twigなど)利用の場合の処理
			if( $this->subModName ){
				$this->fields = $_topThis->subModule->{$this->subModName}->fields;
			}

			foreach( $this->fields as $tmpFieldName=>$row ){
				$row->description = $this->normalizeDescription(@$row->description);
				if( @$this->fields->{$tmpFieldName}->fieldType == 'module' ){
					@$this->fields->{$tmpFieldName}->enabledChildren = $this->broccoli->normalizeEnabledParentsOrChildren(@$this->fields->{$tmpFieldName}->enabledChildren, $this->id);
				}

				if( @$this->fields->{$tmpFieldName}->fieldType == 'loop' ){
					@$this->subModule = ($this->subModule ? $this->subModule : json_decode('{}'));

					@$_topThis->subModule->{$tmpFieldName} = $this->broccoli->createModuleInstance( $this->id, array(
						"src" => '',
						"subModName" => $tmpFieldName,
						"modName" => ($this->fields->{$tmpFieldName}->label ? $this->fields->{$tmpFieldName}->label : $this->fields->{$tmpFieldName}->name),
						"topThis" => $_topThis
					) );
					$_topThis->subModule->{$tmpFieldName}->init();
				}
			}
			return true;

		}else{
			// Broccoliエンジン利用の処理
			$this->parseBroccoliTemplate($src, $_topThis);
			return true;
		}

	} // parseTpl()


	/**
	 * クリップモジュールの内容を取得する
	 *
	 * クリップモジュールではない場合は false が返されます。
	 */
	public function getClipContents(){
		$rtn = false;
		$realpath_clip = $this->realpath.'/clip.json';
		if( !is_file( $realpath_clip ) ){
			return false;
		}
		$json = file_get_contents( $realpath_clip );
		$rtn = json_decode($json);
		return $rtn;
	}

	/**
	 * READMEを取得する
	 */
	public function getReadme(){

		// README.md (html)
		$readmeHelper = new fncs_readme($this->broccoli);
		$readme = $readmeHelper->get_html($this->realpath);

		return $readme;
	}

	/**
	 * 説明用画像を取得する
	 */
	public function getPics(){

		$realpathPics = $this->broccoli->fs()->normalize_path($this->broccoli->fs()->get_realpath( $this->realpath.'/pics/' ));
		$rtn = array();
		if( is_dir($realpathPics) ){
			$piclist = $this->broccoli->fs()->ls($realpathPics);
			uasort($piclist, function($a,$b){
				if( $a < $b ) return -1;
				if( $a > $b ) return 1;
				return 0;
			});
			foreach( $piclist as $picIdx=>$row ){
				$imgPath = '';
				if( is_file($realpathPics.'/'.$piclist[$picIdx]) ){
					$imgPath = base64_encode(file_get_contents( $realpathPics.'/'.$piclist[$picIdx] ));
				}
				// var_dump( $imgPath );
				array_push($rtn, 'data:image/png;base64,'.$imgPath);
			}
		}

		return $rtn;
	}

	/**
	 * フィールド設定を反映する
	 */
	private function applyFieldConfig( $field ){
		if( !is_object($field) || !property_exists($field, 'fieldType') || $field->fieldType != 'input' ){
			return $field;
		}
		$fieldConf = $this->broccoli->getFieldConfig();
		if( array_key_exists($field->type, $fieldConf) ){
			foreach( $fieldConf[$field->type] as $key=>$val ){
				if( !property_exists( $field, $key ) ){
					$field->{$key} = $val;
				}
			}
		}
		return $field;
	}
}
