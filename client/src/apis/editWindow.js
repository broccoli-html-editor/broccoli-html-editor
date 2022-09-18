/**
 * editWindow.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ return false; }

	var _this = this;

	var it79 = require('iterate79');
	var LangBank = require('langbank');
	var php = require('phpjs');
	var $ = require('jquery');
	var modLb;

	var $editWindow;
	var tplFrame = ''
				+ '<div class="broccoli__edit-window">'
				+ '	<div class="broccoli__edit-window-btn-close button"><button></button></div>'
				+ '	<form action="javascript:;">'
				+ '		<div class="broccoli__edit-window-logical-path">---</div>'
				+ '		<h2 class="broccoli__edit-window-module-name">---</h2>'
				+ '		<div class="broccoli__edit-window-module-readme-switch"><a href="javascript:;">{{ lb.get(\'ui_label.show_readme\') }}</a></div>'
				+ '		<div class="broccoli__edit-window-module-readme"><div class="broccoli__edit-window-module-readme-inner"><article class="broccoli__module-readme"></article></div></div>'
				+ '		<div class="broccoli__edit-window-message-field"></div>'
				+ '		<div class="broccoli__edit-window-fields">'
				+ '		</div>'
				+ '		<div class="broccoli__edit-window-builtin-fields-switch"><a href="javascript:;">{{ lb.get(\'ui_label.show_advanced_setting\') }}</a></div>'
				+ '		<div class="broccoli__edit-window-builtin-fields">'
				+ '			<div class="broccoli__edit-window-builtin-fields__row broccoli__edit-window-builtin-anchor-field-wrap">'
				+ '				<div class="broccoli__edit-window-builtin-fields__title"><label for="broccoli__edit-window-builtin-anchor-field">{{ lb.get(\'ui_label.anchor\') }}</label></div>'
				+ '				<div class="broccoli__edit-window-builtin-fields__input">'
				+ '					<span>#</span>'
				+ '					<input type="text" class="px2-input" id="broccoli__edit-window-builtin-anchor-field" placeholder="">'
				+ '				</div>'
				+ '			</div>'
				+ '			<div class="broccoli__edit-window-builtin-fields__row broccoli__edit-window-builtin-dec-field-wrap">'
				+ '				<div class="broccoli__edit-window-builtin-fields__title"><label for="broccoli__edit-window-builtin-dec-field">{{ lb.get(\'ui_label.embed_comment\') }}</label></div>'
				+ '				<div class="broccoli__edit-window-builtin-fields__input">'
				+ '					<textarea class="px2-input" id="broccoli__edit-window-builtin-dec-field" placeholder=""></textarea>'
				+ '				</div>'
				+ '			</div>'
				+ '		</div>'
				+ '		<div class="broccoli__edit-window-form-buttons">'
				+ '			<div class="broccoli__edit-window-form-buttons-fluid">'
				+ '				<div class="broccoli__edit-window-form-buttons-ok">'
				+ '					<button disabled="disabled" type="submit" class="px2-btn px2-btn--primary px2-btn--lg"> {{ lb.get(\'ui_label.ok\') }}</button>'
				+ '				</div>'
				+ '			</div>'
				+ '			<div class="broccoli__edit-window-form-buttons-fluid">'
				+ '				<div class="broccoli__edit-window-form-buttons-cancel">'
				+ '					<button disabled="disabled" type="button" class="px2-btn px2-btn--sm broccoli__edit-window-btn-cancel">{{ lb.get(\'ui_label.cancel\') }}</button>'
				+ '				</div>'
				+ '				<div class="broccoli__edit-window-form-buttons-delete">'
				+ '					<button disabled="disabled" type="button" class="px2-btn px2-btn--danger px2-btn--sm broccoli__edit-window-btn-remove">{{ lb.get(\'ui_label.remove_this_module\') }}</button>'
				+ '				</div>'
				+ '			</div>'
				+ '		</div>'
				+ '		<div class="broccoli__edit-window-sticky-footer">'
				+ '			<div class="broccoli__edit-window-sticky-footer-main">'
				+ '				<button disabled="disabled" type="submit" class="px2-btn px2-btn--primary"> {{ lb.get(\'ui_label.ok\') }}</button>'
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
		var mod = broccoli.contentsSourceData.getModuleByInternalId(data.modId, data.subModName);
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
			var $err = $('<div class="broccoli__edit-window-inline-error-message">');
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
			var $err = $('<div class="broccoli__edit-window-error-message-box">');
			$elm.show().append(
				$err.text( broccoli.lb.get('ui_message.confirm_error') ) // 入力エラーがあります。確認してください。
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
		callback = callback || function(){};

		var data = broccoli.contentsSourceData.get(instancePath);
		var mod = initMod(data);

		var $fields = $('<div>');
		$editWindow = $(elmEditWindow);
		$editWindow.html('').append( broccoli.bindTwig(tplFrame, {'lb':broccoli.lb}) );
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
			var modulePackageList = broccoli.getBootupInfomations().modulePackageList;
			mod.id.match(/^([\s\S]*)\:([\s\S]*)\/([\s\S]*)$/i);
			var parsedModId = {
				'package': RegExp.$1,
				'category': RegExp.$2,
				'module': RegExp.$3
			};
			var readme = modulePackageList[parsedModId.package].categories[parsedModId.category].modules[parsedModId.module].readme;
			if(readme){
				$editWindow.find('.broccoli__edit-window-module-readme-inner .broccoli__module-readme').html(readme);
				$editWindow.find('.broccoli__edit-window-module-readme-switch a').on('click', function(){
					var $this = $(this);
					var className = 'broccoli__edit-window-module-readme-switch__on';
					$this.toggleClass(className);
					$editWindow.find('.broccoli__edit-window-module-readme').toggle('fast', function(){
						if($(this).is(':visible')){
							$this.html(broccoli.lb.get('ui_label.hide_readme'))
						}else{
							$this.html(broccoli.lb.get('ui_label.show_readme'))
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
		$editWindow.find('.broccoli__edit-window-builtin-fields-switch a').on('click', function(){
			var $this = $(this);
			var className = 'broccoli__edit-window-builtin-fields-switch__on';
			$this.toggleClass(className);
			$editWindow.find('.broccoli__edit-window-builtin-fields').toggle('fast', function(){
				if($(this).is(':visible')){
					$this.html(''+broccoli.lb.get('ui_label.hide_advanced_setting'))
				}else{
					$this.html(''+broccoli.lb.get('ui_label.show_advanced_setting'))
				}
			});
		});

		// moduleフィールド、loopフィールドの内容を更新する
		function updateModuleAndLoopField( instancePath, callbackOf_pdateModuleAndLoopField ){
			callbackOf_pdateModuleAndLoopField = callbackOf_pdateModuleAndLoopField || function(res, callback){
				callback = callback || function(){};
				return;
			};

			broccoli.progress(function(){

				it79.ary(
					mod.fields,
					function(it1, field, fieldName){
						if( typeof(field) != typeof({}) ){
							// オブジェクトではない field → Skip
							it1.next();
							return;
						}

						field.fieldType = field.fieldType || 'input';
						switch( field.fieldType ){
							case 'input':
								it1.next();
								break;
							case 'module':
							case 'loop':
								var $ul = $('<ul>');
								if(!data.fields[field.name]){
									data.fields[field.name] = {};
								}
								it79.ary(
									data.fields[field.name],
									function(it2, childData, idx2){
										var childMod = broccoli.contentsSourceData.getModuleByInternalId(childData.modId, childData.subModName);
										var childInstancePath = instancePath + '/fields.'+field.name+'@'+idx2+''
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
												.addClass('broccoli__panel-drop-to-insert-here')
											)
										;

										if(childMod.fields){
											// プレビューを表示
											(function($label, childMod, childData){
												it79.ary(
													childMod.fields,
													function(itMkLabel, field, fieldName){
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
											.off('drop')
											.on('drop', function(e){
												_this.lock();//フォームをロック
												broccoli.panels.onDrop(e, this, function(){
													updateModuleAndLoopField( instancePath, function(){
														_this.unlock();//フォームのロックを解除
													} );
												});
											})
											.off('click')
											.on('click', function(e){
												return false;
											})
											.off('dblclick')
											.on('dblclick', function(e){
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
															});
														});
													});
												});

											})
											.off('contextmenu')
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
												.text(broccoli.lb.get('ui_label.drop_a_module_here'))
												.attr({
													'data-broccoli-instance-path':appenderInstancePath,
													'data-broccoli-is-appender':'yes',
													// 'data-broccoli-is-instance-tree-view': 'yes',
													'data-broccoli-is-edit-window': 'yes',
													'draggable': false
												})
												.on('mouseover', function(e){
													e.stopPropagation();
													$(this).addClass('broccoli__panel__hovered')
												})
												.on('mouseout',function(e){
													$(this).removeClass('broccoli__panel__hovered')
												})
												.append( $('<div>')
													.addClass('broccoli__panel-drop-to-insert-here')
												)
											;
										}else if( field.fieldType == 'loop' ){
											$appender
												.text(''+broccoli.lb.get('ui_label.dblclick_here_and_add_array_element'))
												.attr({
													'data-broccoli-instance-path':appenderInstancePath,
													'data-broccoli-mod-id': mod.id,
													'data-broccoli-mod-internal-id': mod.internalId,
													'data-broccoli-sub-mod-name': field.name,
													'data-broccoli-is-appender':'yes',
													// 'data-broccoli-is-instance-tree-view': 'yes',
													'data-broccoli-is-edit-window': 'yes',
													'draggable': false
												})
												.on('click', function(e){
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
												.on('mouseover', function(e){
													e.stopPropagation();
													$(this).addClass('broccoli__panel__hovered')
												})
												.on('mouseout',function(e){
													$(this).removeClass('broccoli__panel__hovered')
												})
												.append( $('<div>')
													.addClass('broccoli__panel-drop-to-insert-here')
												)
											;
										}
										broccoli.panels.setPanelEventHandlers( $appender );
										$appender
											.off('drop')
											.on('drop', function(e){
												_this.lock();//フォームをロック
												broccoli.panels.onDrop(e, this, function(){
													updateModuleAndLoopField( instancePath, function(){
														_this.unlock();//フォームのロックを解除
													} );
												});
											})
											.off('dblclick')
											.on('dblclick', function(e){
												var isLoopField = $(this).attr('data-broccoli-sub-mod-name');
												if( !isLoopField ){
													return;
												}
												_this.lock();//フォームをロック
												broccoli.panels.onDblClick(e, this, function(){
													updateModuleAndLoopField( instancePath, function(){
														_this.unlock();//フォームのロックを解除
													} );
												});
											})
											.off('contextmenu')
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
		it79.fnc({}, [
			function(it1){
				modLb = new LangBank(mod.languageCsv || '', function(){
					it1.next();
				});
			},
			function(it1){
				modLb.setLang(broccoli.lb.lang);
				it1.next();
			},
			function(it1){
				it79.ary(
					mod.fields,
					function(it2, field, fieldName){
						if( typeof(field) != typeof({}) ){
							// オブジェクトではない field → Skip
							it2.next();
							return;
						}
						fieldCount ++;
						field.fieldType = field.fieldType || 'input';
						var $field = $(tplField)
							.attr({
								'data-broccoli-edit-window-field-name': field.name ,
								'data-broccoli-edit-window-field-type': field.fieldType
							})
						;
						$field.find('>h3')
							.text((field.label||field.name)+' ')
							.append( $('<small>')
								.text( field.name + ' (' + (field.fieldType=='input' ? field.type : field.fieldType) + ')' )
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

						var elmFieldContent = $field.find('.broccoli__edit-window-field-content').get(0);
						field.fieldType = field.fieldType || 'input';
						switch( field.fieldType ){
							case 'input':
								var fieldDefinition = broccoli.getFieldDefinition(field.type);
								mod.fields[field.name].lb = new (function(lb, field){
									this.get = function(key, defValue){
										var rtn = '';
										var fullkey = '';
										if( data.subModName ){
											fullkey = 'subModule.'+data.subModName+'.'+field.name+':'+key;
										}else{
											fullkey = 'fields.'+field.name+':'+key;
										}
										rtn = lb.get(fullkey);
										if( rtn == '' || rtn == '---' ){
											rtn = defValue;
										}
										return rtn;
									}
								})(modLb, field);
								fieldDefinition.mkEditor(mod.fields[field.name], data.fields[field.name], elmFieldContent, function(){
									if(!focusDone){
										focusDone = true;
										fieldDefinition.focus(elmFieldContent, function(){
											it2.next();
										});
										return;
									}
									it2.next();
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
								it2.next();
								break;
							default:
								$(elmFieldContent)
									.append(
										'<p>'+php.htmlspecialchars( (typeof(field.fieldType)===typeof('') ? field.fieldType : 'unknown') )+'</p>'
									)
								;
								it2.next();
								break;
						}
						return;
					},
					function(){

						if(!fieldCount){
							$fields
								.append(
									'<p style="text-align: center; margin: 7em 1em;">'+broccoli.lb.get('ui_message.this_module_has_no_options')+'</p>'
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
							$editWindow.find('.broccoli__edit-window-sticky-footer button')
								.removeAttr('disabled')
							;
							$editWindow.find('form')
								.removeAttr('disabled')
								.on('submit', function(){
									// 編集内容を保存する
									broccoli.px2style.loading();
									formErrorMessage([]);

									_this.lock();//フォームをロック
									broccoli.progress();
									validateInstance(instancePath, mod, data, function(res){
										if( !res ){
											// エラーがあるため次へ進めない
											_this.unlock();
											broccoli.closeProgress();
											broccoli.px2style.closeLoading();
											return;
										}
										saveInstance(instancePath, mod, data, function(res){
											broccoli.progressMessage('');
											broccoli.closeProgress();
											broccoli.px2style.closeLoading();
											callback(res);
										});
									});

								})
							;
							$editWindow.find('.broccoli__edit-window-btn-close button')
								.on('click', function(){
									_this.lock();
									callback(false);
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
									if( !confirm('このインスタンスを削除します。よろしいですか？') ){
										_this.unlock();
										return;
									}
									if( instancePath.match(new RegExp('^\\/bowl\\.[^\\/]+$')) ){
										alert('ルートインスタンスは削除できません。');
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
									.on('keydown.broccoli-html-editor', function(e){
										if (e.keyCode == 9 && e.originalEvent.shiftKey) {
											$end.focus();
											e.preventDefault();
											e.stopPropagation();
											return false;
										}
									})
								;
								$end
									.on('keydown.broccoli-html-editor', function(e){
										if (e.keyCode == 9 && !e.originalEvent.shiftKey) {
											$start.focus();
											e.preventDefault();
											e.stopPropagation();
											return false;
										}
									})
								;
							})($editWindow);

							$(window).on('keydown.broccoli-html-editor', function(e){
								var cmdKey = ( e.originalEvent.metaKey || e.originalEvent.ctrlKey );
								var pressedKey = e.originalEvent.key.toLowerCase();
								if(cmdKey){
									if(pressedKey == 's'){
										e.stopPropagation();
										e.preventDefault();
										$editWindow.find('form').submit();
										return;
									}
								}
							});

							it1.next();
						});
					}
				);
			},
			function(it1){
				var $innerBody = $('.broccoli__lightbox-inner-body');
				var $btnOk = $editWindow.find('.broccoli__edit-window-form-buttons button[type=submit]');
				var $stickyBar = $editWindow.find('.broccoli__edit-window-sticky-footer');
				var $stickyBarBtns = $editWindow.find('.broccoli__edit-window-sticky-footer button');
				var lastVisibilityVisible = null;
				$innerBody.on('scroll', function(){
					var btnOffsetScrollTop = $btnOk.offset().top - $innerBody.offset().top;
					var visibilityVisible = null;
					if( btnOffsetScrollTop > $innerBody.innerHeight() ){
						visibilityVisible = true;
					}else{
						visibilityVisible = false;
					}
					if( lastVisibilityVisible !== visibilityVisible ){
						$stickyBar.css({
							'opacity': ( visibilityVisible ? 1 : 0 ),
						});
						$stickyBarBtns.css({
							'pointer-events': ( visibilityVisible ? 'auto' : 'none' ),
						});
					}
					lastVisibilityVisible = visibilityVisible;
				});
				$innerBody.trigger('scroll');
				it1.next();
			},
		]);
		return;
	}

	/**
	 * パンくずを表示する
	 */
	function drawLogicalPath(instancePath, data){
		// パンくずを表示
		var instPath = instancePath.split('/');
		var timer;

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
			var mod = broccoli.contentsSourceData.getModuleByInternalId(contData.modId, contData.subModName);
			var label = mod && mod.info.name||mod.id;
			if(instPathMemo.length==2){
				// bowl自体だったら
				label = instPathMemo[instPathMemo.length-1];
				label = broccoli.lb.get('system_module_label.editable_area') + ': ' + label.replace(/^bowl\./, '') + '';
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
					broccoli.message( broccoli.lb.get('ui_message.confirm_error') ); // 入力エラーがあります。確認してください。
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
				var message = 'フィールド "'+fieldName2+'" を処理しています...';
				if( broccoli.lb.getLang() == 'en' ){
					message = 'Processing Field "'+fieldName2+'"...';
				}
				broccoli.progressMessage( message );
				fieldDefinition.saveEditorContent($dom.get(0), data.fields[fieldName2], mod.fields[fieldName2], function(result){
					data.fields[fieldName2] = result;
					it2.next();
				}, {
					'message': function(msg){
						broccoli.progressMessage( fieldName2+': '+msg );
					}
				});
				return;
			},
			function(){
				broccoli.progressMessage( broccoli.lb.get('ui_message.sending_data') ); // データを送信しています...
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
							broccoli.progressMessage( broccoli.lb.get('ui_message.updating_instance') ); // インスタンス情報を更新しています...
							broccoli.contentsSourceData.updateInstance(data, instancePath, function(){
								it2.next(arg);
							});
						} ,
						function(it2, arg){
							broccoli.progressMessage( broccoli.lb.get('ui_label.finished') ); // 完了
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
		var $formElms = $editWindow.find('input,select,textarea,button');
		$formElms.each(function(idx, elm){
			var $elm = $(elm);
			var isDisabled = !!$elm.attr('disabled');
			if( !isDisabled ){
				$elm.attr({
					'data-broccoli-html-editor--locked': true,
					'disabled': true
				});
			}
		});
		callback();
		return;

	}

	/**
	 * フォーム操作の凍結を解除する
	 */
	this.unlock = function(callback){
		callback = callback || function(){};
		var $formElms = $editWindow.find('[data-broccoli-html-editor--locked]');
		$formElms
			.removeAttr('data-broccoli-html-editor--locked')
			.removeAttr('disabled')
		;
		callback();
		return;

	}

	return;
}
