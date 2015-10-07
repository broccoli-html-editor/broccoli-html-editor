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
			function(it1, module, moduleId){
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
							rtn += '<img src="'+php.htmlspecialchars( thumb )+'" alt="'+php.htmlspecialchars( label )+'" style="width:40px; margin-right:5px;" />';
						}
						rtn += php.htmlspecialchars( label );
						return rtn;
					})(module))
					.attr({
						'title': module.moduleName,
						'data-id': module.moduleId,
						'draggable': true //←HTML5のAPI http://www.htmq.com/dnd/
					})
					.on('dragstart', function(e){
						// px.message( $(this).data('id') );
						event.dataTransfer.setData('method', 'add' );
						event.dataTransfer.setData('modId', $(this).attr('data-id') );
					})
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

	it79.fnc(
		{},
		[
			function(it1, data){
				broccoli.gpi('getPackageList',{},function(list){
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
				data.$ul = $('<ul>');
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
				$(targetElm).html('').append(data.$ul);

				callback();
				it1.next(data);
			}
		]
	);

	return;
}
