/**
 * utils.js
 * ユーティリティ
 */
module.exports = function(broccoli){

	/**
	 * インスタンスBを削除した影響を受けたあとのインスタンスAのパスを取得する
	 */
	this.getInstancePathWhichWasAffectedRemovingInstance = function( moveTo, moveFrom ){
		console.log('=-=-=-=-=-==-=-=', moveTo, moveFrom);

		// 移動・挿入後の選択状態を更新する際、
		// 移動元が抜けることで移動先の番号が変わる場合に、選択状態が乱れる。
		// この関数では、移動先のパスを計算し直し、移動したインスタンス自身の新しいパスを返す。
		// これを `broccoli.selectInstance()` すれば、移動・挿入成功後の選択状態を自然な結果にできる。
		if(!moveFrom){
			// 新規の場合
			return moveTo;
		}
		if(!moveFrom.match(/^([\S]+)\@([0-9]+)$/)){
			console.error('FATAL: Instance path has an illegal format.');
			return moveTo;
		}

		var moveFromPath = RegExp.$1;
		var moveFromIdx = RegExp.$2;

		var idx = moveTo.indexOf(moveFromPath+'@');
		if( idx !== 0 ){
			console.log('--- 影響なし', moveTo);
			return moveTo;
		}
		var tmpMoveToStr = moveTo.substring((moveFromPath+'@').length);
		if(!tmpMoveToStr.match(/^([0-9]+)([\S]*)$/)){
			console.log('--- 影響なし', moveTo);
			return moveTo;
		}
		var moveToIdx = RegExp.$1;
		var moveToPath = RegExp.$2;
		if( moveToIdx > moveFromIdx ){
			var rtn = moveFromPath + '@' + (moveToIdx-1) + moveToPath;
			console.log('+++ 影響あり', rtn);
			return rtn;
		}

		console.log('--- 影響なし', moveTo);
		return moveTo;
	}

}
