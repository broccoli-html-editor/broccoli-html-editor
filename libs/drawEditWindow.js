/**
 * drawEditWindow.js
 */
module.exports = function(broccoli, instancePath, elmEditWindow, callback){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ callback(); return false; }

	var _this = this;
	callback = callback || function(){};

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var twig = require('twig');
	var $ = require('jquery');

	var $panels = $(broccoli.options.elmPanels);
	var $contents = $(broccoli.options.elmIframeWindow.document);
	var $contentsElements = $contents.find('[data-broccoli-instance-path]');

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

	it79.fnc(
		{},
		[
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

	return;
}
