/**
 * insertWindow.js
 */
module.exports = function(broccoli){
	if(!window){ return false; }

	var _this = this;

	var it79 = require('iterate79');
	var php = require('phpjs');
	var $ = require('jquery');

	var $insertWindow;

	var moduleList = {};

	var hasParents = {};
	var hasSystemParents = {};
	var childrenIndex = {};

	var modulePaletteCondition = {};
	var instanceInsertTo;
	var latestCallback;



	/**
	 * 初期化
	 */
	this.init = function(instancePath, elmInsertWindow, callback){
		try{
			modulePaletteCondition = JSON.parse( broccoli.getBootupInfomations().userData.modPaletteCondition );
		}catch(e){
			console.error(e);
		}
		if( !modulePaletteCondition ){
			modulePaletteCondition = {};
		}
		if( !modulePaletteCondition.cond ){
			modulePaletteCondition.cond = {};
		}

		var tplFrame = ''
			+ '<div class="broccoli__insert-window">'
			+ '<p>' + broccoli.lb.get('ui_message.please_select_a_module_to_insert') + '</p>'
			+ '<div class="broccoli__insert-window-body"></div>'
			+ '</div>'
		;

		if( !instancePath || !elmInsertWindow ){
			callback(false);
			return;
		}

		instanceInsertTo = instancePath;
		$insertWindow = $(elmInsertWindow);
		$insertWindow.html(tplFrame);
		latestCallback = callback || function(){};

		$insertWindow.find('.px2-btn').on('click', function(){
			latestCallback(false);
		});

		var $insertWindowBody = $insertWindow.find('.broccoli__insert-window-body');

		it79.fnc(
			{},
			[
				function(it1, data){
					// モジュールパッケージの一覧を取得
					moduleList = broccoli.getBootupInfomations().modulePackageList;
					it1.next(data);
				} ,
				function(it1, data){
					// モジュールパッケージの親子関係を抽出
					for(var pkgId in moduleList){
						var pkg = moduleList[pkgId];
						for( var catId in pkg.categories ){
							var cat = pkg.categories[catId];
							for( var modId in cat.modules ){
								var mod = cat.modules[modId];
								try{
									if(mod.moduleInfo.enabledParents.length){
										// 親の制約がある場合
										hasParents[mod.moduleId] = true;
										for( var idx in mod.moduleInfo.enabledParents ){
											var parentModId = mod.moduleInfo.enabledParents[idx];
											var parsedParentModuleId = broccoli.parseModuleId(parentModId);
											childrenIndex[parentModId] = childrenIndex[parentModId] || {};
											childrenIndex[parentModId][mod.moduleId] = mod;

											if( parentModId.match(/^_sys\//) ){
												hasSystemParents[mod.moduleId] = true;
											}
										}
									}
								}catch(e){
								}

								for( var fieldName in mod.moduleInfo.interface ){
									var field = mod.moduleInfo.interface[fieldName];
									if(field.fieldType == 'module'){
										try{
											if(field.enabledChildren.length){
												// 子の制約がある場合
												childrenIndex[mod.moduleId] = childrenIndex[mod.moduleId] || {};
												for(var idx in field.enabledChildren){
													var parsedModuleId = broccoli.parseModuleId(field.enabledChildren[idx]);
													childrenIndex[mod.moduleId][field.enabledChildren[idx]] = moduleList[parsedModuleId.package].categories[parsedModuleId.category].modules[parsedModuleId.module];
												}
											}
										}catch(e){
										}
			
									}
								}
							}
						}
					}
					it1.next(data);
				} ,
				function(it1, data){
					$insertWindowBody
						.html('loading...')
					;
					data.$ul = $('<ul class="broccoli__insert-window-list">');
					setTimeout(function(){
						it1.next(data);
					}, 10);
				} ,
				function(it1, data){
					// パッケージの階層を描画
					it79.ary(
						moduleList ,
						function(it2, pkg, packageId){
							if( pkg.hidden || pkg.deprecated ){
								// 非推奨のパッケージは非表示
								it2.next();
								return;
							}

							var isOpened = true;
							try{
								if( modulePaletteCondition.cond[packageId] == 'closed' ){
									isOpened = false;
								}
							}catch(e){}

							var $li = $('<li>');
							var $ulCat = $('<ul>');
							var $a = $('<a class="broccoli__insert-window__buttongroups">')
								.append( $('<span>').text( pkg.packageName ) )
								.attr({
									'href':'javascript:;',
									'data-broccoli-module-package-id': packageId
								})
								.on('click', function(){
									var $pkgId = $(this).attr('data-broccoli-module-package-id');
									$(this).toggleClass('broccoli__insert-window__buttongroups--closed');
									$ulCat.toggle(100);
									return false;
								})
							;
							if( !isOpened ){
								$a.addClass('broccoli__insert-window__buttongroups--closed');
								$ulCat.hide(0);
							}
							$li.append( $a );

							drawCategories(
								packageId,
								pkg.categories,
								$ulCat,
								function(){
									$li.append($ulCat);
									data.$ul.append( $li );
									it2.next();
								}
							);
						} ,
						function(){
							it1.next(data);
						}
					);
				} ,
				function(it1, data){
					$insertWindowBody.html('').append(data.$ul);
				},
			]
		);

		return;
	}


	// カテゴリの階層を描画
	function drawCategories(packageId, categories, $ul, callback){
		it79.ary(
			categories ,
			function(it1, category, categoryId){
				if( category.hidden || category.deprecated ){
					// 非推奨のカテゴリは非表示
					it1.next();return;
				}

				var isOpened = true;
				try{
					if( modulePaletteCondition.cond[packageId + ':' + categoryId] == 'closed' ){
						isOpened = false;
					}
				}catch(e){}

				var $liCat = $('<li>');
				var $ulMod = $('<ul>');
				var $a = $('<a class="broccoli__insert-window__buttongroups">')
					.append( $('<span>').text(category.categoryName)  )
					.attr({
						'href':'javascript:;',
						'data-broccoli-module-category-id': packageId + ':' + categoryId
					})
					.on('click', function(){
						var $categoryId = $(this).attr('data-broccoli-module-category-id');
						$(this).toggleClass('broccoli__insert-window__buttongroups--closed');
						$ulMod.toggle(100)
					})
				;
				if( !isOpened ){
					$a.addClass('broccoli__insert-window__buttongroups--closed');
					$ulMod.hide(0);
				}
				$liCat.append( $a );
				$ul.append( $liCat );

				drawModules(
					packageId,
					categoryId,
					category.modules,
					$ulMod,
					function(){
						$liCat.append($ulMod);
						it1.next();
					}
				);
			} ,
			function(){
				callback();
			}
		);
		return;
	}

	// モジュールの階層を描画
	function drawModules(packageId, categoryId, modules, $ul, callback){
		it79.ary(
			modules ,
			function(it1, mod, moduleId){
				if( mod.hidden || mod.deprecated ){
					// 非推奨のモジュールは非表示
					it1.next();
					return;
				}
				if( hasParents[mod.moduleId] && !hasSystemParents[mod.moduleId] ){
					// 親指定を持っている場合は非表示
					it1.next();
					return;
				}
				var $liMod = $('<li>');
				$liMod.append( generateModuleButton(mod) );
				$ul.append( $liMod );

				// 子モジュールを追加
				appendModuleChildren($ul, mod);

				it1.next();
			} ,
			function(){
				callback();
			}
		);
		return;
	}

	/**
	 * モジュールのボタンを生成する
	 */
	function generateModuleButton( mod, depth ){
		depth = depth || 0;
		var $button = $('<div class="broccoli__insert-window__module">');
		if(depth){
			$button.addClass('broccoli__insert-window__module-children');
		}
		$button
			.html((function(d){
				var rtn = '';
				var label = d.moduleName;
				var thumb = null;
				if(d.thumb){
					thumb = d.thumb;
				}
				if(thumb){
					rtn += '<span class="broccoli__insert-window__module-thumb"><img src="'+php.htmlspecialchars( thumb )+'" alt="'+php.htmlspecialchars( label )+'" /></span>';
				}else{
					rtn += '<span class="broccoli__insert-window__module-thumb"><img src="'+php.htmlspecialchars( broccoli.images["module-default-icon"] )+'" alt="" /></span>';
				}
				rtn += '<span class="broccoli__insert-window__module-label">'+php.htmlspecialchars( label )+'</span>';
				rtn += '<span class="broccoli__insert-window__module-button"><button type="button" class="px2-btn px2-btn--primary">'+broccoli.lb.get('ui_label.insert')+'</button></span>';
				return rtn;
			})(mod))
		;
		$button.find('button')
			.attr({
				'data-id': mod.moduleId,
				'data-internal-id': mod.moduleInternalId,
				'data-name': mod.moduleName,
				// 'data-readme': mod.readme,
				'data-clip': JSON.stringify(mod.clip),
				'data-insert-instance-to': instanceInsertTo,
				'href': 'javascript:;'
			})
			.on('click', function(e){
				var $this = $(this);
				var modId = $this.attr('data-id');
				var modInternalId = $this.attr('data-internal-id');
				var moveTo = $this.attr('data-insert-instance-to');
				var modClip = $this.attr('data-clip');
				try {
					modClip = JSON.parse(modClip);
				} catch (e) {
					modClip = false;
				}
				$this.addClass('broccoli__insert-window__module-selected');
				lock();

				if( modClip ){
					var parsedModId = broccoli.parseModuleId(modId);
					var newInstancePath = moveTo;

					broccoli.gpi(
						'getClipModuleContents',
						{
							'moduleId': modId,
							'resourceMode': 'temporaryHash',
						} ,
						function(resultData){
							var clipContents = resultData.clipContents;

							it79.ary(
								clipContents.data ,
								function(it1, row1, idx1){
									broccoli.contentsSourceData.duplicateInstance(clipContents.data[idx1], clipContents.resources, {'supplementModPackage': parsedModId.package}, function(newData){

										broccoli.contentsSourceData.addInstance( newData, moveTo, function(result){
											// 上から順番に挿入していくので、
											// moveTo を1つインクリメントしなければいけない。
											// (そうしないと、天地逆さまに積み上げられることになる。)
											moveTo = broccoli.incrementInstancePath(moveTo);
											it1.next();
										} );

									});
								} ,
								function(){
									broccoli.gpi(
										'replaceClipModuleResources',
										{
											'moduleId': modId,
										} ,
										function(resultData){
											var affectedResources = resultData.affectedResources;
											broccoli.resourceMgr.getResourceDb(function(tmpResourceDb){
												for( var resKey in affectedResources ){
													tmpResourceDb[resKey] = affectedResources[resKey];
												}
												broccoli.resourceMgr.setResourceDb(tmpResourceDb, function(result){
													broccoli.unselectInstance(function(){
														broccoli.saveContents(function(){
															broccoli.message(broccoli.lb.get('ui_message.insert_clip_data_done')); // クリップを挿入しました。
															broccoli.redraw(function(){
																broccoli.closeProgress(function(){
																	broccoli.selectInstance(newInstancePath, function(){
																		unlock();
																		latestCallback(true);
																	});
																});
															});
														});
													});
												});
											});

										}
									);
								}
							);

						}
					);

					return;
				}

				broccoli.progress(function(){

					broccoli.contentsSourceData.addInstance( modInternalId, moveTo, function(result){
						if(!result){
							console.error('Failed addInstance()', modInternalId, moveTo);
							broccoli.closeProgress(function(){
								unlock();
								latestCallback(false);
							});
							return;
						}

						// コンテンツを保存
						broccoli.unselectInstance(function(){
							broccoli.saveContents(function(){
								// alert('インスタンスを追加しました。');
								broccoli.redraw(function(){
									broccoli.closeProgress(function(){
										broccoli.selectInstance(moveTo, function(){
											unlock();
											latestCallback(true);
										});
									});
								});
							});
						});
					} );

				});
				return;
			})
		;
		return $button;
	}

	/**
	 * モジュールに、子の関係に当たるモジュール群を追記する
	 */
	function appendModuleChildren($ul, mod, depth, previouslies){
		previouslies = previouslies || {};
		if(!childrenIndex[mod.moduleId]){
			// 子の関係に当たるモジュールが1つもない
			return;
		}
		if(previouslies[mod.moduleId]){
			// 既出
			return;
		}
		previouslies[mod.moduleId] = true;
		depth = depth || 0;
		for(var modId in childrenIndex[mod.moduleId]){
			var $liMod = $('<li>');
			$liMod.append( generateModuleButton(childrenIndex[mod.moduleId][modId], depth + 1) );
			$ul.append( $liMod );

			// 再帰処理
			appendModuleChildren($ul, childrenIndex[mod.moduleId][modId], depth + 1, previouslies);
		}
		return;
	}

	function lock(){
		broccoli.px2style.loading();
		$insertWindow.find('a, button').attr({
			'disabled': true,
		});
	}
	function unlock(){
		$insertWindow.find('a, button').removeAttr('disabled');
		broccoli.px2style.closeLoading();
	}

	return;
}
