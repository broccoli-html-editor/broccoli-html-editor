<?php
/****

# README
これは、コマンドライン引数で受け取ったファイルのパスから、
Base64文字列を作成して 表示します。
webpack の url-loader も asset/inline も、base64 を正しく変換できなかったため、
暫定的に base64 に手動変換して対応するために置いたスクリプトです。

# USAGE
php ./tests/utils/file2base64.php ./client/src/resources/chevron-down-x2.png;
****/
require_once(__DIR__.'/../../vendor/autoload.php');
$fs = new tomk79\filesystem();
$req = new tomk79\request();
$path_original = $req->get_cli_param(-1);
$bin_original = file_get_contents($path_original);
$base64 = base64_encode($bin_original);
var_dump($base64);
exit;
