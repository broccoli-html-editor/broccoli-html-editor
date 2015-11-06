/**
 * panels.js
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

	var $instancePathView;


	/**
	 * インスタンスパスビューを更新する
	 */
	this.update = function(callback){
		callback = callback||function(){};
		var selectedInstance = broccoli.getSelectedInstance();
		if( selectedInstance === null ){
			$instancePathView.text('-');
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
			var mod = broccoli.contentsSourceData.getModule(contData.modId, contData.subModName);
			var label = mod && mod.info.name||mod.id;
			if(instPathMemo.length==2){
				// bowl自体だったら
				label = instPathMemo[instPathMemo.length-1];
			}
			if( mod.subModName ){
				// サブモジュールだったら
				label = '@'+mod.subModName;
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
							broccoli.selectInstance( dataPath );
						}, 20);
						return false;
					} )
					.text(label)
				)
			);
		}
		$instancePathView.html('').append($ul).show();

		broccoli.contentsSourceData.getChildren( selectedInstance, function(children){
			if(children.length){
				var $ulChildren = $('<ul class="broccoli--instance-path-view-children">');
				for(var child in children){
					var contData = broccoli.contentsSourceData.get(children[child]);
					var mod = broccoli.contentsSourceData.getModule(contData.modId, contData.subModName);
					var label = mod && mod.info.name||mod.id;
					if( mod.subModName ){
						// サブモジュールだったら
						label = '@'+mod.subModName;
					}
					$ulChildren.append( $('<li>')
						.append( $('<a href="javascript:;">')
							.attr({
								'data-broccoli-instance-path': children[child]
							})
							.bind('mouseover', function(e){
								var dataPath = $(this).attr('data-broccoli-instance-path');
								broccoli.focusInstance( dataPath );
							} )
							.bind('mouseout', function(e){
								broccoli.unfocusInstance();
							} )
							.bind('dblclick', function(e){
								var dataPath = $(this).attr('data-broccoli-instance-path');
								clearTimeout(timer);
								broccoli.selectInstance( dataPath );
								broccoli.editInstance( dataPath );
							} )
							.bind('click', function(e){
								broccoli.unfocusInstance();
								var dataPath = $(this).attr('data-broccoli-instance-path');
								timer = setTimeout(function(){
									broccoli.selectInstance( dataPath );
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
		$instancePathView = $(domElm);

		it79.fnc(
			{},
			[
				function( it1, data ){
					$instancePathView.html('initialize...');
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
