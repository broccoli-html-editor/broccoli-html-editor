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
			rtn = rtn.replace(new RegExp('\r\n|\r|\n','g'), '<br />');
		}else if(typeof(fieldData)===typeof('')){
			rtn = utils79.toStr(fieldData);
			rtn = php.htmlspecialchars( rtn );
			rtn = rtn.replace(new RegExp('\r\n|\r|\n','g'), '<br />');
		}
		if( mode == 'canvas' && !rtn.length ){
			rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;white-space:nowrap;">(ダブルクリックしてテキストを編集してください)</span>';
		}
		// setTimeout(function(){
			callback(rtn);
		// }, 0);
		return;
	}

}
