module.exports = function(broccoli){
	var php = require('phpjs');
	var utils79 = require('utils79');
	var editorLib = null;
	try {
		if(window.ace){
			editorLib = 'ace';
		}
	} catch (e) {
	}

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = '';
		var is_escape = false;
		if(typeof(fieldData)===typeof({})){
			if(typeof(fieldData.src)===typeof('')){
				var src = utils79.toStr(fieldData.src);
				if(typeof(mod.escape)===typeof('')){
					is_escape = true;
					switch( mod.escape.toLowerCase() ){
						case 'html_attr_text':
							$src = utils79.h(src);
							break;
					}
				}
				rtn = ''+src;
			}
		}
		if(mod.autowrap){
			switch(fieldData.lang){
				case 'javascript':
					rtn = '<script>'+rtn+'</script>';
					break;
				case 'css':
					rtn = '<style>'+rtn+'</style>';
					break;
				case 'php':
					break;
				default:
					break;
			}
		}
		if( mode == 'canvas' ){
			if(is_escape){
				rtn = '';
			}else{
				rtn = '<span style="display:inline-block;color:#969800;background-color:#f0f1b3;border:1px solid #969800;font-size:10px;padding:0.2em 1em;max-width:100%;overflow:hidden;">'+broccoli.lb.get('ui_message.double_click_to_edit_script')+'</span>';
			}
		}

		// setTimeout(function(){
			callback(rtn);
		// }, 0);
		return;
	}

}
