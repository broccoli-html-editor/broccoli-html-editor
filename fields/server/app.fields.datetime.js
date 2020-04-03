module.exports = function(broccoli){
	var php = require('phpjs');
	var utils79 = require('utils79');

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = '';
		if(typeof(fieldData)===typeof('') && fieldData.length){
			rtn = utils79.toStr(fieldData);
			var $format = 'Y-m-d H:i:s';
			if( mod.format ){
				$format = mod.format;
			}
			rtn = dateFormat( $format, rtn ); // ←日付フォーマット
			rtn = php.htmlspecialchars( rtn ); // ←HTML特殊文字変換
			rtn = rtn.replace(new RegExp('\r\n|\r|\n','g'), '<br />'); // ← 改行コードは改行タグに変換
		}
		if( mode == 'canvas' && !rtn.length ){
			rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;white-space:nowrap;">(ダブルクリックして編集してください)</span>';
		}
		// setTimeout(function(){
			callback(rtn);
		// }, 0);
		return;
	}

	function dateFormat(format, date){
		var tmpDate = new Date(date);
		format = format.replace(/Y/g, tmpDate.getFullYear());
		format = format.replace(/m/g, ('0' + (tmpDate.getMonth() + 1)).slice(-2));
		format = format.replace(/d/g, ('0' + tmpDate.getDate()).slice(-2));
		format = format.replace(/H/g, ('0' + tmpDate.getHours()).slice(-2));
		format = format.replace(/i/g, ('0' + tmpDate.getMinutes()).slice(-2));
		format = format.replace(/s/g, ('0' + tmpDate.getSeconds()).slice(-2));
		return format;
	}

}
