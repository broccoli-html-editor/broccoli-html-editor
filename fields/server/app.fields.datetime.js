module.exports = function(broccoli){
	var php = require('phpjs');
	var utils79 = require('utils79');

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = '';
		var $format = 'Y-m-d H:i:s';
		if( mod.format ){
			$format = mod.format;
		}

		if(typeof(fieldData)===typeof({}) && fieldData.src ){
			rtn = utils79.toStr(fieldData.src);
			rtn = dateFormat( $format, rtn ); // ←日付フォーマット
			rtn = php.htmlspecialchars( rtn ); // ←HTML特殊文字変換
			rtn = rtn.replace(new RegExp('\r\n|\r|\n','g'), '<br />'); // ← 改行コードは改行タグに変換
		}else if(typeof(fieldData)===typeof('') && fieldData.length){
			rtn = utils79.toStr(fieldData);
			rtn = dateFormat( $format, rtn ); // ←日付フォーマット
			rtn = php.htmlspecialchars( rtn ); // ←HTML特殊文字変換
			rtn = rtn.replace(new RegExp('\r\n|\r|\n','g'), '<br />'); // ← 改行コードは改行タグに変換
		}

		if( mode == 'canvas' && !rtn.length ){
			rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;">('+broccoli.lb.get('ui_message.double_click_to_edit')+')</span>';
		}

		callback(rtn);
		return;
	}

	function dateFormat(format, date){
		var tmpDate = new Date(date);

		format = format.replace(/y/g, (''+tmpDate.getFullYear()).slice(-2)); // 年。2 桁の数字。
		format = format.replace(/Y/g, tmpDate.getFullYear()); // 年。4 桁の数字。

		format = format.replace(/m/g, ('0' + (tmpDate.getMonth() + 1)).slice(-2)); // 月。数字。先頭にゼロをつける。
		format = format.replace(/n/g, (tmpDate.getMonth() + 1)); // 月。数字。先頭にゼロをつけない。

		format = format.replace(/d/g, ('0' + tmpDate.getDate()).slice(-2)); // 日。二桁の数字（先頭にゼロがつく場合も）
		format = format.replace(/j/g, tmpDate.getDate()); // 日。先頭にゼロをつけない。

		var G = tmpDate.getHours();
		format = format.replace(/H/g, ('0' + G).slice(-2)); // 時。数字。24 時間単位。
		format = format.replace(/G/g, G); // 時。24時間単位。先頭にゼロを付けない。

		var g = G % 12;
		if(g === 0){ g = 12; }
		format = format.replace(/h/g, ('0' + g).slice(-2)); // 時。数字。12 時間単位。
		format = format.replace(/g/g, g); // 時。12時間単位。先頭にゼロを付けない。

		var a = (G < 12 ? 'am' : 'pm');
		var A = (G < 12 ? 'AM' : 'PM');
		format = format.replace(/a/g, a); // 午前または午後（小文字）
		format = format.replace(/A/g, A); // 午前または午後（大文字）

		format = format.replace(/i/g, ('0' + tmpDate.getMinutes()).slice(-2)); // 分。先頭にゼロをつける。
		format = format.replace(/s/g, ('0' + tmpDate.getSeconds()).slice(-2)); // 秒。先頭にゼロをつける。

		// PHP の dateformat に含まれないため割愛
		// format = format.replace(/xxxxxxx/g, tmpDate.getMinutes());
		// format = format.replace(/xxxxxxx/g, tmpDate.getSeconds());
		return format;
	}

}
