/**
 * editWindow.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ callback(); return false; }

	var _this = this;

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var $ = require('jquery');

	var $editWindow;
	var tplFrame = '';
	tplFrame += '<div class="broccoli--edit-window">';
	tplFrame += '	<form action="javascript:;">';
	tplFrame += '		<h2 class="broccoli--edit-window-module-name"></h2>';
	tplFrame += '		<div class="broccoli--edit-window-fields">';
	tplFrame += '		</div>';
	tplFrame += '		<div class="broccoli--edit-window-form-buttons">';
	tplFrame += '			<div class="btn-group btn-group-justified" role="group">';
	tplFrame += '				<div class="btn-group">';
	tplFrame += '					<button type="submit" class="btn btn-primary btn-lg">OK</button>';
	tplFrame += '				</div>';
	tplFrame += '			</div>';
	tplFrame += '		</div>';
	tplFrame += '	</form>';
	tplFrame += '</div>';

	this.init = function(instancePath, elmEditWindow, callback){
		callback = callback || function(){};

		var data = broccoli.contentsSourceData.get(instancePath);
		console.log( data );
		var mod = broccoli.contentsSourceData.getModule(data.modId);
		console.log( mod );

		$editWindow = $(elmEditWindow);
		$editWindow.append(tplFrame);
		$editWindow.find('.broccoli--edit-window-module-name').text(mod.info.name||mod.id);
		$editWindow.find('form').bind('submit', function(){
			callback();
		});
		return this;
	}

	return;
}
