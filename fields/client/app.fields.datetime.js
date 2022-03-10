module.exports = function(broccoli){

	var $ = require('jquery');

	/**
	 * エディタUIを生成 (Client Side)
	 */
	this.mkEditor = function( mod, data, elm, callback ){

		var presetString = data;
		if( typeof(presetString) === typeof({}) && presetString.src !== undefined ){
			presetString = presetString.src;
		}

		mod.step = mod.step || "min";
		var $rtn = $('<div>');
		$rtn.css({'display': 'flex'});

		var valDate, valTime;
		if( presetString ){
			valDate = dateFormat('Y-m-d', presetString);
			valTime = dateFormat('H:i', presetString);
			valTimeSec = dateFormat('H:i:s', presetString);
		}

		var $date = $('<input type="date" class="px2-input">')
			.attr({ "name": mod.name + "__date" })
			.val(valDate)
			.css({'width':'180px', 'max-width': '100%'});
		var $time = $('<input type="time" class="px2-input">')
			.attr({ "name": mod.name + "__time" })
			.val(valTime)
			.css({'width':'130px', 'max-width': '100%'});

		if( mod.step == "date" ){
			$time.css({"display": "none"});
		}else if( mod.step == "sec" ){
			$time.val(valTimeSec);
			$time.attr({"step": 1});
		}

		$rtn
			.append( $date )
			.append( $time )
		;

		$(elm).html($rtn);

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback();
		}); });
		return this;
	}

	/**
	 * エディタUIで編集した内容を保存 (Client Side)
	 */
	this.saveEditorContent = function( elm, data, mod, callback, options ){
		options = options || {};
		options.message = options.message || function(msg){};//ユーザーへのメッセージテキストを送信
		var $dom = $(elm);
		var valDate = $dom.find('input[type=date]').val();
		var valTime = $dom.find('input[type=time]').val();
		var src = '';
		if( valDate && valTime ){
			src = valDate + ' ' + valTime;
		}else if( valDate ){
			src = valDate + ' 00:00:00';
		}
		src = JSON.parse( JSON.stringify(src) );

		var finData = {
			"src": src
		};

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback(finData);
		}); });
		return this;
	}


	function dateFormat(format, date){
		var tmpDate = new Date(date);
		format = format.replace(/Y/g, tmpDate.getFullYear());
		format = format.replace(/m/g, ('0' + (tmpDate.getMonth() + 1)).slice(-2));
		format = format.replace(/d/g, ('0' + tmpDate.getDate()).slice(-2));
		format = format.replace(/H/g, ('0' + tmpDate.getHours()).slice(-2));
		format = format.replace(/i/g, ('0' + tmpDate.getMinutes()).slice(-2));
		format = format.replace(/s/g, ('0' + tmpDate.getSeconds()).slice(-2));
		return format;
	}
}
