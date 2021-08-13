module.exports = function(broccoli){
	var utils79 = require('utils79');

	/**
	 * エディタUIを生成
	 */
	this.mkEditor = function( mod, data, elm, callback ){

		var presetString = data;
		if( typeof(presetString) === typeof({}) && presetString.src !== undefined ){
			presetString = presetString.src;
		}

		var $select = $('<select>').addClass('px2-input');
		if( mod.options ){
			if(mod.display == 'radio'){
				// ラジオボタン
				$select = $('<div>')
					.css({'max-width':'100%'})
				;
				for( var idx in mod.options ){
					var label = mod.lb.get('options.'+idx+'.label', mod.options[idx].label);
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
							.text(label)
						)
					;
					if( presetString==mod.options[idx].value ){
						$option.find('input').attr({
							'checked': 'checked'
						});
					}
					$select.append( $option );
				}
				// 選択されていなかったら default を選択。
				if( !$select.find('input[type=radio]:checked').length ){
					var defaultValue = mod.default;
					if( defaultValue === undefined ){
						defaultValue = '';
					}
				   $select.find('input[type=radio][value="'+defaultValue+'"]').attr({'checked':'checked'});
				}
				// それでも選択されていなかったら、最初の選択肢を選択。
				if( !$select.find('input[type=radio]:checked').length ){
					$select.find('input[type=radio]:first').attr({'checked':'checked'});
				}

			}else{
				// デフォルトはselectタグ
				$select = $('<select>')
					.addClass('px2-input')
					.attr({
						"name":mod.name
					})
					.css({
						'max-width':'100%'
					})
				;
				for( var idx in mod.options ){
					var label = mod.lb.get('options.'+idx+'.label', mod.options[idx].label);
					var $option = $('<option>')
						.attr({
							'value':mod.options[idx].value
						})
						.text(label)
					;
					if( presetString==mod.options[idx].value ){
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

		var finData = {
			"src": src
		};

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback(finData);
		}); });
		return;
	}

}
