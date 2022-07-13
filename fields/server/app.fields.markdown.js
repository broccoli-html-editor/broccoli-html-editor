module.exports = function(broccoli){
	var utils79 = require('utils79');

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = '';
		var marked = require('marked');
		marked.setOptions({
			renderer: new marked.Renderer(),
			gfm: true,
			headerIds: false,
			tables: true,
			breaks: false,
			pedantic: false,
			sanitize: false,
			smartLists: true,
			smartypants: false,
			xhtml: true
		});

		if(typeof(fieldData)===typeof({}) && fieldData.src ){
			rtn = utils79.toStr(fieldData.src);
			rtn = marked.parse(rtn);
		}else if(typeof(fieldData)===typeof('')){
			rtn = utils79.toStr(fieldData);
			rtn = marked.parse(rtn);
		}
		if( mode == 'canvas' && !rtn.length ){
			rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;">(ダブルクリックしてマークダウンを編集してください)</span>';
		}
		// setTimeout(function(){
			callback(rtn);
		// }, 0);
		return;
	}

}
