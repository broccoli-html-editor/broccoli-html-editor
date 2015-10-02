/**
 * API: broccoli
 */
module.exports = function( data, callback, main, socket ){
	var Broccoli = require(__dirname+'/../../../../libs/broccoli.js');

	setTimeout(function(){
		data.messageByBackend = 'callbacked by backend API "broccoli".';
		callback(data);
	}, 1000);
	return;
}
