/**
 * history.js
 */
module.exports = function(broccoli){

	var historyDataArray = [];
	var historyIdx = 0;

	/**
	 * ヒストリーを初期化する
	 */
	this.init = function( data, resourceDb, callback ){
		callback = callback||function(){};

		historyDataArray = [];
		historyIdx = 0;
		this.put(data, resourceDb, function(){
			setTimeout( callback, 0 );
		});
		return this;
	}

	/**
	 * ヒストリーに歴史を追加する
	 */
	this.put = function( data, resourceDb, callback ){
		callback = callback||function(){};

		historyDataArray.splice(0, historyIdx, {
			"datetime": (new Date).getTime(),
			"contents": data,
			"resources": resourceDb
		});
		historyIdx = 0;

		// console.log('history.put()', historyDataArray);
		setTimeout( callback, 0 );
		return this;
	}

	/**
	 * 1つ前のデータを得る
	 */
	this.back = function( callback ){
		// console.log('history.back()', historyDataArray, historyIdx);
		callback = callback||function(){};
		historyIdx ++;
		if( historyIdx >= historyDataArray.length || historyIdx < 0 ){
			historyIdx --;
			callback(false);
			return this;
		}
		// console.log('historyIdx: ', historyIdx);
		var data = {contents: {}, resources: {}};
		data = historyDataArray[historyIdx];
		callback( data );
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
		// console.log(historyIdx, data.contents, data.resources);
		var data = {contents: {}, resources: {}};
		data = historyDataArray[historyIdx];
		callback( data );
		return this;
	}

	/**
	 * history情報の全体を取得する
	 */
	this.getHistory = function(){
		var rtn = {
			'array': historyDataArray ,
			'index': historyIdx
		};
		return rtn;
	}

}
