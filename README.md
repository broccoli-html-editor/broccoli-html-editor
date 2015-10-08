# broccoli

## Usage

### NodeJS

```js
var Broccoli = require('broccoli');
var broccoli = new Broccoli({
	'Mod1': '/path/to/moduleset1/',
	'Mod2': '/path/to/moduleset2/',
	...
});

```

### Browser JS

```html
<div id="canvas" data-broccoli-preview="/path/to/your_preview.html"></div>
<div id="palette"></div>

<!-- broccoli -->
<script src="client/dist/broccoli.min.js"></script>
<script>
var broccoli = new Broccoli({
	'elmCanvas': document.getElementById('canvas'),
	'elmModulePalette': document.getElementById('palette'),
	'contents_area_selector': '[data-contents]',
	'contents_bowl_name_by': 'data-contents',
	'gpiBridge': function(api, options, callback){
		// General Purpose Interface Bridge
		// サーバーサイドへリクエストを送信する汎用的なAPIです。
		// 使用しているフレームワークやシステムの要件に合わせて、実装してください。
		callback(rtn);
		return;
	}
},function(){
	console.log('broccoli standby.');
});
</script>
```
