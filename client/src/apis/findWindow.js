/**
 * findWindow.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ return false; }

	var _this = this;

	var it79 = require('iterate79');
	var $ = require('jquery');
	var moduleList = {};
	var contentsElements = [];
	var timerFormWatcher;

	var $findWindow = $('<div>');
	var $elmResult;
	var tplFrame = ''
				+ '<div class="broccoli__find-window">'
				+ '	<div class="broccoli__find-window-search">'
				+ '		<form action="javascript:;">'
				+ '			<input type="search" name="search-keyword" class="px2-input px2-input--block" />'
				+ '		</form>'
				+ '	</div>'
				+ '	<div class="broccoli__find-window-result"></div>'
				+ '</div>'
	;
	var instancePath;

	/**
	 * 初期化
	 */
	this.init = function(){
		// console.log( '=-=-=-=-=-=-=-=-= Initialize EditWindow.' );
		// callback = callback || function(){};

		contentsElements = []; // クリア
		instancePath = broccoli.getSelectedInstance();

		it79.fnc(
			{},
			[
				function( it1, data ){
					// --------------------------------------
					// モジュール定義を整理
					broccoli.gpi(
						'getModulePackageList',
						{},
						function(resultData){
							var tmpAllModuleList = resultData.modulePackageList;

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
						function(resultData){
							var contentsDataJson = resultData.data;
							function parseModuleRecursive(instancePath, instance){
								var data = {};
								data.instancePath = instancePath;
								data.modId = instance.modId;
								data.content = '';
								data.data = null;
								data.label = null;
								contentsElements.push(data);

								var mod = moduleList[instance.modId];

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
									}
								}

							}
							// contentsElements
							for( var bowlName in contentsDataJson.bowl ){
								for( var fieldName in contentsDataJson.bowl[bowlName].fields ){
									for( var idx in contentsDataJson.bowl[bowlName].fields[fieldName] ){
										parseModuleRecursive('/bowl.'+bowlName+'/fields.'+fieldName+'@'+idx, contentsDataJson.bowl[bowlName].fields[fieldName][idx]);
									}
								}
							}

							it1.next(data);
						}
					);
				} ,

				function( it1, data ){

					$findWindow.html('').append( broccoli.bindTwig(tplFrame, {'lb':broccoli.lb}) );

					broccoli.px2style.modal({
						'title': broccoli.lb.get('ui_label.search'),
						'body': $findWindow,
						'buttons': [],
						'buttonsSecondary': [
							$('<button class="px2-btn">')
								.text(broccoli.lb.get('ui_label.cancel'))
								.on('click', function(){
									broccoli.px2style.closeModal();
								})
						],
						'onclose': function(){
							if( instancePath ){
								setTimeout(function(){
									broccoli.selectInstance(instancePath, function(){
										broccoli.instanceTreeView.focusInstance(instancePath, function(){
											broccoli.focusInstance(instancePath, function(){
											});
										});
									});
								}, 200);
							}
						},
					});

					it1.next(data);
				} ,
				function( it1, data ){
					$elmResult = $findWindow.find('.broccoli__find-window-result');
					it1.next(data);
				} ,
				function( it1, data ){
					var $keywordForm = $findWindow.find('input[name=search-keyword]');
					$keywordForm.on('change.broccoli-html-editor keyup.broccoli-html-editor', function(){
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
		return;
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
			$instance
				.text(instance.label)
				.attr({
					'href':'javascript:;',
					'data-broccoli-instance-path': instance.instancePath
				})
				.on('click', function(){
					instancePath = $(this).attr('data-broccoli-instance-path');
					// alert(instancePath);
					broccoli.instanceTreeView.focusInstance(instancePath, function(){
						broccoli.selectInstance(instancePath, function(){
							broccoli.focusInstance(instancePath, function(){
							});
						});
					});
				})
			;
			$elmResult.append($instance);
		}
	}

	return;
}
