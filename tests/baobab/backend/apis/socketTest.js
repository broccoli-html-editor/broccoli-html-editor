/**
 * API: socketTest
 */
module.exports = function( data, callback, main, socket ){
	// delete(require.cache[require('path').resolve(__filename)]);
	console.log(data);
	console.log(data.message);
	// data.main = main;
	setTimeout(function(){
		data.messageByBackend = 'callbacked by backend API "socketTest".';
		// socket.send('showSocketTest', data);
		callback(data);
	}, 1000);
	return;
}
