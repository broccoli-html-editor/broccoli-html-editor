/**
 * findWindow.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ return false; }

	var _this = this;

	var it79 = require('iterate79');
	var php = require('phpjs');
	var $ = require('jquery');
	var contentsElements;

	var $findWindow;
	var $elmResult;
	var tplFrame = ''
				+ '<div class="broccoli__find-window">'
				+ '	<h2 class="broccoli__find-window-module-name">検索</h2>'
				+ '	<div class="broccoli__find-window-search">'
				+ '		<form action="javascript:;">'
				+ '			<input type="text" name="search-keyword" class="form-control" />'
				+ '		</form>'
				+ '	</div>'
				+ '	<div class="broccoli__find-window-result"></div>'
				+ '	<div class="broccoli__find-window-form-buttons">'
				+ '		<div class="container-fluid">'
				+ '			<div class="row">'
				+ '				<div class="col-sm-4">'
				+ '					<div class="btn-group btn-group-justified" role="group" style="margin-top:20px;">'
				+ '						<div class="btn-group">'
				+ '							<button disabled="disabled" type="button" class="px2-btn px2-btn--sm px2-btn--block broccoli__find-window-btn-cancel"><%= lb.get(\'ui_label.cancel\') %></button>'
				+ '						</div>'
				+ '					</div>'
				+ '				</div>'
				+ '				<div class="col-sm-4 col-sm-offset-4">'
				+ '					<div class="btn-group btn-group-justified" role="group" style="margin-top:20px;">'
				+ '						<div class="btn-group">'
				// + '							<button disabled="disabled" type="button" class="px2-btn px2-btn--danger px2-btn--sm px2-btn--block broccoli__find-window-btn-remove"><span class="glyphicon glyphicon-trash"></span> <%= lb.get(\'ui_label.remove_this_module\') %></button>'
				+ '						</div>'
				+ '					</div>'
				+ '				</div>'
				+ '			</div>'
				+ '		</div>'
				+ '	</div>'
				+ '</div>'
	;

	/**
	 * 初期化
	 * @param  {String}   instancePath  [description]
	 * @param  {Object}   elmEditWindow [description]
	 * @param  {Function} callback      [description]
	 * @return {Void}                 [description]
	 */
	this.init = function(){
		// console.log( '=-=-=-=-=-=-=-=-= Initialize EditWindow.' );
		// callback = callback || function(){};
		it79.fnc(
			{},
			[
				function( it1, data ){
					broccoli.postMessenger.send(
						'getAllInstance',
						{},
						function(_contentsElements){
							console.log(_contentsElements);
							contentsElements = _contentsElements;
							it1.next(data);
						}
					);
				} ,
				function( it1, data ){
					broccoli.lightbox( function( lbElm ){
						$findWindow = $(lbElm);
						$findWindow.html('').append( broccoli.bindEjs(tplFrame, {'lb':broccoli.lb}) );

						$findWindow.find('.broccoli__find-window-btn-cancel').removeAttr('disabled').on('click', function(){
							broccoli.closeLightbox( function(){} );
						});
						it1.next(data);
					} );
				} ,
				function( it1, data ){
					$elmResult = $findWindow.find('.broccoli__find-window-result');
					for( var idx in contentsElements ){
						var instance = contentsElements[idx];
						var $instance = $('<a>');
						$instance.text(instance.instancePath);
						$instance.attr({
							'href':'javascript:;',
							'data-broccoli-instance-path': instance.instancePath
						});
						$instance.on('click', function(){
							var instancePath = $(this).attr('data-broccoli-instance-path');
							// alert(instancePath);
							broccoli.selectInstance(instancePath);
							broccoli.focusInstance(instancePath);
							broccoli.instanceTreeView.focusInstance(instancePath);
						});
						$elmResult.append($instance);
					}
					it1.next(data);
				}
			]
		);
		return this;
	}

	return;
}
