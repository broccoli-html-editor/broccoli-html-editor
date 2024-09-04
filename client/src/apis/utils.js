/**
 * utils
 * ユーティリティ
 */
module.exports = function(broccoli){
	const $ = require('jquery');

	/**
	 * インスタンスBを削除した影響を受けたあとのインスタンスAのパスを計算する
	 */
	this.getInstancePathWhichWasAffectedRemovingInstance = function( challangeInstancePathTo, remmovedInstancePath ){

		// 移動・挿入後の選択状態を更新する際、
		// 移動元が抜けることで移動先の番号が変わる場合に、選択状態が乱れる。
		// この関数では、移動先のパスを計算し直し、移動したインスタンス自身の新しいパスを返す。
		// これを `broccoli.selectInstance()` すれば、移動・挿入成功後の選択状態を自然な結果にできる。
		if(!remmovedInstancePath){
			// 新規の場合
			return challangeInstancePathTo;
		}
		if(!remmovedInstancePath.match(/^([\S]+?)\@([0-9]+)$/)){
			console.error('FATAL: Instance path has an illegal format.', remmovedInstancePath);
			return challangeInstancePathTo;
		}

		var remmovedInstancePathPath = RegExp.$1;
		var remmovedInstancePathIdx = Number(RegExp.$2);

		var idx = challangeInstancePathTo.indexOf(remmovedInstancePathPath+'@');
		if( idx !== 0 ){
			return challangeInstancePathTo;
		}
		var tmpchallangeInstancePathToStr = challangeInstancePathTo.substring((remmovedInstancePathPath+'@').length);
		if(!tmpchallangeInstancePathToStr.match(/^([0-9]+)([\S]*?)$/)){
			return challangeInstancePathTo;
		}
		var challangeInstancePathToIdx = Number(RegExp.$1);
		var challangeInstancePathToPath = RegExp.$2;
		if( challangeInstancePathToIdx > remmovedInstancePathIdx ){
			var rtn = remmovedInstancePathPath + '@' + (challangeInstancePathToIdx-1) + challangeInstancePathToPath;
			return rtn;
		}

		return challangeInstancePathTo;
	}

	/**
	 * インスタンスBを挿入した影響を受けたあとのインスタンスAのパスを計算する
	 */
	this.getInstancePathWhichWasAffectedInsertingInstance = function( challangeInstancePath, insertedInstancePath ){

		if(!insertedInstancePath){
			// 新規の場合
			return challangeInstancePath;
		}
		if(!insertedInstancePath.match(/^([\S]+?)\@([0-9]+)$/)){
			console.error('FATAL: Instance path has an illegal format.', insertedInstancePath);
			return challangeInstancePath;
		}

		var insertedInstancePathPath = RegExp.$1;
		var insertedInstancePathIdx = Number(RegExp.$2);

		var idx = challangeInstancePath.indexOf(insertedInstancePathPath+'@');
		if( idx !== 0 ){
			return challangeInstancePath;
		}
		var tmpchallangeInstancePathStr = challangeInstancePath.substring((insertedInstancePathPath+'@').length);
		if(!tmpchallangeInstancePathStr.match(/^([0-9]+)([\S]*?)$/)){
			return challangeInstancePath;
		}
		var challangeInstancePathIdx = Number(RegExp.$1);
		var challangeInstancePathPath = RegExp.$2;
		if( challangeInstancePathIdx >= insertedInstancePathIdx ){
			var rtn = insertedInstancePathPath + '@' + (challangeInstancePathIdx+1) + challangeInstancePathPath;
			return rtn;
		}

		return challangeInstancePath;
	}

	/**
	 * プレビューに表示するHTMLを解毒する
	 *
	 * @param {*} html	HTML
	 * @param {*} resDb	リソースDB
	 * @returns 
	 */
	this.sanitizePreviewHtml = function(html, resDb){
		html = (function(src){
			for(var resKey in resDb){
				try {
					src = src.split('{broccoli-html-editor-resource-baser64:{'+resKey+'}}').join(resDb[resKey].base64);
				} catch (e) {
				}
			}
			return src;
		})(html);

		const $html = $('<div>').html(html);
		$html.find('*').each(function(){
			$(this).removeAttr('style'); // スタイルを削除
		});
		$html.find('style').remove(); // styleタグも削除
		$html.find('script').remove(); // scriptタグも削除

		// 無効化するタグ
		[
			'a',
			'button',
			'big',
			'small',
			'sup',
			'sub',
			'input',
			'textarea',
			'select',
			'option',
			'label',
			'form',
		].forEach((elementName, index)=>{
			$html.find(elementName).each((index, elm)=>{
				elm.outerHTML = elm.innerHTML;
			});
		});

		// div に置換するタグ
		[
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
		].forEach((elementName, index)=>{
			$html.find(elementName).each((index, elm)=>{
				elm.outerHTML = `<div>${elm.innerHTML}</div>`;
			});
		});

		// JavaScriptのイベントを発火させる属性を削除する
		$html.find('*').each(function(){
			const $this = $(this);
			$.each(this.attributes, function(i, attrib){
				if(attrib.name.match(/^on/i)){
					$this.removeAttr(attrib.name);
				}
			});
		});

		return $html.html();
	}
}
