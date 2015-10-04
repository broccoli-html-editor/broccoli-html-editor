/**
 * API: broccoli
 */
module.exports = function( data, callback, main, socket ){
	delete(require.cache[require('path').resolve(__filename)]);

	data = data||{};
	callback = callback||function(){};
	var Broccoli = require('./../../../../libs/main.js');
	var broccoli = new Broccoli({
		'PlainHTMLElements': './testdata/PlainHTMLElements/',
		'testMod1': './testdata/modules1/',
		'testMod2': './testdata/modules2/'
	}, {
		'cd': __dirname+'/../../../'
	});

	if(data.api == 'getPackageList'){
		broccoli.getPackageList(function(list){
			callback(list);
		});
		return ;
	}

	setTimeout(function(){
		data.messageByBackend = 'callbacked by backend API "broccoli".';
		callback(data);
	}, 1000);
	return;
}
