<?php
require_once(__DIR__.'/../../../vendor/autoload.php');
require_once(__DIR__.'/../../php_test_helper/test_php_field_custom1.php');

$broccoli = new broccoliHtmlEditor\broccoliHtmlEditor();

$broccoli->init(
	array(
		'paths_module_template' => array(
			'PlainHTMLElements' => '../PlainHTMLElements/',
			'testMod1' => '../modules1/',
			'testMod2' => '../modules2/',
			'testMod3' => '../modules3-deprecated/'
		) ,
		'documentRoot' => __DIR__.'/',
		'pathHtml' => '/editpage/index.html',
		'pathResourceDir' => '/editpage/index_files/resources/',
		'realpathDataDir' => __DIR__.'/editpage/index_files/guieditor.ignore/',
		'customFields' => array(
			'custom1' => 'test_php_field_custom1'
		) ,
		'bindTemplate' => function($htmls){
			$fin = '';
			$fin .= '<!DOCTYPE html>'."\n";
			$fin .= '<html>'."\n";
			$fin .= '    <head>'."\n";
			$fin .= '        <meta charset="utf-8" />'."\n";
			$fin .= '        <title>sample page</title>'."\n";
			$fin .= '        <link rel="stylesheet" href="/common/css/common.css" />'."\n";
			$fin .= '        <link rel="stylesheet" href="/common/css/module.css" />'."\n";
			$fin .= '        <script src="/common/js/module.js"></script>'."\n";
			$fin .= '        <style media="screen">'."\n";
			$fin .= '            img{max-width:100%;}'."\n";
			$fin .= '        </style>'."\n";
			$fin .= '    </head>'."\n";
			$fin .= '    <body>'."\n";
			$fin .= '        <div class="theme_wrap">'."\n";
			$fin .= '        <h1>sample page</h1>'."\n";
			$fin .= '        <h2>main</h2>'."\n";
			$fin .= '        <div class="contents" data-contents="main">'."\n";
			$fin .= $htmls['main']."\n";
			$fin .= '        </div><!-- /main -->'."\n";
			$fin .= '        <h2>secondly</h2>'."\n";
			$fin .= '        <div class="contents" data-contents="secondly">'."\n";
			$fin .= $htmls['secondly']."\n";
			$fin .= '        </div><!-- /secondly -->'."\n";
			$fin .= '        <footer>'."\n";
			$fin .= '            <a href="/editpage/">top</a>, <a href="http://www.pxt.jp/" target="_blank">pxt</a>'."\n";
			$fin .= '            <form action="javascript:alert(\'form submit done.\');">'."\n";
			$fin .= '                <input type="submit" value="submit!" />'."\n";
			$fin .= '            </form>'."\n";
			$fin .= '        </footer>'."\n";
			$fin .= '        </div>'."\n";
			$fin .= '    </body>'."\n";
			$fin .= '</html>'."\n";
			$fin .= '<script data-broccoli-receive-message="yes">'."\n";
			$fin .= 'window.addEventListener(\'message\',(function() {'."\n";
			$fin .= 'return function f(event) {'."\n";
			$fin .= 'if(event.origin!=\'http://127.0.0.1:8088\'){return;}// <- check your own server\'s origin.'."\n";
			$fin .= 'var s=document.createElement(\'script\');'."\n";
			$fin .= 'document.querySelector(\'body\').appendChild(s);s.src=event.data.scriptUrl;'."\n";
			$fin .= 'window.removeEventListener(\'message\', f, false);'."\n";
			$fin .= '}'."\n";
			$fin .= '})(),false);'."\n";
			$fin .= '</script>'."\n";

			return $fin;
		},
		'log' => function($msg){
			var_dump('[ERROR HANDLED]'.$msg);
		}
	)
);


$rtn = $broccoli->gpi(
	$_REQUEST['api'],
	$_REQUEST['options']
);
echo json_encode($rtn);
exit;
