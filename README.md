# broccoli-html-editor

_broccoli-html-editor_ は、GUIベースでHTMLを編集するブロックエディタライブラリです。
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
        'appMode' => 'web', // 'web' or 'desktop'. default to 'web'
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
        'fieldConfig' => array(
            'image' => array( // image field に対する設定
                'filenameAutoSetter' => 'ifEmpty', // filenameAutoSetterの初期値を設定
            ),
        ),
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
        },
        'userStorage' => function($key, $val = null){
            // ユーザー固有の情報を読み書きします。
            $args = func_get_args();
            if( count($args) == 1 ){
                // 読み取りとしてコールされる場合、引数が1つだけ提供されます。
                return file_get_contents('/path/to/userdir/'.urlencode($key).'.json');
            }else{
                // 書き込みの要求の場合、引数が2つ提供されます。
                return file_put_contents('/path/to/userdir/'.urlencode($key).'.json', $val);
            }
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

#### PHPの要件

- PHP 5.4 以上
  - [mbstring](https://www.php.net/manual/ja/book.mbstring.php) PHP Extension
  - [JSON](https://www.php.net/manual/ja/book.json.php) PHP Extension

モジュールやカスタムフィールドなど他のパッケージとの構成によって、いくつかの要件が追加される場合があります。
依存パッケージのシステム要件も確認してください。



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
        'customValidationRules': {
            'customValidation1': function(value, req, attribute, passes) {
                // カスタムバリデーションを定義します。
                // フィールドの validate に登録して呼び出すことができます。
                var ok = true;
                if( ok ){
                    passes(); // if available
                }else{
                    passes(false, 'The '+attribute+' is not valid.'); // if not available
                }
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
            // 通常のクリップボード処理では対応できない特殊な環境で利用する場合に拡張してください。
            // 省略した場合は、Broccoliの標準的な処理が適用されます。
            'set': function( data, type, event, callback ){
                // クリップボードにコピーする機能を実装してください。
            },
            'get': function( type, event, callback ){
                // クリップボードからデータを取得する機能を実装してください。
            }
        },
        'droppedFileOperator': {
            // ローカルディスクから直接ファイルがドロップされた場合の処理を拡張します。
            // mimetype毎に加工処理を設定できます。
            // 省略した場合は、Broccoliの標準的な処理が適用されます。
            'text/example': function(fileInfo, callback){
                var clipContents = {
                    'data': {},
                    'resources': {}
                };

                // クリップモジュールと同様の形式のオブジェクトを生成して
                // コールバックへ返却してください。
                // ファイルを処理しない場合は false を返却してください。
                callback(clipContents);
                return;
            }
        },
        'onClickContentsLink': function( uri, data ){
            // コンテンツ内のリンクをクリックした場合のイベントハンドラを登録できます。
            alert(uri + ' へ移動');
            console.log(data);
            return false;
        },
        'onMessage': function( message ){
            // ユーザーへ知らせるメッセージを表示します。
            // 組み込む先でお使いのフレームワークや環境に応じて、
            // 適切なメッセージ機能へ転送してください。
            yourOunCustomMessageMethod( message );
        },
        'onEditWindowOpen': function(){
            // インスタンスの編集ウィンドウを開いたときにコールされます。
        },
        'onEditWindowClose': function(){
            // インスタンスの編集ウィンドウを閉じたときにコールされます。
        },
        'enableModuleAnchor': true, // モジュールごとのid属性入力の有効/無効 (デフォルトは `true`)
        'enableModuleDec': true // DEC入力の有効/無効 (デフォルトは `true`)
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

クロスオリジンで動作する場合は、編集画面上のプレビューHTMLの最後に、次のスクリプトコードを埋め込む必要があります。同一オリジンで動作させる場合はこの手順は必要ありません。

`'http://127.0.0.1:8080'` の箇所には、`broccoli-html-editor` の編集画面が置かれるサーバーの `origin` を設定してください。

```html
<script data-broccoli-receive-message="yes">
window.addEventListener('message',(function() {
return function f(event) {
if(!event.data.scriptUrl){return;}
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
    "id": "foo-bar-elements",
    "name": "Foo Bar Elements",
    "type": "module",
    "path": "path/to/modules/"
}
```

### フィールド の例

```json
{
    "id": "foo-bar-field",
    "name": "Foo Bar Field",
    "type": "field",
    "backend": {
        "class": "myNamespace\\myClassName"
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

#### node.js

```
$ npm start
```

#### PHP

```
$ composer start
```

### test

#### node.js

```
$ npm test
```

#### PHP

```
$ composer test
```


## 更新履歴 - Change log

### broccoli-html-editor v1.0.1 (2022年10月16日)

- 依存ライブラリの更新。
- 一部UIの英訳を追加。
- CodeMirrorが適用されたフィールドの捜査官を改善。
- `droppedFileOperator` コールバックが、処理しない場合に `false` を返せるようになった。
- その他、細かいUIの改善、内部コードの修正など。

### broccoli-html-editor v1.0.0 (2022年9月25日)

- `onEditWindowOpen()`、 `onEditWindowClose()` オプションを追加。
- 編集ウィンドウ上での Ctrl + S 操作で、保存できるようになった。
- アペンダーを選択してコピーすると応答しなくなる不具合を修正。
- 編集ウィンドウで編集中に、誤操作でウィンドウを閉じる前に確認するようになった。
- 未定義のモジュール の編集ウィンドウを開けない問題を修正。
- CodeMirror でのテキスト編集に対応。
- UIの一部を英訳した。
- UIデザインの更新。
- インスタンスツリービューのプレビューHTMLにサニタイズ機能を追加した。
- その他、細かいUIの改善など。

### broccoli-html-editor v0.7.0 (2022年7月11日)

- `module.js` の安定性に関する修正。スコープが分離されるようになった。
- SCSSコンパイラのバージョン間の差異を吸収する処理を追加。
- その他、細かいUIの改善など。

### broccoli-html-editor v0.6.2 (2022年6月5日)

- Windowsタブレットでのタッチ操作の挙動に関する改善。
- その他、不具合の修正など。

### broccoli-html-editor v0.6.1 (2022年5月2日)

- 外部ライブラリへの依存に関する問題を修正。
- その他、不具合の修正など。

### broccoli-html-editor v0.6.0 (2022年1月8日)

- サポートするPHPのバージョンを `>=7.3.0` に変更。
- PHP 8.1 に対応した。

### broccoli-html-editor v0.5.2 (2021年11月29日)

- 多言語化ファイルが定義されていないモジュールで編集ウィンドウが正しく開かない場合がある問題を修正。

### broccoli-html-editor v0.5.1 (2021年11月28日)

- クロスオリジンな環境で実行される場合に、初期化が正常に完了しない場合がある不具合を修正。

### broccoli-html-editor v0.5.0 (2021年11月26日)

- モジュール、カテゴリ、パッケージの情報に `hidden` を追加。
- UIの改善: 編集ウィンドウの右上に 閉じるボタン を追加。
- パネルが、実際の要素の座標からずれて表示されてしまう場合にも、最新の座標情報を取得しなおして補正するようになった。
- モジュールの README が、多言語版を定義できるようになった。
- 内部コードに関する変更: browserify から webpack へ移行した。
- Windows版 Chrome 96 で、モジュールパレットからモジュールを追加できない不具合を修正。
- 一部画面要素の英語対応。

### broccoli-html-editor v0.4.7 (2021年9月26日)

- UIの改善: 編集ウィンドウの下に、スクロールに追従するOKボタンを追加。
- 編集ウィンドウからのコンテキストメニューを廃止した。

### broccoli-html-editor v0.4.6 (2021年8月26日)

- コンテキストメニューからクリップモジュールを挿入できない不具合を修正。
- インスタンスを繰り返し検索すると同一のデータが重複する不具合を修正。
- その他、UIなどの改善。

### broccoli-html-editor v0.4.5 (2021年8月21日)

- UIの改善: レイアウトビュー上の、編集領域のない箇所をクリックして、インスタンスの選択を解除できるようになった。
- UIの改善: モーダルボックスのサイズを調整した。
- 同一オリジンで動作する環境では、プレビューHTMLに `data-broccoli-receive-message` スクリプトを埋め込む必要がなくなった。(クロスオリジンの場合は従来どおり)
- ショートカットキー (macOS では `Cmd + A`、Windows では `Ctrl + A`) でインスタンスの全選択ができるようになった。
- コンテキストメニューから新規モジュール追加ダイアログを利用できるようになった。
- fileフィールドを追加。
- imageフィールドで、セットされた画像を 名前を付けて保存 できるようになった。
- インスタンスを検索できるようになった。
- その他、細かい不具合の修正と安定性の向上。

### broccoli-html-editor v0.4.4 (2021年7月10日)

- UIの改善: アペンダーの表示量を調整した。一番浅い階層だけは、内容がセットされていても常に表示されるようになった。
- Twigテンプレートで作成したモジュールで、 `_ENV.lang` と `_ENV.data` を利用できるようになった。
- UI改善: 編集ウィンドウを閉じるときのフォームの振る舞いを改善した。
- その他、細かい不具合の修正。

### broccoli-html-editor v0.4.3 (2021年6月26日)

- UIの改善: アペンダーの表示量を少なくした。
- ブランクのコンテンツから制作を始めたときに起きる不具合を修正。
- 内部エラー処理に関する修正。

### broccoli-html-editor v0.4.2 (2021年5月25日)

- 画像ファイルを直接ドロップしたあとに起きるスクリプトエラーを修正。

### broccoli-html-editor v0.4.1 (2021年4月23日)

- `scssphp/scssphp` への対応を追加。
- 内部コードの細かい修正。

### broccoli-html-editor v0.4.0 (2021年2月6日)

- モジュールのマルチ言語化に対応した。
- あとからモジュールに追加した moduleフィールド または loopフィールドがある場合に、編集ウィンドウで起きる不具合を修正。
- 各フィールド間のデータの互換性が向上した。直接文字列でデータを格納していた `html`, `text`, `markdown`, `html_attr_text`, `href`, `select`, `datetime`, `color` の各フィールドが、`multitext` に合わせて `{"src": src}` の型で格納するように変更された。(読み込みについては旧来の文字列の形式との互換性が維持される)
- `color` フィールドが、 インスタンスツリービュー上でカラーチップで確認できるようになった。
- 内部コードの細かい修正。


## ライセンス - License

MIT License


## 作者 - Author

- Tomoya Koyanagi <tomk79@gmail.com>
- website: <https://www.pxt.jp/>
- Twitter: @tomk79 <https://twitter.com/tomk79/>
