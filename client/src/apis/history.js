/**
 * history.js
 */
module.exports = function(broccoli){

	var historyDataArray = [];
	var historyIdx = 0;

	/**
	 * ヒストリーを初期化する
	 */
	this.init = function( data, callback ){
		callback = callback||function(){};

		historyDataArray = [];
		historyIdx = 0;
		this.put(data, function(){
			setTimeout( callback, 0 );
		});
		return this;
	}

	/**
	 * ヒストリーに歴史を追加する
	 */
	this.put = function( data, callback ){
		callback = callback||function(){};

		historyDataArray.splice(0, historyIdx, JSON.stringify(data));
		historyIdx = 0;

		// console.log('history.put()', historyDataArray);
		setTimeout( callback, 0 );
		return this;
	}

	/**
	 * 1つ前のデータを得る
	 */
	this.back = function( callback ){
		// console.log('history.back()', historyDataArray);
		callback = callback||function(){};
		historyIdx ++;
		if( historyIdx >= historyDataArray.length || historyIdx < 0 ){
			historyIdx --;
			callback(false);
			return this;
		}
		callback(JSON.parse( historyDataArray[historyIdx] ));
		return this;
	}

	/**
	 * 1つ次のデータを得る
	 */
	this.go = function( callback ){
		// console.log('history.go()', historyDataArray);
		callback = callback||function(){};
		historyIdx --;
		if( historyIdx >= historyDataArray.length || historyIdx < 0 ){
			historyIdx ++;
			callback(false);
			return this;
		}
		callback(JSON.parse( historyDataArray[historyIdx] ));
		return this;
	}

	/**
	 * history情報を取得する
	 */
	this.getHistory = function(){
		var rtn = {
			'array': historyDataArray ,
			'index': historyIdx
		};
		return rtn;
	}

}
