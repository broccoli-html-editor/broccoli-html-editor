/**
 * finalize.js
 */
module.exports = function(html, callback, supply){
	delete(require.cache[require('path').resolve(__filename)]);
	var data = supply['data']; // モジュールに入力されたデータが供給される。
	var cheerio = supply['cheerio'];// ← broccoli-html-editor からリソースとして供給される "cheerio" を利用.

	html = '<p class="finalized">finalized</p>'+html+' - '+JSON.stringify(data)+'<p class="finalized">finalized</p>';

	var $ = cheerio.load(html, {decodeEntities: false});
	$('.finalized').eq(0).css({ 'color': '#f00' });
	$('.finalized').eq(1).css({ 'color': '#00f' });
	html = $.html();
	// console.log(html);

	// 完成したHTMLは、callback() に渡して返します。
	callback(html);
	return true;
}
