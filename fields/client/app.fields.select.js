module.exports = function(broccoli){
	var utils79 = require('utils79');

	/**
	 * エディタUIを生成
	 */
	this.mkEditor = function( mod, data, elm, callback ){

		var $select = $('<select>');
		if( mod.options ){
			if(mod.display == 'radio'){
				// ラジオボタン
				$select = $('<div>')
					.css({'max-width':'100%'})
				;
				for( var idx in mod.options ){
					var $option = $('<label>')
						.css({
							'display': 'inline-block',
							'margin': '1px 4px',
							'padding': '0.3em 0.5em'
						})
						.append( $('<input>')
							.attr({
								"type":'radio',
								"name":mod.name,
								'value':mod.options[idx].value
							})
						)
						.append( $('<span>')
							.text(mod.options[idx].label)
						)
					;
					if( data==mod.options[idx].value ){
						$option.find('input').attr({
							'checked': 'checked'
						});
					}
					$select.append( $option );
				}
				// 選択されていなかったら default を選択。
				if( !$select.find('input[type=radio]:checked').length && mod.default ){
					$select.find('input[type=radio][value='+mod.default+']').attr({'checked':'checked'});
				}
				// それでも選択されていなかったら、最初の選択肢を選択。
				if( !$select.find('input[type=radio]:checked').length ){
					$select.find('input[type=radio]:first').attr({'checked':'checked'});
				}

			}else{
				// デフォルトはselectタグ
				$select = $('<select>')
					.attr({
						"name":mod.name
					})
					.css({
						'max-width':'100%'
					})
				;
				for( var idx in mod.options ){
					var $option = $('<option>')
						.attr({
							'value':mod.options[idx].value
						})
						.text(mod.options[idx].label)
					;
					if( data==mod.options[idx].value ){
						$option.attr({
							'selected': 'selected'
						});
					}
					$select.append( $option );
				}
			}
		}
		var rtn = $('<div>')
			.append( $select )
		;
		$(elm).html(rtn);

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback();
		}); });
		return;
	}

	/**
	 * エディタUIで編集した内容を保存
	 */
	this.saveEditorContent = function( elm, data, mod, callback ){
		var $dom = $(elm);
		var src = '';
		if(mod.display == 'radio'){
			src = $dom.find('input[type=radio]:checked').val();

			// 選択されていなかったら default を選択。
			if( src === undefined && mod.default ){
				src = mod.default;
			}
			// それでも選択されていなかったら、最初の選択肢を選択。
			if( src === undefined ){
				src = $dom.find('input[type=radio]:first').val();
			}

		}else{
			src = $dom.find('select').val();
		}
		src = JSON.parse( JSON.stringify(src) );
		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback(src);
		}); });
		return;
	}

}
