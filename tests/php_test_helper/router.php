<?php
// router.php
if (preg_match('/^\/libs\//', $_SERVER["REQUEST_URI"])) {
	$path = preg_replace('/^\/libs\//', '', $_SERVER["REQUEST_URI"]);
	$bin = file_get_contents(__DIR__.'/../../client/dist/'.$path);
	if (preg_match('/\.([a-zA-Z0-9]+)$/', strtolower($path), $matched)) {
		$ext = strtolower(trim($matched[1]));
		$mimetype = 'text/plain';
		switch($ext){
			case 'css': $mimetype = 'text/css'; break;
			case 'js': $mimetype = 'text/javascript'; break;
			case 'png': $mimetype = 'image/png'; break;
			case 'gif': $mimetype = 'image/gif'; break;
			case 'jpg':case 'jpe':case 'jpeg': $mimetype = 'image/jpeg'; break;
		}
		@header('Content-type: '.$mimetype);
	}
	echo $bin;
	return true;
}elseif (preg_match('/\.(?:png|jpg|jpeg|gif|js|css)$/', $_SERVER["REQUEST_URI"])) {
	return false;
}else{

}
return false;