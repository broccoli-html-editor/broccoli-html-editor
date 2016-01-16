/**
 * finalize.js
 */
module.exports = function(html, callback){
	delete(require.cache[require('path').resolve(__filename)]);
	var cheerio = require('cheerio');

	html = '<p class="finalized">finalized</p>'+html+'<p class="finalized">finalized</p>';

	var $ = cheerio.load(html, {decodeEntities: false});
	$('.finalized').eq(0).css({ 'color': '#f00' });
	$('.finalized').eq(1).css({ 'color': '#00f' });
	html = $.html();

	// 完成したHTMLは、callback() に渡して返します。
	callback(html);
	return true;
}
