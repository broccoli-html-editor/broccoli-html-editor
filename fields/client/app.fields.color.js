module.exports = function(broccoli){

	var $ = require('jquery');
	var utils79 = require('utils79');
	var Pickr = require('@simonwep/pickr/dist/pickr.es5.min');
	var Promise = require('es6-promise').Promise;


	/**
	 * プレビュー用の簡易なHTMLを生成する (Client Side)
	 * InstanceTreeViewで利用する。
	 */
	this.mkPreviewHtml = function( fieldData, mod, callback ){
		var value = '';
		var rtn = '';
		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){

				// サーバーサイドの bind() に相当する処理
				try {
					if( typeof(fieldData)===typeof({}) && fieldData.src ){
						value = utils79.toStr(fieldData.src);
					}else{
						value = utils79.toStr(fieldData);
					}
				} catch (e) {
					console.error('color field: Unable to read value.', fieldData, e);
					value = '[error]';
				}
				rlv();

			}); })
			.then(function(){ return new Promise(function(rlv, rjt){

				// console.log(value);

				var $rtn = $('<div>');

				var $colorChip = $('<span>')
					.css({
						"display": "inline-block",
						"background-color": value,
						"border": "1px solid #fff",
						"width": "4em",
						"height": "1.5em",
						"margin-right": "0.5em"
					});
				$rtn.append($colorChip);

				var $content = $('<span>').append(value);
				$content.find('*').each(function(){
					$(this)
						.removeAttr('style') //スタイル削除しちゃう
					;
				});
				$content.find('style').remove(); // styleタグも削除しちゃう
				$content.find('script').remove(); // scriptタグも削除しちゃう

				$rtn.append($content);

				rtn = $rtn.html();
				rlv();

			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				callback( rtn );
			}); })
		;
		return;
	}

	/**
	 * エディタUIを生成 (Client Side)
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var rows = 12;
		if( mod.rows ){
			rows = mod.rows;
		}

		var presetString = data;
		if( typeof(presetString) === typeof({}) && presetString.src !== undefined ){
			presetString = presetString.src;
		}

		var $formElm;
		var $Cleared = $('<a>');
		var $PickrW = $('<div>');
		var $Pickr = $('<div>');
		var $wrapper = $('<div>');
		var $wrapper_c1 = $('<div>');
		var $wrapper_c2 = $('<div>');
		$wrapper.append($wrapper_c1).append($wrapper_c2);

		$wrapper.css({
			'display': 'flex',
		});
		$wrapper_c2.css({
			'font-size': '24px',
			'padding-left': '20px',
			'font-weight': 'bold',
		});

		function updateIcon(){
			var val = $formElm.val();
			if( val ){
				$Cleared.hide();
				$PickrW.show();
				$wrapper_c2.text(val);
			}else{
				$PickrW.hide();
				$Cleared.show();
				$wrapper_c2.text('なし');
			}
		}

		$formElm = $('<input type="hidden">')
			.attr({
				"name": mod.name
			})
			.val(presetString)
		;

		$(elm).append($formElm);

		// Initialize Pickr
		$wrapper_c1.append($PickrW.append($Pickr));
		var pickr = new Pickr({
			el: $Pickr.get(0),
			container: $wrapper_c1.get(0),
			theme: 'classic', // or 'monolith', or 'nano'
			default: (presetString || '#ffffff00'),
			autoReposition: false,
			closeOnScroll: true,
			inline: false,
			showAlways: false,

			swatches: [
				'rgba(244, 67, 54, 1)',
				'rgba(233, 30, 99, 0.95)',
				'rgba(156, 39, 176, 0.9)',
				'rgba(103, 58, 183, 0.85)',
				'rgba(63, 81, 181, 0.8)',
				'rgba(33, 150, 243, 0.75)',
				'rgba(3, 169, 244, 0.7)',
				'rgba(0, 188, 212, 0.7)',
				'rgba(0, 150, 136, 0.75)',
				'rgba(76, 175, 80, 0.8)',
				'rgba(139, 195, 74, 0.85)',
				'rgba(205, 220, 57, 0.9)',
				'rgba(255, 235, 59, 0.95)',
				'rgba(255, 193, 7, 1)'
			],

			components: {

				// Main components
				preview: true,
				opacity: true,
				hue: true,

				// Input / output Options
				interaction: {
					hex: true,
					rgba: true,
					hsla: true,
					hsva: true,
					cmyk: true,
					input: true,
					cancel: true,
					clear: true,
					save: true
				}
			}
		}).on('save', function(color, instance){
			pickr.hide();
			var val = '';
			if(pickr.getSelectedColor()){
				var hexa = pickr.getColor().toHEXA();
				// console.log(hexa);
				val = hexa.toString();
			}
			$formElm.val(val);
			updateIcon();
		}).on('change', function(color, instance){
			console.log('++ change', color, instance);
		}).on('clear', function(instance) {
			console.log('++ clear', instance);
		}).on('cancel', function(instance) {
			console.log('++ cancel', instance);
		});

		$Cleared
			.text('なし')
			.attr({
				"href": "javascript:;"
			})
			.css({
				'display': 'block',
				'width': '32px',
				'height': '32px',
				'border': '1px solid #999',
				'border-radius': '5px',
				'text-align': 'center',
				'color': '#999999',
				'font-size': '9px',
			})
			.on('click', function(){
				pickr.show();
				return false;
			});
		$wrapper_c1.append($Cleared);


		updateIcon();

		$(elm).append($wrapper);

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback();
		}); });
		return;
	}

	/**
	 * エディタUIで編集した内容を保存 (Client Side)
	 */
	this.saveEditorContent = function( elm, data, mod, callback, options ){
		options = options || {};
		options.message = options.message || function(msg){};//ユーザーへのメッセージテキストを送信
		var $dom = $(elm);
		var src = $dom.find('input[type=hidden]').val();
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
