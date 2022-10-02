<?php
$lang = 'ja';
if( isset($_REQUEST['LANG']) ){
	$lang = $_REQUEST['LANG'];
}
?>
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title>Broccoli TEST</title>
		<link rel="stylesheet" href="./index_files/css.css" />
		<style>
:root {
	--px2-main-color: #00a0e6;
	--px2-text-color: #333;
	--px2-background-color: #f9f9f9;
}

		</style>
	</head>
	<body>
		<div class="instanceTreeView"></div>
		<div class="canvas" data-broccoli-preview="http://127.0.0.1:8088/tests/testdata/htdocs/editpage/index.html"></div>
		<div class="palette"></div>
		<div class="instancePathView"></div>
		<div class="test_funcs">
			<ul>
				<li><a href="javascript:window.main.reloadBroccoli();">Reload</a></li>
				<li><a href="javascript:window.main.broccoli.historyBack(function(){alert('history Back done.');});">history Back</a></li>
				<li><a href="javascript:window.main.broccoli.historyGo(function(){alert('history Go done.');});">history Go</a></li>
				<li><a href="javascript:window.main.broccoli.copy(function(res){console.log(res);alert('copy done.');});">copy</a></li>
				<li><a href="javascript:window.main.broccoli.cut(function(res){console.log(res);alert('cut done.');});">cut</a></li>
				<li><a href="javascript:window.main.broccoli.paste(function(res){console.log(res);alert('paste done.');});">paste</a></li>
				<li><a href="javascript:window.main.broccoli.remove(function(res){console.log(res);alert('remove done.');});">remove</a></li>
				<li><a href="javascript:window.main.broccoli.find();">find</a></li>
				<li><a href="javascript:alert(window.main.broccoli.getSelectedInstance());">getSelectedInstance</a></li>
				<li><a href="javascript:window.main.broccoli.editInstance();">editInstance</a></li>
				<li><a href="javascript:window.main.broccoli.insertInstance();">insertInstance</a></li>
			</ul>
		</div>

		<!-- jQuery -->
		<script src="./index_files/jquery-3.5.1.min.js" type="text/javascript"></script>

		<!-- Ace Editor (Optional) -->
		<script src="./index_files/libs/ace-builds/src-noconflict/ace.js"></script>

		<!-- CodeMirror (Optional) -->
		<link rel=stylesheet href="./index_files/libs/codemirror/lib/codemirror.css" />
		<link rel=stylesheet href="./index_files/libs/codemirror/theme/ambiance.css" />
		<link rel=stylesheet href="./index_files/libs/codemirror/theme/mdn-like.css" />
		<link rel=stylesheet href="./index_files/libs/codemirror/theme/monokai.css" />
		<link rel=stylesheet href="./index_files/libs/codemirror/theme/eclipse.css" />
		<link rel=stylesheet href="./index_files/libs/codemirror/theme/elegant.css" />
		<script src="./index_files/libs/codemirror/lib/codemirror.js"></script>
		<script src="./index_files/libs/codemirror/mode/xml/xml.js"></script>
		<script src="./index_files/libs/codemirror/mode/javascript/javascript.js"></script>
		<script src="./index_files/libs/codemirror/mode/css/css.js"></script>
		<script src="./index_files/libs/codemirror/mode/sass/sass.js"></script>
		<script src="./index_files/libs/codemirror/mode/markdown/markdown.js"></script>
		<script src="./index_files/libs/codemirror/mode/php/php.js"></script>
		<script src="./index_files/libs/codemirror/mode/htmlmixed/htmlmixed.js"></script>

		<!-- broccoli -->
		<script src="./../../../client/dist/broccoli.js"></script>

		<!-- main.js -->
		<script src="./index_files/main.js" type="text/javascript"></script>
		<script type="text/javascript">
			$(window).on('load', function(){
				main.init({
					'serverType': 'php',
					'lang': <?= var_export($lang, true) ?>
				},function(){
					console.log('TestPage: Initialize Broccoli: done');
				});
			});
		</script>
	</body>
</html>
