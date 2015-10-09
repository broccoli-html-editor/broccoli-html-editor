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
	tplFrame += '		<div class="broccoli--edit-window-form-buttons">';
	tplFrame += '			<div class="btn-group btn-group-justified" role="group">';
	tplFrame += '				<div class="btn-group">';
	tplFrame += '					<button disabled="disabled" type="submit" class="btn btn-primary btn-lg">OK</button>';
	tplFrame += '				</div>';
	tplFrame += '			</div>';
	tplFrame += '		</div>';
	tplFrame += '	</form>';
	tplFrame += '</div>';

	var tplField = '';
	tplField += '<div class="broccoli--edit-window-field">';
	tplField += '	<h3>---</h3>';
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
		var mod = broccoli.contentsSourceData.getModule(data.modId);
		// console.log( mod );

		var $fields = $('<div>');
		$editWindow = $(elmEditWindow);
		$editWindow.append(tplFrame);
		$editWindow.find('.broccoli--edit-window-module-name').text(mod.info.name||mod.id);
		$editWindow.find('.broccoli--edit-window-fields').append($fields);

		it79.ary(
			mod.fields,
			function(it1, field, fieldName){
				// console.log(fieldName);
				var $field = $(tplField).attr({'data-broccoli-edit-window-field-name': field.name});
				$field.find('>h3')
					.text((field.label||field.name)+' ')
					.append( $('<small>')
						.text((field.fieldType=='input' ? field.type : field.fieldType))
					)
				;
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
					default:
						$(elmFieldContent)
							.append(
								'<p>'+php.htmlspecialchars( field.fieldType )+'</p>'
							)
						;
						it1.next();
						break;
				}
				return;
			},
			function(){
				$editWindow.find('.broccoli--edit-window-form-buttons button')
					.removeAttr('disabled')
				;
				$editWindow.find('form')
					.removeAttr('disabled')
					.bind('submit', function(){
						// 編集内容を保存する
						console.log( data );
						console.log( mod );

						it79.ary(
							mod.fields,
							function(it2, field2, fieldName2){
								var $dom = $editWindow.find('[data-broccoli-edit-window-field-name='+field2.name+']');
								var fieldDefinition = broccoli.getFieldDefinition(field2.type);
								fieldDefinition.saveEditorContent($dom.get(0), data.fields[fieldName2], mod, function(result){
									data.fields[fieldName2] = result;
									it2.next();
								});
							},
							function(){
								// クライアントサイドにあるメモリ上のcontentsSourceDataに反映する。
								// この時点で、まだサーバー側には送られていない。
								// サーバー側に送るのは、callback() の先の仕事。
								broccoli.contentsSourceData.updateInstance(data, instancePath, function(){
									callback();
								});
							}
						);


					})
				;
			}
		);
		return this;
	}

	return;
}
