/**
 * drawModulePalette.js
 */
module.exports = function(broccoli, targetElm, callback){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ callback(); return false; } // client side only
	// console.log(moduleList);
	// console.log(targetElm);

	var _this = this;
	callback = callback || function(){};
	var moduleList = {};

	var it79 = require('iterate79');
	var php = require('phpjs');
	var $ = require('jquery');

	var hasParents = {};
	var hasSystemParents = {};
	var childrenIndex = {};

	var modulePaletteCondition = {};
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
				var $a = $('<a class="broccoli__module-palette__buttongroups">')
					.append( $('<span>').text(category.categoryName)  )
					.attr({
						'href':'javascript:;',
						'data-broccoli-module-category-id': packageId + ':' + categoryId,
						'draggable': false,
					})
					.on('click', function(){
						var $categoryId = $(this).attr('data-broccoli-module-category-id');
						$(this).toggleClass('broccoli__module-palette__buttongroups--closed');
						$ulMod.toggle(100)
						if( $(this).hasClass('broccoli__module-palette__buttongroups--closed') ){
							saveModPaletteCondition($categoryId, 'closed');
						}else{
							saveModPaletteCondition($categoryId, 'opened');
						}
					})
				;
				if( !isOpened ){
					$a.addClass('broccoli__module-palette__buttongroups--closed');
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
		// var timerTouchStart;
		// var isTouchStartHold = false;

		depth = depth || 0;
		var $button = $('<a class="broccoli__module-palette__draggablebutton">');
		if(depth){
			$button.addClass('broccoli__module-palette__draggablebutton-children');
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
					rtn += '<span class="broccoli__module-palette__draggablebutton-thumb"><img src="'+php.htmlspecialchars( thumb )+'" alt="'+php.htmlspecialchars( label )+'" /></span>';
				}else{
					rtn += '<span class="broccoli__module-palette__draggablebutton-thumb"><img src="'+php.htmlspecialchars( broccoli.images["module-default-icon"] )+'" alt="" /></span>';
				}
				rtn += '<span class="broccoli__module-palette__draggablebutton-label">'+php.htmlspecialchars( label )+'</span>';
				return rtn;
			})(mod))
			.attr({
				// 'title': (function(d){
				// 	return (d.moduleName ? d.moduleName+' ('+d.moduleId+')' : d.moduleId);
				// })(mod),
				'data-id': mod.moduleId,
				'data-internal-id': mod.moduleInternalId,
				'data-name': mod.moduleName,
				'data-readme': mod.readme,
				'data-clip': JSON.stringify(mod.clip),
				'draggable': true, //←HTML5のAPI http://www.htmq.com/dnd/
				'href': 'javascript:;'
			})
			.on('dragstart', function(e){
				var $this = $(this);
				updateModuleInfoPreview(null, {'elm': this}, function(){
					// console.log(e);
					var event = e.originalEvent;
					// px.message( $(this).data('id') );
					var transferData = {
						'method': 'add',
						'modId': $this.attr('data-id'),
						'modInternalId': $this.attr('data-internal-id'),
						'modClip': $this.attr('data-clip'),
					};
					event.dataTransfer.setData('text/json', JSON.stringify(transferData) );
				});
			})
			.on('dragover', function(e){
				updateModuleInfoPreview(null, {'elm': this}, function(){});
			})
			.on('mouseover', function(e){
				var htmlBody = generateModuleInfoHtml(this);
				var $heading = $('<p>')
					.text( $(this).attr('data-name') || $(this).attr('data-id') )
					.css({
						'font-size': '160%',
						'font-weight': 'bold',
						'margin': '0',
					});
				var html = $heading.prop('outerHTML') + htmlBody;
				updateModuleInfoPreview(html, {'elm': this}, function(){});
			})
			.on('mouseout', function(e){
				updateModuleInfoPreview(null, {'elm': this}, function(){});
			})
			.on('dblclick', function(e){
				e.preventDefault();
				e.stopPropagation();
				var $this = $(this);
				var html = generateModuleInfoHtml(this);
				var $html = $(html);
				var moduleId = $this.attr('data-id');

				// モジュールの詳細な情報を取得
				broccoli.gpi(
					'getModule',
					{
						'moduleId': moduleId
					} ,
					function(result){

						var $pics = $html.find('.broccoli--module-info-content-pics');
						var pics = result.pics;
						if( !pics.length ){
							$pics.remove();
						}else{
							var html = '';
							html += '<p>参考イメージ</p>';
							html += '<ul>';
							for( var idx in pics ){
								html += '<li><img src="'+ pics[idx] +'" /></li>';
							}
							html += '</ul>';
							$pics.append(html);
						}
						var $readme = $html.find('.broccoli__module-readme');
						if( result.readme ){
							$readme.html(result.readme);
							$this.attr({'data-readme': result.readme});
						}

						broccoli.px2style.modal({
							'title': result.name || moduleId,
							'width': 780,
							'body': $html,
						});

					}
				);
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

	/**
	 * モジュール情報のHTMLを生成する
	 */
	function generateModuleInfoHtml(elm){
		var $elm = $(elm);
		var html = '';
		var $img = $elm.find('img').eq(0);
		html += '<article class="broccoli broccoli--module-info-content">';
		if( $img.length ){
			html += '<div class="broccoli--module-info-content-thumb"><img src="'+$img.attr('src')+'" /></div>';
		}
		html += '<div class="broccoli--module-info-content-readme"><article class="broccoli__module-readme"></article></div>';
		html += '<div class="broccoli--module-info-content-pics"></div>';
		html += '<p class="broccoli--module-info-content-id"></p>';
		html += '</article>';

		var $html = $('<div>');
		$html.html(html);
		$html.find('h1.broccoli--module-info-content-h1').text($elm.attr('data-name'));
		$html.find('.broccoli--module-info-content-id').text('Module ID: ' + $elm.attr('data-internal-id'));
		if( $elm.attr('data-clip') == 'true' ){
			$html.find('.broccoli--module-info-content-id').append(
				$('<img />')
					.attr({
						'src': broccoli.images["clip"],
					})
					.css({
						'height': '1.2em',
						'margin-left': '10px',
					})
			);
		}
		var readme = $elm.attr('data-readme');
		$html.find('.broccoli__module-readme').html((readme ? readme : '<p style="text-align:center; padding: 100px 0; margin: 0 auto;">-- no readme --</p>' ));

		return $html.html();
	}

	/**
	 * モジュール情報プレビューを更新する
	 */
	function updateModuleInfoPreview($html, options, callback){
		callback = callback||function(){};
		var $body = $('body');
		$body.find('.broccoli--module-info-preview').remove();
		if( $(window).height() < 400 || $(window).width() < 400 ){
			// Window が小さすぎたら表示しない
			callback();
			return;
		}
		if( $html === null ){
			callback();
			return;
		}
		var $preview = $('<div class="broccoli broccoli--module-info-preview">');
		$preview.append( $html );
		$preview.on('mouseover dragover', function(e){
			$(this).remove();
		});

		$body
			.append( $preview )
		;
		if( options.elm ){
			var $elm = $(options.elm);
			var elmOffset = $elm.offset();
			var left = elmOffset.left - $preview.outerWidth() - 10;
			var top = elmOffset.top - 10;
			if( top < 10 ){ top = 10; }
			if( $(window).height()-(top+$preview.outerHeight()) < 10 ){ top = $(window).height()-($preview.outerHeight()) - 10; }
			$preview.css({
				'left': left,
				'top': top
			});
		}
		callback();
		return;
	}


	/**
	 * モジュールパレットのコンディション情報を更新する
	 */
	function saveModPaletteCondition(packageId, openedOrClosed, callback){
		callback = callback || function(){}
		if( !modulePaletteCondition ){
			modulePaletteCondition = {};
		}
		if( !modulePaletteCondition.cond ){
			modulePaletteCondition.cond = {};
		}
		modulePaletteCondition.cond[packageId] = openedOrClosed;

		broccoli.gpi(
			'saveUserData',
			{
				'modPaletteCondition': JSON.stringify(modulePaletteCondition)
			},
			function(){
				callback();
			}
		);
		return;
	}


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
				$(targetElm)
					.html('loading...')
					.removeClass('broccoli')
					.addClass('broccoli')
					.addClass(`broccoli--appearance-${broccoli.options.appearance}`)
					.removeClass('broccoli__module-palette').addClass('broccoli__module-palette')
				;
				data.$ul = $('<ul class="broccoli__module-palette-list">');
				it1.next(data);
			} ,
			function(it1, data){
				// パッケージの階層を描画
				it79.ary(
					moduleList ,
					function(it2, pkg, packageId){
						if( pkg.hidden || pkg.deprecated ){
							// 非推奨のパッケージは非表示
							it2.next();return;
						}

						var isOpened = true;
						try{
							if( modulePaletteCondition.cond[packageId] == 'closed' ){
								isOpened = false;
							}
						}catch(e){}

						var $li = $('<li>');
						var $ulCat = $('<ul>');
						var $a = $('<a class="broccoli__module-palette__buttongroups">')
							.append( $('<span>').text( pkg.packageName ) )
							.attr({
								'href':'javascript:;',
								'data-broccoli-module-package-id': packageId,
								'draggable': false,
							})
							.on('click', function(){
								var $pkgId = $(this).attr('data-broccoli-module-package-id');
								$(this).toggleClass('broccoli__module-palette__buttongroups--closed');
								$ulCat.toggle(100);
								if( $(this).hasClass('broccoli__module-palette__buttongroups--closed') ){
									saveModPaletteCondition($pkgId, 'closed');
								}else{
									saveModPaletteCondition($pkgId, 'opened');
								}
								return false;
							})
						;
						if( !isOpened ){
							$a.addClass('broccoli__module-palette__buttongroups--closed');
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
				// フィルター機能をセットアップ
				var html = '';
				var changeTimer;
				var lastKeyword = '';

				html += '<div class="broccoli__module-palette-inner">';
				html += '<div class="broccoli__module-palette-filter"><input type="search" placeholder="filter..." class="px2-input" style="width:100%;" /></div>';
				html += '</div>';
				$wrap = $(html);
				$wrap.append(data.$ul);

				$(targetElm).html('').append($wrap);

				function onChange(){
					// フィルター機能
					var keyword = $(this).val();
					if( lastKeyword == keyword ){ return; }
					lastKeyword = keyword;
					clearTimeout( changeTimer );
					// console.log( keyword );

					$(targetElm).find('a').removeClass('broccoli__module-palette__buttongroups--closed');
					$(targetElm).find('ul').show();

					changeTimer = setTimeout(function(){
						$(targetElm).find('a.broccoli__module-palette__draggablebutton').each(function(){
							var $this = $(this);
							if( $this.attr('data-id').toLowerCase().match( keyword.toLowerCase() ) ){
								$this.show().addClass('broccoli__module-palette__shown-module');
								return;
							}
							if( $this.attr('data-name').toLowerCase().match( keyword.toLowerCase() ) ){
								$this.show().addClass('broccoli__module-palette__shown-module');
								return;
							}
							// if( $this.attr('data-readme') ){
							// }
							$this.hide().removeClass('broccoli__module-palette__shown-module');
						});

						$(targetElm).find('li').each(function(){
							var $this = $(this);
							var $btns = $this.find('a.broccoli__module-palette__draggablebutton.broccoli__module-palette__shown-module');
							if( !$btns.length ){
								$this.css({'display':'none'});
							}else{
								$this.css({'display':'block'});
							}
							return;
						});

					}, 100);

				}
				$(targetElm).find('.broccoli__module-palette-filter input')
					.on( 'change', onChange )
					.on( 'keyup', onChange )
				;

				it1.next(data);
			} ,
			function(it1, data){
				callback();
				it1.next(data);
			}
		]
	);

	return;
}
