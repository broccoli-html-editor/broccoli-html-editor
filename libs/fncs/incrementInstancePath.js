/**
 * インスタンスパスの末尾の連番を1つ進める
 */
module.exports = function(instancePath){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(instancePath.match( new RegExp('^(.*)\\@([0-9]+)$') )){
		var tmpPath = RegExp.$1;
		var tmpNum = RegExp.$2;
		tmpNum = Number(tmpNum);
		tmpNum ++;
		instancePath = tmpPath + '@' + tmpNum;
	}
	return instancePath;
}
