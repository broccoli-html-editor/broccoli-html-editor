/**
 * validate.js
 */
module.exports = function(broccoli){
	var it79 = require('iterate79');

	this.validate = function(value, validators, callback){
		callback = callback || function(){};
		var errorMsgs = [];
		// errorMsgs.push('エラーがあります。');
		if( !validators ){
			callback([]);
			return;
		}

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				it79.ary(
					validators,
					function(it2, row, idx){
						if( row == 'required' ){
							if( !value.length ){
								errorMsgs.push('この項目は必ず入力してください。');
							}
						}
						it2.next();
					},
					function(){
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				callback( errorMsgs );
			}); })
		;
		return;
	}
}
