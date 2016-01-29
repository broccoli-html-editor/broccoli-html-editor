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

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var twig = require('twig');
	var fs = require('fs');
	var cheerio = require('cheerio');

	var mod;

	this.nameSpace = {"vars": {}};
	if( options.nameSpace ){
		this.nameSpace = options.nameSpace;
	}

	data = data || {};

	function mkAppender(fieldType, param){
		var rtn = '';

		switch(fieldType){
			case 'module':
				var baseSize = 16;
				var depth = param.instancePath.split('/').length - 3;
				if(depth<0){depth=0;}
				var style = {};
				// console.log(depth);

				// obj['font-size'] = baseSize;
				style['font-size'] = baseSize * ( 100 - depth*10 ) / 100;
				style['padding'] = 15 - depth*2;
				style['background-color'] = '#fbfbff';
				if(depth <= 0){
					style['background-color'] = '#eef';
				}else if(depth <= 1){
					style['background-color'] = '#f4f4ff';
				}else if(depth <= 2){
					style['background-color'] = '#f6f6ff';
				}else if(depth <= 3){
					style['background-color'] = '#f9f9ff';
				}else{
					style['background-color'] = '#fbfbff';
				}

				rtn += '<div';
				rtn += ' data-broccoli-instance-path="'+php.htmlspecialchars(param.instancePath)+'"';
				rtn += ' data-broccoli-mod-id="'+php.htmlspecialchars(param.modId)+'"';
				rtn += ' data-broccoli-is-appender="yes"';
				rtn += ' style="';
				rtn +=     'height:auto;';
				rtn +=     'overflow:hidden;';
				rtn +=     'padding:'+style['padding']+'px;';
				rtn +=     'background-color:'+style['background-color']+';';
				rtn +=     'border:3px solid transparent;';
				rtn +=     'border-radius:5;';
				rtn +=     'font-family: &amp;YuGothic&amp;, &amp;Yu Gothic&amp;, Meiryo, &amp;Hiragino Kaku Gothic ProN&amp;, Verdana, sans-serif;';
				rtn +=     'font-size:'+style['font-size']+'px;';
				rtn +=     'color:#000;';
				rtn +=     'text-align:center;';
				rtn +=     'box-sizing:border-box;';
				rtn +=     'clear:both;';
				rtn +=     'white-space:nowrap;';
				rtn +=     'margin:10px 0;';
				rtn += '"';
				rtn += '>';
				rtn += '(+) ここにモジュールをドラッグしてください。';
				rtn += '</div>';
				break;

			case 'loop':
				rtn += '<div';
				rtn += ' data-broccoli-instance-path="'+php.htmlspecialchars(param.instancePath)+'"';
				rtn += ' data-broccoli-mod-id="'+php.htmlspecialchars(param.modId)+'"';
				rtn += ' data-broccoli-sub-mod-name="'+php.htmlspecialchars(param.subModName)+'"';
				rtn += ' data-broccoli-is-appender="yes"';
				rtn += ' style="';
				rtn +=     'overflow:hidden;';
				rtn +=     'padding:5px 15px;';
				rtn +=     'background-color:#dfe;';
				rtn +=     'border:3px solid transparent;';
				rtn +=     'border-radius:5px;';
				rtn +=     'font-family: &amp;YuGothic&amp;, &amp;Yu Gothic&amp;, Meiryo, &amp;Hiragino Kaku Gothic ProN&amp;, Verdana, sans-serif;';
				rtn +=     'font-size:9px;';
				rtn +=     'text-align:center;';
				rtn +=     'box-sizing:border-box;';
				rtn +=     'clear:both;';
				rtn +=     'white-space:nowrap;';
				rtn +=     'margin:10px 0;';
				rtn += '"';
				rtn += '>';
				rtn += 'ここをダブルクリックして配列要素を追加してください。';
				rtn += '</div>';
				break;
		}
		return rtn;
	}


	it79.fnc(
		{},
		[
			function(it1, d){
				broccoli.getModule( data.modId, options.subModName, function(result){
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

										if( field.fieldType == 'input' ){
											// input field
											var fieldDef = broccoli.getFieldDefinition( field.type ); // フィールドタイプ定義を呼び出す
											var tmpVal = '';
											tplDataObj[field.name] = '';
											fieldDef.bind( fieldData[field.name], options.mode, field, function(html){
												tmpVal += html;
												if( !field.hidden ){//← "hidden": true だったら、非表示(=出力しない)
													tplDataObj[field.name] = tmpVal;
												}
												_this.nameSpace.vars[field.name] = {
													fieldType: "input", type: field.type, val: tmpVal
												}
												it3.next();
											} );
											return;

										}else if( field.fieldType == 'module' ){
											// module field
											var opt = JSON.parse( JSON.stringify(options) );
											opt.instancePath += '/fields.'+field.name;
											tplDataObj[field.name] = '';

											it79.ary(
												fieldData[field.name],
												function( it2, row, idx ){
													// ネストされたモジュールの再帰処理
													var tmpopt = JSON.parse( JSON.stringify(opt) );
													tmpopt.instancePath += '@'+idx;
													broccoli.buildBowl(row, tmpopt, function(html){
														tplDataObj[field.name] += html;
														it2.next();
													});
												} ,
												function(){
													if( options.mode == 'canvas' ){
														var tmpopt = JSON.parse( JSON.stringify(opt) );
														if(typeof(fieldData[field.name]) != typeof([])){ fieldData[field.name] = []; }
														tmpopt.instancePath += '@'+(fieldData[field.name].length);
														tplDataObj[field.name] += mkAppender(
															'module',
															{
																'modId': mod.id,
																'instancePath': tmpopt.instancePath
															}
														);
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
											// console.log(fieldData);
											// console.log(field.loop);
											// console.log(fieldData[field.name]);
											it79.ary(
												fieldData[field.name],
												function( it2, row, idx ){
													// ネストされたモジュールの再帰処理
													// console.log('----------');
													// console.log(row);
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
														// tplDataObj[field.name].push(mkAppender(
														// 	'loop',
														// 	{
														// 		'modId': mod.id,
														// 		'subModName': field.name,
														// 		'instancePath': tmpopt.instancePath
														// 	}
														// ));
													}
													it3.next();
													// buildBroccoliHtml( src, rtn, function(html){
													// 	callback(html);
													// } );
												}
											);

											// loop field
											// tplDataObj[field.name] = fieldData[field.name];
											// it3.next();
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
									// 環境変数登録
									tplDataObj._ENV = {
										"mode": options.mode
									};

									try {
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

						if( typeof(field) == typeof('') ){
							// end系：無視
							buildBroccoliHtml( src, rtn, function(html){
								callback(html);
							} );
							return;

						}else if( field.input ){
							// input field
							var tmpVal = '';
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
											it2.next(data2);
										} );
									} ,
									function(it2, data2){
										if( !field.input.hidden ){//← "hidden": true だったら、非表示(=出力しない)
											rtn += tmpVal;
										}
										_this.nameSpace.vars[field.input.name] = {
											fieldType: "input", type: field.input.type, val: tmpVal
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
										rtn += html;
										it2.next();
									});
								} ,
								function(){
									if( options.mode == 'canvas' ){
										var tmpopt = JSON.parse( JSON.stringify(opt) );
										if(typeof(fieldData[field.module.name]) != typeof([])){ fieldData[field.module.name] = []; }
										tmpopt.instancePath += '@'+(fieldData[field.module.name].length);
										rtn += mkAppender(
											'module',
											{
												'modId': mod.id,
												'instancePath': tmpopt.instancePath
											}
										);
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
							// console.log(fieldData);
							// console.log(field.loop);
							it79.ary(
								fieldData[field.loop.name],
								function( it2, row, idx ){
									// ネストされたモジュールの再帰処理
									var tmpopt = JSON.parse( JSON.stringify(opt) );
									tmpopt.instancePath += '@'+idx;
									tmpopt.subModName = field.loop.name;
									// console.log(tmpopt);
									broccoli.buildBowl(row, tmpopt, function(html){
										// rtn += '<!-- ---- LOOP ---- -->';
										rtn += html;
										// rtn += '<!-- ---- /LOOP ---- -->';
										it2.next();
									});
								} ,
								function(){
									if( options.mode == 'canvas' ){
										var tmpopt = JSON.parse( JSON.stringify(opt) );
										if(typeof(fieldData[field.loop.name]) != typeof([])){ fieldData[field.loop.name] = []; }
										tmpopt.instancePath += '@'+(fieldData[field.loop.name].length);
										rtn += mkAppender(
											'loop',
											{
												'modId': mod.id,
												'subModName': field.loop.name,
												'instancePath': tmpopt.instancePath
											}
										);
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
							var boolResult = false;
							src = '';
							if( field.if.cond && typeof(field.if.cond) == typeof([]) ){
								// cond に、2次元配列を受け取った場合。
								// 1次元目は or 条件、2次元目は and 条件で評価する。
								for( var condIdx in field.if.cond ){
									var condBool = true;
									for( var condIdx2 in field.if.cond[condIdx] ){
										var tmpCond = field.if.cond[condIdx][condIdx2];
										if( tmpCond.match( new RegExp('^([\\s\\S]*?)\\:([\\s\\S]*)$') ) ){
											var tmpMethod = php.trim(RegExp.$1);
											var tmpValue = php.trim(RegExp.$2);

											if( tmpMethod == 'is_set' ){
												if( !_this.nameSpace.vars[tmpValue] || !php.trim(_this.nameSpace.vars[tmpValue].val).length ){
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
												if( _this.nameSpace.vars[tmpValue].val != tmpDiff ){
													condBool = false;
													break;
												}
											}else if( tmpOpe == '!=' ){
												if( _this.nameSpace.vars[tmpValue].val == tmpDiff ){
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
							if( _this.nameSpace.vars[field.if.is_set] && php.trim(_this.nameSpace.vars[field.if.is_set].val).length ){
								boolResult = true;
							}
							if( boolResult ){
								src += tmpSearchResult.content;
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
				} );
				return;
			} ,
			function(it1, d){
				if(typeof(d.html) !== typeof('')){
					// console.log(d.html);
					it1.next(d);
					return;
				}
				if( options.mode == 'canvas' ){
					// console.log( d.html );

					var isSingleRootElement = (function(tplSrc){
						if( options.instancePath.match(new RegExp('^\\/bowl\\.[^\\/]+$')) ){
							return false;
						}
						tplSrc = tplSrc.replace( new RegExp('\\<\\!\\-\\-.*?\\-\\-\\>','g'), '' );
						tplSrc = tplSrc.replace( new RegExp('\\{\\&.*?\\&\\}','g'), '' );
						tplSrc = tplSrc.replace( new RegExp('\r\n|\r|\n','g'), '' );
						tplSrc = tplSrc.replace( new RegExp('\t','g'), '' );
						tplSrc = tplSrc.replace( new RegExp('^[\s\r\n]*'), '' );
						tplSrc = tplSrc.replace( new RegExp('[\s\r\n]*$'), '' );

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

					})(d.html);

					if( isSingleRootElement ){
						var $ = cheerio.load(d.html, {decodeEntities: false});
						var $1stElm = $('*').eq(0);
						$1stElm.attr({ 'data-broccoli-instance-path': options.instancePath });
						if( options.subModName ){
							$1stElm.attr({ 'data-broccoli-sub-mod-name': options.subModName });
						}
						$1stElm.attr({ 'data-broccoli-area-size-detection': (mod.info.areaSizeDetection||'shallow') });
						$1stElm.attr({ 'data-broccoli-module-name': (mod.info.name||mod.id) });
						d.html = $.html();
					}else{
						var html = '';
						html += '<div';
						html += ' data-broccoli-instance-path="'+php.htmlspecialchars(options.instancePath)+'"';
						if( options.subModName ){
							html += ' data-broccoli-sub-mod-name="'+php.htmlspecialchars(options.subModName)+'"';
						}
						html += ' data-broccoli-area-size-detection="'+php.htmlspecialchars((mod.info.areaSizeDetection||'shallow'))+'"';
						// html += ' data-broccoli-is-single-root-element="'+(isSingleRootElement?'yes':'no')+'"';
						html += ' data-broccoli-module-name="'+php.htmlspecialchars((mod.info.name||mod.id))+'"';
						html += '>';
						html += d.html;
						html += '</div>';
						d.html = html;
					}
				}
				it1.next(d);
			} ,
			function(it1, d){
				if(typeof(d.html) !== typeof('')){
					// console.log(d.html);
					it1.next(d);
					return;
				}

				if( data.dec ){
					var $ = cheerio.load(d.html, {decodeEntities: false});
					var $1stElm = $('*').eq(0);
					$1stElm.attr({ 'data-dec': data.dec });
					d.html = $.html();
				}
				if( data.anchor ){
					var $ = cheerio.load(d.html, {decodeEntities: false});
					var $1stElm = $('*').eq(0);
					$1stElm.attr({ 'id': data.anchor });
					d.html = $.html();
				}

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

	return;
}
