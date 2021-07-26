<?php
class testHelper{

	/**
	 * Start Built in server.
	 */
	static public function start_built_in_server(){
		static $pid;
		if($pid){
			return;
		}
		$WEB_SERVER_HOST = 'localhost';
		$WEB_SERVER_PORT = 3000;
		$WEB_SERVER_DOCROOT = __DIR__.'/../testdata/htdocs/';
		$WEB_SERVER_ROUTER = __DIR__.'/router.php';

		// Command that starts the built-in web server
		$command = sprintf(
			'php -S %s:%d -t %s %s >/dev/null 2>&1 & echo $!',
			$WEB_SERVER_HOST,
			$WEB_SERVER_PORT,
			$WEB_SERVER_DOCROOT,
			$WEB_SERVER_ROUTER
		);

		// Execute the command and store the process ID
		$output = array();
		exec($command, $output);
		$pid = (int) $output[0];

		echo sprintf(
			'%s - Web server started on %s:%d with PID %d',
			date('r'),
			$WEB_SERVER_HOST,
			$WEB_SERVER_PORT,
			$pid
		) . PHP_EOL;

		// Kill the web server when the process ends
		register_shutdown_function(function() use ($pid) {
			echo sprintf('%s - Killing process with ID %d', date('r'), $pid) . PHP_EOL;
			exec('kill ' . $pid);
		});
		return;
	}

	/**
	 * $broccoli を生成する
	 */
	static public function makeDefaultBroccoli($options = array()){
		require_once(__DIR__.'/test_php_field_custom1.php');

		$contents_id = (@$options['contents_id'] ? $options['contents_id'] : 'test1/test1');
		$paths_module_template = (@$options['paths_module_template'] ? $options['paths_module_template'] : array(
			'PlainHTMLElements' => '../PlainHTMLElements',
			'testMod1' => '../modules1',
			'testMod2' => '../modules2'
		));

		$broccoli = new broccoliHtmlEditor\broccoliHtmlEditor();
		$broccoli->init(array(
			'appMode' => 'web', // 'web' or 'desktop'. default to 'web'
			'paths_module_template' => $paths_module_template ,
			'documentRoot' => __DIR__.'/../testdata/htdocs/', // realpath
			'pathHtml' => '/'.$contents_id.'.html',
			'pathResourceDir' => '/'.$contents_id.'_files/resources/',
			'realpathDataDir' => __DIR__.'/../testdata/htdocs/'.$contents_id.'_files/guieditor.ignore/',
			'customFields' => array(
				'custom1' => 'test_php_field_custom1'
			) ,
			'fieldConfig' => array(
				'image' => array(
					'filenameAutoSetter' => 'ifEmpty',
				),
			),
			'bindTemplate' => function($htmls){
				$fin = '';
				$fin .= '<!DOCTYPE html>'."\n";
				$fin .= '<html>'."\n";
				$fin .= '    <head>'."\n";
				$fin .= '        <meta charset="utf-8" />'."\n";
				$fin .= '        <title>sample page</title>'."\n";
				$fin .= '        <link rel="stylesheet" href="../common/css/common.css" />'."\n";
				$fin .= '        <link rel="stylesheet" href="../common/css/module.css" />'."\n";
				$fin .= '        <script src="../common/js/module.js"></script>'."\n";
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
				$fin .= '        <h2>thirdly</h2>'."\n";
				$fin .= '        <div class="contents" data-contents="thirdly">'."\n";
				$fin .= $htmls['thirdly']."\n";
				$fin .= '        </div><!-- /thirdly -->'."\n";
				$fin .= '        <footer>'."\n";
				$fin .= '            <a href="../editpage/">top</a>, <a href="https://www.pxt.jp/" target="_blank">pxt</a>'."\n";
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
				$fin .= 'if(!event.data.scriptUrl){return;}'."\n";
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
				// エラー発生時にコールされます。
				// msg を受け取り、適切なファイルへ出力するように実装してください。
				error_log($msg."\n", 3, __DIR__.'/error.log');
			}
		));

		return $broccoli;
	}
}
