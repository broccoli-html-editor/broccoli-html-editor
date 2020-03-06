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

		// var_dump($data);
		// var_dump($options);

		$this->data = ($data ? json_decode(json_encode($data)) : json_decode('{}'));

		$options = ($options ? $options : array());
		$options['instancePath'] = (@$options['instancePath'] ? $options['instancePath'] : '');
		$this->options = $options;

		$this->nameSpace = array("vars" => array(), "varsFinalized" => array());
		if( @$this->options['nameSpace'] ){
			$this->nameSpace = $this->options['nameSpace'];
		}
	}

	/**
	 * build
	 */
	public function build(){
		$d = json_decode('{"html": ""}');

		$mod = $this->broccoli->getModule( @$this->data->modId, @$this->options['subModName'] );
		if($mod === false){
			$mod = $this->broccoli->getModule( '_sys/unknown', null );
		}

		$src = $mod->template;
		$fieldData = json_decode(json_encode(@$this->data->fields), true);
		// var_dump($mod->topThis->templateType);

		if( $mod->topThis->templateType != 'broccoli' ){
			// テンプレートエンジン(Twigなど)利用の場合の処理
			// var_dump($mod->id . ' - ' . $mod->subModName);
			$tplDataObj = array();

			foreach($mod->fields as $fieldName=>$field){
				if( @$field->fieldType == 'input' ){
					// input field
					$fieldDef = $this->broccoli->getFieldDefinition( $field->type ); // フィールドタイプ定義を呼び出す
					$tmpVal = '';
					$tplDataObj[$field->name] = '';
					$html = $fieldDef->bind( $fieldData[$field->name], $this->options['mode'], $field );
					$tmpVal .= $html;
					if( !@$field->hidden ){//← "hidden": true だったら、非表示(=出力しない)
						$tplDataObj[$field->name] = $tmpVal;
					}
					@$this->nameSpace['vars'][$field->name] = array(
						"fieldType" => "input",
						"type" => $field->type,
						"val" => $tmpVal
					);

				}elseif( @$field->fieldType == 'module' ){
					// module field
					$opt = json_decode( json_encode($this->options) );
					$opt->instancePath .= '/fields.'.$field->name;
					$tmp_tplDataObj = '';

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

					if( !@$field->hidden ){//← "hidden": true だったら、非表示(=出力しない)
						$tplDataObj[$field->name] = $tmp_tplDataObj;
					}
					@$this->nameSpace['vars'][$field->name] = array(
						"fieldType" => "module",
						"val" => $tmp_tplDataObj
					);

				}elseif( @$field->fieldType == 'loop' ){
					// loop field
					$tmpSearchResult = $mod->searchEndTag( $src, 'loop' );
					$src = $tmpSearchResult['nextSrc'];

					$opt = json_decode( json_encode($this->options) );
					$opt->instancePath .= '/fields.'.$field->name;
					$tplDataObj[$field->name] = array();
					foreach($fieldData[$field->name] as $idx=>$row){
						// ネストされたモジュールの再帰処理
						$tmpopt = json_decode( json_encode($opt), true );
						$tmpopt['instancePath'] .= '@'.$idx;
						$tmpopt['subModName'] = $field->name;
						// var_dump($tmpopt);
						$html = $this->broccoli->buildBowl($row, $tmpopt );
						array_push($tplDataObj[$field->name], $html);
					}
					if( $this->options['mode'] == 'canvas' ){
						$tmpopt = json_decode( json_encode($opt), true );
						if(!is_array($fieldData[$field->name])){ $fieldData[$field->name] = array(); }
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
				);
				// Twig: カスタム関数登録
				$tplFuncs = array();
				$loopitem_memo = array();
				$tplFuncs['loopitem_start'] = function($fieldNameFor) use ($loopitem_memo, $tplFuncs, $fieldData, $mod){
					ob_start();
					return;
				};
				$tplFuncs['loopitem_end'] = function($fieldNameFor) use ($loopitem_memo, $tplFuncs, $fieldData, $mod){
					$html = ob_get_clean();
					if( $this->options['mode'] == 'finalize' ){
						echo $html;
						return;
					}
					$html = $this->finalize_module_instance_panel( $html, $mod );
					echo $html;
					return;
				};
				$tplFuncs['appender'] = function($fieldNameFor) use ($loopitem_memo, $tplFuncs, $fieldData, $mod){
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
						$appender = $this->mkAppender('module', array(
							'modId' => $this->data->modId,
							'subModName' => null,
							'instancePath' => $this->options['instancePath'].'/fields.'.$fieldNameFor.'@'.count($fieldData[$fieldNameFor]),
						));
						echo $appender;

					}
					return;
				};

				$twigHelper = new helper_twig();
				$tmp_twig_rtn = $twigHelper->bind($src, $tplDataObj, $tplFuncs);

				if( !is_string($tmp_twig_rtn) ){
					// var_dump( 'TemplateEngine Rendering ERROR.' );
					$tmp_twig_rtn = '<div class="error">TemplateEngine Rendering ERROR.</div>';
				}
				$d->html = $tmp_twig_rtn;
				unset($tmp_twig_rtn);
			}

		}else{
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

				}elseif( @$field->input ){
					// input field
					$tmpVal = '';
					$tmpValFin = '';

					// フィールドタイプ定義を呼び出す
					$fieldDef = $this->broccoli->getFieldDefinition($field->input->type);
					if( !$fieldDef ){
						// ↓未定義のフィールドタイプの場合のデフォルトの挙動
						$fieldDef = $this->broccoli->fieldBase();
					}
					$html = $fieldDef->bind( @$fieldData[$field->input->name], $this->options['mode'], $field->input );
					$tmpVal .= $html;
					$html = $fieldDef->bind( @$fieldData[$field->input->name], 'finalize', $field->input );
					$tmpValFin .= $html;

					if( !@$field->input->hidden ){//← "hidden": true だったら、非表示(=出力しない)
						$rtn .= $tmpVal;
					}
					@$this->nameSpace['vars'][$field->input->name] = array(
						'fieldType' => "input", 'type' => $field->input->type, 'val' => $tmpVal
					);
					@$this->nameSpace['varsFinalized'][$field->input->name] = array(
						'fieldType' => "input", 'type' => $field->input->type, 'val' => $tmpValFin
					);

					continue;

				}elseif( @$field->module ){
					// module field
					$opt = json_decode( json_encode($this->options) );
					$opt->instancePath .= '/fields.'.$field->module->name;
					$tmpVal = '';
					if(is_array(@$fieldData[$field->module->name])){
						foreach( $fieldData[$field->module->name] as $idx=>$row ){
							// ネストされたモジュールの再帰処理
							$tmpopt = json_decode( json_encode($opt), true );
							$tmpopt['instancePath'] .= '@'.$idx;
							$tmpopt['subModName'] = null;
							unset($tmpopt['subModName']);
							// var_dump($tmpopt);
							$html = $this->broccoli->buildBowl($row, $tmpopt);
							$tmpVal .= $html;
						}
					}

					if( $this->options['mode'] == 'canvas' ){
						$tmpopt = json_decode( json_encode($opt), true );
						if(!is_array(@$fieldData[$field->module->name])){ $fieldData[$field->module->name] = array(); }
						$tmpopt['instancePath'] .= '@'.(count($fieldData[$field->module->name]));
						$tmpVal .= $this->mkAppender(
							'module',
							array(
								'modId' => $mod->id,
								'instancePath' => $tmpopt['instancePath']
							)
						);
					}

					if( !@$field->module->hidden ){//← "hidden": true だったら、非表示(=出力しない)
						$rtn .= $tmpVal;
					}
					@$this->nameSpace['vars'][$field->module->name] = array(
						"fieldType" => "module", "val" => $tmpVal
					);
					@$this->nameSpace['varsFinalized'][$field->module->name] = array(
						"fieldType" => "module", "val" => $tmpVal
					);

					continue;

				}elseif( @$field->loop ){
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
						// var_dump($tmpopt);
						$html = $this->broccoli->buildBowl($row, $tmpopt);
						// $tmpVal .= '<!-- ---- LOOP ---- -->';
						$tmpVal .= $html;
						// $tmpVal .= '<!-- ---- /LOOP ---- -->';
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

					if( !@$field->loop->hidden ){//← "hidden": true だったら、非表示(=出力しない)
						$rtn .= $tmpVal;
					}
					@$this->nameSpace['vars'][$field->loop->name] = array(
						'fieldType' => "loop", 'val' => $tmpVal
					);
					@$this->nameSpace['varsFinalized'][$field->loop->name] = array(
						'fieldType' => "loop", 'val' => $tmpVal
					);

					continue;

				}elseif( @$field->if ){
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

							}elseif( @$subField->elseif ){
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

							}elseif( @$subField->if ){
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
					// var_dump($tmpIfContentList);

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

				}elseif( @$field->echo ){
					// echo field
					if( @$this->nameSpace['vars'][$field->echo->ref] && @$this->nameSpace['vars'][$field->echo->ref]['val'] ){
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

		$d->html = $this->finalize_module_instance_panel( $d->html, $mod );
		$d->html = $this->finalize_module_instance_dec( $d->html );

		return $d->html;
	}


	/**
	 * Appenderを生成する
	 */
	private function mkAppender($fieldType, $param){
		$rtn = '';

		switch($fieldType){
			case 'module':
				$baseSize = 16;
				$depth = count(explode('/', $param['instancePath'])) - 3;
				if($depth<0){$depth=0;}
				$style = array();
				// var_dump($depth);

				// $obj['font-size'] = $baseSize;
				$style['font-size'] = $baseSize * ( 100 - $depth*10 ) / 100;
				$style['padding'] = 15 - $depth*2;
				$style['background-color'] = '#fbfbff';
				if($depth <= 0){
					$style['background-color'] = '#eef';
				}elseif($depth <= 1){
					$style['background-color'] = '#f4f4ff';
				}elseif($depth <= 2){
					$style['background-color'] = '#f6f6ff';
				}elseif($depth <= 3){
					$style['background-color'] = '#f9f9ff';
				}else{
					$style['background-color'] = '#fbfbff';
				}

				$rtn .= '<div';
				$rtn .= ' data-broccoli-instance-path="'.htmlspecialchars($param['instancePath']).'"';
				$rtn .= ' data-broccoli-mod-id="'.htmlspecialchars($param['modId']).'"';
				$rtn .= ' data-broccoli-is-appender="yes"';
				$rtn .= ' style="';
				$rtn .=     'height:auto;';
				$rtn .=     'overflow:hidden;';
				$rtn .=     'padding:'.$style['padding'].'px;';
				$rtn .=     'background-color:'.$style['background-color'].';';
				$rtn .=     'border:3px solid transparent;';
				$rtn .=     'border-radius:5px;';
				$rtn .=     'font-family: &quot;YuGothic&quot;, &quot;Yu Gothic&quot;, Meiryo, &quot;Hiragino Kaku Gothic ProN&quot;, Verdana, sans-serif;';
				$rtn .=     'font-size:'.$style['font-size'].'px;';
				$rtn .=     'color:#000;';
				$rtn .=     'text-align:center;';
				$rtn .=     'box-sizing:border-box;';
				$rtn .=     'clear:both;';
				$rtn .=     'white-space:nowrap;';
				$rtn .=     'margin:10px 0;';
				$rtn .= '"';
				$rtn .= '>';
				$rtn .= '(+) '.$this->broccoli->lb()->get('ui_label.drop_a_module_here');
				$rtn .= '</div>';
				break;

			case 'loop':
				$rtn .= '<div';
				$rtn .= ' data-broccoli-instance-path="'.htmlspecialchars($param['instancePath']).'"';
				$rtn .= ' data-broccoli-mod-id="'.htmlspecialchars($param['modId']).'"';
				$rtn .= ' data-broccoli-sub-mod-name="'.htmlspecialchars($param['subModName']).'"';
				$rtn .= ' data-broccoli-is-appender="yes"';
				$rtn .= ' style="';
				$rtn .=     'overflow:hidden;';
				$rtn .=     'padding:5px 15px;';
				$rtn .=     'background-color:#dfe;';
				$rtn .=     'border:3px solid transparent;';
				$rtn .=     'border-radius:5px;';
				$rtn .=     'font-family: &quot;YuGothic&quot;, &quot;Yu Gothic&quot;, Meiryo, &quot;Hiragino Kaku Gothic ProN&quot;, Verdana, sans-serif;';
				$rtn .=     'font-size:9px;';
				$rtn .=     'color:#000;';
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
		if( @$ifField->cond && is_array($ifField->cond) ){
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
							if( !@$this->nameSpace['varsFinalized'][$tmpValue] || !strlen(trim(@$this->nameSpace['varsFinalized'][$tmpValue]['val'])) ){
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
							if( @$this->nameSpace['varsFinalized'][$tmpValue] && @trim($this->nameSpace['varsFinalized'][$tmpValue]['val']) == trim($tmpDiff) ){
								$condBool = true;
								break;
							}
						}elseif( $tmpOpe == '!=' ){
							if( @$this->nameSpace['varsFinalized'][$tmpValue] && @trim($this->nameSpace['varsFinalized'][$tmpValue]['val']) == trim($tmpDiff) ){
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

		if( @$this->nameSpace['varsFinalized'][$ifField->is_set] && strlen(trim(@$this->nameSpace['varsFinalized'][$ifField->is_set]['val'])) ){
			// is_set の評価
			$boolResult = true;
		}
		return $boolResult;
	} // evaluateIfFieldCond()

	/**
	 * モジュールインスタンスの仕上げ処理: パネル情報を埋め込む
	 */
	private function finalize_module_instance_panel( $d_html, $mod ){

		if( is_string($d_html) && $this->options['mode'] == 'canvas' ){
			// var_dump( $d_html );

			$isSingleRootElement = function($tplSrc){
				if( preg_match('/^\/bowl\.[^\/]+$/s', $this->options['instancePath']) ){
					return false;
				}
				$tplSrc = preg_replace( '/\<\!\-\-[\s\S]*?\-\-\>/s', '', $tplSrc );
				$tplSrc = preg_replace( '/\{\&[\s\S]*?\&\}/s', '', $tplSrc );
				$tplSrc = preg_replace( '/\r\n|\r|\n/s', '', $tplSrc );
				$tplSrc = preg_replace( '/\t/s', '', $tplSrc );
				$tplSrc = preg_replace( '/^[\s\r\n]*/s', '', $tplSrc );
				$tplSrc = preg_replace( '/[\s\r\n]*$/s', '', $tplSrc );

				if( strlen($tplSrc) && strpos($tplSrc, '<') === 0 && preg_match('/\>$/s', $tplSrc) ){
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
							// var_dump('------------------------------------------------------');
							// var_dump($tplSrc);
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

					$simple_html_dom_ret[0]->{'data-broccoli-instance-path'} = $this->options['instancePath'];
					if( @$this->options['subModName'] ){
						$simple_html_dom_ret[0]->{'data-broccoli-sub-mod-name'} = $this->options['subModName'];
					}
					$simple_html_dom_ret[0]->{'data-broccoli-area-size-detection'} = (@$mod->info['areaSizeDetection'] ? $mod->info['areaSizeDetection'] : 'shallow');
					$simple_html_dom_ret[0]->{'data-broccoli-module-name'} = (@$mod->info['name'] ? $mod->info['name'] : $mod->id);
					$d_html = $simple_html_dom->outertext;
				}

			}else{
				$tmp_html = '';
				$tmp_html .= '<div';
				$tmp_html .= ' data-broccoli-instance-path="'.htmlspecialchars($this->options['instancePath']).'"';
				if( @$this->options['subModName'] ){
					$tmp_html .= ' data-broccoli-sub-mod-name="'.htmlspecialchars($this->options['subModName']).'"';
				}
				$tmp_html .= ' data-broccoli-area-size-detection="'.htmlspecialchars((@$mod->info['areaSizeDetection'] ? $mod->info['areaSizeDetection'] : 'shallow')).'"';
				// $tmp_html .= ' data-broccoli-is-single-root-element="'+(isSingleRootElement?'yes':'no').'"';
				$tmp_html .= ' data-broccoli-module-name="'.htmlspecialchars((@$mod->info['name'] ? $mod->info['name'] : $mod->id)).'"';
				$tmp_html .= '>';
				$tmp_html .= $d_html;
				$tmp_html .= '</div>';
				$d_html = $tmp_html;
			}
		}

		return $d_html;
	}

	/**
	 * モジュールインスタンスの仕上げ処理: DEC情報を埋め込む
	 */
	private function finalize_module_instance_dec( $d_html ){

		if(is_string($d_html)){
			if( @$this->data->dec ){
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
						$simple_html_dom_ret_node->$attr = $this->data->dec;
						break;
					}
					$d_html = $simple_html_dom->outertext;
				}
			}
			if( @$this->data->anchor ){
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
						$simple_html_dom_ret_node->$attr = $this->data->anchor;
						break;
					}
					$d_html = $simple_html_dom->outertext;
				}
			}
		}

		return $d_html;
	}

}
