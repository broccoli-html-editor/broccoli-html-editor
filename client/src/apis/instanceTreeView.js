/**
 * instanceTreeView.js
 */
module.exports = function(broccoli){
	if(!window){ return false; }

	var _this = this;

	var it79 = require('iterate79');
	var LangBank = require('langbank');
	var php = require('phpjs');
	var $ = require('jquery');
	var utils = (()=>{
		const Utils = require('./utils.js');
		return new Utils();
	})();
	var modLb;

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
		var $ul = $('<ul>');

		var data = broccoli.contentsSourceData.get();
		var resDb;

		function buildInstance(data, parentInstancePath, subModName, callback){
			callback = callback||function(){};
			var mod = broccoli.contentsSourceData.getModuleByInternalId(data.modId, subModName);
			if( mod === false ){
				mod = {
					'id': '_sys/unknown',
					'info': {
						'name': 'Unknown Module'
					}
				}
			}

			var $ul = $('<ul>')
				.addClass('broccoli--instance-tree-view-fields')
			;

			it79.fnc({}, [
				function(it1){
					modLb = new LangBank(mod.languageCsv || '', function(){
						it1.next();
					});
				},
				function(it1){
					modLb.setLang(broccoli.lb.lang);
					it1.next();
				},
				function(it1){
					it79.ary(
						mod.fields,
						function(itAry, row, idx){
							var $li = $('<li>')
								.append(
									$('<span>')
										.text( row.label || idx ) // ← field name
										.addClass('broccoli--instance-tree-view-fieldname')
								)
							;

							if(row.fieldType == 'input'){
								var fieldDef = broccoli.getFieldDefinition( row.type ); // フィールドタイプ定義を呼び出す
								mod.fields[row.name].lb = new (function(lb, field){
									this.get = function(key, defValue){
										var rtn = '';
										var fullkey = '';
										if( data.subModName ){
											fullkey = 'subModule.'+data.subModName+'.'+field.name+':'+key;
										}else{
											fullkey = 'fields.'+field.name+':'+key;
										}
										rtn = lb.get(fullkey);
										if( rtn == '' || rtn == '---' ){
											rtn = defValue;
										}
										return rtn;
									}
								})(modLb, row);
								fieldDef.mkPreviewHtml( data.fields[row.name], mod.fields[row.name], function(html){
									html = utils.sanitizePreviewHtml(html, resDb);
									$li.append(
										$('<div class="broccoli--instance-tree-view-fieldpreview">')
											.html('<div>'+html+'</div>')
									);

									$ul.append($li);
									itAry.next();
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
										var tmpDepth = instancePath.split('/');
										if( tmpDepth.length > 3 && data.fields[idx] && data.fields[idx].length ){ // Appenderの表示数を減らす。
											$ul.append( $li );
											itAry.next();
											return;
										}

										var $appender = $('<div>')
											.append( $('<span>')
												.text(broccoli.lb.get('ui_label.drop_a_module_here'))
											)
											.addClass('broccoli--instance-tree-view-panel-item')
											.attr({
												'data-broccoli-instance-path':instancePath,
												'data-broccoli-is-appender':'yes',
												'data-broccoli-is-instance-tree-view': 'yes',
												'draggable': false
											})
											.on('mouseover', function(e){
												e.stopPropagation();
												$(this).addClass('broccoli__panel__hovered')
											})
											.on('mouseout',function(e){
												$(this).removeClass('broccoli__panel__hovered')
											})
											.append( $('<div>')
												.addClass('broccoli__panel-drop-to-insert-here')
											)
										;
										broccoli.panels.setPanelEventHandlers( $appender );
										$li.append( $appender );
										$ul.append( $li );
										itAry.next();
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
											.append( $('<span>')
												.text(''+broccoli.lb.get('ui_label.dblclick_here_and_add_array_element'))
											)
											.addClass('broccoli--instance-tree-view-panel-item')
											.attr({
												'data-broccoli-instance-path':instancePath,
												'data-broccoli-mod-id': mod.id,
												'data-broccoli-mod-internal-id': mod.internalId,
												'data-broccoli-sub-mod-name': row.name,
												'data-broccoli-is-appender':'yes',
												'data-broccoli-is-instance-tree-view': 'yes',
												'draggable': false
											})
											.on('mouseover', function(e){
												e.stopPropagation();
												$(this).addClass('broccoli__panel__hovered')
											})
											.on('mouseout',function(e){
												$(this).removeClass('broccoli__panel__hovered')
											})
											.append( $('<div>')
												.addClass('broccoli__panel-drop-to-insert-here')
											)
										;
										broccoli.panels.setPanelEventHandlers( $appender );
										$li.append( $appender );
										$ul.append($li);
										itAry.next();
									}
								);
								return;
							}
							itAry.next();
							return;
						} ,
						function(){
							it1.next();
						}
					);
				},
				function(){
					var $rtn = $('<div>')
						.append(
							$('<span>')
								.text(mod.info.name||mod.id) // ← module name
								.addClass('broccoli--instance-tree-view-modulename')
						)
						.addClass('broccoli--instance-tree-view-panel-item')
						.attr({
							'data-broccoli-instance-path': parentInstancePath,
							'data-broccoli-sub-mod-name': subModName,
							'data-broccoli-is-instance-tree-view': 'yes',
							'draggable': true
						})
						.on('mouseover', function(e){
							e.stopPropagation();
							$(this).addClass('broccoli__panel__hovered')
						})
						.on('mouseout',function(e){
							$(this).removeClass('broccoli__panel__hovered')
						})
						.append( $('<div>')
							.addClass('broccoli__panel-drop-to-insert-here')
						)
						.append( $ul )
					;
					broccoli.panels.setPanelEventHandlers($rtn);
					callback($rtn);
				},
			]);

			return;
		}

		broccoli.resourceMgr.getResourceDb(function(_resDb){
			resDb = _resDb;
			it79.ary(
				data.bowl,
				function(it1, row, idx){
					var $bowl = $('<li>')
						.append(
							$('<span>')
								.text( broccoli.lb.get('ui_label.editable') + ': ' + idx ) // ← bowl name
								.addClass('broccoli--instance-tree-view-bowlname')
						)
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
		});

		return;
	}


	/**
	 * インスタンスを選択する
	 */
	this.updateInstanceSelection = function( callback ){
		callback = callback || function(){};
		var instancePath = broccoli.getSelectedInstance();
		var instancePathRegion = broccoli.getSelectedInstanceRegion();
		this.unselectInstance(function(){
			$instanceTreeView.find('[data-broccoli-instance-path]')
				.filter(function (index) {
					var isPathSelected = $.inArray($(this).attr("data-broccoli-instance-path"), instancePathRegion);
					if( isPathSelected === false || isPathSelected < 0 ){
						return false;
					}
					return true;
				})
				.addClass('broccoli__panel--selected')
			;
			callback();
		});
		return;
	}

	/**
	 * モジュールインスタンスの選択状態を解除する
	 */
	this.unselectInstance = function(callback){
		callback = callback || function(){};
		$instanceTreeView.find('[data-broccoli-instance-path]')
			.removeClass('broccoli__panel--selected')
		;
		callback();
		return;
	}

	/**
	 * モジュールインスタンスにフォーカスする
	 */
	this.focusInstance = function( instancePath, callback ){
		callback = callback || function(){};

		var $targetElm = $(this.getElement(instancePath));
		if($targetElm.length){
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
		return;
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
			.addClass(`broccoli--appearance-${broccoli.options.appearance}`)
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
		return;
	}

	return;
}
