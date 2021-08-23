/**
 * findWindow.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ return false; }

	var _this = this;

	var it79 = require('iterate79');
	var php = require('phpjs');
	var $ = require('jquery');
	var moduleList = {};
	var contentsElements = [];
	var timerFormWatcher;

	var $findWindow;
	var $elmResult;
	var tplFrame = ''
				+ '<div class="broccoli__find-window">'
				+ '	<h2 class="broccoli__find-window-module-name">検索</h2>'
				+ '	<div class="broccoli__find-window-search">'
				+ '		<form action="javascript:;">'
				+ '			<input type="text" name="search-keyword" class="form-control" />'
				+ '		</form>'
				+ '	</div>'
				+ '	<div class="broccoli__find-window-result"></div>'
				+ '	<div class="broccoli__find-window-form-buttons">'
				+ '		<p style="text-align: center;"><button disabled="disabled" type="button" class="px2-btn broccoli__find-window-btn-cancel"><%= lb.get(\'ui_label.cancel\') %></button></p>'
				+ '	</div>'
				+ '</div>'
	;

	/**
	 * 初期化
	 * @param  {String}   instancePath  [description]
	 * @param  {Object}   elmEditWindow [description]
	 * @param  {Function} callback      [description]
	 * @return {Void}                 [description]
	 */
	this.init = function(){
		// console.log( '=-=-=-=-=-=-=-=-= Initialize EditWindow.' );
		// callback = callback || function(){};

		contentsElements = []; // クリア

		it79.fnc(
			{},
			[
				function( it1, data ){
					// --------------------------------------
					// モジュール定義を整理
					broccoli.gpi(
						'getModulePackageList',
						{},
						function(tmpAllModuleList){
							// console.log(tmpAllModuleList);

							for(var pkgId in tmpAllModuleList){
								var pkg = tmpAllModuleList[pkgId];
								for( var catId in pkg.categories ){
									var cat = pkg.categories[catId];
									for( var modId in cat.modules ){
										var mod = cat.modules[modId];
										moduleList[mod.moduleId] = mod;
									}
								}
							}
							// console.log(moduleList);
							it1.next(data);
						}
					);
				} ,
				function( it1, data ){
					// --------------------------------------
					// コンテンツデータを整理
					broccoli.gpi(
						'getContentsDataJson',
						{},
						function(result){
							// console.log(result);
							function parseModuleRecursive(instancePath, instance){
								// console.log(instancePath, instance);
								var data = {};
								data.instancePath = instancePath;
								data.modId = instance.modId;
								data.content = '';
								data.data = null;
								data.label = null;
								contentsElements.push(data);

								var mod = moduleList[instance.modId];
								// console.log(mod);

								if( instance.fields ){
									for( var fieldName in instance.fields ){
										var fieldType = '';
										if( mod && mod.moduleInfo && mod.moduleInfo.interface && mod.moduleInfo.interface[fieldName] ){
											fieldType = mod.moduleInfo.interface[fieldName].fieldType;
										}

										if( fieldType == 'module' || fieldType == 'loop' ){
											for( var idx in instance.fields[fieldName] ){
												parseModuleRecursive(instancePath+'/fields.'+fieldName+'@'+idx, instance.fields[fieldName][idx]);
											}

										}else{
											data.data = instance.fields[fieldName];
											if( typeof(instance.fields[fieldName]) == typeof('') ){
												data.content += instance.fields[fieldName];
											}else{
												data.content += JSON.stringify(instance.fields[fieldName]);
											}

											data.label = data.content;
											if( typeof(data.data) == typeof('') ){
												data.label = data.data;
											}else if( typeof(data.data) == typeof({}) && data.data.src ){
												data.label = data.data.src;
											}else if( typeof(data.data) == typeof([]) && data.data[0] && data.data.length ){
												data.label = JSON.stringify(data.data[0]);
											}
										}
										// instance.fields[fieldName];
									}
								}

							}
							// contentsElements
							for( var bowlName in result.bowl ){
								for( var fieldName in result.bowl[bowlName].fields ){
									for( var idx in result.bowl[bowlName].fields[fieldName] ){
										parseModuleRecursive('/bowl.'+bowlName+'/fields.'+fieldName+'@'+idx, result.bowl[bowlName].fields[fieldName][idx]);
									}
								}
							}

							// console.log('=-=-=-=-=-=');
							// console.log(contentsElements);
							it1.next(data);
						}
					);
				} ,

				function( it1, data ){
					broccoli.lightbox( function( lbElm ){
						$(lbElm).addClass('broccoli__lightbox-inner--edit-window-mode');
						$findWindow = $(lbElm);
						$findWindow.html('').append( broccoli.bindEjs(tplFrame, {'lb':broccoli.lb}) );

						$findWindow.find('.broccoli__find-window-btn-cancel').removeAttr('disabled').on('click', function(){
							broccoli.closeLightbox( function(){} );
						});
						it1.next(data);
					} );
				} ,
				function( it1, data ){
					$elmResult = $findWindow.find('.broccoli__find-window-result');
					it1.next(data);
				} ,
				function( it1, data ){
					var $keywordForm = $findWindow.find('input[name=search-keyword]');
					$keywordForm.on('change keyup', function(){
						clearTimeout(timerFormWatcher);
						timerFormWatcher = setTimeout(function(){
							var keyword = $keywordForm.val();
							if( !keyword.length ){
								$elmResult.html('');
								return;
							}
							// alert(keyword);
							searchInstance(keyword);
						}, 100);
					});
					it1.next(data);
				}
			]
		);
		return this;
	}

	/**
	 * 検索を実行する
	 */
	function searchInstance(keyword){
		$elmResult.html('');
		for( var idx in contentsElements ){
			var instance = contentsElements[idx];
			if( !instance.content.match(keyword) ){
				continue;
			}

			var $instance = $('<a>');
			$instance.text(instance.label);
			$instance.attr({
				'href':'javascript:;',
				'data-broccoli-instance-path': instance.instancePath
			});
			$instance.on('click', function(){
				var instancePath = $(this).attr('data-broccoli-instance-path');
				// alert(instancePath);
				broccoli.selectInstance(instancePath);
				broccoli.focusInstance(instancePath);
				broccoli.instanceTreeView.focusInstance(instancePath);
			});
			$elmResult.append($instance);
		}
	}

	return;
}