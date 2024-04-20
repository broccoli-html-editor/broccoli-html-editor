/**
 * history.js
 */
module.exports = function(broccoli){
	var historyDataArray = [];
	var historyIdx = 0;
	var maxHistorySize = 30;

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
		return;
	}

	/**
	 * ヒストリーに歴史を追加する
	 */
	this.put = function( data, resourceDb, callback ){
		callback = callback||function(){};


		// 履歴をさかのぼっているとき、
		// 現時点(=historyIdx)以降の履歴は削除する
		if( historyIdx ){
			historyDataArray.splice(0, historyIdx);
			historyIdx = 0;
		}


		// 先頭に新しい履歴を追加
		var newRecord = JSON.parse(JSON.stringify({
			"datetime": (new Date).getTime(),
			"contents": data,
			"resources": resourceDb
		}));
		historyDataArray.unshift(newRecord);


		// 件数の上限設定より古い履歴を削除
		historyDataArray.splice( maxHistorySize );


		callback();
		return;
	}

	/**
	 * 1つ前のデータを得る
	 */
	this.back = function( callback ){
		return this.step(-1, callback);
	}

	/**
	 * 1つ次のデータを得る
	 */
	this.go = function( callback ){
		return this.step(1, callback);
	}

	/**
	 * 次(または前)のデータを得る
	 */
	this.step = function( step, callback ){
		callback = callback||function(){};
		var tmpHistoryIdx = historyIdx - step;
		if( tmpHistoryIdx >= historyDataArray.length ){
			tmpHistoryIdx = (historyDataArray.length - 1);
			if( historyIdx == tmpHistoryIdx ){
				callback(false);
				return;
			}
		}else if( tmpHistoryIdx < 0 ){
			tmpHistoryIdx = 0;
			if( historyIdx == tmpHistoryIdx ){
				callback(false);
				return;
			}
		}

		historyIdx = tmpHistoryIdx;
		var data = {contents: {}, resources: {}};
		data = JSON.parse(JSON.stringify(historyDataArray[historyIdx])); // deep copy
		callback( data );
		return;
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
