# broccoli-html-editor

_broccoli-html-editor_ は、GUIベースのHTMLエディタライブラリです。
断片化されたHTMLの部品(モジュール)をドラッグ＆ドロップ操作で組み合わせて、ウェブページを構成できます。

## インストール - Install

```
$ composer require broccoli-html-editor/broccoli-html-editor
```


## 使い方 - Usage

### サーバー側 - Server side (PHP)

`/path/to/broccoli_api.php` にAPIを設置する例です。

```php
<?php
require_once('path/to/vendor/autoload.php');

$broccoli = new broccoliHtmlEditor\broccoliHtmlEditor();
$broccoli->init(
	array(
		'appMode': 'web', // 'web' or 'desktop'. default to 'web'
		'paths_module_template' => array(
			'testMod1' => '/realpath/to/modules1/' ,
			'testMod2' => '/realpath/to/modules2/'
		) ,
		'documentRoot' => '/realpath/to/www/htdocs/', // realpath
		'pathHtml' => '/path/to/your_preview.html',
		'pathResourceDir' => '/path/to/your_preview_files/resources/',
		'realpathDataDir' => '/realpath/to/www/htdocs/path/to/your_preview_files/guieditor.ignore/',
		'customFields' => array(
			// カスタムフィールドを実装します。
			// このクラスは、 `broccoliHtmlEditor\\fieldBase` を基底クラスとして継承します。
			// customFields のキー(ここでは custom1)が、フィールドの名称になります。
			'custom1' => 'broccoli_class\\field_custom1'
		) ,
		'bindTemplate' => function($htmls){
			$fin = '';
			$fin .= '<!DOCTYPE html>'."\n";
			$fin .= '<html>'."\n";
			$fin .= '    <head>'."\n";
			$fin .= '        <title>sample page</title>'."\n";
			$fin .= '    </head>'."\n";
			$fin .= '    <body>'."\n";
			$fin .= '        <div data-contents="main">'."\n";
			$fin .= $htmls['main']."\n";
			$fin .= '        </div><!-- /main -->'."\n";
			$fin .= '        <div data-contents="secondly">'."\n";
			$fin .= $htmls['secondly']."\n";
			$fin .= '        </div><!-- /secondly -->'."\n";
			$fin .= '    </body>'."\n";
			$fin .= '</html>';

			return $fin;
		},
		'log' => function($msg){
			// エラー発生時にコールされます。
			// msg を受け取り、適切なファイルへ出力するように実装してください。
			error_log('[ERROR HANDLED]'.$msg, 3, '/path/to/error.log');
		}
	)
);


$rtn = $broccoli->gpi(
	$_REQUEST['api'],
	json_decode($_REQUEST['options'], true)
);
echo json_encode($rtn);
exit;
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
				"url": "/path/to/broccoli_api.php",
				"type": 'post',
				'data': {
					'api': api ,
					'options': JSON.stringify(options)
				},
				"success": function(data){
					callback(data);
				}
			});
			return;
		},
		'clipboard': {
			// クリップボード操作の機能を拡張できます。
			'set': function( data, type ){
				// クリップボードにコピーする機能を実装してください。
			},
			'get': function( type ){
				// クリップボードからデータを取得する機能を実装してください。
			}
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
`'http://127.0.0.1:8080'` には、`broccoli-html-editor` の編集画面が置かれるサーバーの `origin` を設定してください。

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

サーバー側、クライアント側 ともに、オプション `customFields[fieldName]` に定義します。

このメソッドは、サーバーサイドは `broccoliHtmlEditor\fieldBase` を、クライアントサイドは `client/src/apis/fieldBase.js` を、基底クラスとして継承します。

- server side
	- bind($fieldData, $mode, $mod) - データをバインドする
	- resourceProcessor($path_orig, $path_public, $resInfo) - リソースを加工する
	- gpi($options) - GPI
- client side
	- normalizeData(fieldData, mode) - データを正規化する
	- mkPreviewHtml(fieldData, mod, callback) - プレビュー用の簡易なHTMLを生成する
	- mkEditor(mod, data, elm, callback) - エディタUIを生成
	- focus(elm, callback) - エディタUIにフォーカス
	- duplicateData(data, callback) - データを複製する
	- extractResourceId(data, callback) - データから使用するリソースのリソースIDを抽出する
	- validateEditorContent(elm, data, mod, callback) - エディタUIで編集した内容を検証する
	- saveEditorContent(elm, data, mod, callback, options) - エディタUIで編集した内容を保存
	- callGpi(options, callback) - GPIを呼び出す


## プラグインの種類と `broccoli.json`

`broccoli-html-editor` のプラグインには、 _モジュール_ と _フィールド_ があります。
アプリケーションがこれらのパッケージを効率的に利用するため、 各パッケージのルートディレクトリに `broccoli.json` を配置し、パッケージに関する情報を記述します。

### モジュール の例

```json
{
    "name": "Foo Bar Elements",
    "type": "module",
    "path": "path/to/modules/"
}
```

### フィールド の例

```json
{
    "name": "Foo Bar Field",
    "type": "field",
    "backend": {
        "require": "myNamespace\\myClassName"
    },
    "frontend": {
        "file" : "path/to/dist/broccoli-field-foobar.js",
        "function" : "window.BroccoliFieldFooBar"
    }
}
```


## データフォーマット

[Data Format](docs/data_format.md) を参照してください。


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

### broccoli-html-editor v0.3.1 (リリース日未定)

- ????????????????????

### broccoli-html-editor v0.3.0 (2018年6月15日)

- if フィールドが、 canvas モード描画時でも常に finalize モードで出力された値を評価するように変更した。
- バックエンド処理をPHPに移行した。これに伴い、 `finalize.js` は `finalize.php` へ変更され、フィールドプラグインのバックエンド処理もPHPへ移行する。

### broccoli-html-editor v0.2.0 (2018年3月5日)

- クライアントサイドに `clipboard.set()`, `clipboard.get()` オプションを追加。
- インスタンス編集後の保存時に、処理の進捗状況を伝えるようになった。
- imageフィールドがファイル名の重複をチェックするようになった。
- imageフィールドの JPEG, PNG 画像の自動ロスレス圧縮機能を削除。圧縮に著しく時間がかかり、作業効率を下げるため。
- moduleフィールド、 loopフィールドに `maxLength` を追加。
- moduleフィールドに `enabledChildren` を、モジュールの `info.json` 仕様に `enabledParents`, `enabledBowls` を追加。親子関係の定義ができるようになった。
- 画像等のリソースが増えるとUIが重くなるパフォーマンス上の問題を改善。
- finalize.js の第3引数 `supply` に `data` を追加。モジュールに入力されたデータ構造にアクセスできるようになった。
- `elseif`、 `else` フィールドを追加。
- その他幾つかの細かい修正。

### broccoli-html-editor v0.1.0 (2017年4月20日)

- Node.js 0.x , io.js のサポートを中止。
- `broccoli.buildModuleCss()` が、SASSが使えない環境で異常終了する問題を修正。
- モジュールにscriptタグが含まれる場合に、編集画面では無効にするようになった。
- editWindow 内の moduleフィールドに「モジュールパレットから追加」ができるようになった。
- インスタンスのカット機能追加。
- インスタンスの範囲選択機能追加。
- その他幾つかの細かい修正。

### broccoli-html-editor v0.1.0-beta.11 (2017年1月18日)

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

### broccoli-html-editor v0.1.0-beta.10 (2016年8月3日)

- selectフィールドに、オプション `"display": "radio"` を追加。ラジオボタン形式の入力欄を作成できるようになった。
- editWindow上 の loop appender をダブルクリック操作した後に表示が更新されない問題を修正。
- Ace Editor が有効な場合、同じ種類のフィールドが1つのモジュールに並んでいる場合に、最後の値がすべてに適用されてしまう不具合を修正。
- コピー＆ペースト操作時に、誤った操作ができてしまう不具合を修正。
- データ上のエラーで、誤ったモジュールが混入した場合に異常終了しないように修正。
- その他幾つかの細かい修正。

### broccoli-html-editor v0.1.0-beta.9 (2016年6月8日)

- editWindow 上で、moduleフィールドとloopフィールドの並べ替えができるようになった。
- Ace Editor を自然改行されるように設定した。
- Ace Editor で、書式に応じてテーマが変わるようにした。
- Ace Editor の文字サイズを最適化。
- 編集保存中のアニメーション追加。


### broccoli-html-editor v0.1.0-beta.8 (2016年4月27日)

- 埋め込み Ace Editor に対応。
- 1行のフィールドを textarea ではなく input[type=text] に変更。
- ドラッグ＆ドロップ操作が Firefox に対応した。
- loopモジュール内にモジュールが入る場合のデータが扱えない問題を修正。
- `postMessage()` に関する不具合を修正。


### broccoli-html-editor v0.1.0-beta.7 (2016年4月15日)

- imageフィールドに、ローカルディスク上の画像ファイルをドラッグ＆ドロップで登録できるようになった。
- imageフィールドが、画像のURL指定で登録できるようになった。
- moduleフィールドとloopフィールドの内容をリスト表示するようになった。
- サーバー側設定に appMode を追加
- appender に mouseover, mouseout したときの不自然な挙動を修正
- bootstrap アイコン を使用
- editWindow: アンカーのinputの前に # の表示をつけた
- コンテンツで html,body が height:100%; になっているときにプレビュー画面の高さ設定に失敗する問題を修正
- CSS調整: モジュールの README.md

### broccoli-html-editor v0.1.0-beta.6 (2016年3月23日)

- 編集エリアが無駄に縦に長くなる問題を修正
- instancePathView のレイアウト調整
- modulePalette のフィルター機能の振る舞いを改善
- appenderを選択できるようにした。
- panelクリックでinstanceTreeViewをフォーカスするようにした。
- bowl操作の制御調整
- instanceTreeView の bowl のデザイン修正

### broccoli-html-editor v0.1.0-beta.4 (2016年3月8日)

- リソース情報を含むコピー＆ペーストが可能になった。
- クリップモジュール機能を追加。


## ライセンス - License

MIT License


## 作者 - Author

- Tomoya Koyanagi <tomk79@gmail.com>
- website: <http://www.pxt.jp/>
- Twitter: @tomk79 <http://twitter.com/tomk79/>
