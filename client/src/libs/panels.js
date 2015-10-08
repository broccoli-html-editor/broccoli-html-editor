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

	var $panels = $(broccoli.options.elmPanels);
	var $contents = $(broccoli.options.elmIframeWindow.document);
	var $contentsElements;

	function drawPanel(idx, domElm){
		function calcHeight($me, idx){
			var $nextElm = $contentsElements.eq(idx+1);
			if( !$nextElm.length ){
				return $me.height();
			}
			var rtn = ($nextElm.offset().top - $me.offset().top);
			if( $me.height() > rtn ){
				return $me.height();
			}
			return rtn;
		}
		var $this = $(domElm);
		var $panel = $('<div>');
		$panels.append($panel);
		$panel
			.css({
				'width': $this.width(),
				'height': calcHeight($this, idx),
				'position': 'absolute',
				'left': $this.offset().left,
				'top': $this.offset().top
			})
			.addClass('broccoli--panel')
			.attr({
				'data-broccoli-instance-path': $this.attr('data-broccoli-instance-path'),
				'draggable': true // <- HTML5のAPI http://www.htmq.com/dnd/
			})
			.bind('click', function(){
				broccoli.selectInstance($(this).attr('data-broccoli-instance-path'));
			})
			.bind('dblclick', function(){
				broccoli.editInstance($(this).attr('data-broccoli-instance-path'));
			})
			.bind('dragstart', function(){
				event.dataTransfer.setData("method", 'moveTo' );
				event.dataTransfer.setData("data-broccoli-instance-path", $(this).attr('data-broccoli-instance-path') );
				var subModName = $(this).attr('data-broccoli-sub-mod-name');
				if( typeof(subModName) === typeof('') && subModName.length ){
					event.dataTransfer.setData("data-broccoli-sub-mod-name", subModName );
				}
			})
			.bind('drop', function(){
				var method = event.dataTransfer.getData("method");
				options.drop($(this).attr('data-broccoli-instance-path'), method);
			})
		;

	}

	/**
	 * 初期化する
	 * @param  {Function} callback [description]
	 * @return {[type]}            [description]
	 */
	this.init = function(callback){
		it79.fnc(
			{},
			[
				function( it1, data ){
					$contentsElements = $contents.find('[data-broccoli-instance-path]');
					it1.next(data);
				} ,
				function( it1, data ){
					$panels.html('').removeClass('broccoli').addClass('broccoli');
					it1.next(data);
				} ,
				function( it1, data ){
					// console.log($contentsElements.size());
					$contentsElements.each(drawPanel);
					it1.next(data);
				} ,
				function( it1, data ){
					callback();
					it1.next(data);
				}
			]
		);
	}

	/**
	 * インスタンスを選択する
	 * @param  {[type]} instancePath [description]
	 * @return {[type]}              [description]
	 */
	this.selectInstance = function( instancePath, callback ){
		callback = callback || function(){};
		$panels.find('[data-broccoli-instance-path]')
			.filter(function (index) {
				return $(this).attr("data-broccoli-instance-path") == instancePath;
			})
			.addClass('broccoli--panel__selected')
		;
		// this.updateInstancePathView();
		callback();
		return this;
	}

	/**
	 * モジュールインスタンスの選択状態を解除する
	 */
	this.unselectInstance = function(callback){
		callback = callback || function(){};
		$panels.find('[data-broccoli-instance-path]')
			.removeClass('broccoli--panel__selected')
		;
		// this.updateInstancePathView();
		callback();
		return this;
	}

	/**
	 * モジュールインスタンスにフォーカスする
	 * フォーカス状態の囲みで表現され、画面に収まるようにスクロールする
	 */
	this.focusInstance = function( instancePath, callback ){
		callback = callback || function(){};
		$panels.find('[data-broccoli-instance-path]')
			.filter(function (index) {
				return $(this).attr("data-broccoli-instance-path") == instancePath;
			})
			.addClass('broccoli--panel__focused')
		;
		var $targetElm = $('.broccoli--panel__focused');
		var $confField = $('.cont_field');
		var top = $confField.scrollTop() + $targetElm.offset().top - 30;
		$confField.stop().animate({"scrollTop":top} , 'fast' );
		callback();
		return this;

	}

	/**
	 * モジュールインスタンスのフォーカス状態を解除する
	 */
	this.unfocusInstance = function(callback){
		callback = callback || function(){};
		selectedInstance = null;
		$panels.find('.broccoli--panel__focused')
			.removeClass('broccoli--panel__focused')
		;
		callback();
		return this;
	}

	return;
}
