/**
 * userStorage.js
 */
module.exports = function(broccoli){

	/**
	 * ユーザー固有の情報を取得する
	 */
	this.get = function($key, callback){
		callback = callback || function(){}
		callback(null);
		return;
	}

	/**
	 * ユーザー固有の情報を保存する
	 */
	this.put = function($key, $val, callback){
		callback = callback || function(){}
		callback(true);
		return;
	}

}
