module.exports = function(broccoli){

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = ''
		var marked = require('marked');
		marked.setOptions({
			renderer: new marked.Renderer(),
			gfm: true,
			tables: true,
			breaks: false,
			pedantic: false,
			sanitize: false,
			smartLists: true,
			smartypants: false
		});

		if(typeof(fieldData)===typeof('')){
			rtn = marked(fieldData);
		}
		if( mode == 'canvas' && !rtn.length ){
			rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;white-space:nowrap;">(ダブルクリックしてマークダウンを編集してください)</span>';
		}
		setTimeout(function(){
			// px.textEditor.attachTextEditor(
			// 	$dom.find('textarea').get(0),
			// 	'md'
			// );
			// $dom.find('.CodeMirror').css({
			// 	'border': '1px solid #ccc',
			// 	'border-radius': '3px'
			// });

			callback(rtn);
		}, 0);
		return;
	}

}
