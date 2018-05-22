<?php
class testHelper{

	/**
	 * $broccoli を生成する
	 */
	static public function makeDefaultBroccoli($options = array()){
		$content_id = @$options['content_id'] || 'test1/test1';
		$paths_module_template = @$options['paths_module_template'] || array(
			'PlainHTMLElements' => '../PlainHTMLElements',
			'testMod1' => '../modules1',
			'testMod2' => '../modules2'
		);

		$broccoli = new broccoliHtmlEditor\broccoliHtmlEditor();
		$broccoli->init(array(
			'appMode' => 'web', // 'web' or 'desktop'. default to 'web'
			'paths_module_template' => $paths_module_template ,
			'documentRoot' => __DIR__.'/../testdata/htdocs/', // realpath
			'pathHtml' => '/'.$content_id.'.html',
			'pathResourceDir' => '/'.$content_id.'_files/resources/',
			'realpathDataDir' => __DIR__.'/../testdata/htdocs/'.$content_id.'_files/guieditor.ignore/',
			'customFields' => array(
				'custom1' => function($broccoli){
					// カスタムフィールドを実装します。
					// この関数は、fieldBase.js を基底クラスとして継承します。
					// customFields オブジェクトのキー(ここでは custom1)が、フィールドの名称になります。
				}
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
				// エラー発生時にコールされます。
				// msg を受け取り、適切なファイルへ出力するように実装してください。
				file_put_contents(__DIR__.'/path/to/error.log', $msg, FILE_APPEND);
			}
		));

		return $broccoli;
	}
}