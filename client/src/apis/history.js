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
		historyDataArray.splice(0, historyIdx);

		// 先頭に新しい履歴を追加
		historyDataArray.unshift(JSON.parse(JSON.stringify({
			"datetime": (new Date).getTime(),
			"contents": data,
			"resources": resourceDb
		})));
		historyIdx = 0;

		// 件数の上限設定より古い履歴を削除
		historyDataArray.splice( maxHistorySize );


		// console.log('history.put()', historyDataArray);
		setTimeout( callback, 0 );
		return;
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
			return;
		}
		// console.log('historyIdx: ', historyIdx);
		var data = {contents: {}, resources: {}};
		data = historyDataArray[historyIdx];
		callback( data );
		return;
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
			return;
		}
		// console.log(historyIdx, data.contents, data.resources);
		var data = {contents: {}, resources: {}};
		data = historyDataArray[historyIdx];
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
