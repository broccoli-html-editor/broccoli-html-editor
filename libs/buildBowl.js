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

	var mod = broccoli.createModuleInstance( data.modId );

	this.nameSpace = {"vars": {}};
	if( options.nameSpace ){
		this.nameSpace = options.nameSpace;
	}


	it79.fnc(
		{},
		[
			function(it1, d){
				mod.init(function(res){
					// console.log(res);
					it1.next(d);
				});
			} ,
			function(it1, d){
				var src = mod.template;
				var rtn = '';
				var fieldData = data.fields;

				if( mod.topThis.templateType != 'broccoli' ){
					// テンプレートエンジン利用の場合の処理
					// console.log(this.id + '/' + this.subModName);
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
											var fieldDef;
											var tmpVal = '';
											if( broccoli.fieldDefinitions[field.type] ){
												// フィールドタイプ定義を呼び出す
												fieldDef = broccoli.fieldDefinitions[field.type];
											}else{
												// ↓未定義のフィールドタイプの場合のデフォルトの挙動
												fieldDef = broccoli.fieldBase;
											}
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
											tplDataObj[field.name] = fieldData[field.name].join('');
											it3.next();
											return;

										}else if( field.fieldType == 'loop' ){
											// loop field
											tplDataObj[field.name] = fieldData[field.name];
											it3.next();
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
								// 環境変数登録
								tplDataObj._ENV = {
									"mode": options.mode
								};

								try {
									rtn = twig({
										data: src
									}).render(tplDataObj);
								} catch (e) {
									console.log( 'TemplateEngine Rendering ERROR.' );
									rtn = '<div class="error">TemplateEngine Rendering ERROR.</div>'
								}
								d.html = rtn;
								it1.next(d);
								return;
							}
						]
					);
					return;

				}else{
					// テンプレートエンジンを利用しない場合の処理
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
									broccoli.buildBowl(row, tmpopt, function(html){
										rtn += html;
										it2.next();
									});
								} ,
								function(){
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

							it79.ary(
								fieldData[field.loop.name],
								function( it2, row, idx ){
									// ネストされたモジュールの再帰処理
									var tmpopt = JSON.parse( JSON.stringify(opt) );
									tmpopt.instancePath += '@'+idx;

									broccoli.buildBowl(row, tmpopt, function(html){
										// rtn += '<!-- ---- LOOP ---- -->';
										rtn += html;
										// rtn += '<!-- ---- /LOOP ---- -->';
										it2.next();
									});
								} ,
								function(){
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
				if( options.mode == 'canvas' ){
					var html = '';
					html += '<div data-broccoli-instance-path="'+php.htmlspecialchars(options.instancePath)+'">';
					html += d.html;
					html += '</div>';
					d.html = html;
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
