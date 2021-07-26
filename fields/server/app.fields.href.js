module.exports = function(broccoli){
	var php = require('phpjs');
	var utils79 = require('utils79');

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = '';
		if(typeof(fieldData)===typeof({}) && fieldData.src ){
			rtn = utils79.toStr(fieldData.src);
			rtn = php.htmlspecialchars( rtn );
		}else if(typeof(fieldData)===typeof('')){
			rtn = utils79.toStr(fieldData);
			rtn = php.htmlspecialchars( rtn );
		}
		if( mode == 'canvas' && !rtn.length ){
			rtn = '';
		}

		callback(rtn);
		return;
	}

}
