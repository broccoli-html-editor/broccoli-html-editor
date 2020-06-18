module.exports = function(broccoli){

	var Pickr = require('@simonwep/pickr/dist/pickr.es5.min');
	var pickr;

	/**
	 * エディタUIを生成 (Client Side)
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var rows = 12;
		if( mod.rows ){
			rows = mod.rows;
		}
		var $rtn = $('<div>'),
			$formElm
		;

		$formElm = $('<input type="color" class="form-control">')
			.attr({
				"name": mod.name
			})
			.val(data)
			.css({'width':'160px', 'max-width': '100%'})
		;
		$rtn.append( $formElm );

		$(elm).html($rtn);

		// Initialize Pickr
		pickr = new Pickr({
			el: $formElm.get(0),
			container: $rtn.get(0),
			theme: 'classic', // or 'monolith', or 'nano'
			default: data,
			autoReposition: false,
			closeOnScroll: true,

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
					clear: true,
					save: true
				}
			}
		}).on('save', function(color, instance){
			pickr.hide();
		}).on('change', function(color, instance){
			console.log('change', color, instance);
		});

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
		var src = $dom.find('input[type=color]').val();
		if(pickr){
			src = pickr.getColor().toHEXA().toString();
		}
		src = JSON.parse( JSON.stringify(src) );

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback(src);
		}); });
		return;
	}

}
