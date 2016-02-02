/**
 * editWindow.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ callback(); return false; }

	var _this = this;

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var $ = require('jquery');

	var $editWindow;
	var tplFrame = '';
	tplFrame += '<div class="broccoli--edit-window">';
	tplFrame += '	<form action="javascript:;">';
	tplFrame += '		<h2 class="broccoli--edit-window-module-name">---</h2>';
	tplFrame += '		<div class="broccoli--edit-window-fields">';
	tplFrame += '		</div>';
	tplFrame += '		<div class="broccoli--edit-window-builtin-fields">';
	tplFrame += '			<div class="form-group">';
	tplFrame += '				<label for="broccoli--edit-window-builtin-anchor-field">アンカー</label>';
	tplFrame += '				<input type="text" class="form-control" id="broccoli--edit-window-builtin-anchor-field" placeholder="">';
	tplFrame += '			</div>';
	tplFrame += '			<div class="form-group">';
	tplFrame += '				<label for="broccoli--edit-window-builtin-dec-field">埋め込みコメント入力欄</label>';
	tplFrame += '				<textarea class="form-control" id="broccoli--edit-window-builtin-dec-field" placeholder=""></textarea>';
	tplFrame += '			</div>';
	tplFrame += '		</div>';
	tplFrame += '		<div class="broccoli--edit-window-form-buttons">';
	tplFrame += '			<div class="container-fluid">';
	tplFrame += '				<div class="row">';
	tplFrame += '					<div class="col-sm-6 col-sm-offset-3">';
	tplFrame += '						<div class="btn-group btn-group-justified" role="group">';
	tplFrame += '							<div class="btn-group">';
	tplFrame += '								<button disabled="disabled" type="submit" class="btn btn-primary btn-lg">OK</button>';
	tplFrame += '							</div>';
	tplFrame += '						</div>';
	tplFrame += '					</div>';
	tplFrame += '				</div>';
	tplFrame += '			</div>';
	tplFrame += '			<div class="container-fluid">';
	tplFrame += '				<div class="row">';
	tplFrame += '					<div class="col-sm-4">';
	tplFrame += '						<div class="btn-group btn-group-justified" role="group" style="margin-top:20px;">';
	tplFrame += '							<div class="btn-group">';
	tplFrame += '								<button disabled="disabled" type="button" class="btn btn-default btn-sm broccoli--edit-window-btn-cancel">キャンセル</button>';
	tplFrame += '							</div>';
	tplFrame += '						</div>';
	tplFrame += '					</div>';
	tplFrame += '					<div class="col-sm-4 col-sm-offset-4">';
	tplFrame += '						<div class="btn-group btn-group-justified" role="group" style="margin-top:20px;">';
	tplFrame += '							<div class="btn-group">';
	tplFrame += '								<button disabled="disabled" type="button" class="btn btn-danger btn-sm broccoli--edit-window-btn-remove">このモジュールを削除する</button>';
	tplFrame += '							</div>';
	tplFrame += '						</div>';
	tplFrame += '					</div>';
	tplFrame += '				</div>';
	tplFrame += '			</div>';
	tplFrame += '		</div>';
	tplFrame += '	</form>';
	tplFrame += '</div>';

	var tplField = '';
	tplField += '<div class="broccoli--edit-window-field">';
	tplField += '	<h3>---</h3>';
	tplField += '	<div class="broccoli--edit-window-field-description">';
	tplField += '	</div>';
	tplField += '	<div class="broccoli--edit-window-field-content">';
	tplField += '	</div>';
	tplField += '</div>';


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
		var mod = broccoli.contentsSourceData.getModule(data.modId, data.subModName);
		if( mod === false ){
			mod = {
				'id': '_sys/unknown',
				'info': {
					'name': 'Unknown Module'
				}
			}
		}
		// console.log( data.modId, data.subModName );
		// console.log( mod );

		var $fields = $('<div>');
		$editWindow = $(elmEditWindow);
		$editWindow.append(tplFrame);
		$editWindow.find('.broccoli--edit-window-module-name').text(mod.info.name||mod.id);
		$editWindow.find('.broccoli--edit-window-fields').append($fields);

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
							it1.next();
						})
						break;
					case 'module':
					case 'loop':
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
										// function(it2, data){
										// 	// リソースマネージャーのデータを更新
										// 	broccoli.resourceMgr.init(function(){
										// 		it2.next(data);
										// 	});
										// } ,
										function(it2, data){
											callback();
											it2.next(data);
										}
									]
								);
							}
						);


					})
				;
				$editWindow.find('button.broccoli--edit-window-btn-cancel')
					.bind('click', function(){
						_this.lock();
						callback();
					})
				;
				$editWindow.find('button.broccoli--edit-window-btn-remove')
					.bind('click', function(){
						_this.lock();
						if( !confirm('このモジュールを削除します。よろしいですか？') ){
							_this.unlock();
							return;
						}
						broccoli.contentsSourceData.removeInstance(instancePath, function(){
							broccoli.unselectInstance(function(){
								callback();
							});
						});
					})
				;
			}
		);
		return this;
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
