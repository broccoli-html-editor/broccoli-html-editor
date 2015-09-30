/**
 * buildHtml.js
 */
module.exports = function(broccoli, data, options, callback){
	// console.log(data);
	// console.log(options);

	var _this = this;
	options = options || {};
	callback = callback || function(){};

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var twig = require('twig');
	var fs = require('fs');

	var mod = broccoli.createModuleInstance( data.modId );


	it79.fnc(
		{},
		[
			function(it1, d){
				mod.init(function(res){
					// console.log(res);
					// console.log(mod);
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
					for( var fieldName in mod.fields ){
						field = mod.fields[fieldName];

						if( field.fieldType == 'input' ){
							// input field
							var tmpVal = '';
							if( broccoli.fieldDefinitions[field.type] ){
								// フィールドタイプ定義を呼び出す
								tmpVal += broccoli.fieldDefinitions[field.type].bind( fieldData[field.name], options.mode, field );
							}else{
								// ↓未定義のフィールドタイプの場合のデフォルトの挙動
								tmpVal += broccoli.fieldBase.bind( fieldData[field.name], options.mode, field );
							}
							if( !field.hidden ){//← "hidden": true だったら、非表示(=出力しない)
								tplDataObj[field.name] = tmpVal;
							}
							_this.nameSpace.vars[field.name] = {
								fieldType: "input", type: field.type, val: tmpVal
							}

						}else if( field.fieldType == 'module' ){
							// module field
							tplDataObj[field.name] = fieldData[field.name].join('');

						}else if( field.fieldType == 'loop' ){
							// loop field
							tplDataObj[field.name] = fieldData[field.name];

						}
					}

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
							if( broccoli.fieldDefinitions[field.input.type] ){
								// フィールドタイプ定義を呼び出す
								tmpVal += broccoli.fieldDefinitions[field.input.type].bind( fieldData[field.input.name], options.mode, field.input );
							}else{
								// ↓未定義のフィールドタイプの場合のデフォルトの挙動
								tmpVal += broccoli.fieldBase.bind( fieldData[field.input.name], options.mode, field.input );
							}
							if( !field.input.hidden ){//← "hidden": true だったら、非表示(=出力しない)
								rtn += tmpVal;
							}
							_this.nameSpace.vars[field.input.name] = {
								fieldType: "input", type: field.input.type, val: tmpVal
							}

							buildBroccoliHtml( src, rtn, function(html){
								callback(html);
							} );
							return;

						}else if( field.module ){
							// module field
							it79.ary(
								fieldData[field.module.name],
								function( it2, row, idx ){
									// ネストされたモジュールの再帰処理
									broccoli.buildHtml(row, options, function(html){
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
							rtn += fieldData[field.loop.name].join('');
							src = tmpSearchResult.nextSrc;

							buildBroccoliHtml( src, rtn, function(html){
								callback(html);
							} );
							return;

						}else if( field.if ){
							// if field
							// is_set に指定されたフィールドに値があったら、という評価ロジックを取り急ぎ実装。
							// もうちょっとマシな条件の書き方がありそうな気がするが、あとで考える。
							// → 2015-04-25: cond のルールを追加。
							var tmpSearchResult = searchEndTag( src, 'if' );
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

						return;
					}//buildBroccoliHtml()

					buildBroccoliHtml(src, '', function(html){
						d.html = html;
						it1.next(d);
					});
				}

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
