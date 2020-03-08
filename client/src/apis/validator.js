/**
 * validate.js
 */
module.exports = function(broccoli){
	var Validator = require('validatorjs');
	var validatorLang = [];
	validatorLang.en = require('../../../node_modules/validatorjs/src/lang/en.js');
	validatorLang.ja = require('../../../node_modules/validatorjs/src/lang/ja.js');
	// console.log(broccoli.options.lang);
	// console.log(validatorLang);
	Validator.useLang('en');
	if( broccoli.options.lang && validatorLang[broccoli.options.lang] ){
		Validator.setMessages('en', validatorLang[broccoli.options.lang]);
	}

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
				var validation = new Validator({
					'target': value
				}, {
					'target': validators
				});
				if( !validation.passes() ){
					errorMsgs = errorMsgs.concat(validation.errors.get('target'));
				}
				rlv();

			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				callback( errorMsgs );
			}); })
		;
		return;
	}
}
