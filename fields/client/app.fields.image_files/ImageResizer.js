/**
 * Image resizer
 */
module.exports = function(){

	/**
	 * 画像をリサイズする
	 */
	this.resizeImage = function(imgData, conditions, callback) {
		conditions = conditions || {};
		conditions.mimeType = conditions.mimeType || "image/png";
		conditions.maxWidth = conditions.maxWidth || 160;
		conditions.maxHeight = conditions.maxHeight || 240;
		callback = callback || function(){};

		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		var img = new Image();
		img.onload = function() {
			var calcedImageSize = calcResizedWidthHeight(img.width, img.height, conditions);
			canvas.width = calcedImageSize.w;
			canvas.height = calcedImageSize.h;
			ctx.drawImage(img, 0, 0, calcedImageSize.w, calcedImageSize.h);
			callback( canvas.toDataURL(conditions.mimeType) );
		}
		img.src = imgData;

		return;
	}

	/**
	 * リサイズ後の画角を計算する
	 */
	function calcResizedWidthHeight( origW, origH, conditions ){
		var rtn = {
			w: origW,
			h: origH,
		};

		if( conditions.maxWidth && origW > conditions.maxWidth ){
			// 幅が規定を超える場合、幅合わせでリサイズ
			rtn.w = conditions.maxWidth;
			rtn.h = (function(){
				return origH / origW * rtn.w;
			})();
		}

		if( conditions.maxHeight && rtn.h > conditions.maxHeight ){
			// 高さが規定を超える場合、高さ合わせでリサイズ
			rtn.h = conditions.maxHeight;
			rtn.w = (function(){
				return origW / origH * rtn.h;
			})();
		}

		return rtn;
	}
}
