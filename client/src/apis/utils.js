/**
 * utils.js
 * ユーティリティ
 */
module.exports = function(broccoli){

	/**
	 * インスタンスBを削除した影響を受けたあとのインスタンスAのパスを計算する
	 */
	this.getInstancePathWhichWasAffectedRemovingInstance = function( challangeInstancePathTo, remmovedInstancePath ){
		// console.log('=-=-=-=-=-==-=-=', challangeInstancePathTo, remmovedInstancePath);

		// 移動・挿入後の選択状態を更新する際、
		// 移動元が抜けることで移動先の番号が変わる場合に、選択状態が乱れる。
		// この関数では、移動先のパスを計算し直し、移動したインスタンス自身の新しいパスを返す。
		// これを `broccoli.selectInstance()` すれば、移動・挿入成功後の選択状態を自然な結果にできる。
		if(!remmovedInstancePath){
			// 新規の場合
			return challangeInstancePathTo;
		}
		if(!remmovedInstancePath.match(/^([\S]+)\@([0-9]+)$/)){
			console.error('FATAL: Instance path has an illegal format.', remmovedInstancePath);
			return challangeInstancePathTo;
		}

		var remmovedInstancePathPath = RegExp.$1;
		var remmovedInstancePathIdx = Number(RegExp.$2);

		var idx = challangeInstancePathTo.indexOf(remmovedInstancePathPath+'@');
		if( idx !== 0 ){
			// console.log('--- 影響なし', challangeInstancePathTo);
			return challangeInstancePathTo;
		}
		var tmpchallangeInstancePathToStr = challangeInstancePathTo.substring((remmovedInstancePathPath+'@').length);
		if(!tmpchallangeInstancePathToStr.match(/^([0-9]+)([\S]*)$/)){
			// console.log('--- 影響なし', challangeInstancePathTo);
			return challangeInstancePathTo;
		}
		var challangeInstancePathToIdx = Number(RegExp.$1);
		var challangeInstancePathToPath = RegExp.$2;
		if( challangeInstancePathToIdx > remmovedInstancePathIdx ){
			var rtn = remmovedInstancePathPath + '@' + (challangeInstancePathToIdx-1) + challangeInstancePathToPath;
			// console.log('+++ 影響あり', rtn);
			return rtn;
		}

		// console.log('--- 影響なし', challangeInstancePathTo);
		return challangeInstancePathTo;
	}

	/**
	 * インスタンスBを挿入した影響を受けたあとのインスタンスAのパスを計算する
	 */
	this.getInstancePathWhichWasAffectedInsertingInstance = function( challangeInstancePath, insertedInstancePath ){
		// console.log('=-=-=-=-=-==-=-=', challangeInstancePath, insertedInstancePath);

		if(!insertedInstancePath){
			// 新規の場合
			return challangeInstancePath;
		}
		if(!insertedInstancePath.match(/^([\S]+)\@([0-9]+)$/)){
			console.error('FATAL: Instance path has an illegal format.', insertedInstancePath);
			return challangeInstancePath;
		}

		var insertedInstancePathPath = RegExp.$1;
		var insertedInstancePathIdx = Number(RegExp.$2);

		var idx = challangeInstancePath.indexOf(insertedInstancePathPath+'@');
		if( idx !== 0 ){
			// console.log('--- 影響なし', challangeInstancePath);
			return challangeInstancePath;
		}
		var tmpchallangeInstancePathStr = challangeInstancePath.substring((insertedInstancePathPath+'@').length);
		if(!tmpchallangeInstancePathStr.match(/^([0-9]+)([\S]*)$/)){
			// console.log('--- 影響なし', challangeInstancePath);
			return challangeInstancePath;
		}
		var challangeInstancePathIdx = Number(RegExp.$1);
		var challangeInstancePathPath = RegExp.$2;
		if( challangeInstancePathIdx >= insertedInstancePathIdx ){
			var rtn = insertedInstancePathPath + '@' + (challangeInstancePathIdx+1) + challangeInstancePathPath;
			// console.log('+++ 影響あり', rtn);
			return rtn;
		}

		// console.log('--- 影響なし', challangeInstancePath);
		return challangeInstancePath;
	}

}
