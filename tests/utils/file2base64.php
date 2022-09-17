<?php
require_once(__DIR__.'/../../vendor/autoload.php');
$fs = new tomk79\filesystem();
$req = new tomk79\request();
$path_original = $req->get_cli_param(-1);
$bin_original = file_get_contents($path_original);
$base64 = base64_encode($bin_original);
var_dump($base64);
exit;
