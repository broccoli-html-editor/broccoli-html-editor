/**
 * モジュールIDをパースする
 */
module.exports = function(moduleId){
	// delete(require.cache[require('path').resolve(__filename)]);
	var rtn = {
		'package': false,
		'category': false,
		'module': false
	};
	if(typeof(moduleId) != typeof('')){
		return false;
	}
	if( !moduleId.match( new RegExp('^(?:([0-9a-zA-Z\\_\\-\\.]*?)\\:)?([^\\/\\:\\s]*)\\/([^\\/\\:\\s]*)$') ) ){
		return false;
	}
	rtn.package = RegExp.$1;
	rtn.category = RegExp.$2;
	rtn.module = RegExp.$3;

	if( !rtn.package.length ){
		rtn.package = null;
	}
	if( !rtn.category.length ){
		rtn.category = null;
	}
	if( !rtn.module.length ){
		rtn.module = null;
	}
	return rtn;
}
