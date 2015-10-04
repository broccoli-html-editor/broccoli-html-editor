var gulp = require('gulp');
var sass = require('gulp-sass');//CSSコンパイラ
var autoprefixer = require("gulp-autoprefixer");//CSSにベンダープレフィックスを付与してくれる
var uglify = require("gulp-uglify");//JavaScriptファイルの圧縮ツール
var concat = require('gulp-concat');//ファイルの結合ツール
var plumber = require("gulp-plumber");//コンパイルエラーが起きても watch を抜けないようになる
var rename = require("gulp-rename");//ファイル名の置き換えを行う
var twig = require("gulp-twig");//Twigテンプレートエンジン
var browserify = require("gulp-browserify");//NodeJSのコードをブラウザ向けコードに変換
var packageJson = require(__dirname+'/package.json');
var _tasks = [
	'broccoli.js'
];


// broccoli.js (frontend) を処理
gulp.task("broccoli.js", function() {
	gulp.src(["client/src/broccoli.js"])
		.pipe(plumber())
		.pipe(browserify({}))
		.pipe(concat('broccoli.js'))
		// .pipe(uglify())
		.pipe(gulp.dest( './client/dist/' ))
		.pipe(gulp.dest( './tests/baobab/frontend/' ))
		.pipe(concat('broccoli.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest( './client/dist/' ))
		.pipe(gulp.dest( './tests/baobab/frontend/' ))
	;
});

// src 中のすべての拡張子を監視して処理
gulp.task("watch", function() {
	gulp.watch(["client/src/**/*"], _tasks);

	var port = packageJson.baobabConfig.defaultPort;
	var svrCtrl = require('baobab-fw').createSvrCtrl();
	svrCtrl.boot(function(){
		require('child_process').spawn('open',[svrCtrl.getUrl()]);
	});

});

// src 中のすべての拡張子を処理(default)
gulp.task("default", _tasks);
