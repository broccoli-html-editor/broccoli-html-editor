# broccoli-html-editor

_broccoli-html-editor_ は、GUIベースのHTMLエディタライブラリです。
断片化されたHTMLの部品(モジュール)をドラッグ＆ドロップ操作で組み合わせて、ウェブページを構成できます。

## インストール - Install

```
$ npm install broccoli-html-editor --save
```


## 使い方 - Usage

### サーバー側 - Server side JavaScript (NodeJS)

次の例は、 `express` を使用した実装例です。

```js
var express = require('express'),
	app = express();
var server = require('http').Server(app);

app.use( require('body-parser')({"limit": "1024mb"}) );
app.use( '/path/to/jquery', express.static( 'node_modules/jquery/dist/' ) ); // <- option; not required
app.use( '/path/to/broccoli-html-editor', express.static( 'node_modules/broccoli-html-editor/client/dist/' ) );
app.use( '/apis/broccoli', function(req, res, next){

	var Broccoli = require('broccoli-html-editor');
	var broccoli = new Broccoli();

	// 初期化を実行してください。
	broccoli.init(
		{
			'appMode': 'web', // 'web' or 'desktop'. default to 'web'
			'paths_module_template': {
				'testMod1': '/realpath/to/modules1/' ,
				'testMod2': '/realpath/to/modules2/'
			} ,
			'documentRoot': '/realpath/to/www/htdocs/', // realpath
			'pathHtml': '/path/to/your_preview.html',
			'pathResourceDir': '/path/to/your_preview_files/resources/',
			'realpathDataDir':  '/realpath/to/www/htdocs/path/to/your_preview_files/guieditor.ignore/',
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
			},
			'log': function(msg){
				// エラー発生時にコールされます。
				// msg を受け取り、適切なファイルへ出力するように実装してください。
				fs.writeFileSync('/path/to/error.log', {}, msg);
			}
		},
		function(){
			// クライアントサイドに設定した GPI(General Purpose Interface) Bridge から送られてきたリクエストは、
			// `broccoli.gpi` に渡してください。
			// GPIは、処理が終わると、第3引数の関数をコールバックします。
			// コールバック関数の引数を、クライアント側へ返却してください。
			broccoli.gpi(
				JSON.parse(req.body.api),
				JSON.parse(req.body.options),
				function(value){
					res
						.status(200)
						.set('Content-Type', 'text/json')
						.send( JSON.stringify(value) )
						.end();
				}
			);
		}
	);
} );
app.use( express.static( '/path/to/htdocs/' ) );
server.listen( 8080, function(){
	console.log('server-standby');
} );
```

APIの一覧は[こちらを参照](docs/api_server.md)ください。


### クライアント側 - Client side JavaScript

```html
<div id="canvas" data-broccoli-preview="http://127.0.0.1:8081/path/to/your_preview.html"></div>
<div id="palette"></div>
<div id="instanceTreeView"></div>
<div id="instancePathView"></div>

<!-- jQuery -->
<script src="/path/to/jquery/jquery.js"></script><!-- <- option; not required -->

<!-- broccoli -->
<script src="/path/to/broccoli-html-editor/broccoli.min.js"></script>
<script>
var broccoli = new Broccoli();
broccoli.init(
	{
		'elmCanvas': document.getElementById('canvas'),
		'elmModulePalette': document.getElementById('palette'),
		'elmInstanceTreeView': document.getElementById('instanceTreeView'),
		'elmInstancePathView': document.getElementById('instancePathView'),
		'lang': 'en', // language
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
			$.ajax({
				"url": "/apis/broccoli",
				"type": 'post',
				'data': {
					'api': JSON.stringify(api) ,
					'options': JSON.stringify(options)
				},
				"success": function(data){
					callback(data);
				}
			});
			return;
		},
		'onClickContentsLink': function( uri, data ){
			alert(uri + ' へ移動');
			console.log(data);
			return false;
		},
		'onMessage': function( message ){
			// ユーザーへ知らせるメッセージを表示する
			console.info('message: '+message);
		}
	} ,
	function(){
		// 初期化が完了すると呼びだされるコールバック関数です。

		$(window).on('resize', function(){
			// このメソッドは、canvasの再描画を行います。
			// ウィンドウサイズが変更された際に、UIを再描画するよう命令しています。
			broccoli.redraw();
		});

	}
);
</script>
```

### プレビュー用ウェブサーバー - Web Server for preview

編集画面上のプレビューHTMLの最後に、次のスクリプトコードを埋め込んでください。
`'http://127.0.0.1:8080'` には、broccoli-html-editor の編集画面が置かれるサーバーの origin を設定してください。

```html
<script data-broccoli-receive-message="yes">
window.addEventListener('message',(function() {
return function f(event) {
if(event.origin!='http://127.0.0.1:8080'){return;}// <- check your own server's origin.
var s=document.createElement('script');
document.querySelector('body').appendChild(s);s.src=event.data.scriptUrl;
window.removeEventListener('message', f, false);
}
})(),false);
</script>
```

APIの一覧は[こちらを参照](docs/api_client.md)ください。



## モジュールの開発 - developing HTML module

coming soon.


## カスタムフィールドの開発 - developing custom field

サーバー側、クライアント側 ともに、オプション `customFields[fieldName]` にメソッドを定義します。

このメソッドは、サーバーサイドは `libs/fieldBase.js` を、クライアントサイドは `client/src/apis/fieldBase.js` を、基底クラスとして継承します。

- server side
	- bind(fieldData, mode, mod, callback) - データをバインドする
	- resourceProcessor(path_orig, path_public, resInfo, callback) - リソースを加工する
	- gpi(options, callback) - GPI
- client side
	- normalizeData(fieldData, mode) - データを正規化する
	- mkPreviewHtml(fieldData, mod, callback) - プレビュー用の簡易なHTMLを生成する
	- mkEditor(mod, data, elm, callback) - エディタUIを生成
	- focus(elm, callback) - エディタUIにフォーカス
	- duplicateData(data, callback) - データを複製する
	- extractResourceId(data, callback) - データから使用するリソースのリソースIDを抽出する
	- validateEditorContent(elm, data, mod, callback) - エディタUIで編集した内容を検証する
	- saveEditorContent(elm, data, mod, callback) - エディタUIで編集した内容を保存
	- callGpi(options, callback) - GPIを呼び出す


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


## 更新履歴 - Change log

### broccoli-html-editor@0.1.0 (2017年4月20日)

- Node.js 0.x , io.js のサポートを中止。
- `broccoli.buildModuleCss()` が、SASSが使えない環境で異常終了する問題を修正。
- モジュールにscriptタグが含まれる場合に、編集画面では無効にするようになった。
- editWindow 内の moduleフィールドに「モジュールパレットから追加」ができるようになった。
- インスタンスのカット機能追加。
- インスタンスの範囲選択機能追加。
- その他幾つかの細かい修正。

### broccoli-html-editor@0.1.0-beta.11 (2017年1月18日)

- モジュール設定 `deprecated` を追加。非推奨のモジュールに `true` をセットすると、モジュールパレットに表示されなくなる。
- サーバーサイドに新しいAPI `broccoli.updateContents()` を追加。
- クライアントサイドの新しいフィールドAPI `validateEditorContent()` を追加。
- クライアントサイドの新しいオプション `lang` を追加。
- imageフィールドに、JPEG, PNG 画像の自動ロスレス圧縮機能を追加。
- imageフィールドに、ウェブ上のURLを直接参照できる機能を追加。
- imageフィールドに、クリップボード上の画像をペーストできる機能を追加。
- 既に使用されたモジュールに、後から selectフィールドを追加した場合に、 `default` が適用されない不具合を修正。
- モジュールの package, category にも `deprecated` フラグを追加。
- moduleフィールド、 loopフィールド でも `hidden`, ifフィールドでの分岐, echoフィールドからの出力 ができるようになった。
- buildCss() が、モジュールのCSSに含まれる `url()` を base64 に置き換えてビルドするようになった。
- finalize.js の第3引数に、ライブラリやリソースを供給する `supply` を追加。この中に含まれる `cheerio` を利用できるようになった。
- ライトボックス表示中のtabキーによるフォーカス操作を改善。ライトボックス以外の領域にフォーカスしないようにした。
- モジュールの `info.json` や `clip.json` がキャッシュされ、更新が反映されない場合がある問題を修正。
- モジュールテンプレート中の `{& ~~~~ &}` のあとに改行が続く場合、1つだけ削除するようになった。(テンプレートコードの可読性向上のため)
- CSS, JS のビルド結果を整形した。
- その他幾つかの細かい修正。

### broccoli-html-editor@0.1.0-beta.10 (2016年8月3日)

- selectフィールドに、オプション `"display": "radio"` を追加。ラジオボタン形式の入力欄を作成できるようになった。
- editWindow上 の loop appender をダブルクリック操作した後に表示が更新されない問題を修正。
- Ace Editor が有効な場合、同じ種類のフィールドが1つのモジュールに並んでいる場合に、最後の値がすべてに適用されてしまう不具合を修正。
- コピー＆ペースト操作時に、誤った操作ができてしまう不具合を修正。
- データ上のエラーで、誤ったモジュールが混入した場合に異常終了しないように修正。
- その他幾つかの細かい修正。

### broccoli-html-editor@0.1.0-beta.9 (2016年6月8日)

- editWindow 上で、moduleフィールドとloopフィールドの並べ替えができるようになった。
- Ace Editor を自然改行されるように設定した。
- Ace Editor で、書式に応じてテーマが変わるようにした。
- Ace Editor の文字サイズを最適化。
- 編集保存中のアニメーション追加。


### broccoli-html-editor@0.1.0-beta.8 (2016年4月27日)

- 埋め込み Ace Editor に対応。
- 1行のフィールドを textarea ではなく input[type=text] に変更。
- ドラッグ＆ドロップ操作が Firefox に対応した。
- loopモジュール内にモジュールが入る場合のデータが扱えない問題を修正。
- `postMessage()` に関する不具合を修正。


### broccoli-html-editor@0.1.0-beta.7 (2016年4月15日)

- imageフィールドに、ローカルディスク上の画像ファイルをドラッグ＆ドロップで登録できるようになった。
- imageフィールドが、画像のURL指定で登録できるようになった。
- moduleフィールドとloopフィールドの内容をリスト表示するようになった。
- サーバー側設定に appMode を追加
- appender に mouseover, mouseout したときの不自然な挙動を修正
- bootstrap アイコン を使用
- editWindow: アンカーのinputの前に # の表示をつけた
- コンテンツで html,body が height:100%; になっているときにプレビュー画面の高さ設定に失敗する問題を修正
- CSS調整: モジュールの README.md

### broccoli-html-editor@0.1.0-beta.6 (2016年3月23日)

- 編集エリアが無駄に縦に長くなる問題を修正
- instancePathView のレイアウト調整
- modulePalette のフィルター機能の振る舞いを改善
- appenderを選択できるようにした。
- panelクリックでinstanceTreeViewをフォーカスするようにした。
- bowl操作の制御調整
- instanceTreeView の bowl のデザイン修正

### broccoli-html-editor@0.1.0-beta.4 (2016年3月8日)

- リソース情報を含むコピー＆ペーストが可能になった。
- クリップモジュール機能を追加。


## ライセンス - License

MIT License


## 作者 - Author

- Tomoya Koyanagi <tomk79@gmail.com>
- website: <http://www.pxt.jp/>
- Twitter: @tomk79 <http://twitter.com/tomk79/>
