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
		conditions.maxWidth = conditions.maxWidth || 1600;
		conditions.maxHeight = conditions.maxHeight || 2400;
		conditions.quality = conditions.quality || 0.92;
		callback = callback || function(){};

		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		var img = new Image();
		img.onload = function() {
			var calcedImageSize = calcResizedWidthHeight(img.width, img.height, conditions);
			canvas.width = calcedImageSize.w;
			canvas.height = calcedImageSize.h;

			// img要素をcanvasに転写する
			ctx.drawImage(img, 0, 0, calcedImageSize.w, calcedImageSize.h);

			var newDataUri = canvas.toDataURL(conditions.mimeType, conditions.quality);

			// fetch して リサイズ後の画像容量を取得する
			fetch( newDataUri )
				.then( function(res){
					return res.blob();
				} )
				.then( function(blob){
					callback( {
						dataUri: newDataUri,
						size: blob.size,
						width: calcedImageSize.w,
						height: calcedImageSize.h,
						mimeType: conditions.mimeType,
						ext: mimeTypeToExt(conditions.mimeType),
					} );
				} );

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

	/**
	 * mimeType から 拡張子を得る
	 */
	function mimeTypeToExt( mimeType ){
		switch( mimeType ){
			case 'image/png':
				return 'png';
			case 'image/jpeg':
			case 'image/jpg':
			case 'image/jpe':
				return 'jpg';
			case 'image/gif':
				return 'gif';
			case 'image/webp':
				return 'webp';
			case 'image/svg+xml':
				return 'svg';
		}
		return 'unknown';
	}
}
