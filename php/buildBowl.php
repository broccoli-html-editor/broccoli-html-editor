<?php
/**
 * broccoli-html-editor
 */
namespace broccoliHtmlEditor;

/**
 * buildBowl
 *
 * @author Tomoya Koyanagi <tomk79@gmail.com>
 */
class buildBowl{

	/** $broccoli */
	private $broccoli;

	/** $data */
	private $data;

	/** $options */
	private $options;

	/** values */
	private $nameSpace;

	/**
	 * Constructor
	 */
	public function __construct($broccoli, $data, $options){
		$this->broccoli = $broccoli;

		$this->data = ($data ? json_decode(json_encode($data)) : json_decode('{}'));

		$options = ($options ? $options : array());
		$options['instancePath'] = $options['instancePath'] ?? '';
		$this->options = $options;

		$this->nameSpace = array("vars" => array(), "varsFinalized" => array());
		if( $this->options['nameSpace'] ?? null ){
			$this->nameSpace = $this->options['nameSpace'];
		}
	}

	/**
	 * build
	 */
	public function build(){
		$d = json_decode('{"html": ""}');

		$mod = $this->broccoli->getModuleByInternalId( $this->data->modId ?? null, $this->options['subModName'] ?? null );
		if($mod === false){
			$mod = $this->broccoli->getModule( '_sys/unknown', null );
		}

		$src = $mod->template;
		$fieldData = json_decode(json_encode($this->data->fields ?? null), true);

		if( $mod->topThis->templateType != 'broccoli' ){
			// --------------------------------------
			// テンプレートエンジン(Twigなど)利用の場合の処理
			$tplDataObj = array();

			foreach($mod->fields as $fieldName=>$field){
				if( !property_exists($field, 'fieldType') || !strlen(''.$field->fieldType) || $field->fieldType == 'input' ){
					// input field
					$fieldDef = $this->broccoli->getFieldDefinition( $field->type ); // フィールドタイプ定義を呼び出す
					$tplDataObj[$field->name] = '';
					$tmp_bind_value = null;
					if( array_key_exists($field->name, $fieldData) ){
						$tmp_bind_value = $fieldData[$field->name];
					}
					$tmpVal = $fieldDef->bind( $tmp_bind_value, $this->options['mode'], $field );
					$tmpValFin = $fieldDef->bind( $tmp_bind_value, 'finalize', $field );
					$tplDataObj[$field->name] = $tmpVal;
					$this->nameSpace['vars'][$field->name] = array(
						"fieldType" => "input",
						"type" => $field->type,
						"val" => $tmpVal
					);
					$this->nameSpace['varsFinalized'][$field->name] = array(
						'fieldType' => "input",
						'type' => $field->type,
						'val' => $tmpValFin
					);

				}elseif( $field->fieldType == 'module' ){
					// module field
					$opt = json_decode( json_encode($this->options) );
					$opt->instancePath .= '/fields.'.$field->name;
					$tmp_tplDataObj = '';

					if( !array_key_exists($field->name, $fieldData) ){
						$fieldData[$field->name] = array();
					}
					foreach( $fieldData[$field->name] as $idx=>$row ){
						// ネストされたモジュールの再帰処理
						$tmpopt = json_decode( json_encode($opt), true );
						unset($tmpopt['subModName']);// サブモジュールから外部のモジュールを参照する場合に、subModName を渡さないように配慮する必要がある。
						$tmpopt['instancePath'] .= '@'.$idx;
						$html = $this->broccoli->buildBowl($row, $tmpopt);
						$tmp_tplDataObj .= $html;
					}

					if( $this->options['mode'] == 'canvas' ){
						$tmpopt = json_decode( json_encode($opt), true );
						$tmpDepth = explode('/', $tmpopt['instancePath']);
						if( count($tmpDepth) <= 3 || !count($fieldData[$field->name]) ){ // Appenderの表示数を減らす。
							if(!is_array($fieldData[$field->name])){ $fieldData[$field->name] = array(); }
							$tmpopt['instancePath'] .= '@'.(count($fieldData[$field->name]));
							$tmp_tplDataObj .= $this->mkAppender(
								'module',
								array(
									'modId' => $mod->id,
									'instancePath' => $tmpopt['instancePath']
								)
							);
						}
					}

					$tplDataObj[$field->name] = $tmp_tplDataObj;
					$this->nameSpace['vars'][$field->name] = array(
						"fieldType" => "module",
						"val" => $tmp_tplDataObj
					);
					$this->nameSpace['varsFinalized'][$field->name] = array(
						"fieldType" => "module",
						"val" => $tmp_tplDataObj
					);

				}elseif( $field->fieldType == 'loop' ){
					// loop field
					$tmpSearchResult = $mod->searchEndTag( $src, 'loop' );
					$src = $tmpSearchResult['nextSrc'];

					$opt = json_decode( json_encode($this->options) );
					$opt->instancePath .= '/fields.'.$field->name;
					$tplDataObj[$field->name] = array();
					if( array_key_exists($field->name, $fieldData) && (is_object($fieldData[$field->name]) || is_array($fieldData[$field->name])) ){
						foreach($fieldData[$field->name] as $idx=>$row){
							// ネストされたモジュールの再帰処理
							$tmpopt = json_decode( json_encode($opt), true );
							$tmpopt['instancePath'] .= '@'.$idx;
							$tmpopt['subModName'] = $field->name;
							$html = $this->broccoli->buildBowl($row, $tmpopt );
							array_push($tplDataObj[$field->name], $html);
						}
					}
					if( $this->options['mode'] == 'canvas' ){
						$tmpopt = json_decode( json_encode($opt), true );
						if(!array_key_exists($field->name, $fieldData) || !is_array($fieldData[$field->name])){ $fieldData[$field->name] = array(); }
						$tmpopt['instancePath'] .= '@'.(count($fieldData[$field->name]));
					}

				}

			}

			if($mod->subModName){
				$d->html = $tplDataObj;
			}else{
				// Twig: 環境変数登録
				$tplDataObj['_ENV'] = array(
					"mode" => $this->options['mode'],
					"vars" => array(),
					"lang" => $this->broccoli->lb()->lang,
					"data" => $this->data,
				);
				foreach( $this->nameSpace['varsFinalized'] as $tmpKey=>$tmpRow ){
					$tplDataObj['_ENV']["vars"][$tmpKey] = $tmpRow['val'];
				}

				// Twig: カスタム関数登録
				$tplFuncs = array();
				$loopitem_memo = array(
					'nest' => array(),
					'status' => array(),
				);
				$tplFuncs['loopitem_start'] = function($fieldNameFor) use (&$loopitem_memo, $tplFuncs, $fieldData, $mod){
					ob_start();
					if( $this->options['mode'] == 'finalize' ){
						return;
					}
					array_push($loopitem_memo['nest'], $fieldNameFor);
					if( !array_key_exists($fieldNameFor, $loopitem_memo['status']) ){
						$loopitem_memo['status'][$fieldNameFor] = array(
							'index' => 0,
							'closed' => false,
						);
					}else{
						$loopitem_memo['status'][$fieldNameFor]['index'] ++;
						$loopitem_memo['status'][$fieldNameFor]['closed'] = false;
					}
					return;
				};
				$tplFuncs['loopitem_end'] = function() use (&$loopitem_memo, $tplFuncs, $fieldData, $mod){
					$fieldNameFor = array_pop($loopitem_memo['nest']);
					$loopitem_memo['status'][$fieldNameFor]['closed'] = true;

					$html = ob_get_clean();
						// NOTE: Twig 3.9以降、この `ob_get_clean()` はコンテンツを取得できなくなりました。(おそらく、標準出力されない仕様になった？)
						// TODO: Twig 3.9以降の新しい仕様に対応する。
					if( $this->options['mode'] == 'finalize' ){
						echo $html;
						return;
					}
					$tmp_options = json_decode(json_encode($this->options), true);
					$tmp_options['instancePath'] .= '/fields.'.$fieldNameFor.'@'.($loopitem_memo['status'][$fieldNameFor]['index']);
					$tmp_options['subModName'] = $fieldNameFor;
					$html = $this->finalize_module_instance_panel( $html, $mod, $tmp_options );
					echo $html;
					unset($tmp_options);
					return;
				};
				$tplFuncs['appender'] = function($fieldNameFor) use (&$loopitem_memo, $tplFuncs, $fieldData, $mod){
					if( $this->options['mode'] == 'finalize' ){
						return;
					}
					if($mod->fields->{$fieldNameFor}->fieldType == 'loop'){
						$appender = $this->mkAppender('loop', array(
							'modId' => $this->data->modId,
							'subModName' => $fieldNameFor,
							'instancePath' => $this->options['instancePath'].'/fields.'.$fieldNameFor.'@'.count($fieldData[$fieldNameFor]),
						));
						echo $appender;

					}elseif($mod->fields->{$fieldNameFor}->fieldType == 'module'){
						if( !count($fieldData[$fieldNameFor]) ){ // Appenderの表示数を減らす。
							$appender = $this->mkAppender('module', array(
								'modId' => $this->data->modId,
								'subModName' => null,
								'instancePath' => $this->options['instancePath'].'/fields.'.$fieldNameFor.'@'.count($fieldData[$fieldNameFor]),
							));
							echo $appender;
						}

					}
					return;
				};

				$twigHelper = new helper_twig();
				$tmp_twig_rtn = $twigHelper->bind($src, $tplDataObj, $tplFuncs);

				if( !is_string($tmp_twig_rtn) ){
					$tmp_twig_rtn = '<div class="error">TemplateEngine Rendering ERROR.</div>';
				}
				$d->html = $tmp_twig_rtn;
				unset($tmp_twig_rtn);
			}

		}else{
			// --------------------------------------
			// Broccoliエンジン利用の処理
			$rtn = '';
			while(1){

				if( !preg_match( '/^((?:.|\r|\n)*?)\{\&((?:.|\r|\n)*?)\&\}((?:.|\r|\n)*)$/', $src, $matched ) ){
					$rtn .= $src;
					break;
				}

				$rtn .= $matched[1];
				$field = $matched[2];
				$field = json_decode( $field );
				if( is_null($field) ){
					$field = json_decode(json_encode(array('input' => array(
						'type'=>'html',
						'name'=>'__error__'
					))));
				}
				$src = $matched[3];
				$src = preg_replace('/^(?:\r\n|\r|\n)/s', '', $src);

				if( is_string($field) ){
					// end系：無視
					continue;

				}elseif( $field->input ?? null ){
					// input field
					$tmpVal = '';
					$tmpValFin = '';

					// フィールドタイプ定義を呼び出す
					$fieldDef = $this->broccoli->getFieldDefinition($field->input->type);
					if( !$fieldDef ){
						// ↓未定義のフィールドタイプの場合のデフォルトの挙動
						$fieldDef = $this->broccoli->fieldBase();
					}
					$html = $fieldDef->bind( $fieldData[$field->input->name] ?? null, $this->options['mode'], $field->input );
					$tmpVal .= $html;
					$html = $fieldDef->bind( $fieldData[$field->input->name] ?? null, 'finalize', $field->input );
					$tmpValFin .= $html;

					if( !($field->input->hidden ?? null) ){//← "hidden": true だったら、非表示(=出力しない)
						$rtn .= $tmpVal;
					}
					$this->nameSpace['vars'][$field->input->name] = array(
						'fieldType' => "input", 'type' => $field->input->type, 'val' => $tmpVal
					);
					$this->nameSpace['varsFinalized'][$field->input->name] = array(
						'fieldType' => "input", 'type' => $field->input->type, 'val' => $tmpValFin
					);

					continue;

				}elseif( $field->module ?? null ){
					// module field
					$opt = json_decode( json_encode($this->options) );
					$opt->instancePath .= '/fields.'.$field->module->name;
					$tmpVal = '';
					if(is_array($fieldData[$field->module->name] ?? null)){
						foreach( $fieldData[$field->module->name] as $idx=>$row ){
							// ネストされたモジュールの再帰処理
							$tmpopt = json_decode( json_encode($opt), true );
							$tmpopt['instancePath'] .= '@'.$idx;
							$tmpopt['subModName'] = null;
							unset($tmpopt['subModName']);
							$html = $this->broccoli->buildBowl($row, $tmpopt);
							$tmpVal .= $html;
						}
					}

					if( $this->options['mode'] == 'canvas' ){
						$tmpopt = json_decode( json_encode($opt), true );
						if(!is_array($fieldData[$field->module->name] ?? null)){ $fieldData[$field->module->name] = array(); }
						$tmpopt['instancePath'] .= '@'.(count($fieldData[$field->module->name]));
						$tmpDepth = explode('/', $tmpopt['instancePath']);
						if( count($tmpDepth) <= 3 || !count($fieldData[$field->module->name]) ){ // Appenderの表示数を減らす。
							$tmpVal .= $this->mkAppender(
								'module',
								array(
									'modId' => $mod->id,
									'instancePath' => $tmpopt['instancePath']
								)
							);
						}
					}

					if( !($field->module->hidden ?? null) ){//← "hidden": true だったら、非表示(=出力しない)
						$rtn .= $tmpVal;
					}
					$this->nameSpace['vars'][$field->module->name] = array(
						"fieldType" => "module", "val" => $tmpVal
					);
					$this->nameSpace['varsFinalized'][$field->module->name] = array(
						"fieldType" => "module", "val" => $tmpVal
					);

					continue;

				}elseif( $field->loop ?? null ){
					// loop field
					$tmpSearchResult = $mod->searchEndTag( $src, 'loop' );
					$src = $tmpSearchResult['nextSrc'];

					$opt = json_decode( json_encode($this->options) );
					$opt->instancePath .= '/fields.'.$field->loop->name;
					$tmpVal = '';
					foreach( $fieldData[$field->loop->name] as $idx=>$row ){
						// ネストされたモジュールの再帰処理
						$tmpopt = json_decode( json_encode($opt), true );
						$tmpopt['instancePath'] .= '@'.$idx;
						$tmpopt['subModName'] = $field->loop->name;
						if(property_exists($field->loop, 'index') && $field->loop->index){
							$this->nameSpace['vars'][$field->loop->index] = array(
								"fieldType"=>'input',
								"type"=>'html',
								"val"=>($idx + 1),
							);
							$this->nameSpace['varsFinalized'][$field->loop->index] = $this->nameSpace['vars'][$field->loop->index];
						}
						$tmpopt['nameSpace'] = $this->nameSpace;
						$html = $this->broccoli->buildBowl($row, $tmpopt);
						$tmpVal .= $html;
					}

					if( $this->options['mode'] == 'canvas' ){
						$tmpopt = json_decode( json_encode($opt), true );
						if(!is_array($fieldData[$field->loop->name])){ $fieldData[$field->loop->name] = array(); }
						$tmpopt['instancePath'] .= '@'.(count($fieldData[$field->loop->name]));
						$tmpVal .= $this->mkAppender(
							'loop',
							array(
								'modId' => $mod->id,
								'subModName' => $field->loop->name,
								'instancePath' => $tmpopt['instancePath']
							)
						);
					}

					if( !($field->loop->hidden ?? null) ){//← "hidden": true だったら、非表示(=出力しない)
						$rtn .= $tmpVal;
					}
					$this->nameSpace['vars'][$field->loop->name] = array(
						'fieldType' => "loop", 'val' => $tmpVal
					);
					$this->nameSpace['varsFinalized'][$field->loop->name] = array(
						'fieldType' => "loop", 'val' => $tmpVal
					);

					continue;

				}elseif( $field->if ?? null ){
					// if field
					// is_set に指定されたフィールドに値があったら、という評価ロジックを取り急ぎ実装。
					// もうちょっとマシな条件の書き方がありそうな気がするが、あとで考える。
					// → 2015-04-25: cond のルールを追加。
					$tmpSearchResult = $mod->searchEndTag( $src, 'if' );
					$tmpFncIfContentList = function($field, $src)use($mod){
						// ifフィールド内の構造(elseif, else) を解析する
						$contentList = array();
						$currentFieldName = 'if';
						$currentSrc = '';
						$currentField = $field->if;
						$subFieldStr = null;
						$subField = null;
						while(1){
							if( !preg_match( '/^((?:.|\r|\n)*?)\{\&((?:.|\r|\n)*?)\&\}((?:.|\r|\n)*)$/', $src, $matched ) ){
								$currentSrc .= $src;
								array_push($contentList, array(
									"fieldName" => $currentFieldName,
									"field" => $currentField,
									"content" => $currentSrc
								));
								break;
							}
							$currentSrc .= $matched[1];
							$subFieldStr = $matched[2];
							$subField = json_decode( $subFieldStr );
							if( is_null($subField) ){
								$subField = json_decode(json_encode(array('input'=>array(
									'type'=>'html',
									'name'=>'__error__'
								))));
							}
							$src = $matched[3];

							if( $subField === "else" ){
								// elseフィールド
								$src = preg_replace('/^(?:\r\n|\r|\n)/s', '', $src);
								array_push($contentList, array(
									'fieldName' => $currentFieldName,
									'field' => $currentField,
									'content' => $currentSrc
								));
								$currentFieldName = 'else';
								$currentField = null;
								$currentSrc = '';

							}elseif( is_string($subField) ){
								// end系: 無視

							}elseif( $subField->elseif ?? null ){
								// elseifフィールド
								$src = preg_replace('/^(?:\r\n|\r|\n)/s', '', $src);
								array_push($contentList, array(
									'fieldName' => $currentFieldName,
									'field' => $currentField,
									'content' => $currentSrc
								));
								$currentFieldName = 'elseif';
								$currentField = $subField->elseif;
								$currentSrc = '';

							}elseif( $subField->if ?? null ){
								// ネストされた ifフィールド
								$currentSrc .= '{&'.$subFieldStr.'&}';
								$tmpSearchResult = $mod->searchEndTag( $src, 'if' );
								$currentSrc .= $tmpSearchResult['content'];
								$currentSrc .= '{&"endif"&}';
								$src = $tmpSearchResult['nextSrc'];

							}else{
								// その他すべて
								$currentSrc .= '{&'.$subFieldStr.'&}';
							}
							continue;
						}
						return $contentList;
					};
					$tmpIfContentList = $tmpFncIfContentList($field, $tmpSearchResult['content']);

					$src = '';
					foreach($tmpIfContentList as $idx=>$row){
						if($tmpIfContentList[$idx]['fieldName'] == 'else'){
							$src .= $tmpIfContentList[$idx]['content'];
							break;
						}
						$boolResult = $this->evaluateIfFieldCond($tmpIfContentList[$idx]['field']);
						if( $boolResult ){
							$src .= $tmpIfContentList[$idx]['content'];
							break;
						}
					}
					$src .= $tmpSearchResult['nextSrc'];

					continue;

				}elseif( $field->echo ?? null ){
					// echo field
					if( ($this->nameSpace['vars'][$field->echo->ref] ?? null) && ($this->nameSpace['vars'][$field->echo->ref]['val'] ?? null) ){
						$rtn .= $this->nameSpace['vars'][$field->echo->ref]['val'];
					}

					continue;
				}

			}

			$d->html = $rtn;
		}
		unset($rtn);


		if( is_string($d->html) ){
			// finalize.php の処理をかける
			$finalize = $mod->finalize;
			$d->html = $finalize( $d->html, array('data'=>$this->data) );


			// canvasモードのとき、scriptタグは削除する。
			// scriptの挙動がGUI編集画面を破壊する可能性があるため。
			if( $this->options['mode'] == 'canvas' ){
				// HTMLをパース
				$simple_html_dom = str_get_html(
					$d->html ,
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
					$simple_html_dom_ret = $simple_html_dom->find('script');
					foreach( $simple_html_dom_ret as $simple_html_dom_ret_node ){
						$simple_html_dom_ret_node->outertext = '<div style="color:#eee; background-color: #f00; border: 3px solid #f00; text-align: center;">script element</div>';
					}
					$d->html = $simple_html_dom->outertext;
				}
			}
		}

		$d->html = $this->finalize_module_instance_panel( $d->html, $mod, $this->options );
		$d->html = $this->finalize_module_instance_dec( $d->html, $this->data );
		$d->html = $this->finalize_module_instance_anchor( $d->html, $this->data );

		return $d->html;
	}


	/**
	 * Appenderを生成する
	 */
	private function mkAppender($fieldType, $param){
		$rtn = '';

		switch($fieldType){
			case 'module':
				$baseSize = 14;
				$depth = count(explode('/', $param['instancePath'])) - 3;
				if($depth<1){$depth=1;}
				$style = array();

				$style['font-size'] = $baseSize * ( 100 - $depth*5 ) / 100;
				$style['padding'] = 15 - $depth*2;
				$style['background-color'] = '#F5FAFF';
				// if($depth <= 0){
				// 	$style['background-color'] = '#F5FAFF';
				// }elseif($depth <= 1){
				// 	$style['background-color'] = '#F5FAFF';
				// }elseif($depth <= 2){
				// 	$style['background-color'] = '#F5FAFF';
				// }elseif($depth <= 3){
				// 	$style['background-color'] = '#F5FAFF';
				// }else{
				// 	$style['background-color'] = '#F5FAFF';
				// }

				$rtn .= '<div';
				$rtn .= ' data-broccoli-instance-path="'.htmlspecialchars($param['instancePath']).'"';
				$rtn .= ' data-broccoli-mod-id="'.htmlspecialchars($param['modId']).'"';
				$rtn .= ' data-broccoli-is-appender="yes"';
				$rtn .= ' style="';
				$rtn .=     'height:auto;';
				$rtn .=     'max-height:calc('.$style['font-size'].' * 6px);';
				$rtn .=     'overflow:hidden;';
				$rtn .=     'padding:'.$style['padding'].'px;';
				$rtn .=     'background-color:'.$style['background-color'].';';
				$rtn .=     'border:3px solid transparent;';
				$rtn .=     'border-radius:0px;';
				$rtn .=     'font-family: &quot;Hiragino Kaku Gothic ProN&quot;, Meiryo, Verdana, sans-serif;';
				$rtn .=     'font-size:'.$style['font-size'].'px;';
				$rtn .=     'color:#3871E0;';
				$rtn .=     'text-align:center;';
				$rtn .=     'box-sizing:border-box;';
				$rtn .=     'clear:both;';
				$rtn .=     'white-space:nowrap;';
				$rtn .=     'margin:10px 0;';
				$rtn .= '"';
				$rtn .= '>';
				$rtn .= $this->broccoli->lb()->get('ui_label.drop_a_module_here');
				$rtn .= '</div>';
				break;

			case 'loop':
				$rtn .= '<div';
				$rtn .= ' data-broccoli-instance-path="'.htmlspecialchars($param['instancePath']).'"';
				$rtn .= ' data-broccoli-mod-id="'.htmlspecialchars($param['modId']).'"';
				$rtn .= ' data-broccoli-sub-mod-name="'.htmlspecialchars($param['subModName']).'"';
				$rtn .= ' data-broccoli-is-appender="yes"';
				$rtn .= ' style="';
				$rtn .=     'height:auto;';
				$rtn .=     'max-height:calc(9 * 6px);';
				$rtn .=     'overflow:hidden;';
				$rtn .=     'padding:5px 15px;';
				$rtn .=     'background-color:#F4FFFC;';
				$rtn .=     'border:3px solid transparent;';
				$rtn .=     'border-radius:0px;';
				$rtn .=     'font-family: &quot;Hiragino Kaku Gothic ProN&quot;, Meiryo, Verdana, sans-serif;';
				$rtn .=     'font-size:14px;';
				$rtn .=     'color:#189AA3;';
				$rtn .=     'text-align:center;';
				$rtn .=     'box-sizing:border-box;';
				$rtn .=     'clear:both;';
				$rtn .=     'white-space:nowrap;';
				$rtn .=     'margin:10px 0;';
				$rtn .= '"';
				$rtn .= '>';
				$rtn .= ''.$this->broccoli->lb()->get('ui_label.dblclick_here_and_add_array_element');
				$rtn .= '</div>';
				break;
		}
		return $rtn;
	}



	/**
	 * ifフィールドの条件式を評価する
	 */
	private function evaluateIfFieldCond( $ifField ){
		$boolResult = false;
		if( ($ifField->cond ?? null) && is_array($ifField->cond) ){
			// cond の評価
			// cond に、2次元配列を受け取った場合。
			// 1次元目は or 条件、2次元目は and 条件で評価する。
			foreach( $ifField->cond as $condIdx=>$cond){
				$condBool = true;
				foreach( $ifField->cond[$condIdx] as $condIdx2=>$cond2 ){
					$tmpCond = $ifField->cond[$condIdx][$condIdx2];
					if( preg_match( '/^([\s\S]*?)\:([\s\S]*)$/s', $tmpCond, $matched ) ){
						$tmpMethod = trim($matched[1]);
						$tmpValue = trim($matched[2]);

						if( $tmpMethod == 'is_set' ){
							if( !($this->nameSpace['varsFinalized'][$tmpValue] ?? null) || !strlen(trim($this->nameSpace['varsFinalized'][$tmpValue]['val'] ?? '')) ){
								$condBool = false;
								break;
							}
						}elseif( $tmpMethod == 'is_mode' ){
							if( $tmpValue != $this->options['mode'] ){
								$condBool = false;
								break;
							}
						}
					}elseif( preg_match( '/^([\s\S]*?)(\!\=|\=\=)([\s\S]*)$/s', $tmpCond, $matched ) ){
						$tmpValue = trim($matched[1]);
						$tmpOpe = trim($matched[2]);
						$tmpDiff = trim($matched[3]);
						if( $tmpOpe == '==' ){
							$condBool = false;
							if( ($this->nameSpace['varsFinalized'][$tmpValue] ?? null) && trim($this->nameSpace['varsFinalized'][$tmpValue]['val'] ?? '') == trim($tmpDiff) ){
								$condBool = true;
								break;
							}
						}elseif( $tmpOpe == '!=' ){
							if( ($this->nameSpace['varsFinalized'][$tmpValue] ?? null) && trim($this->nameSpace['varsFinalized'][$tmpValue]['val'] ?? '') == trim($tmpDiff) ){
								$condBool = false;
								break;
							}
						}
					}

				}
				if( $condBool ){
					$boolResult = true;
					break;
				}
			}
		}

		if( ($this->nameSpace['varsFinalized'][($ifField->is_set ?? null)] ?? null) && strlen(trim($this->nameSpace['varsFinalized'][($ifField->is_set ?? null)]['val'] ?? '')) ){
			// is_set の評価
			$boolResult = true;
		}
		return $boolResult;
	}

	/**
	 * モジュールインスタンスの仕上げ処理: パネル情報を埋め込む
	 */
	private function finalize_module_instance_panel( $d_html, $mod, $options ){

		if( is_string($d_html) && $options['mode'] == 'canvas' ){

			$isSingleRootElement = function($tplSrc) use ($options){
				if( preg_match('/^\/bowl\.[^\/]+$/s', $options['instancePath']) ){
					return false;
				}
				$tplSrc = preg_replace( '/\<\!\-\-[\s\S]*?\-\-\>/s', '', $tplSrc );
				$tplSrc = preg_replace( '/\{\&[\s\S]*?\&\}/s', '', $tplSrc );
				$tplSrc = preg_replace( '/\r\n|\r|\n/s', '', $tplSrc );
				$tplSrc = preg_replace( '/\t/s', '', $tplSrc );
				$tplSrc = preg_replace( '/^[\s\r\n]*/s', '', $tplSrc );
				$tplSrc = preg_replace( '/[\s\r\n]*$/s', '', $tplSrc );

				if( strlen(''.$tplSrc) && strpos($tplSrc, '<') === 0 && preg_match('/\>$/s', $tplSrc) ){
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
						$attr = 'data-dec';
						$simple_html_dom_ret = $simple_html_dom->find('>*');
						if( count($simple_html_dom_ret) == 1 ){
							return true;
						}
					}

				}
				return false;

			};
			$isSingleRootElement = $isSingleRootElement($d_html);

			if( $isSingleRootElement ){
				// HTMLをパース
				$simple_html_dom = str_get_html(
					$d_html ,
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
					$attr = 'data-dec';
					$simple_html_dom_ret = $simple_html_dom->find('>*');

					$simple_html_dom_ret[0]->{'data-broccoli-instance-path'} = $options['instancePath'];
					$moduleName = (strlen($mod->info['name'] ?? '') ? $mod->info['name'] : $mod->id);
					if( $options['subModName'] ?? null ){
						$moduleName = $options['subModName'];
						$simple_html_dom_ret[0]->{'data-broccoli-sub-mod-name'} = $options['subModName'];
					}
					$simple_html_dom_ret[0]->{'data-broccoli-area-size-detection'} = (strlen($mod->info['areaSizeDetection'] ?? '') ? $mod->info['areaSizeDetection'] : 'shallow');
					$simple_html_dom_ret[0]->{'data-broccoli-module-name'} = $moduleName;
					$d_html = $simple_html_dom->outertext;
				}

			}else{
				$tmp_html = '';
				$tmp_html .= '<div';
				$tmp_html .= ' data-broccoli-instance-path="'.htmlspecialchars($options['instancePath']).'"';
				$moduleName = (strlen($mod->info['name'] ?? '') ? $mod->info['name'] : $mod->id);
				if( $options['subModName'] ?? null ){
					$moduleName = $options['subModName'];
					$tmp_html .= ' data-broccoli-sub-mod-name="'.htmlspecialchars($options['subModName']).'"';
				}
				$tmp_html .= ' data-broccoli-area-size-detection="'.htmlspecialchars((strlen($mod->info['areaSizeDetection'] ?? '') ? $mod->info['areaSizeDetection'] : 'shallow')).'"';
				// $tmp_html .= ' data-broccoli-is-single-root-element="'+(isSingleRootElement?'yes':'no').'"';
				$tmp_html .= ' data-broccoli-module-name="'.htmlspecialchars($moduleName).'"';
				$tmp_html .= '>';
				$tmp_html .= $d_html;
				$tmp_html .= '</div>';
				$d_html = $tmp_html;
			}
		}

		return $d_html;
	}

	/**
	 * モジュールインスタンスの仕上げ処理: anchor情報を埋め込む
	 */
	private function finalize_module_instance_anchor( $d_html, $data ){

		if(is_string($d_html)){
			if( $data->anchor ?? null ){
				// HTMLをパース
				$simple_html_dom = str_get_html(
					$d_html ,
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
					$attr = 'id';
					$simple_html_dom_ret = $simple_html_dom->find('*');
					foreach( $simple_html_dom_ret as $simple_html_dom_ret_node ){
						$simple_html_dom_ret_node->$attr = $data->anchor;
						break;
					}
					$d_html = $simple_html_dom->outertext;
				}
			}
		}

		return $d_html;
	}

	/**
	 * モジュールインスタンスの仕上げ処理: DEC情報を埋め込む
	 */
	private function finalize_module_instance_dec( $d_html, $data ){

		if(is_string($d_html)){
			if( $data->dec ?? null ){
				// HTMLをパース
				$simple_html_dom = str_get_html(
					$d_html ,
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
					$attr = 'data-dec';
					$simple_html_dom_ret = $simple_html_dom->find('*');
					foreach( $simple_html_dom_ret as $simple_html_dom_ret_node ){
						$simple_html_dom_ret_node->$attr = $data->dec;
						break;
					}
					$d_html = $simple_html_dom->outertext;
				}
			}
		}

		return $d_html;
	}

}
