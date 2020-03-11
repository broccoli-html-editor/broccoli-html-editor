このモジュールは、開発用に作成したカスタムフィールドを使用したモジュールの実装例です。

## コーディング例

```
<div>
    <p>custom1 field</p>
{&{"input":{"type":"custom1","name":"main","description":"これはカスタムフィールドです。\n\nカスタムフィールドは、broccoli-html-editor の初期化時に設定して、追加することができます。"}}&}
    <p>/custom1 field</p>
</div>
```

## サンプルイメージ

### サンプルイメージ1

![サンプルイメージ1](pics/picture1.png "サンプル1")

### サンプルイメージ2

<img src="pics/picture2.png" alt="サンプルイメージ2" />

## README 表現サンプル

### h3 表現サンプル

リンクする[サンプル](https://github.com/broccoli-html-editor)。

HTMLを直接書いてリンクする<a href="https://github.com/broccoli-html-editor">サンプル</a>。

相対パスの[サンプル](./template.html)。

#### h4 表現サンプル

- ul/li サンプル
- ul/li サンプル
    - ul/li サンプル
        - ul/li サンプル
- ul/li サンプル

段落テキストサンプル。

1. ol/li サンプル
2. ol/li サンプル
3. ol/li サンプル
4. ol/li サンプル

##### サニタイズ

<a href="javascript:alert('Script in href');">JavaScript in href</a>

<a href="#" onclick="alert('Script in onclick');">JavaScript in onclick</a>

<form action="javascript:alert('Script in form action');">
<button type="submit">JavaScript in form action</button>
</form>
<form action="#" onsubmit="alert('Script in form action');">
<button type="submit">JavaScript in form submit</button>
</form>

<script>alert('Script in README');</script>
<script language="javascript">alert('Script in README');</script>

<style>*{color:#f00 !important;}</style>
<style type="text/css">*{color:#f30 !important;}</style>

<link rel="stylesheet" href="javascript:alert('JavaScript in link href');" />

<div
    style="border: 1px solid #f00; padding: 2em; margin: 1em 0;" onclick="alert('onclick');" onmouseover='alert("onmouseover");' onmouseout="alert(&amp;onmouseout&amp;);" onmousedown="alert('onmousedown');"
    data-hoge-fuga
    data-foo-bar="test"
    disabled
    data-hoge=fugaboga
    nomark=nomark
    onchange>
    <p disabled>サニタイズテスト</p>
</div>
