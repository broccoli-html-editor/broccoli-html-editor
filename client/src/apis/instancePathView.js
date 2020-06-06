/**
 * instancePathView.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ callback(); return false; }

	var _this = this;

	var it79 = require('iterate79');
	var $ = require('jquery');

	var $instancePathView, $instancePathViewInner;


	/**
	 * インスタンスパスビューを更新する
	 */
	this.update = function(callback){
		callback = callback||function(){};
		var selectedInstance = broccoli.getSelectedInstance();
		if( selectedInstance === null ){
			$instancePathViewInner.text('-');
			callback();
			return this;
		}
		var instPath = selectedInstance.split('/');
		var timer;

		// console.log(instPath);

		var $ul = $('<ul>');
		var instPathMemo = [];
		for( var idx in instPath ){
			instPathMemo.push(instPath[idx]);
			if( instPathMemo.length <= 1 ){ continue; }
			var contData = broccoli.contentsSourceData.get(instPathMemo.join('/'));
			if( !contData ){
				// appender を選択した場合に、
				// 存在しない instance が末尾に含まれた状態で送られてくる。
				// その場合、contData は undefined になる。
				// 処理できないので、スキップする。
				continue;
			}
			var mod = broccoli.contentsSourceData.getModuleByInternalId(contData.modId, contData.subModName);
			var label = mod && mod.info.name||mod.id;
			if(instPathMemo.length==2){
				// bowl自体だったら
				label = instPathMemo[instPathMemo.length-1];
				label = '編集エリア: ' + label.replace(/^bowl\./, '') + '';
			}
			$ul.append( $('<li>')
				.append( $('<a href="javascript:;">')
					.attr({
						'data-broccoli-instance-path': instPathMemo.join('/')
					})
					.bind('dblclick', function(e){
						clearTimeout(timer);
						var instancePath = $(this).attr('data-broccoli-instance-path');
						broccoli.editInstance( instancePath );
					} )
					.bind('click', function(e){
						var dataPath = $(this).attr('data-broccoli-instance-path');
						timer = setTimeout(function(){
							broccoli.selectInstance( dataPath, function(){
								broccoli.focusInstance( dataPath, function(){
									broccoli.instanceTreeView.focusInstance( dataPath, function(){} );
								} );
							} );
						}, 20);
						return false;
					} )
					.text(label)
				)
			);
		}
		$instancePathViewInner.html('').append($ul).show();

		broccoli.contentsSourceData.getChildren( selectedInstance, function(children){
			if(children.length){
				var $ulChildren = $('<ul class="broccoli--instance-path-view-children">');
				for(var child in children){
					var contData = broccoli.contentsSourceData.get(children[child]);
					var mod = broccoli.contentsSourceData.getModuleByInternalId(contData.modId, contData.subModName);
					var label = mod && mod.info.name||mod.id;
					$ulChildren.append( $('<li>')
						.append( $('<a href="javascript:;">')
							.attr({
								'data-broccoli-instance-path': children[child]
							})
							.bind('mouseover', function(e){
								var dataPath = $(this).attr('data-broccoli-instance-path');
								broccoli.focusInstance( dataPath, function(){
									broccoli.instanceTreeView.focusInstance( dataPath, function(){} );
								} );
							} )
							.bind('mouseout', function(e){
								broccoli.unfocusInstance();
							} )
							.bind('dblclick', function(e){
								var dataPath = $(this).attr('data-broccoli-instance-path');
								clearTimeout(timer);
								broccoli.selectInstance( dataPath, function(){
									broccoli.editInstance( dataPath );
								} );
							} )
							.bind('click', function(e){
								broccoli.unfocusInstance();
								var dataPath = $(this).attr('data-broccoli-instance-path');
								timer = setTimeout(function(){
									broccoli.selectInstance( dataPath, function(){
										broccoli.focusInstance( dataPath, function(){
											broccoli.instanceTreeView.focusInstance( dataPath, function(){} );
										} );
									} );
								}, 20);
								return false;
							} )
							.text(label)
						)
					);
				}
				$ul.find('li:last-child').append($ulChildren);
			}
		} );

		callback();
		return this;
	}


	/**
	 * 初期化する
	 * @param  {Object} domElm     DOM Element of instance path view container.
	 * @param  {Function} callback callback function.
	 * @return {Object}            this
	 */
	this.init = function(domElm, callback){
		$instancePathView = $(domElm)
			.addClass('broccoli')
			.addClass('broccoli--instance-path-view')
		;
		// console.log(domElm);
		// console.log($instancePathView);
		$instancePathViewInner = $('<div>')
			.addClass('broccoli--instance-path-view-inner')
		;

		it79.fnc(
			{},
			[
				function( it1, data ){
					$instancePathView.html('').append($instancePathViewInner);
					$instancePathViewInner.html('initialize...');
					it1.next(data);
				} ,
				function( it1, data ){
					_this.update(function(){
						it1.next(data);
					});
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
