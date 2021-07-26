/**
 * userStorage.js
 */
module.exports = function(broccoli){

	/**
	 * ユーザー固有の情報を取得する
	 */
	this.load = function($key, callback){
		callback = callback || function(){};
		var $fnc;
		try{
			$fnc = broccoli.options.userStorage;
		}catch(e){
			callback(false);
			return;
		}

		if( !$fnc ){
			callback(false);
			return;
		}
		$fnc($key, function(rtn){
			callback(rtn);
			return;
		});
		return;
	}

	/**
	 * ユーザー固有の情報を保存する
	 */
	this.save = function($key, $val, callback){
		callback = callback || function(){};
		var $fnc;
		try{
			$fnc = broccoli.options.userStorage;
		}catch(e){
			callback(false);
			return;
		}

		if( !$fnc ){
			callback(false);
			return;
		}
		$fnc($key, $val, function(rtn){
			callback(rtn);
			return;
		});
		return;
	}

}
