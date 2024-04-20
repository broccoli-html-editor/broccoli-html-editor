/**
 * findWindow.js
 */
module.exports = function(broccoli){
	if(!window){ return false; }

	var _this = this;

	var KeywordMarker = require('@tomk79/keywordmarker').default;
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
	var gotoInstancePath;
	var selectedInstancePath;
	var origInstancePath;

	var $selectBtn;

	/**
	 * 初期化
	 */
	this.init = function(){
		contentsElements = []; // クリア
		origInstancePath = broccoli.getSelectedInstance();
		gotoInstancePath = origInstancePath;
		selectedInstancePath = null;

		$selectBtn = $('<button class="px2-btn px2-btn--primary">');

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
								data.label = '';
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
												data.content += data2text(instance.fields[fieldName]);
											}

											data.label = data.content;
											if( typeof(data.data) == typeof('') ){
												data.label = data.data;
											}else if( typeof(data.data) == typeof({}) && data.data.src ){
												data.label = data.data.src;
											}else if( typeof(data.data) == typeof([]) && data.data[0] && data.data.length ){
												data.label = data2text(data.data[0]);
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
						'buttons': [
							$selectBtn
								.text(broccoli.lb.get('ui_label.select'))
								.prop({'disabled': true})
								.on('click', function(){
									gotoInstancePath = selectedInstancePath;
									broccoli.px2style.closeModal();
								})
						],
						'buttonsSecondary': [
							$('<button class="px2-btn">')
								.text(broccoli.lb.get('ui_label.cancel'))
								.on('click', function(){
									gotoInstancePath = origInstancePath;
									broccoli.px2style.closeModal();
								})
						],
						'onclose': function(){
							if( gotoInstancePath ){
								setTimeout(function(){
									broccoli.selectInstance(gotoInstancePath, function(){
										broccoli.focusInstance(gotoInstancePath, function(){
											broccoli.instanceTreeView.focusInstance(gotoInstancePath, function(){
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
		let $ul = null;
		for( var idx in contentsElements ){
			var instance = contentsElements[idx];
			if( !instance.content.match(keyword) ){
				continue;
			}

			if( !$ul ){
				$ul = $('<ul>');
				$elmResult.append($ul);
			}

			var $li = $('<li>');
			var $instance = $('<a>');
			$instance
				.html(`
					<p class="broccoli__find-window-result-title">${KeywordMarker(instance.label, keyword)}</p>
					<p class="broccoli__find-window-result-content">${KeywordMarker(instance.content, keyword)}</p>
				`)
				.attr({
					'href':'javascript:;',
					'data-broccoli-instance-path': instance.instancePath
				})
				.on('click', function(){
					$selectBtn.prop({disabled: false});
					var instancePath = $(this).attr('data-broccoli-instance-path');
					selectedInstancePath = instancePath;
					broccoli.selectInstance(selectedInstancePath, function(){
						broccoli.focusInstance(selectedInstancePath, function(){
							broccoli.instanceTreeView.focusInstance(selectedInstancePath, function(){
							});
						});
					});
				})
				.on('dblclick', function(){
					$selectBtn.prop({disabled: false});
					var instancePath = $(this).attr('data-broccoli-instance-path');
					gotoInstancePath = instancePath;
					broccoli.px2style.closeModal();
				})
			;
			$ul.append($li.append($instance));
		}
		if( !$ul ){
			var $notfound = `<div class="broccoli__find-window-result-notfound">Not found.</div>`;
			$elmResult.append($notfound);
		}
	}


	function data2text(data){
		if( typeof(data) == typeof('string') ){
			return data;
		}
		if( typeof(data) == typeof({}) ){
			var keys = Object.keys(data);
			var rtn = [];
			keys.forEach((key)=>{
				rtn.push(data2text(data[key]));
			});
			return rtn.join(' ');
		}

		return JSON.stringify(data);
	}

	return;
}
