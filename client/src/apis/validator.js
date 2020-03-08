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

	this.validate = function(attr, value, rules, mod, callback){
		callback = callback || function(){};
		var errorMsgs = [];
		// errorMsgs.push('エラーがあります。');
		if( !rules ){
			callback([]);
			return;
		}
		if( !attr ){
			attr = mod.name;
		}
		if( !attr ){
			attr = 'targer';
		}

		var validateData = {};
		validateData[attr] = value;
		var validateRules = {};
		validateRules[attr] = rules;

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				var validation = new Validator(validateData, validateRules);
				if( !validation.passes() ){
					errorMsgs = errorMsgs.concat(validation.errors.get(attr));
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
