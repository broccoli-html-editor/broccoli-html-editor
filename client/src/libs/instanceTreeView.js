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
		$instanceTreeView.html('...');
		var $ul = $('<ul>')
			// .css({
			// 	"border":"1px solid #666"
			// })
		;

		var data = broccoli.contentsSourceData.get();
		// console.log(data);

		function buildInstance(data, parentInstancePath, subModName, callback){
			callback = callback||function(){};
			// console.log(data);
			var mod = broccoli.contentsSourceData.getModule(data.modId, subModName);
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
						.text(idx)
					;

					if(row.fieldType == 'input'){
						$ul.append($li);
						it1.next();
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
								var instancePath = parentInstancePath+'/fields.'+idx+'@'+(data.fields[idx].length);

								var $appender = $('<div>')
									.text('(+) ここにモジュールをドラッグしてください。')
									.attr({
										'data-broccoli-instance-path':instancePath,
										'data-broccoli-is-appender':'yes',
										'data-broccoli-is-instance-tree-view': 'yes',
										'draggable': false
									})
									.bind('mouseover', function(e){
										e.stopPropagation();
										var $this = $(this);
										var instancePath = $this.attr('data-broccoli-instance-path');
										broccoli.focusInstance( instancePath );
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
								var instancePath = parentInstancePath+'/fields.'+idx+'@'+(data.fields[idx].length);

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
									.bind('mouseover', function(e){
										e.stopPropagation();
										var $this = $(this);
										var instancePath = $this.attr('data-broccoli-instance-path');
										broccoli.focusInstance( instancePath );
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
						.text( mod.info.name||mod.id )
						.css({
							// "border":"1px solid #666"
						})
						.attr({
							'data-broccoli-instance-path': parentInstancePath,
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
						.bind('mouseover', function(e){
							e.stopPropagation();
							var $this = $(this);
							var instancePath = $this.attr('data-broccoli-instance-path');
							// if( $this.attr('data-broccoli-is-appender') == 'yes' ){
							// 	instancePath = php.dirname(instancePath);
							// }
							broccoli.focusInstance( instancePath );
						})
						.append( $('<div>')
							.addClass('broccoli--panel-drop-to-insert-here')
						)
						.append( $('<ul>')
						)
					;
					broccoli.panels.setPanelEventHandlers($rtn);
					$rtn.find('>ul').append($ul);
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
					.text('bowl.'+idx)
					.attr({
						'data-broccoli-instance-path':'/bowl.'+idx
					})
					.bind('mouseover',function(e){
						var instancePath = $(this).attr('data-broccoli-instance-path');
						broccoli.focusInstance(instancePath);
						e.stopPropagation();
					})
					.bind('mouseout',function(e){
						broccoli.unfocusInstance();
						e.stopPropagation();
					})
					.bind('click',function(e){
						var instancePath = $(this).attr('data-broccoli-instance-path');
						broccoli.selectInstance(instancePath);
						e.stopPropagation();
					})
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
