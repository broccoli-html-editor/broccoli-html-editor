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

	var $findWindow;
	var tplFrame = ''
				+ '<div class="broccoli--find-window">'
				+ '	<form action="javascript:;">'
				+ '		<h2 class="broccoli--find-window-module-name">検索</h2>'
				+ '		<div class="broccoli--find-window-form-buttons">'
				+ '			<div class="container-fluid">'
				+ '				<div class="row">'
				+ '					<div class="col-sm-4">'
				+ '						<div class="btn-group btn-group-justified" role="group" style="margin-top:20px;">'
				+ '							<div class="btn-group">'
				+ '								<button disabled="disabled" type="button" class="px2-btn px2-btn--sm px2-btn--block broccoli--find-window-btn-cancel"><%= lb.get(\'ui_label.cancel\') %></button>'
				+ '							</div>'
				+ '						</div>'
				+ '					</div>'
				+ '					<div class="col-sm-4 col-sm-offset-4">'
				+ '						<div class="btn-group btn-group-justified" role="group" style="margin-top:20px;">'
				+ '							<div class="btn-group">'
				// + '								<button disabled="disabled" type="button" class="px2-btn px2-btn--danger px2-btn--sm px2-btn--block broccoli--find-window-btn-remove"><span class="glyphicon glyphicon-trash"></span> <%= lb.get(\'ui_label.remove_this_module\') %></button>'
				+ '							</div>'
				+ '						</div>'
				+ '					</div>'
				+ '				</div>'
				+ '			</div>'
				+ '		</div>'
				+ '	</form>'
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
		broccoli.lightbox( function( lbElm ){
			var $fields = $('<div>');
			$findWindow = $(lbElm);
			$findWindow.html('').append( broccoli.bindEjs(tplFrame, {'lb':broccoli.lb}) );

			$findWindow.find('.broccoli--find-window-btn-cancel').removeAttr('disabled').on('click', function(){
				broccoli.closeLightbox( function(){} );
			});
		} );
		return this;
	}

	return;
}
