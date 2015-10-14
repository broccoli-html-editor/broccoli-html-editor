# broccoli-html-editor

_broccoli-html-editor_ は、GUIベースのHTMLエディタライブラリです。

## インストール - Install

```
$ npm install broccoli-html-editor --save
```

## 使い方 - Usage

### サーバー側 - Server side JavaScript (NodeJS)

```js
var Broccoli = require('broccoli-html-editor');
var broccoli = new Broccoli({
	'paths_module_template': {
		'testMod1': '/realpath/to/modules1/',
		'testMod2': '/realpath/to/modules2/'
	} ,
	'documentRoot': '/realpath/to/www/htdocs/',// realpath
	'pathHtml': '/editpage/index.html',
	'pathResourceDir': '/editpage/index_files/resources/',
	'realpathDataDir':  '/realpath/to/www/htdocs/editpage/index_files/guieditor.ignore/',
	'customFields': {
		'custom1': function(broccoli){
			// カスタムフィールドを実装します。
			// この関数は、fieldBase.js を基底クラスとして継承します。
			// customFields オブジェクトのキー(ここでは custom1)が、フィールドの名称になります。
		}
	} ,
	'bindTemplate': function(htmls, callback){
		var fin = '';
		fin += '<!DOCTYPE html>'+"\n";
		fin += '<html>'+"\n";
		fin += '    <head>'+"\n";
		fin += '        <title>sample page</title>'+"\n";
		fin += '    </head>'+"\n";
		fin += '    <body>'+"\n";
		fin += '        <div data-contents="main">'+"\n";
		fin += htmls['main']+"\n";
		fin += '        </div><!-- /main -->'+"\n";
		fin += '        <div data-contents="secondly">'+"\n";
		fin += htmls['secondly']+"\n";
		fin += '        </div><!-- /secondly -->'+"\n";
		fin += '    </body>'+"\n";
		fin += '</html>';

		callback(fin);
		return;
	}

});

// 初期化を実行してください。
broccoli.init(function(){
	console.log('standby!');
});

```

クライアントサイドに設定した GPI(General Purpose Interface) Bridge から送られてきたリクエストは、`broccoli.gpi` に渡してください。
GPIは、処理が終わると、第3引数の関数をコールバックします。
コールバック関数の引数を、クライアント側へ返却してください。

```js
broccoli.gpi(
	bridge.api,
	bridge.options,
	function(result){
		callback(result);
	}
);
```


### クライアント側 - Client side JavaScript

```html
<div id="canvas" data-broccoli-preview="/path/to/your_preview.html"></div>
<div id="palette"></div>

<!-- jQuery -->
<script src="/path/to/jquery.js"></script><!-- <- option; not required -->

<!-- broccoli -->
<link rel="stylesheet" href="node_modules/broccoli-html-editor/client/dist/broccoli.min.css" />
<script src="node_modules/broccoli-html-editor/client/dist/broccoli.min.js"></script>
<script>
var broccoli = new Broccoli();
broccoli.init(
	{
		'elmCanvas': document.getElementById('canvas'),
		'elmModulePalette': document.getElementById('palette'),
		'contents_area_selector': '[data-contents]',
			// ↑編集可能領域を探すためのクエリを設定します。
			// 　この例では、data-contents属性が付いている要素が編集可能領域として認識されます。
		'contents_bowl_name_by': 'data-contents',
			// ↑bowlの名称を、data-contents属性値から取得します。
		'customFields': {
			'custom1': function(broccoli){
				// カスタムフィールドを実装します。
				// この関数は、fieldBase.js を基底クラスとして継承します。
				// customFields オブジェクトのキー(ここでは custom1)が、フィールドの名称になります。
			}
		},
		'gpiBridge': function(api, options, callback){
			// GPI(General Purpose Interface) Bridge
			// broccoliは、バックグラウンドで様々なデータ通信を行います。
			// GPIは、これらのデータ通信を行うための汎用的なAPIです。
			socket.send(
				'broccoli',
				{
					'api': 'gpiBridge' ,
					'bridge': {
						'api': api ,
						'options': options
					}
				} ,
				function(rtn){
					// console.log(rtn);
					callback(rtn);
				}
			);
			return;
		}
	} ,
	function(){
		// 初期化が完了すると呼びだされるコールバック関数です。

		$(window).resize(function(){
			// このメソッドは、canvasの再描画を行います。
			// ウィンドウサイズが変更された際に、UIを再描画するよう命令しています。
			broccoli.redraw();
		});

		callback();
	}
);
</script>
```

## モジュールの開発 - developing HTML module

coming soon.

## カスタムフィールドの開発 - developing custom field

サーバー側、クライアント側 ともに、オプション `customFields[fieldName]` にメソッドを定義します。

このメソッドは、 `libs/fieldBase.js` を基底クラスとして継承します。

- bind(fieldData, mode, mod, callback) - データをバインドする (Server Side)
- mkPreviewHtml(fieldData, mod, callback) - プレビュー用の簡易なHTMLを生成する (Server Side/Client Side)
- normalizeData(fieldData, mode) - データを正規化する (Server Side/Client Side)
- mkEditor( mod, data, elm, callback ) - エディタUIを生成 (Client Side)
- duplicateData( data, callback ) - データを複製する (Client Side)
- saveEditorContent( elm, data, mod, callback ) - エディタUIで編集した内容を保存 (Client Side)


## for developer

### build

```
$ gulp
```

### build with watching edit change

```
$ gulp watch
```

### server up

```
$ npm run up
```

### test

```
$ npm test
```

## ライセンス - License

MIT License


## 作者 - Author

- (C)Tomoya Koyanagi <tomk79@gmail.com>
- website: <http://www.pxt.jp/>
- Twitter: @tomk79 <http://twitter.com/tomk79/>
