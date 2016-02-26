/**
 * drawModulePalette.js
 */
module.exports = function(broccoli, callback){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ callback(); return false; } // client side only
	var targetElm = broccoli.options.elmModulePalette;
	// console.log(moduleList);
	// console.log(targetElm);

	var _this = this;
	callback = callback || function(){};
	var moduleList = {};

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var twig = require('twig');
	var $ = require('jquery');

	// カテゴリの階層を描画
	function drawCategories(categories, $ul, callback){
		it79.ary(
			categories ,
			function(it1, category, categoryId){
				var $liCat = $('<li>');
				var $ulMod = $('<ul>');
				$liCat.append( $('<a>')
					.text(category.categoryName)
					.attr({'href':'javascript:;'})
					.click(function(){
						$(this).toggleClass('broccoli--module-palette__closed');
						$ulMod.toggle(100)
					})
				);
				$ul.append( $liCat );

				drawModules(
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
	function drawModules(modules, $ul, callback){
		it79.ary(
			modules ,
			function(it1, mod, moduleId){
				var $liMod = $('<li>');
				$liMod.append( $('<button>')
					.html((function(d){
						var rtn = '';
						var label = d.moduleName;
						var thumb = null;
						if(d.thumb){
							thumb = d.thumb;
						}
						if(thumb){
							rtn += '<img src="'+php.htmlspecialchars( thumb )+'" alt="'+php.htmlspecialchars( label )+'" style="width:35px; margin-right:5px;" />';
						}
						rtn += php.htmlspecialchars( label );
						return rtn;
					})(mod))
					.attr({
						// 'title': (function(d){
						// 	return (d.moduleName ? d.moduleName+' ('+d.moduleId+')' : d.moduleId);
						// })(mod),
						'data-id': mod.moduleId,
						'data-name': mod.moduleName,
						'data-readme': mod.readme,
						'data-clip': JSON.stringify(mod.clip),
						'data-pics': JSON.stringify(mod.pics),
						'draggable': true //←HTML5のAPI http://www.htmq.com/dnd/
					})
					.on('dragstart', function(e){
						// px.message( $(this).data('id') );
						event.dataTransfer.setData('method', 'add' );
						event.dataTransfer.setData('modId', $(this).attr('data-id') );
						event.dataTransfer.setData('modClip', $(this).attr('data-clip') );
						updateModuleInfoPreview(null, {'elm': this}, function(){});
					})
					.on('mouseover', function(e){
						var html = generateModuleInfoHtml(this);
						updateModuleInfoPreview(html, {'elm': this}, function(){});
					})
					.on('mouseout', function(e){
						updateModuleInfoPreview(null, {'elm': this}, function(){});
					})
					.on('dblclick', function(e){
						var html = generateModuleInfoHtml(this);
						broccoli.lightbox(function(elm){
							$(elm)
								.append(html)
								.append( $('<button class="btn btn-primary btn-block">')
									.text('close')
									.bind('click', function(){
										broccoli.closeLightbox();
									})
								)
							;
						});
					})
					// .tooltip({'placement':'left'})
				);
				$ul.append( $liMod );

				it1.next();
			} ,
			function(){
				callback();
			}
		);
		return;
	}

	/**
	 * モジュール情報のHTMLを生成する
	 */
	function generateModuleInfoHtml(elm){
		var $elm = $(elm);
		var html = '';
		var $img = $elm.find('img').eq(0);
		html += '<article class="broccoli--module-info-content">';
		if( $img.size() ){
			html += '<div class="broccoli--module-info-content-thumb"><img src="'+$img.attr('src')+'" /></div>';
		}
		html += '<h1 class="broccoli__user-selectable">'+$elm.attr('data-name')+'</h1>';
		html += '<p class="broccoli__user-selectable">'+$elm.attr('data-id')+'</p>';
		html += '<hr />';
		var readme = $elm.attr('data-readme');
		var $readme = $('<div>'+readme+'</div>')
		$readme.find('a').each(function(){
			$(this).attr({'target':'_blank'})
		});
		html += '<div class="broccoli__user-selectable">'+ (readme ? $readme.html() : '<p style="text-align:center; margin: 100px auto;">-- no readme --</p>' ) +'</div>';

		var pics = JSON.parse( $elm.attr('data-pics') );
		if( pics.length ){
			// html += '<hr />';
			html += '<div class="broccoli--module-info-content-pics">';
			html += '<p>参考イメージ</p>';
			html += '<ul>';
			for( var idx in pics ){
				// console.log(pics[idx]);
				html += '<li><img src="'+ pics[idx] +'" /></li>';
			}
			html += '</ul>';
			html += '</div>';
		}
		html += '<hr />';
		html += '</article>';
		return html;
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
			return this;
		}
		if( $html === null ){
			callback();
			return this;
		}
		var $preview = $('<div class="broccoli broccoli--module-info-preview">');
		$preview.append( $html );

		$body
			.append( $preview )
		;
		if( options.elm ){
			var $elm = $(options.elm);
			var elmOffset = $elm.offset();
			// console.log($elm.offset().top);
			// console.log($elm.offset().left);
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
		return this;
	}


	it79.fnc(
		{},
		[
			function(it1, data){
				broccoli.gpi('getModulePackageList',{},function(list){
					moduleList = list;
					it1.next(data);
				});
			} ,
			function(it1, data){
				$(targetElm)
					.html('loading...')
					.removeClass('broccoli').addClass('broccoli')
					.removeClass('broccoli--module-palette').addClass('broccoli--module-palette')
				;
				data.$ul = $('<ul class="broccoli--module-palette-list">');
				it1.next(data);
			} ,
			function(it1, data){
				// パッケージの階層を描画
				it79.ary(
					moduleList ,
					function(it2, pkg, packageId){
						var $li = $('<li>');
						var $ulCat = $('<ul>');
						$li.append( $('<a>')
							.text( pkg.packageName )
							.attr({'href':'javascript:;'})
							.click(function(){
								$(this).toggleClass('broccoli--module-palette__closed');
								$ulCat.toggle(100)
							})
						);

						drawCategories(
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
				var html = '';
				var changeTimer;
				var lastKeyword = '';

				html += '<div class="broccoli--module-palette-inner">';
				html += '<div class="broccoli--module-palette-filter"><input type="text" style="width:100%;" placeholder="filter..." /></div>';
				html += '</div>';
				$wrap = $(html);
				$wrap.append(data.$ul);

				$(targetElm).html('').append($wrap);

				function onChange(){
					var keyword = $(this).val();
					if( lastKeyword == keyword ){ return; }
					lastKeyword = keyword;
					clearTimeout( changeTimer );
					// console.log( keyword );

					$(targetElm).find('a').removeClass('broccoli--module-palette__closed');
					$(targetElm).find('ul').show();


					changeTimer = setTimeout(function(){
						$(targetElm).find('button').each(function(){
							var $this = $(this);
							if( $this.attr('data-id').toLowerCase().match( keyword.toLowerCase() ) ){
								$this.show();
								return;
							}
							if( $this.attr('data-name').toLowerCase().match( keyword.toLowerCase() ) ){
								$this.show();
								return;
							}
							// if( $this.attr('data-readme') ){
							// }
							$this.hide();
						});
					}, 100);

				}
				$(targetElm).find('.broccoli--module-palette-filter input')
					.change( onChange )
					.keyup( onChange )
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
