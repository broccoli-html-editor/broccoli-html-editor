/**
 * editWindow.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ return false; }

	var _this = this;

	var it79 = require('iterate79');
	var php = require('phpjs');
	var $ = require('jquery');

	var $editWindow;
	var tplFrame = ''
				+ '<div class="broccoli__edit-window">'
				+ '	<form action="javascript:;">'
				+ '		<div class="broccoli__edit-window-logical-path">---</div>'
				+ '		<h2 class="broccoli__edit-window-module-name">---</h2>'
				+ '		<div class="broccoli__edit-window-module-readme-switch"><a href="javascript:;"><span class="glyphicon glyphicon-menu-right"></span> Show README</a></div>'
				+ '		<div class="broccoli__edit-window-module-readme"><div class="broccoli__edit-window-module-readme-inner"><article class="broccoli__module-readme"></article></div></div>'
				+ '		<div class="broccoli__edit-window-message-field"></div>'
				+ '		<div class="broccoli__edit-window-fields">'
				+ '		</div>'
				+ '		<div class="broccoli__edit-window-builtin-fields-switch"><a href="javascript:;"><span class="glyphicon glyphicon-menu-right"></span> <%= lb.get(\'ui_label.show_advanced_setting\') %></a></div>'
				+ '		<div class="broccoli__edit-window-builtin-fields">'
				+ '			<div class="form-group broccoli__edit-window-builtin-anchor-field-wrap">'
				+ '				<label for="broccoli__edit-window-builtin-anchor-field"><%= lb.get(\'ui_label.anchor\') %></label>'
				+ '				<div class="input-group">'
				+ '					<span class="input-group-addon" id="basic-addon1">#</span>'
				+ '					<input type="text" class="form-control" id="broccoli__edit-window-builtin-anchor-field" placeholder="">'
				+ '				</div>'
				+ '			</div>'
				+ '			<div class="form-group broccoli__edit-window-builtin-dec-field-wrap">'
				+ '				<label for="broccoli__edit-window-builtin-dec-field"><%= lb.get(\'ui_label.embed_comment\') %></label>'
				+ '				<textarea class="form-control" id="broccoli__edit-window-builtin-dec-field" placeholder=""></textarea>'
				+ '			</div>'
				+ '		</div>'
				+ '		<div class="broccoli__edit-window-form-buttons">'
				+ '			<div class="broccoli__edit-window-form-buttons-fluid">'
				+ '				<div class="broccoli__edit-window-form-buttons-ok">'
				+ '					<button disabled="disabled" type="submit" class="px2-btn px2-btn--primary px2-btn--lg"><span class="glyphicon glyphicon-ok"></span> <%= lb.get(\'ui_label.ok\') %></button>'
				+ '				</div>'
				+ '			</div>'
				+ '			<div class="broccoli__edit-window-form-buttons-fluid">'
				+ '				<div class="broccoli__edit-window-form-buttons-cancel">'
				+ '					<button disabled="disabled" type="button" class="px2-btn px2-btn--sm broccoli__edit-window-btn-cancel"><%= lb.get(\'ui_label.cancel\') %></button>'
				+ '				</div>'
				+ '				<div class="broccoli__edit-window-form-buttons-delete">'
				+ '					<button disabled="disabled" type="button" class="px2-btn px2-btn--danger px2-btn--sm broccoli__edit-window-btn-remove"><span class="glyphicon glyphicon-trash"></span> <%= lb.get(\'ui_label.remove_this_module\') %></button>'
				+ '				</div>'
				+ '			</div>'
				+ '		</div>'
				+ '	</form>'
				+ '</div>'
	;

	var tplField = ''
				+ '<div class="broccoli__edit-window-field">'
				+ '	<h3>---</h3>'
				+ '	<div class="broccoli__edit-window-field-description">'
				+ '	</div>'
				+ '	<div class="broccoli__edit-window-field-content">'
				+ '	</div>'
				+ '	<div class="broccoli__edit-window-field-error-message">'
				+ '	</div>'
				+ '</div>'
	;

	function initMod(data){
		var mod = broccoli.contentsSourceData.getModule(data.modId, data.subModName);
		if( mod === false ){
			mod = {
				'id': '_sys/unknown',
				'info': {
					'name': 'Unknown Module'
				}
			}
		}
		return mod;
	}

	function formErrorMessage(msgs){
		var $elm = $editWindow.find('.broccoli__edit-window-message-field');
		$editWindow.find('[data-broccoli-edit-window-field-name]').removeClass('has-error');
		$editWindow.find('.broccoli__edit-window-field-error-message').hide().html('');
		$elm.hide().html('');
		for( var idx in msgs ){
			var $err = $('<div class="broccoli__inline-error-message">');
			var $errUl = $('<ul>');
			var errCount = 0;
			for( var idx2 in msgs[idx] ){
				errCount ++;
				$errUl.append( $('<li>')
					.text( msgs[idx][idx2] )
				);
			}
			$editWindow.find('[data-broccoli-edit-window-field-name='+idx+']').addClass('has-error');
			$editWindow.find('[data-broccoli-edit-window-field-name='+idx+'] .broccoli__edit-window-field-error-message').show().append( $err.append($errUl) );
		}
		if(errCount){
			var $err = $('<div class="broccoli__error-message-box">');
			$elm.show().append(
				$err.text( '入力エラーがあります。確認してください。' )
			);
			$('.broccoli__lightbox').scrollTop(0);
		}
		return;
	}

	/**
	 * 初期化
	 * @param  {String}   instancePath  [description]
	 * @param  {Object}   elmEditWindow [description]
	 * @param  {Function} callback      [description]
	 * @return {Void}                 [description]
	 */
	this.init = function(instancePath, elmEditWindow, callback){
		// console.log( '=-=-=-=-=-=-=-=-= Initialize EditWindow.' );
		callback = callback || function(){};

		var data = broccoli.contentsSourceData.get(instancePath);
		// console.log( data );
		var mod = initMod(data);
		// console.log( data.modId, data.subModName );
		// console.log( mod );

		var $fields = $('<div>');
		$editWindow = $(elmEditWindow);
		$editWindow.html('').append( broccoli.bindEjs(tplFrame, {'lb':broccoli.lb}) );
		$editWindow.find('.broccoli__edit-window-module-name').text(mod.info.name||mod.id);
		$editWindow.find('.broccoli__edit-window-fields').append($fields);

		$editWindow.find('.broccoli__edit-window-logical-path').html('').append(
			drawLogicalPath(instancePath, data)
		);

		// options
		if( !broccoli.options.enableModuleAnchor ){
			$editWindow.find('.broccoli__edit-window-builtin-anchor-field-wrap').css({'display': 'none'});
		}
		if( !broccoli.options.enableModuleDec ){
			$editWindow.find('.broccoli__edit-window-builtin-dec-field-wrap').css({'display': 'none'});
		}
		if( !broccoli.options.enableModuleAnchor && !broccoli.options.enableModuleDec ){
			$editWindow.find('.broccoli__edit-window-builtin-fields-switch').css({'display': 'none'});
			$editWindow.find('.broccoli__edit-window-builtin-fields').css({'display': 'none'});
		}


		$editWindow.find('.broccoli__edit-window-module-readme').hide();
		try{
			// console.log(broccoli.getBootupInfomations().modulePackageList);
			var modulePackageList = broccoli.getBootupInfomations().modulePackageList;
			mod.id.match(/^([\s\S]*)\:([\s\S]*)\/([\s\S]*)$/i);
			var parsedModId = {
				'package': RegExp.$1,
				'category': RegExp.$2,
				'module': RegExp.$3
			};
			var readme = modulePackageList[parsedModId.package].categories[parsedModId.category].modules[parsedModId.module].readme;
			// console.log(readme);
			if(readme){
				$editWindow.find('.broccoli__edit-window-module-readme-inner .broccoli__module-readme').html(readme);
				$editWindow.find('.broccoli__edit-window-module-readme-switch a').click(function(){
					var $this = $(this);
					var className = 'broccoli__edit-window-module-readme-switch__on';
					$editWindow.find('.broccoli__edit-window-module-readme').toggle('fast', function(){
						if($(this).is(':visible')){
							$this.addClass(className);
							$this.html('<span class="glyphicon glyphicon-menu-down"></span> '+'Hide README')
						}else{
							$this.removeClass(className);
							$this.html('<span class="glyphicon glyphicon-menu-right"></span> '+'Show README')
						}
					});
				});
			}else{
				$editWindow.find('.broccoli__edit-window-module-readme-switch').hide();
			}
		}catch(e){
			$editWindow.find('.broccoli__edit-window-module-readme-switch').hide();
		}

		$editWindow.find('.broccoli__edit-window-builtin-fields').hide();
		$editWindow.find('.broccoli__edit-window-builtin-fields-switch a').click(function(){
			var $this = $(this);
			var className = 'broccoli__edit-window-builtin-fields-switch__on';
			$editWindow.find('.broccoli__edit-window-builtin-fields').toggle('fast', function(){
				if($(this).is(':visible')){
					$this.addClass(className);
					$this.html('<span class="glyphicon glyphicon-menu-down"></span> '+broccoli.lb.get('ui_label.hide_advanced_setting'))
				}else{
					$this.removeClass(className);
					$this.html('<span class="glyphicon glyphicon-menu-right"></span> '+broccoli.lb.get('ui_label.show_advanced_setting'))
				}
			});
		});

		// moduleフィールド、loopフィールドの内容を更新する
		function updateModuleAndLoopField( instancePath, callbackOf_pdateModuleAndLoopField ){
			console.log('updateModuleAndLoopField();');
			callbackOf_pdateModuleAndLoopField = callbackOf_pdateModuleAndLoopField || function(res, callback){
				callback = callback || function(){};
				return;
			};
			// var data = broccoli.contentsSourceData.get(instancePath);
			// // console.log( data );
			// var mod = initMod(data);

			broccoli.progress(function(){

				it79.ary(
					mod.fields,
					function(it1, field, fieldName){
						if( typeof(field) != typeof({}) ){
							// オブジェクトではない field → Skip
							it1.next();
							return;
						}

						switch( field.fieldType ){
							case 'input':
								it1.next();
								break;
							case 'module':
							case 'loop':
								var $ul = $('<ul>');
								it79.ary(
									data.fields[field.name],
									function(it2, childData, idx2){
										var childMod = broccoli.contentsSourceData.getModule(childData.modId, childData.subModName);
										var childInstancePath = instancePath + '/fields.'+field.name+'@'+idx2+''
										// console.log(childInstancePath);
										// console.log(childData);
										// console.log(childMod);
										// console.log(mod);
										var label = childData.modId;
										if( childMod.info && childMod.info.name ){
											label = childMod.info.name;
										}
										var $li = $('<li>');
										var $a = $('<a>');
										var $label = $('<span>');
										$li.append($a);
										$a
											.append($label.text(label))
											.attr({
												'href': 'javascript:;',
												'data-broccoli-parent-instance-path': instancePath,
												'data-broccoli-instance-path': childInstancePath,
												'data-broccoli-mod-id': childMod.id,
												'data-broccoli-sub-mod-name': childMod.subModName,
												// 'data-broccoli-is-appender':'yes',
												'data-broccoli-is-edit-window': 'yes',
												'draggable': true
											})
											.append( $('<div>')
												.addClass('broccoli--panel-drop-to-insert-here')
											)
										;

										if(childMod.fields){
											// プレビューを表示
											(function($label, childMod, childData){
												it79.ary(
													childMod.fields,
													function(itMkLabel, field, fieldName){
														// console.log(field.fieldType);
														// console.log(field.type);
														var fieldType = field.fieldType;
														var type = field.type;
														if(fieldType == 'input'){
															if( !broccoli.fieldDefinitions[type] ){
																itMkLabel.next();
																return;
															}
															broccoli.resourceMgr.getResourceDb(function(resDb){
																broccoli.fieldDefinitions[type].mkPreviewHtml(childData.fields[fieldName], childMod.fields[fieldName], function(html){
																	html = (function(src){
																		for(var resKey in resDb){
																			try {
																				src = src.split('{broccoli-html-editor-resource-baser64:{'+resKey+'}}').join(resDb[resKey].base64);
																			} catch (e) {
																			}
																		}
																		return src;
																	})(html);
																	$label.append('<div class="broccoli__edit-window-field-preview"><div>'+html+'</div></div>');
																	itMkLabel.next();
																});
															});
															return;
														}else if(fieldType == 'module'){
															$label.append('<div class="broccoli__edit-window-field-preview"><div>(module field)</div></div>');
															itMkLabel.next();
															return;
														}else if(fieldType == 'loop'){
															$label.append('<div class="broccoli__edit-window-field-preview"><div>(loop field)</div></div>');
															itMkLabel.next();
															return;
														}
														itMkLabel.next();
														return;
													},
													function(){
													}
												);
											})($label, childMod, childData);
										}

										broccoli.panels.setPanelEventHandlers( $a );
										$a
											.unbind('drop')
											.bind('drop', function(e){
												_this.lock();//フォームをロック
												broccoli.panels.onDrop(e, this, function(){
													updateModuleAndLoopField( instancePath, function(){
														_this.unlock();//フォームのロックを解除
														console.log('drop event done.');
													} );
												});
											})
											.unbind('click')
											.bind('click', function(e){
												return false;
											})
											.unbind('dblclick')
											.bind('dblclick', function(e){
												var $this = $(this);
												// インスタンス instancePath の変更を保存し、
												// 一旦編集ウィンドウを閉じたあと、
												// childInstancePath の編集画面を開く。
												var instancePath = $this.attr('data-broccoli-parent-instance-path');
												var childInstancePath = $this.attr('data-broccoli-instance-path');
												formErrorMessage([]);

												_this.lock();//フォームをロック
												validateInstance(instancePath, mod, data, function(res){
													if( !res ){
														// エラーがあるため次へ進めない
														_this.unlock();
														return;
													}
													saveInstance(instancePath, mod, data, function(res){
														// コンテンツデータを保存
														broccoli.progressMessage('コンテンツを保存しています');
														broccoli.saveContents(function(){
															broccoli.panels.onDblClick(e, $this.get(0), function(){
																broccoli.progressMessage('');
																console.log('dblclick event done.');
															});
														});
													});
												});

											})
										;
										$ul
											.append($li)
										;
										it2.next();
									},
									function(){
										var appenderInstancePath = instancePath+'/fields.'+field.name+'@'+(data.fields[field.name].length);
										var $li = $('<li>');
										var $appender = $('<a>');
										if( field.fieldType == 'module' ){
											$appender
												.text('(+) '+broccoli.lb.get('ui_label.drop_a_module_here'))
												.attr({
													'data-broccoli-instance-path':appenderInstancePath,
													'data-broccoli-is-appender':'yes',
													// 'data-broccoli-is-instance-tree-view': 'yes',
													'draggable': false
												})
												.bind('mouseover', function(e){
													e.stopPropagation();
													$(this).addClass('broccoli--panel__hovered')
												})
												.bind('mouseout',function(e){
													$(this).removeClass('broccoli--panel__hovered')
												})
												.append( $('<div>')
													.addClass('broccoli--panel-drop-to-insert-here')
												)
											;
										}else if( field.fieldType == 'loop' ){
											$appender
												.text(''+broccoli.lb.get('ui_label.dblclick_here_and_add_array_element'))
												.attr({
													'data-broccoli-instance-path':appenderInstancePath,
													'data-broccoli-mod-id': mod.id,
													'data-broccoli-sub-mod-name': field.name,
													'data-broccoli-is-appender':'yes',
													// 'data-broccoli-is-instance-tree-view': 'yes',
													'draggable': false
												})
												.bind('click', function(e){
													e.stopPropagation();
													var $this = $(this);
													var instancePath = $this.attr('data-broccoli-instance-path');
													var selectInstancePath = instancePath;
													// if( $this.attr('data-broccoli-is-appender') == 'yes' ){
													// 	selectInstancePath = php.dirname(instancePath);
													// }
													broccoli.selectInstance( selectInstancePath, function(){
														broccoli.focusInstance( instancePath );
													} );
												})
												.bind('mouseover', function(e){
													e.stopPropagation();
													$(this).addClass('broccoli--panel__hovered')
												})
												.bind('mouseout',function(e){
													$(this).removeClass('broccoli--panel__hovered')
												})
												.append( $('<div>')
													.addClass('broccoli--panel-drop-to-insert-here')
												)
											;
										}
										broccoli.panels.setPanelEventHandlers( $appender );
										$appender
											.unbind('drop')
											.bind('drop', function(e){
												_this.lock();//フォームをロック
												broccoli.panels.onDrop(e, this, function(){
													updateModuleAndLoopField( instancePath, function(){
														_this.unlock();//フォームのロックを解除
														console.log('drop event done.');
													} );
												});
											})
											.unbind('dblclick')
											.bind('dblclick', function(e){
												_this.lock();//フォームをロック
												broccoli.panels.onDblClick(e, this, function(){
													updateModuleAndLoopField( instancePath, function(){
														_this.unlock();//フォームのロックを解除
														console.log('dblclick event done.');
													} );
												});
											})
										;
										$ul.append( $li.append($appender) );

										var $elmFieldContent = $fields.find('.broccoli__edit-window-module-fields[data-broccoli--editwindow-field-name='+field.name+']').eq(0);
										$elmFieldContent.addClass('broccoli__edit-window-module-fields--fieldtype-'+field.fieldType);
										$elmFieldContent.find('.broccoli__edit-window-module-fields__instances').html('')
											.append(
												$ul
											)
										;
										if(field.fieldType == 'module'){
											// moduleフィールドには、モジュールパレットがつきます。
											broccoli.drawModulePalette( $elmFieldContent.find('.broccoli__edit-window-module-fields__palette').get(0), function(){
												it1.next();
											} );
										}else{
											it1.next();
										}

									}
								);
								break;
							default:
								it1.next();
								break;
						}
						return;
					},
					function(){
						broccoli.closeProgress(function(){
							callbackOf_pdateModuleAndLoopField();
						});
					}
				);
			});
			return;
		} // updateModuleAndLoopField()

		var focusDone = false;
		var fieldCount = 0;
		it79.ary(
			mod.fields,
			function(it1, field, fieldName){
				if( typeof(field) != typeof({}) ){
					// オブジェクトではない field → Skip
					it1.next();
					return;
				}
				fieldCount ++;
				// console.log(fieldName);
				// console.log(field);
				var $field = $(tplField)
					.attr({
						'data-broccoli-edit-window-field-name': field.name ,
						'data-broccoli-edit-window-field-type': field.fieldType
					})
				;
				$field.find('>h3')
					.text((field.label||field.name)+' ')
					.append( $('<small>')
						.text((field.fieldType=='input' ? field.type : field.fieldType))
					)
				;

				if( field.validate ){
					for(var valiNum in field.validate){
						if( field.validate[valiNum] == 'required' ){
							$field.addClass('broccoli__edit-window-field-required');
							break;
						}
					}
				}

				if( field.description ){
					$field.find('>.broccoli__edit-window-field-description')
						.html( field.description )
					;
				}else{
					$field.find('>.broccoli__edit-window-field-description')
						.remove()
					;
				}
				$fields.append($field);

				// console.log( broccoli.fieldDefinitions );
				var elmFieldContent = $field.find('.broccoli__edit-window-field-content').get(0);
				switch( field.fieldType ){
					case 'input':
						var fieldDefinition = broccoli.getFieldDefinition(field.type);
						fieldDefinition.mkEditor(mod.fields[field.name], data.fields[field.name], elmFieldContent, function(){
							if(!focusDone){
								focusDone = true;
								fieldDefinition.focus(elmFieldContent, function(){
									it1.next();
								});
								return;
							}
							it1.next();
							return;
						})
						break;
					case 'module':
					case 'loop':
						$(elmFieldContent)
							.append(
								$('<div>')
									.addClass('broccoli__edit-window-module-fields')
									.attr({
										"data-broccoli--editwindow-field-name": field.name
									})
									.append( $('<div>')
										.addClass('broccoli__edit-window-module-fields__instances')
									)
									.append( $('<div>')
										.addClass('broccoli__edit-window-module-fields__palette')
									)
							)
						;
						it1.next();
						break;
					default:
						$(elmFieldContent)
							.append(
								'<p>'+php.htmlspecialchars( (typeof(field.fieldType)===typeof('') ? field.fieldType : 'unknown') )+'</p>'
							)
						;
						it1.next();
						break;
				}
				return;
			},
			function(){

				if(!fieldCount){
					$fields
						.append(
							'<p style="text-align: center; margin: 7em 1em;">このモジュールにはオプションが定義されていません。</p>'
						)
					;
				}

				updateModuleAndLoopField(instancePath, function(){
					$editWindow.find('#broccoli__edit-window-builtin-anchor-field')
						.val(data.anchor)
					;
					$editWindow.find('#broccoli__edit-window-builtin-dec-field')
						.val(data.dec)
					;
					$editWindow.find('.broccoli__edit-window-form-buttons button')
						.removeAttr('disabled')
					;
					$editWindow.find('form')
						.removeAttr('disabled')
						.on('submit', function(){
							// 編集内容を保存する
							// console.log( data );
							// console.log( mod );
							formErrorMessage([]);

							_this.lock();//フォームをロック
							broccoli.progress();
							validateInstance(instancePath, mod, data, function(res){
								if( !res ){
									// エラーがあるため次へ進めない
									_this.unlock();
									broccoli.closeProgress();
									return;
								}
								saveInstance(instancePath, mod, data, function(res){
									broccoli.progressMessage('');
									broccoli.closeProgress();
									callback(res);
								});
							});

						})
					;
					$editWindow.find('button.broccoli__edit-window-btn-cancel')
						.on('click', function(){
							_this.lock();
							callback(false);
						})
					;
					$editWindow.find('button.broccoli__edit-window-btn-remove')
						.on('click', function(){
							_this.lock();
							if( !confirm('このモジュールを削除します。よろしいですか？') ){
								_this.unlock();
								return;
							}
							if( instancePath.match(new RegExp('^\\/bowl\\.[^\\/]+$')) ){
								alert('bowlは削除できません。');
								_this.unlock();
								return;
							}
							broccoli.contentsSourceData.removeInstance(instancePath, function(){
								broccoli.unselectInstance(function(){
									callback(true);
								});
							});
						})
					;
					(function($target){
						// タブキーの制御
						var $tabTargets = $target.find('a, input, textarea, select, button');
						var $start = $tabTargets.eq(0);
						var $end = $tabTargets.eq(-1);
						$start
							.on('keydown', function(e){
								if (e.keyCode == 9 && e.originalEvent.shiftKey) {
									$end.focus();
									e.preventDefault();
									e.stopPropagation();
									return false;
								}
							})
						;
						$end
							.on('keydown', function(e){
								if (e.keyCode == 9 && !e.originalEvent.shiftKey) {
									$start.focus();
									e.preventDefault();
									e.stopPropagation();
									return false;
								}
							})
						;
					})($editWindow);
				});

			}
		);
		return this;
	}

	/**
	 * パンくずを表示する
	 */
	function drawLogicalPath(instancePath, data){
		// パンくずを表示
		var instPath = instancePath.split('/');
		var timer;

		// console.log(instPath);

		var $ul = $('<ul>');
		var instPathMemo = [];
		for( var idx in instPath ){
			instPathMemo.push(instPath[idx]);
			if( instPathMemo.length <= 1 ){ continue; }
			var contData = broccoli.contentsSourceData.get(instPathMemo.join('/'));
			if( !contData ){
				// appender を選択した場合に、
				// 存在しない instance が末尾に含まれた状態で送られてくる。
				// その場合、contData は undefined になる。
				// 処理できないので、スキップする。
				continue;
			}
			var mod = broccoli.contentsSourceData.getModule(contData.modId, contData.subModName);
			var label = mod && mod.info.name||mod.id;
			if(instPathMemo.length==2){
				// bowl自体だったら
				label = instPathMemo[instPathMemo.length-1];
			}
			var isLastOne = false;
			if( idx >= instPath.length-1 ){ isLastOne = true; }
			$ul.append( $('<li>')
				.append( $('<'+(isLastOne?'span':'a href="javascript:;"')+'>')
					.attr({
						'data-broccoli-instance-path': instPathMemo.join('/')
					})
					.bind('click', function(e){
						if( this.tagName.toLowerCase() != 'a' ){
							return;
						}
						clearTimeout(timer);
						var instancePathTo = $(this).attr('data-broccoli-instance-path');

						_this.lock();//フォームをロック
						validateInstance(instancePath, mod, data, function(res){
							if( !res ){
								// エラーがあるため次へ進めない
								_this.unlock();
								return;
							}
							saveInstance(instancePath, mod, data, function(res){
								// コンテンツデータを保存
								broccoli.progressMessage('コンテンツを保存しています');
								broccoli.saveContents(function(){
									broccoli.editInstance( instancePathTo );
								});
							});
						});
					} )
					.text(label)
				)
			);
		}
		return $ul;

	}

	/**
	 * インスタンスの編集内容を検証する
	 */
	function validateInstance( instancePath, mod, data, callback ){
		var errors = {};
		var isError = false;
		it79.ary(
			mod.fields,
			function(it2, field2, fieldName2){
				var $dom = $editWindow.find('[data-broccoli-edit-window-field-name='+field2.name+']');
				if( $dom.attr('data-broccoli-edit-window-field-type') != 'input' ){
					it2.next();return;
				}
				var fieldDefinition = broccoli.getFieldDefinition(field2.type);
				fieldDefinition.validateEditorContent($dom.get(0), mod.fields[fieldName2], function(errorMsgs){
					if( typeof(errorMsgs)==typeof([]) && errorMsgs.length ){
						isError = true;
						errors[fieldName2] = errorMsgs;
					}else if( typeof(errorMsgs)==typeof('') && errorMsgs.length ){
						isError = true;
						errors[fieldName2] = [errorMsgs];
					}
					it2.next();
				});
				return;
			},
			function(){
				if( isError ){
					console.info('ERROR:', errors);
					formErrorMessage(errors);
					broccoli.message('入力エラーがあります。確認してください。');
				}
				callback( !isError );
				return;
			}
		);

		return;
	} // validateInstance()

	/**
	 * インスタンスの編集を保存する
	 */
	function saveInstance( instancePath, mod, data, callback ){
		// console.log('=-=-=-= saveInstance:', data, mod, instancePath);
		callback = callback || function(){};
		if( data.fields && data.fields.length === 0 ){
			data.fields = {};
		}
		it79.ary(
			mod.fields,
			function(it2, field2, fieldName2){
				var $dom = $editWindow.find('[data-broccoli-edit-window-field-name='+field2.name+']');
				if( $dom.attr('data-broccoli-edit-window-field-type') != 'input' ){
					it2.next();return;
				}
				var fieldDefinition = broccoli.getFieldDefinition(field2.type);
				broccoli.progressMessage('フィールド "'+fieldName2+'" を処理しています...');
				fieldDefinition.saveEditorContent($dom.get(0), data.fields[fieldName2], mod.fields[fieldName2], function(result){
					data.fields[fieldName2] = result;
					it2.next();
				}, {
					'message': function(msg){
						broccoli.progressMessage(fieldName2+': '+msg);
					}
				});
				return;
			},
			function(){
				broccoli.progressMessage('データを送信しています...');
				it79.fnc({},
					[
						function(it2, arg){
							data.anchor = $editWindow.find('#broccoli__edit-window-builtin-anchor-field').val();
							data.dec = $editWindow.find('#broccoli__edit-window-builtin-dec-field').val();

							it2.next(arg);
						} ,
						function(it2, arg){
							// クライアントサイドにあるメモリ上のcontentsSourceDataに反映する。
							// この時点で、まだサーバー側には送られていない。
							// サーバー側に送るのは、callback() の先の仕事。
							broccoli.progressMessage('インスタンス情報を更新しています...');
							broccoli.contentsSourceData.updateInstance(data, instancePath, function(){
								it2.next(arg);
							});
						} ,
						function(it2, arg){
							broccoli.progressMessage('完了');
							callback(true);
							it2.next(arg);
						}
					]
				);
			}
		);

		return;
	} // saveInstance()

	/**
	 * フォーム操作を凍結する
	 */
	this.lock = function(callback){
		callback = callback || function(){};
		$editWindow.find('.broccoli__edit-window-builtin-fields').find('input, textarea').attr({'disabled': true});
		$editWindow.find('.broccoli__edit-window-form-buttons').find('button').attr({'disabled': true});
		callback();
		return this;
	}

	/**
	 * フォーム操作の凍結を解除する
	 */
	this.unlock = function(callback){
		callback = callback || function(){};
		$editWindow.find('.broccoli__edit-window-builtin-fields').find('input, textarea').attr({'disabled': false});
		$editWindow.find('.broccoli__edit-window-form-buttons').find('button').attr({'disabled': false});
		callback();
		return this;
	}

	return;
}
