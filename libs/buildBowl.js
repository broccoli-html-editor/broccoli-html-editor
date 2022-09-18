/**
 * buildBowl.js
 */
module.exports = function(broccoli, data, options, callback){
	delete(require.cache[require('path').resolve(__filename)]);
	// console.log(data);
	// console.log(options);

	var _this = this;
	options = options || {};
	options.instancePath = options.instancePath || '';
	callback = callback || function(){};

	var Promise = require('es6-promise').Promise;
	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var twig = require('twig');
	var fs = require('fs');
	var cheerio = require('cheerio');

	var mod;

	this.nameSpace = {"vars": {}, "varsFinalized": {}};
	if( options.nameSpace ){
		this.nameSpace = options.nameSpace;
	}

	data = data || {};

	function mkAppender(fieldType, param){
		var rtn = '';

		switch(fieldType){
			case 'module':
				var baseSize = 14;
				var depth = param.instancePath.split('/').length - 3;
				if(depth<1){depth=1;}
				var style = {};

				style['font-size'] = baseSize * ( 100 - depth*5 ) / 100;
				style['padding'] = 15 - depth*2;
				style['background-color'] = '#F5FAFF';
				// if(depth <= 0){
				// 	style['background-color'] = '#F5FAFF';
				// }else if(depth <= 1){
				// 	style['background-color'] = '#F5FAFF';
				// }else if(depth <= 2){
				// 	style['background-color'] = '#F5FAFF';
				// }else if(depth <= 3){
				// 	style['background-color'] = '#F5FAFF';
				// }else{
				// 	style['background-color'] = '#F5FAFF';
				// }

				rtn += '<div';
				rtn += ' data-broccoli-instance-path="'+php.htmlspecialchars(param.instancePath)+'"';
				rtn += ' data-broccoli-mod-id="'+php.htmlspecialchars(param.modId)+'"';
				rtn += ' data-broccoli-is-appender="yes"';
				rtn += ' style="';
				rtn +=     'height:auto;';
				rtn +=     'max-height:calc('+style['font-size']+' * 6px);';
				rtn +=     'overflow:hidden;';
				rtn +=     'padding:'+style['padding']+'px;';
				rtn +=     'background-color:'+style['background-color']+';';
				rtn +=     'border:3px solid transparent;';
				rtn +=     'border-radius:0px;';
				rtn +=     'font-family: &quot;YuGothic&quot;, &quot;Yu Gothic&quot;, Meiryo, &quot;Hiragino Kaku Gothic ProN&quot;, Verdana, sans-serif;';
				rtn +=     'font-size:'+style['font-size']+'px;';
				rtn +=     'color:#3871E0;';
				rtn +=     'text-align:center;';
				rtn +=     'box-sizing:border-box;';
				rtn +=     'clear:both;';
				rtn +=     'white-space:nowrap;';
				rtn +=     'margin:10px 0;';
				rtn += '"';
				rtn += '>';
				rtn += broccoli.lb.get('ui_label.drop_a_module_here');
				rtn += '</div>';
				break;

			case 'loop':
				rtn += '<div';
				rtn += ' data-broccoli-instance-path="'+php.htmlspecialchars(param.instancePath)+'"';
				rtn += ' data-broccoli-mod-id="'+php.htmlspecialchars(param.modId)+'"';
				rtn += ' data-broccoli-sub-mod-name="'+php.htmlspecialchars(param.subModName)+'"';
				rtn += ' data-broccoli-is-appender="yes"';
				rtn += ' style="';
				rtn +=     'height:auto;';
				rtn +=     'max-height:calc(9 * 6px);';
				rtn +=     'overflow:hidden;';
				rtn +=     'padding:5px 15px;';
				rtn +=     'background-color:#F4FFFC;';
				rtn +=     'border:3px solid transparent;';
				rtn +=     'border-radius:0px;';
				rtn +=     'font-family: &quot;YuGothic&quot;, &quot;Yu Gothic&quot;, Meiryo, &quot;Hiragino Kaku Gothic ProN&quot;, Verdana, sans-serif;';
				rtn +=     'font-size:14px;';
				rtn +=     'color:#189AA3;';
				rtn +=     'text-align:center;';
				rtn +=     'box-sizing:border-box;';
				rtn +=     'clear:both;';
				rtn +=     'white-space:nowrap;';
				rtn +=     'margin:10px 0;';
				rtn += '"';
				rtn += '>';
				rtn += ''+broccoli.lb.get('ui_label.dblclick_here_and_add_array_element');
				rtn += '</div>';
				break;
		}
		return rtn;
	}

	/**
	 * モジュールインスタンスの仕上げ処理: パネル情報を埋め込む
	 */
	function finalize_module_instance_panel( $d_html, mod, options ){
		if(typeof($d_html) !== typeof('')){
			// console.log($d_html);
			return $d_html;
		}
		if( options.mode == 'canvas' ){
			// console.log( $d_html );

			var isSingleRootElement = (function(tplSrc){
				if( options.instancePath.match(new RegExp('^\\/bowl\\.[^\\/]+$')) ){
					return false;
				}
				tplSrc = tplSrc.replace( new RegExp('\\<\\!\\-\\-[\\s\\S]*?\\-\\-\\>','g'), '' );
				tplSrc = tplSrc.replace( new RegExp('\\{\\&[\\s\\S]*?\\&\\}','g'), '' );
				tplSrc = tplSrc.replace( new RegExp('\\r\\n|\\r|\\n','g'), '' );
				tplSrc = tplSrc.replace( new RegExp('\\t','g'), '' );
				tplSrc = tplSrc.replace( new RegExp('^[\\s\\r\\n]*'), '' );
				tplSrc = tplSrc.replace( new RegExp('[\\s\\r\\n]*$'), '' );

				if( tplSrc.length && tplSrc.indexOf('<') === 0 && tplSrc.match(new RegExp('\\>$')) ){
					var htmlparser = require('htmlparser');
					var handler = new htmlparser.DefaultHandler(function (error, dom) {
						// console.log('htmlparser callback');
						if (error){
							// console.log(error);
						}
					});
					// console.log('htmlparser after');
					var parser = new htmlparser.Parser(handler);
					parser.parseComplete(tplSrc);
					// console.log(tplSrc);
					// console.log(handler.dom);

					if( handler.dom.length == 1 ){
						// console.log('------------------------------------------------------');
						// console.log(tplSrc);
						return true;
					}
				}
				return false;

			})($d_html);

			if( isSingleRootElement ){
				var $ = cheerio.load($d_html, {decodeEntities: false});
				var $1stElm = $('*').eq(0);
				$1stElm.attr({ 'data-broccoli-instance-path': options.instancePath });
				var moduleName = (mod.info.name||mod.id);
				if( options.subModName ){
					moduleName = options.subModName;
					$1stElm.attr({ 'data-broccoli-sub-mod-name': options.subModName });
				}
				$1stElm.attr({ 'data-broccoli-area-size-detection': (mod.info.areaSizeDetection||'shallow') });
				$1stElm.attr({ 'data-broccoli-module-name': moduleName });
				$d_html = $.html();
			}else{
				var html = '';
				html += '<div';
				html += ' data-broccoli-instance-path="'+php.htmlspecialchars(options.instancePath)+'"';
				var moduleName = (mod.info.name||mod.id);
				if( options.subModName ){
					moduleName = options.subModName;
					html += ' data-broccoli-sub-mod-name="'+php.htmlspecialchars(options.subModName)+'"';
				}
				html += ' data-broccoli-area-size-detection="'+php.htmlspecialchars((mod.info.areaSizeDetection||'shallow'))+'"';
				// html += ' data-broccoli-is-single-root-element="'+(isSingleRootElement?'yes':'no')+'"';
				html += ' data-broccoli-module-name="'+php.htmlspecialchars(moduleName)+'"';
				html += '>';
				html += $d_html;
				html += '</div>';
				$d_html = html;
			}
		}
		return $d_html;
	}

	/**
	 * モジュールインスタンスの仕上げ処理: anchor情報を埋め込む
	 */
	function finalize_module_instance_anchor( $d_html, data ){
		if(typeof($d_html) !== typeof('')){
			// console.log($d_html);
			return $d_html;
		}

		if( data.dec ){
			var $ = cheerio.load($d_html, {decodeEntities: false});
			var $1stElm = $('*').eq(0);
			$1stElm.attr({ 'data-dec': data.dec });
			$d_html = $.html();
		}
		if( data.anchor ){
			var $ = cheerio.load($d_html, {decodeEntities: false});
			var $1stElm = $('*').eq(0);
			$1stElm.attr({ 'id': data.anchor });
			$d_html = $.html();
		}

		return $d_html;
	}

	/**
	 * モジュールインスタンスの仕上げ処理: DEC情報を埋め込む
	 */
	function finalize_module_instance_dec( $d_html, data ){
		if(typeof($d_html) !== typeof('')){
			// console.log($d_html);
			return $d_html;
		}

		if( data.dec ){
			var $ = cheerio.load($d_html, {decodeEntities: false});
			var $1stElm = $('*').eq(0);
			$1stElm.attr({ 'data-dec': data.dec });
			$d_html = $.html();
		}
		if( data.anchor ){
			var $ = cheerio.load($d_html, {decodeEntities: false});
			var $1stElm = $('*').eq(0);
			$1stElm.attr({ 'id': data.anchor });
			$d_html = $.html();
		}

		return $d_html;
	}

	it79.fnc(
		{},
		[
			function(it1, d){
				broccoli.getModuleByInternalId( data.modId, options.subModName, function(result){
					mod = result;
					it1.next(d);
				} );
			} ,
			function(it1, d){
				if(mod === false){
					broccoli.getModule( '_sys/unknown', null, function(result){
						mod = result;
						it1.next(d);
					} );
				}else{
					it1.next(d);
				}
			} ,
			function(it1, d){
				var src = mod.template;
				var rtn = '';
				var fieldData = data.fields;
				// console.log(mod.topThis.templateType);

				if( mod.topThis.templateType != 'broccoli' ){
					// --------------------------------------
					// テンプレートエンジン(Twigなど)利用の場合の処理
					// console.log(mod.id + ' - ' + mod.subModName);
					var tplDataObj = {};
					it79.fnc(
						{},
						[
							function(it2, data2){
								it79.ary(
									mod.fields ,
									function(it3, field, fieldName){

										if( !field.fieldType || field.fieldType == 'input' ){
											// input field
											var fieldDef = broccoli.getFieldDefinition( field.type ); // フィールドタイプ定義を呼び出す
											var tmpVal = '';
											var tmpValFin = '';
											tplDataObj[field.name] = '';
											fieldDef.bind( fieldData[field.name], options.mode, field, function(html){
												tmpVal += html;
												tplDataObj[field.name] = tmpVal;
												_this.nameSpace.vars[field.name] = {
													fieldType: "input", type: field.type, val: tmpVal
												}
												fieldDef.bind( fieldData[field.name], 'finalize', field, function(html){
													tmpValFin += html;
													_this.nameSpace.varsFinalized[field.name] = {
														fieldType: "input", type: field.type, val: tmpValFin
													}
													it3.next();
												} );
											} );
											return;

										}else if( field.fieldType == 'module' ){
											// module field
											var opt = JSON.parse( JSON.stringify(options) );
											opt.instancePath += '/fields.'+field.name;
											var tmp_tplDataObj = '';

											it79.ary(
												fieldData[field.name],
												function( it2, row, idx ){
													// ネストされたモジュールの再帰処理
													var tmpopt = JSON.parse( JSON.stringify(opt) );
													delete(tmpopt.subModName);// サブモジュールから外部のモジュールを参照する場合に、subModName を渡さないように配慮する必要がある。
													tmpopt.instancePath += '@'+idx;
													broccoli.buildBowl(row, tmpopt, function(html){
														tmp_tplDataObj += html;
														it2.next();
													});
												} ,
												function(){
													if( options.mode == 'canvas' ){
														var tmpopt = JSON.parse( JSON.stringify(opt) );
														if(typeof(fieldData[field.name]) != typeof([])){ fieldData[field.name] = []; }
														tmpopt.instancePath += '@'+(fieldData[field.name].length);
														var tmpDepth = tmpopt.instancePath.split('/');
														if( tmpDepth.length <= 3 || !fieldData[field.name].length ){ // Appenderの表示数を減らす。
															tmp_tplDataObj += mkAppender(
																'module',
																{
																	'modId': mod.id,
																	'instancePath': tmpopt.instancePath
																}
															);
														}
													}

													tplDataObj[field.name] = tmp_tplDataObj;
													_this.nameSpace.vars[field.name] = {
														fieldType: "module", val: tmp_tplDataObj
													}
													_this.nameSpace.varsFinalized[field.name] = {
														fieldType: "module", val: tmp_tplDataObj
													}
													it3.next();
												}
											);
											return;

										}else if( field.fieldType == 'loop' ){
											// loop field
											var tmpSearchResult = mod.searchEndTag( src, 'loop' );
											src = tmpSearchResult.nextSrc;

											var opt = JSON.parse( JSON.stringify(options) );
											opt.instancePath += '/fields.'+field.name;
											tplDataObj[field.name] = [];
											it79.ary(
												fieldData[field.name],
												function( it2, row, idx ){
													// ネストされたモジュールの再帰処理
													var tmpopt = JSON.parse( JSON.stringify(opt) );
													tmpopt.instancePath += '@'+idx;
													tmpopt.subModName = field.name;
													// console.log(tmpopt);
													broccoli.buildBowl(row, tmpopt, function(html){
														tplDataObj[field.name].push(html);
														it2.next();
													});
												} ,
												function(){
													if( options.mode == 'canvas' ){
														var tmpopt = JSON.parse( JSON.stringify(opt) );
														if(typeof(fieldData[field.name]) != typeof([])){ fieldData[field.name] = []; }
														tmpopt.instancePath += '@'+(fieldData[field.name].length);
													}
													it3.next();
												}
											);

											return;

										}
										it3.next();
										return;
									} ,
									function(){
										it2.next(data2);
									}
								);
								return;
							} ,
							function(it2, data2){

								if(mod.subModName){
									d.html = tplDataObj;
								}else{
									// Twig: 環境変数登録
									tplDataObj._ENV = {
										"mode": options.mode,
										"vars": {},
										"lang": broccoli.lb.lang,
										"data": data,
									};
									for(var tmpIdx in _this.nameSpace.varsFinalized){
										tplDataObj._ENV.vars[tmpIdx] = _this.nameSpace.varsFinalized[tmpIdx].val;
									}

									// Twig: カスタム関数登録
									var $loopitem_memo = {
										'nest': [],
										'status': {}
									};
									try {
										twig.extendFunction("loopitem_start", function(fieldNameFor) {
											if( options['mode'] == 'finalize' ){
												return '';
											}
											$loopitem_memo['nest'].push(fieldNameFor);
											if( !$loopitem_memo['status'][fieldNameFor] ){
												$loopitem_memo['status'][fieldNameFor] = {
													'index': 0,
													'closed': false
												};
											}else{
												$loopitem_memo['status'][fieldNameFor]['index'] ++;
												$loopitem_memo['status'][fieldNameFor]['closed'] = false;
											}

											var $html = '<div></div>';
											var $tmp_options = JSON.parse(JSON.stringify(options));
											$tmp_options['instancePath'] += '/fields.'+fieldNameFor+'@'+($loopitem_memo['status'][fieldNameFor]['index']);
											$tmp_options['subModName'] = fieldNameFor;
											$html = finalize_module_instance_panel( $html, mod, $tmp_options );
											$html = $html.replace(/\<\/div\>$/, '');
											return $html;
										});
										twig.extendFunction("loopitem_end", function() {
											if( options['mode'] == 'finalize' ){
												return '';
											}

											var fieldNameFor = $loopitem_memo['nest'].pop();
											$loopitem_memo['status'][fieldNameFor]['closed'] = true;

											return '</div>';
										});
										twig.extendFunction("appender", function(fieldNameFor) {
											if( options.mode == 'finalize' ){
												return '';
											}
											if(mod.fields[fieldNameFor].fieldType == 'loop'){
												var $appender = mkAppender('loop', {
													'modId': data.modId,
													'subModName': fieldNameFor,
													'instancePath': options.instancePath+'/fields.'+fieldNameFor+'@'+(fieldData[fieldNameFor].length)
												});
												return $appender;

											}else if(mod.fields[fieldNameFor].fieldType == 'module'){
												if( !fieldData[fieldNameFor].length ){ // Appenderの表示数を減らす。
													var $appender = mkAppender('module', {
														'modId': data.modId,
														'subModName': null,
														'instancePath': options.instancePath+'/fields.'+fieldNameFor+'@'+count(fieldData[fieldNameFor].length)
													});
												}
												return $appender;

											}
											return '';
										});
										rtn = new twig.twig({
											'data': src
										}).render(tplDataObj);
									} catch (e) {
										console.log( 'TemplateEngine Rendering ERROR.' );
										rtn = '<div class="error">TemplateEngine Rendering ERROR.</div>'
									}
									d.html = rtn;
								}
								it1.next(d);
								return;
							}
						]
					);
					return;

				}else{
					// --------------------------------------
					// Broccoliエンジン利用の処理
					function buildBroccoliHtml(src, rtn, callback){

						if( !src.match( new RegExp('^((?:.|\r|\n)*?)\\{\\&((?:.|\r|\n)*?)\\&\\}((?:.|\r|\n)*)$') ) ){
							rtn += src;
							callback(rtn);
							return;
						}

						rtn += RegExp.$1;
						var field = RegExp.$2;
						try{
							field = JSON.parse( field );
						}catch(e){
							field = {'input':{
								'type':'html',
								'name':'__error__'
							}};
						}
						src = RegExp.$3;
						src = src.replace(/^(?:\r\n|\r|\n)/g, '');

						if( typeof(field) == typeof('') ){
							// end系：無視
							buildBroccoliHtml( src, rtn, function(html){
								callback(html);
							} );
							return;

						}else if( field.input ){
							// input field
							var tmpVal = '';
							var tmpValFin = '';
							it79.fnc(
								{},
								[
									function(it2, data2){
										var fieldDef;
										if( broccoli.fieldDefinitions[field.input.type] ){
											// フィールドタイプ定義を呼び出す
											fieldDef = broccoli.fieldDefinitions[field.input.type];
										}else{
											// ↓未定義のフィールドタイプの場合のデフォルトの挙動
											fieldDef = broccoli.fieldBase;
										}
										fieldDef.bind( fieldData[field.input.name], options.mode, field.input, function(html){
											tmpVal += html;
											fieldDef.bind( fieldData[field.input.name], 'finalize', field.input, function(html){
												tmpValFin += html;
												it2.next(data2);
											} );
										} );
									} ,
									function(it2, data2){
										if( !field.input.hidden ){//← "hidden": true だったら、非表示(=出力しない)
											rtn += tmpVal;
										}
										_this.nameSpace.vars[field.input.name] = {
											fieldType: "input", type: field.input.type, val: tmpVal
										}
										_this.nameSpace.varsFinalized[field.input.name] = {
											fieldType: "input", type: field.input.type, val: tmpValFin
										}

										it2.next(data2);
										return;
									} ,
									function(it2, data2){
										buildBroccoliHtml( src, rtn, function(html){
											callback(html);
										} );
										return;
									}
								]
							);
							return;

						}else if( field.module ){
							// module field
							var opt = JSON.parse( JSON.stringify(options) );
							opt.instancePath += '/fields.'+field.module.name;
							var tmpVal = '';
							it79.ary(
								fieldData[field.module.name],
								function( it2, row, idx ){
									// ネストされたモジュールの再帰処理
									var tmpopt = JSON.parse( JSON.stringify(opt) );
									tmpopt.instancePath += '@'+idx;
									tmpopt.subModName = undefined;
									delete(tmpopt.subModName);
									// console.log(tmpopt);
									broccoli.buildBowl(row, tmpopt, function(html){
										tmpVal += html;
										it2.next();
									});
								} ,
								function(){
									if( options.mode == 'canvas' ){
										var tmpopt = JSON.parse( JSON.stringify(opt) );
										if(typeof(fieldData[field.module.name]) != typeof([])){ fieldData[field.module.name] = []; }
										tmpopt.instancePath += '@'+(fieldData[field.module.name].length);
										var tmpDepth = tmpopt.instancePath.split('/');
										if( tmpDepth.length <= 3 || !fieldData[field.module.name].length ){ // Appenderの表示数を減らす。
											tmpVal += mkAppender(
												'module',
												{
													'modId': mod.id,
													'instancePath': tmpopt.instancePath
												}
											);
										}
									}

									if( !field.module.hidden ){//← "hidden": true だったら、非表示(=出力しない)
										rtn += tmpVal;
									}
									_this.nameSpace.vars[field.module.name] = {
										fieldType: "module", val: tmpVal
									}
									_this.nameSpace.varsFinalized[field.module.name] = {
										fieldType: "module", val: tmpVal
									}

									buildBroccoliHtml( src, rtn, function(html){
										callback(html);
									} );
								}
							);
							return;

						}else if( field.loop ){
							// loop field
							var tmpSearchResult = mod.searchEndTag( src, 'loop' );
							src = tmpSearchResult.nextSrc;

							var opt = JSON.parse( JSON.stringify(options) );
							opt.instancePath += '/fields.'+field.loop.name;
							var tmpVal = '';
							it79.ary(
								fieldData[field.loop.name],
								function( it2, row, idx ){
									// ネストされたモジュールの再帰処理
									var tmpopt = JSON.parse( JSON.stringify(opt) );
									tmpopt.instancePath += '@'+idx;
									tmpopt.subModName = field.loop.name;
									if(field.loop.index){
										_this.nameSpace.vars[field.loop.index] = {
											"fieldType": 'input',
											"type": 'html',
											"val": (Number(idx) + 1)
										};
										_this.nameSpace.varsFinalized[field.loop.index] = _this.nameSpace.vars[field.loop.index];
									}
									tmpopt.nameSpace = _this.nameSpace;
									// console.log(tmpopt);
									broccoli.buildBowl(row, tmpopt, function(html){
										// tmpVal += '<!-- ---- LOOP ---- -->';
										tmpVal += html;
										// tmpVal += '<!-- ---- /LOOP ---- -->';
										it2.next();
									});
								} ,
								function(){
									if( options.mode == 'canvas' ){
										var tmpopt = JSON.parse( JSON.stringify(opt) );
										if(typeof(fieldData[field.loop.name]) != typeof([])){ fieldData[field.loop.name] = []; }
										tmpopt.instancePath += '@'+(fieldData[field.loop.name].length);
										tmpVal += mkAppender(
											'loop',
											{
												'modId': mod.id,
												'subModName': field.loop.name,
												'instancePath': tmpopt.instancePath
											}
										);
									}

									if( !field.loop.hidden ){//← "hidden": true だったら、非表示(=出力しない)
										rtn += tmpVal;
									}
									_this.nameSpace.vars[field.loop.name] = {
										fieldType: "loop", val: tmpVal
									}
									_this.nameSpace.varsFinalized[field.loop.name] = {
										fieldType: "loop", val: tmpVal
									}

									buildBroccoliHtml( src, rtn, function(html){
										callback(html);
									} );
								}
							);
							return;

						}else if( field.if ){
							// if field
							// is_set に指定されたフィールドに値があったら、という評価ロジックを取り急ぎ実装。
							// もうちょっとマシな条件の書き方がありそうな気がするが、あとで考える。
							// → 2015-04-25: cond のルールを追加。
							var tmpSearchResult = mod.searchEndTag( src, 'if' );
							var tmpIfContentList = (function(field, src){
								// ifフィールド内の構造(elseif, else) を解析する
								var contentList = [];
								var currentFieldName = 'if';
								var currentSrc = '';
								var currentField = field.if;
								var subFieldStr, subField;
								while(1){
									if( !src.match( new RegExp('^((?:.|\r|\n)*?)\\{\\&((?:.|\r|\n)*?)\\&\\}((?:.|\r|\n)*)$') ) ){
										currentSrc += src;
										contentList.push({
											fieldName : currentFieldName,
											field : currentField,
											content : currentSrc
										});
										break;
									}
									currentSrc += RegExp.$1;
									subFieldStr = RegExp.$2;
									try{
										subField = JSON.parse( subFieldStr );
									}catch(e){
										subField = {'input':{
											'type':'html',
											'name':'__error__'
										}};
									}
									src = RegExp.$3;

									if( subField === "else" ){
										// elseフィールド
										src = src.replace(/^(?:\r\n|\r|\n)/g, '');
										contentList.push({
											fieldName : currentFieldName,
											field : currentField,
											content : currentSrc
										});
										currentFieldName = 'else';
										currentField = undefined;
										currentSrc = '';

									}else if( typeof(subField) === typeof("") ){
										// end系: 無視

									}else if( subField.elseif ){
										// elseifフィールド
										src = src.replace(/^(?:\r\n|\r|\n)/g, '');
										contentList.push({
											fieldName : currentFieldName,
											field : currentField,
											content : currentSrc
										});
										currentFieldName = 'elseif';
										currentField = subField.elseif;
										currentSrc = '';

									}else if( subField.if ){
										// ネストされた ifフィールド
										currentSrc += '{&'+subFieldStr+'&}';
										var tmpSearchResult = mod.searchEndTag( src, 'if' );
										currentSrc += tmpSearchResult.content;
										currentSrc += '{&"endif"&}';
										src = tmpSearchResult.nextSrc;

									}else{
										// その他すべて
										currentSrc += '{&'+subFieldStr+'&}';
									}
									continue;
								}
								return contentList;
							})(field, tmpSearchResult.content);
							// console.log(tmpIfContentList);

							src = '';
							for(var idx in tmpIfContentList){
								if(tmpIfContentList[idx].fieldName == 'else'){
									src += tmpIfContentList[idx].content;
									break;
								}
								var boolResult = evaluateIfFieldCond(tmpIfContentList[idx].field);
								if( boolResult ){
									src += tmpIfContentList[idx].content;
									break;
								}
							}
							src += tmpSearchResult.nextSrc;

							buildBroccoliHtml( src, rtn, function(html){
								callback(html);
							} );
							return;

						}else if( field.echo ){
							// echo field
							if( _this.nameSpace.vars[field.echo.ref] && _this.nameSpace.vars[field.echo.ref].val ){
								rtn += _this.nameSpace.vars[field.echo.ref].val;
							}

							buildBroccoliHtml( src, rtn, function(html){
								callback(html);
							} );
							return;

						}

						callback(rtn);
						return;
					}//buildBroccoliHtml()

					buildBroccoliHtml(src, '', function(html){
						d.html = html;
						it1.next(d);
					});
					return;
				}
				return;
			} ,
			function(it1, d){
				// finalize.js の処理をかける (broccoli-html-editorで追加された機能)
				mod.finalize( d.html, function(html){
					d.html = html;
					it1.next(d);
				}, {
					// supplying libs and resources to "finalize.js".
					'data': data,
					'cheerio': require('cheerio')
				} );
				return;
			} ,
			function(it1, d){
				// canvasモードのとき、scriptタグは削除する。
				// scriptの挙動がGUI編集画面を破壊する可能性があるため。
				if( options.mode == 'canvas' ){
					if( typeof(d.html) == typeof('') ){
						var $ = cheerio.load(d.html, {decodeEntities: false});
						var $script = $('script');
						$script.each(function(idx, elm){
							$(this).replaceWith( $('<div style="color:#eee; background-color: #f00; border: 3px solid #f00; text-align: center;">script element</div>') );
						});
						d.html = $.html();
					}
				}
				it1.next(d);
				return;
			} ,
			function(it1, d){
				d.html = finalize_module_instance_panel(d.html, mod, options);
				it1.next(d);
			} ,
			function(it1, d){
				d.html = finalize_module_instance_dec(d.html, data);
				it1.next(d);
			} ,
			function(it1, d){
				d.html = finalize_module_instance_anchor(d.html, data);
				it1.next(d);
			} ,
			function(it1, d){
				// console.log('--------------');
				// console.log(d);
				callback(d.html);
				it1.next(d);
			}
		]
	);

	/**
	 * ifフィールドの条件式を評価する
	 */
	function evaluateIfFieldCond(ifField){
		var boolResult = false;
		if( ifField.cond && typeof(ifField.cond) == typeof([]) ){
			// cond の評価
			// cond に、2次元配列を受け取った場合。
			// 1次元目は or 条件、2次元目は and 条件で評価する。
			for( var condIdx in ifField.cond ){
				var condBool = true;
				for( var condIdx2 in ifField.cond[condIdx] ){
					var tmpCond = ifField.cond[condIdx][condIdx2];
					if( tmpCond.match( new RegExp('^([\\s\\S]*?)\\:([\\s\\S]*)$') ) ){
						var tmpMethod = php.trim(RegExp.$1);
						var tmpValue = php.trim(RegExp.$2);

						if( tmpMethod == 'is_set' ){
							if( !_this.nameSpace.varsFinalized[tmpValue] || !php.trim(_this.nameSpace.varsFinalized[tmpValue].val).length ){
								condBool = false;
								break;
							}
						}else if( tmpMethod == 'is_mode' ){
							if( tmpValue != options.mode ){
								condBool = false;
								break;
							}
						}
					}else if( tmpCond.match( new RegExp('^([\\s\\S]*?)(\\!\\=|\\=\\=)([\\s\\S]*)$') ) ){
						var tmpValue = php.trim(RegExp.$1);
						var tmpOpe = php.trim(RegExp.$2);
						var tmpDiff = php.trim(RegExp.$3);
						if( tmpOpe == '==' ){
							condBool = false;
							if( _this.nameSpace.varsFinalized[tmpValue] && _this.nameSpace.varsFinalized[tmpValue].val == tmpDiff ){
								condBool = true;
								break;
							}
						}else if( tmpOpe == '!=' ){
							if( _this.nameSpace.varsFinalized[tmpValue] && _this.nameSpace.varsFinalized[tmpValue].val == tmpDiff ){
								condBool = false;
								break;
							}
						}
					}

				}
				if( condBool ){
					boolResult = true;
					break;
				}
			}
		}

		if( _this.nameSpace.varsFinalized[ifField.is_set] && php.trim(_this.nameSpace.varsFinalized[ifField.is_set].val).length ){
			// is_set の評価
			boolResult = true;
		}
		return boolResult;
	} // evaluateIfFieldCond()

	return;
}
