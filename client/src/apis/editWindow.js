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
				+ '		<div><a href="javascript:;" class="broccoli--edit-window-builtin-fields-switch"><span class="glyphicon glyphicon-menu-right"></span>  詳細設定を表示する</a></div>'
				+ '		<div class="broccoli--edit-window-builtin-fields">'
				+ '			<div class="form-group">'
				+ '				<label for="broccoli--edit-window-builtin-anchor-field">アンカー</label>'
				+ '				<div class="input-group">'
				+ '					<span class="input-group-addon" id="basic-addon1">#</span>'
				+ '					<input type="text" class="form-control" id="broccoli--edit-window-builtin-anchor-field" placeholder="">'
				+ '				</div>'
				+ '			</div>'
				+ '			<div class="form-group">'
				+ '				<label for="broccoli--edit-window-builtin-dec-field">埋め込みコメント入力欄</label>'
				+ '				<textarea class="form-control" id="broccoli--edit-window-builtin-dec-field" placeholder=""></textarea>'
				+ '			</div>'
				+ '		</div>'
				+ '		<div class="broccoli--edit-window-form-buttons">'
				+ '			<div class="container-fluid">'
				+ '				<div class="row">'
				+ '					<div class="col-sm-6 col-sm-offset-3">'
				+ '						<div class="btn-group btn-group-justified" role="group">'
				+ '							<div class="btn-group">'
				+ '								<button disabled="disabled" type="submit" class="btn btn-primary btn-lg"><span class="glyphicon glyphicon-ok"></span> OK</button>'
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
				+ '								<button disabled="disabled" type="button" class="btn btn-default btn-sm broccoli--edit-window-btn-cancel">キャンセル</button>'
				+ '							</div>'
				+ '						</div>'
				+ '					</div>'
				+ '					<div class="col-sm-4 col-sm-offset-4">'
				+ '						<div class="btn-group btn-group-justified" role="group" style="margin-top:20px;">'
				+ '							<div class="btn-group">'
				+ '								<button disabled="disabled" type="button" class="btn btn-danger btn-sm broccoli--edit-window-btn-remove"><span class="glyphicon glyphicon-trash"></span> このモジュールを削除する</button>'
				+ '							</div>'
				+ '						</div>'
				+ '					</div>'
				+ '				</div>'
				+ '			</div>'
				+ '		</div>'
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


	/**
	 * 初期化
	 * @param  {[type]}   instancePath  [description]
	 * @param  {[type]}   elmEditWindow [description]
	 * @param  {Function} callback      [description]
	 * @return {[type]}                 [description]
	 */
	this.init = function(instancePath, elmEditWindow, callback){
		callback = callback || function(){};

		var data = broccoli.contentsSourceData.get(instancePath);
		// console.log( data );
		var mod = initMod(data);
		// console.log( data.modId, data.subModName );
		// console.log( mod );

		var $fields = $('<div>');
		$editWindow = $(elmEditWindow);
		$editWindow.append(tplFrame);
		$editWindow.find('.broccoli--edit-window-module-name').text(mod.info.name||mod.id);
		$editWindow.find('.broccoli--edit-window-fields').append($fields);

		$editWindow.find('.broccoli--edit-window-builtin-fields').hide();
		$editWindow.find('.broccoli--edit-window-builtin-fields-switch').click(function(){
			var $this = $(this);
			var className = 'broccoli--edit-window-builtin-fields-switch__on';
			$editWindow.find('.broccoli--edit-window-builtin-fields').toggle('fast', function(){
				if($(this).is(':visible')){
					$this.addClass(className);
					$this.html('<span class="glyphicon glyphicon-menu-down"></span> 詳細設定を隠す')
				}else{
					$this.removeClass(className);
					$this.html('<span class="glyphicon glyphicon-menu-right"></span>  詳細設定を表示する')
				}
			});
		});

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

		// moduleフィールド、loopフィールドの内容を更新する
		function updateModuleAndLoopField( instancePath, callback ){
			console.log('updateModuleAndLoopField();');
			callback = callback || function(){};
			var data = broccoli.contentsSourceData.get(instancePath);
			// console.log( data );
			var mod = initMod(data);

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
									$li
										.text(label)
										.attr({
											'data-broccoli-instance-path': childInstancePath,
											'data-broccoli-mod-id': childMod.id,
											'data-broccoli-sub-mod-name': childMod.subModName,
											// 'data-broccoli-is-appender':'yes',
											'data-broccoli-is-edit-window': 'yes',
											'draggable': true
										})
										.bind('dblclick', function(e){
											var $this = $(this);
											var childInstancePath = $this.attr('data-broccoli-instance-path');
											// alert(childInstancePath);
											_this.lock();//フォームをロック
											saveInstance(instancePath, mod, data, function(res){
												callback(res, function(){
													// インスタンス instancePath の変更を保存し、
													// 一旦編集ウィンドウを閉じたあと、
													// childInstancePath の編集画面を開く。
													broccoli.editInstance(childInstancePath);
												});
											});

										})
										.bind('drop', function(e){
											_this.lock();//フォームをロック
											setTimeout(function(){ // TODO: ドロップ処理の終了を待ってから実行するべき。暫定的にタイマーで逃げている。
												updateModuleAndLoopField( instancePath, function(){
													_this.unlock();//フォームのロックを解除
												} );
											}, 2000);
										})
										.append( $('<div>')
											.addClass('broccoli--panel-drop-to-insert-here')
										)
									;
									broccoli.panels.setPanelEventHandlers( $li );
									$ul
										.append($li)
									;
									it2.next();
								},
								function(){
									var elmFieldContent = $fields.find('.broccoli--edit-window-module-fields[data-broccoli--editwindow-field-name='+field.name+']').get(0);
									$(elmFieldContent).html('')
										.append(
											$ul
										)
									;
									it1.next();
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
					callback();
				}
			);
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
							saveInstance(instancePath, mod, data, function(res){
								broccoli.closeProgress();
								callback(res);
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
	 * インスタンスの編集を保存する
	 */
	function saveInstance( instancePath, mod, data, callback ){
		it79.ary(
			mod.fields,
			function(it2, field2, fieldName2){
				var $dom = $editWindow.find('[data-broccoli-edit-window-field-name='+field2.name+']');
				if( $dom.attr('data-broccoli-edit-window-field-type') != 'input' ){
					it2.next();return;
				}
				var fieldDefinition = broccoli.getFieldDefinition(field2.type);
				fieldDefinition.saveEditorContent($dom.get(0), data.fields[fieldName2], mod.fields[fieldName2], function(result){
					data.fields[fieldName2] = result;
					it2.next();
				});
				return;
			},
			function(){
				it79.fnc(data,
					[
						function(it2, data){
							data.anchor = $editWindow.find('#broccoli--edit-window-builtin-anchor-field').val();
							data.dec = $editWindow.find('#broccoli--edit-window-builtin-dec-field').val();

							it2.next(data);
						} ,
						function(it2, data){
							// クライアントサイドにあるメモリ上のcontentsSourceDataに反映する。
							// この時点で、まだサーバー側には送られていない。
							// サーバー側に送るのは、callback() の先の仕事。
							broccoli.contentsSourceData.updateInstance(data, instancePath, function(){
								it2.next(data);
							});
						} ,
						function(it2, data){
							callback(true);
							it2.next(data);
						}
					]
				);
			}
		);

		return;
	}

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
