/**
 * validate.js
 */
module.exports = function(broccoli){
	var Validator = require('validatorjs');
	var validatorLang = [];
	validatorLang.en = require('../../../node_modules/validatorjs/src/lang/en.js');
	validatorLang.ja = require('../../../node_modules/validatorjs/src/lang/ja.js');

	Validator.useLang('en');
	if( broccoli.options.lang && validatorLang[broccoli.options.lang] ){
		Validator.setMessages('en', validatorLang[broccoli.options.lang]);
	}

	if( broccoli.options.customValidationRules ){
		for( var tmpRuleName in broccoli.options.customValidationRules ){
			Validator.registerAsync(tmpRuleName, broccoli.options.customValidationRules[tmpRuleName]);
		}
	}

	this.validate = function(attr, value, rules, mod, callback){
		callback = callback || function(){};
		var errorMsgs = [];
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
				
				validation.checkAsync(function(){
					rlv();
				}, function(){
					errorMsgs = errorMsgs.concat(validation.errors.get(attr));
					rlv();
				});
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				callback( errorMsgs );
			}); })
		;
		return;
	}
}
