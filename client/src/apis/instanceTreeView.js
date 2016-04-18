/**
 * instanceTreeView.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ callback(); return false; }

	var _this = this;

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var twig = require('twig');
	var $ = require('jquery');

	var $instanceTreeView;


	/**
	 * インスタンスツリービューを更新する
	 */
	this.update = function(callback){
		callback = callback||function(){};
		if(!$instanceTreeView){
			callback();
			return this;
		}
		// $instanceTreeView.html('...');
		var $ul = $('<ul>');

		var data = broccoli.contentsSourceData.get();
		// console.log(data);

		function buildInstance(data, parentInstancePath, subModName, callback){
			callback = callback||function(){};
			// console.log(data);
			var mod = broccoli.contentsSourceData.getModule(data.modId, subModName);
			if( mod === false ){
				mod = {
					'id': '_sys/unknown',
					'info': {
						'name': 'Unknown Module'
					}
				}
			}
			// console.log(mod);
			var $ul = $('<ul>')
				.addClass('broccoli--instance-tree-view-fields')
				.css({
					"border":"1px solid #eee"
				})
			;

			it79.ary(
				mod.fields,
				function(it1, row, idx){
					var $li = $('<li>')
						.append(
							$('<span>')
								.text(idx) // ← field name
								.addClass('broccoli--instance-tree-view-fieldname')
						)
					;

					if(row.fieldType == 'input'){
						var fieldDef = broccoli.getFieldDefinition( row.type ); // フィールドタイプ定義を呼び出す
						fieldDef.mkPreviewHtml( data.fields[row.name], mod, function(html){
							$li.append(
								$('<span class="broccoli--instance-tree-view-fieldpreview">')
									.html('<span>'+html+'</span>')
							);
							$ul.append($li);
							it1.next();
						} );
						return;
					}else if(row.fieldType == 'module'){

						it79.ary(
							data.fields[idx] ,
							function(it2, row2, idx2){
								var instancePath = parentInstancePath+'/fields.'+idx+'@'+idx2;
								buildInstance(
									row2,
									instancePath,
									null,
									function($fieldsUl){
										$li.append($fieldsUl);
										it2.next();
									}
								);
								return;
							} ,
							function(){
								var instancePath = parentInstancePath+'/fields.'+idx+'@'+(data.fields[idx]?data.fields[idx].length:0);

								var $appender = $('<div>')
									.text('(+) ここにモジュールをドラッグしてください。')
									.attr({
										'data-broccoli-instance-path':instancePath,
										'data-broccoli-is-appender':'yes',
										'data-broccoli-is-instance-tree-view': 'yes',
										'draggable': false
									})
									.bind('click', function(e){
										e.stopPropagation();
										var $this = $(this);
										var instancePath = $this.attr('data-broccoli-instance-path');
										var selectInstancePath = instancePath;
										// if( $this.attr('data-broccoli-is-appender') == 'yes' ){
										// 	selectInstancePath = php.dirname(instancePath);
										// }
										broccoli.selectInstance( selectInstancePath, function(){
											broccoli.focusInstance( instancePath );
										} );
									})
									.bind('mouseover', function(e){
										e.stopPropagation();
										$(this).addClass('broccoli--panel__hovered')
									})
									.bind('mouseout',function(e){
										$(this).removeClass('broccoli--panel__hovered')
									})
									.append( $('<div>')
										.addClass('broccoli--panel-drop-to-insert-here')
									)
								;
								broccoli.panels.setPanelEventHandlers( $appender );
								$li.append( $appender );
								$ul.append( $li );
								it1.next();
							}
						);
						return;
					}else if(row.fieldType == 'loop'){
						it79.ary(
							data.fields[idx] ,
							function(it2, row2, idx2){
								var instancePath = parentInstancePath+'/fields.'+idx+'@'+idx2;
								buildInstance(
									row2,
									instancePath,
									row.name,
									function($fieldsUl){
										$li.append($fieldsUl);
										it2.next();
									}
								);
								return;
							} ,
							function(){
								var instancePath = parentInstancePath+'/fields.'+idx+'@'+(data.fields[idx]?data.fields[idx].length:0);

								var $appender = $('<div>')
									.text('ここをダブルクリックして配列要素を追加してください。')
									.attr({
										'data-broccoli-instance-path':instancePath,
										'data-broccoli-mod-id': mod.id,
										'data-broccoli-sub-mod-name': row.name,
										'data-broccoli-is-appender':'yes',
										'data-broccoli-is-instance-tree-view': 'yes',
										'draggable': false
									})
									.bind('click', function(e){
										e.stopPropagation();
										var $this = $(this);
										var instancePath = $this.attr('data-broccoli-instance-path');
										var selectInstancePath = instancePath;
										// if( $this.attr('data-broccoli-is-appender') == 'yes' ){
										// 	selectInstancePath = php.dirname(instancePath);
										// }
										broccoli.selectInstance( selectInstancePath, function(){
											broccoli.focusInstance( instancePath );
										} );
									})
									.bind('mouseover', function(e){
										e.stopPropagation();
										$(this).addClass('broccoli--panel__hovered')
									})
									.bind('mouseout',function(e){
										$(this).removeClass('broccoli--panel__hovered')
									})
									.append( $('<div>')
										.addClass('broccoli--panel-drop-to-insert-here')
									)
								;
								broccoli.panels.setPanelEventHandlers( $appender );
								$li.append( $appender );
								$ul.append($li);
								it1.next();
							}
						);
						return;
					}
					it1.next();
					return;
				} ,
				function(){
					var $rtn = $('<div>')
						.append(
							$('<span>')
								.text(mod.info.name||mod.id) // ← module name
								.addClass('broccoli--instance-tree-view-modulename')
						)
						.css({
							// "border":"1px solid #666"
						})
						.attr({
							'data-broccoli-instance-path': parentInstancePath,
							'data-broccoli-sub-mod-name': subModName,
							'data-broccoli-is-instance-tree-view': 'yes',
							'draggable': true
						})
						// .bind('dragover', function(e){
						// 	e.stopPropagation();
						// 	var instancePath = $this.attr('data-broccoli-instance-path');
						// 	// if( $this.attr('data-broccoli-is-appender') == 'yes' ){
						// 	// 	instancePath = php.dirname(instancePath);
						// 	// }
						// 	broccoli.focusInstance( instancePath );
						// })
						.bind('click', function(e){
							e.stopPropagation();
							var $this = $(this);
							var instancePath = $this.attr('data-broccoli-instance-path');
							// if( $this.attr('data-broccoli-is-appender') == 'yes' ){
							// 	instancePath = php.dirname(instancePath);
							// }
							broccoli.selectInstance( instancePath, function(){
								broccoli.focusInstance( instancePath );
							} );
						})
						.bind('mouseover', function(e){
							e.stopPropagation();
							$(this).addClass('broccoli--panel__hovered')
						})
						.bind('mouseout',function(e){
							$(this).removeClass('broccoli--panel__hovered')
						})
						.append( $('<div>')
							.addClass('broccoli--panel-drop-to-insert-here')
						)
						.append( $ul )
					;
					broccoli.panels.setPanelEventHandlers($rtn);
					// $rtn.find('>ul').append($ul);
					callback($rtn);
				}
			);

			return;
		}

		it79.ary(
			data.bowl,
			function(it1, row, idx){
				// console.log(idx);
				var $bowl = $('<li>')
					.append(
						$('<span>')
							.text('bowl.'+idx) // ← bowl name
							.addClass('broccoli--instance-tree-view-bowlname')
					)
					// .attr({
					// 	'data-broccoli-instance-path':'/bowl.'+idx
					// })
					// .bind('click',function(e){
					// 	var instancePath = $(this).attr('data-broccoli-instance-path');
					// 	broccoli.focusInstance(instancePath);
					// 	e.stopPropagation();
					// })
					// .bind('mouseout',function(e){
					// 	broccoli.unfocusInstance();
					// 	e.stopPropagation();
					// })
					// .bind('click',function(e){
					// 	var instancePath = $(this).attr('data-broccoli-instance-path');
					// 	broccoli.focusInstance(instancePath);
					// 	e.stopPropagation();
					// })
				;
				buildInstance(
					row,
					'/bowl.'+idx,
					null,
					function($elm){
						$bowl.append($elm);
						$ul.append($bowl);
						it1.next();
					}
				);
			},
			function(){
				$instanceTreeView.html('').append($ul);
				callback();
			}
		);

		return this;
	}


	/**
	 * インスタンスを選択する
	 */
	this.selectInstance = function( instancePath, callback ){
		callback = callback || function(){};
		$instanceTreeView.find('[data-broccoli-instance-path]')
			.filter(function (index) {
				return $(this).attr("data-broccoli-instance-path") == instancePath;
			})
			.addClass('broccoli--panel__selected')
		;
		callback();
		return this;
	}

	/**
	 * モジュールインスタンスの選択状態を解除する
	 */
	this.unselectInstance = function(callback){
		callback = callback || function(){};
		$instanceTreeView.find('[data-broccoli-instance-path]')
			.removeClass('broccoli--panel__selected')
		;
		// this.updateInstancePathView();
		callback();
		return this;
	}

	/**
	 * モジュールインスタンスにフォーカスする
	 */
	this.focusInstance = function( instancePath, callback ){
		callback = callback || function(){};

		var $targetElm = $(this.getElement(instancePath));
		if($targetElm.size()){
			var minTop = $instanceTreeView.scrollTop() + $targetElm.offset().top - 30;
			var topLine = $instanceTreeView.scrollTop();
			var targetTop = topLine + $targetElm.offset().top;
			var targetHeight = $targetElm.height();
			var to = targetTop + (targetHeight/2) - ($instanceTreeView.height()/2);
			if( to > minTop ){
				to = minTop;
			}
			$instanceTreeView.stop().animate({"scrollTop":to} , 'fast' );
		}
		callback();
		return this;
	}

	/**
	 * 指定instanceのHTMLエレメントを取得する
	 */
	this.getElement = function( instancePath ){
		var $rtn = $instanceTreeView.find('[data-broccoli-instance-path="'+php.htmlspecialchars(instancePath)+'"]');
		return $rtn.get(0);
	}

	/**
	 * 初期化する
	 * @param  {Object} domElm     DOM Element of instance path view container.
	 * @param  {Function} callback callback function.
	 * @return {Object}            this
	 */
	this.init = function(domElm, callback){
		$instanceTreeView = $(domElm)
			.addClass('broccoli')
			.addClass('broccoli--instance-tree-view')
		;

		it79.fnc(
			{},
			[
				function( it1, data ){
					$instanceTreeView.html('initialize...');
					it1.next(data);
				} ,
				function( it1, data ){
					callback();
					it1.next(data);
				}
			]
		);
		return this;
	}

	return;
}