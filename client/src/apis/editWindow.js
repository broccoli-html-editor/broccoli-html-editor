/**
 * editWindow.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ return false; }

	var _this = this;

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var $ = require('jquery');

	var $editWindow;
	var tplFrame = ''
				+ '<div class="broccoli--edit-window">'
				+ '	<form action="javascript:;">'
				+ '		<h2 class="broccoli--edit-window-module-name">---</h2>'
				+ '		<div class="broccoli--edit-window-fields">'
				+ '		</div>'
				+ '		<div><a href="javascript:;" class="broccoli--edit-window-builtin-fields-switch"><span class="glyphicon glyphicon-menu-right"></span> <%= lb.get(\'ui_label.show_advanced_setting\') %></a></div>'
				+ '		<div class="broccoli--edit-window-builtin-fields">'
				+ '			<div class="form-group">'
				+ '				<label for="broccoli--edit-window-builtin-anchor-field"><%= lb.get(\'ui_label.anchor\') %></label>'
				+ '				<div class="input-group">'
				+ '					<span class="input-group-addon" id="basic-addon1">#</span>'
				+ '					<input type="text" class="form-control" id="broccoli--edit-window-builtin-anchor-field" placeholder="">'
				+ '				</div>'
				+ '			</div>'
				+ '			<div class="form-group">'
				+ '				<label for="broccoli--edit-window-builtin-dec-field"><%= lb.get(\'ui_label.embed_comment\') %></label>'
				+ '				<textarea class="form-control" id="broccoli--edit-window-builtin-dec-field" placeholder=""></textarea>'
				+ '			</div>'
				+ '		</div>'
				+ '		<div class="broccoli--edit-window-form-buttons">'
				+ '			<div class="container-fluid">'
				+ '				<div class="row">'
				+ '					<div class="col-sm-6 col-sm-offset-3">'
				+ '						<div class="btn-group btn-group-justified" role="group">'
				+ '							<div class="btn-group">'
				+ '								<button disabled="disabled" type="submit" class="px2-btn px2-btn--primary px2-btn--lg px2-btn--block"><span class="glyphicon glyphicon-ok"></span> <%= lb.get(\'ui_label.ok\') %></button>'
				+ '							</div>'
				+ '						</div>'
				+ '					</div>'
				+ '				</div>'
				+ '			</div>'
				+ '			<div class="container-fluid">'
				+ '				<div class="row">'
				+ '					<div class="col-sm-4">'
				+ '						<div class="btn-group btn-group-justified" role="group" style="margin-top:20px;">'
				+ '							<div class="btn-group">'
				+ '								<button disabled="disabled" type="button" class="px2-btn px2-btn--sm px2-btn--block broccoli--edit-window-btn-cancel"><%= lb.get(\'ui_label.cancel\') %></button>'
				+ '							</div>'
				+ '						</div>'
				+ '					</div>'
				+ '					<div class="col-sm-4 col-sm-offset-4">'
				+ '						<div class="btn-group btn-group-justified" role="group" style="margin-top:20px;">'
				+ '							<div class="btn-group">'
				+ '								<button disabled="disabled" type="button" class="px2-btn px2-btn--danger px2-btn--sm px2-btn--block broccoli--edit-window-btn-remove"><span class="glyphicon glyphicon-trash"></span> <%= lb.get(\'ui_label.remove_this_module\') %></button>'
				+ '							</div>'
				+ '						</div>'
				+ '					</div>'
				+ '				</div>'
				+ '			</div>'
				+ '		</div>'
				+ '		<div class="broccoli--edit-window-message-field"></div>'
				+ '	</form>'
				+ '</div>'
	;

	var tplField = ''
				+ '<div class="broccoli--edit-window-field">'
				+ '	<h3>---</h3>'
				+ '	<div class="broccoli--edit-window-field-description">'
				+ '	</div>'
				+ '	<div class="broccoli--edit-window-field-content">'
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
		$editWindow.find('.broccoli--edit-window-module-name').text(mod.info.name||mod.id);
		$editWindow.find('.broccoli--edit-window-fields').append($fields);

		$editWindow.find('.broccoli--edit-window-builtin-fields').hide();
		$editWindow.find('.broccoli--edit-window-builtin-fields-switch').click(function(){
			var $this = $(this);
			var className = 'broccoli--edit-window-builtin-fields-switch__on';
			$editWindow.find('.broccoli--edit-window-builtin-fields').toggle('fast', function(){
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
										$li.append($a);
										$a
											.text(label)
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

										var $elmFieldContent = $fields.find('.broccoli--edit-window-module-fields[data-broccoli--editwindow-field-name='+field.name+']').eq(0);
										$elmFieldContent.addClass('broccoli--edit-window-module-fields--fieldtype-'+field.fieldType);
										$elmFieldContent.find('.broccoli--edit-window-module-fields__instances').html('')
											.append(
												$ul
											)
										;
										if(field.fieldType == 'module'){
											// moduleフィールドには、モジュールパレットがつきます。
											broccoli.drawModulePalette( $elmFieldContent.find('.broccoli--edit-window-module-fields__palette').get(0), function(){
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
		it79.ary(
			mod.fields,
			function(it1, field, fieldName){
				if( typeof(field) != typeof({}) ){
					// オブジェクトではない field → Skip
					it1.next();
					return;
				}
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
				if( field.description ){
					$field.find('>.broccoli--edit-window-field-description')
						.html( field.description )
					;
				}else{
					$field.find('>.broccoli--edit-window-field-description')
						.remove()
					;
				}
				$fields.append($field);

				// console.log( broccoli.fieldDefinitions );
				var elmFieldContent = $field.find('.broccoli--edit-window-field-content').get(0);
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
									.addClass('broccoli--edit-window-module-fields')
									.attr({
										"data-broccoli--editwindow-field-name": field.name
									})
									.append( $('<div>')
										.addClass('broccoli--edit-window-module-fields__instances')
									)
									.append( $('<div>')
										.addClass('broccoli--edit-window-module-fields__palette')
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

				updateModuleAndLoopField(instancePath, function(){
					$editWindow.find('#broccoli--edit-window-builtin-anchor-field')
						.val(data.anchor)
					;
					$editWindow.find('#broccoli--edit-window-builtin-dec-field')
						.val(data.dec)
					;
					$editWindow.find('.broccoli--edit-window-form-buttons button')
						.removeAttr('disabled')
					;
					$editWindow.find('form')
						.removeAttr('disabled')
						.bind('submit', function(){
							// 編集内容を保存する
							// console.log( data );
							// console.log( mod );

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
					$editWindow.find('button.broccoli--edit-window-btn-cancel')
						.bind('click', function(){
							_this.lock();
							callback(false);
						})
					;
					$editWindow.find('button.broccoli--edit-window-btn-remove')
						.bind('click', function(){
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
				});

			}
		);
		return this;
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
				fieldDefinition.validateEditorContent($dom.get(0), data.fields[fieldName2], mod.fields[fieldName2], function(errorMsgs){
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
		callback = callback || function(){};
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
							data.anchor = $editWindow.find('#broccoli--edit-window-builtin-anchor-field').val();
							data.dec = $editWindow.find('#broccoli--edit-window-builtin-dec-field').val();

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
		$editWindow.find('.broccoli--edit-window-builtin-fields').find('input, textarea').attr({'disabled': true});
		$editWindow.find('.broccoli--edit-window-form-buttons').find('button').attr({'disabled': true});
		callback();
		return this;
	}

	/**
	 * フォーム操作の凍結を解除する
	 */
	this.unlock = function(callback){
		callback = callback || function(){};
		$editWindow.find('.broccoli--edit-window-builtin-fields').find('input, textarea').attr({'disabled': false});
		$editWindow.find('.broccoli--edit-window-form-buttons').find('button').attr({'disabled': false});
		callback();
		return this;
	}

	return;
}
