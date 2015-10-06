var gulp = require('gulp');
var sass = require('gulp-sass');//CSSコンパイラ
var autoprefixer = require("gulp-autoprefixer");//CSSにベンダープレフィックスを付与してくれる
var minifyCss = require('gulp-minify-css');//CSSファイルの圧縮ツール
var uglify = require("gulp-uglify");//JavaScriptファイルの圧縮ツール
var concat = require('gulp-concat');//ファイルの結合ツール
var plumber = require("gulp-plumber");//コンパイルエラーが起きても watch を抜けないようになる
var rename = require("gulp-rename");//ファイル名の置き換えを行う
var twig = require("gulp-twig");//Twigテンプレートエンジン
var browserify = require("gulp-browserify");//NodeJSのコードをブラウザ向けコードに変換
var packageJson = require(__dirname+'/package.json');
var _tasks = [
	'broccoli.js',
	'broccoli.css',
	'test/main.js'
];


// broccoli.scss を処理
gulp.task('broccoli.css', function(){
	gulp.src("client/src/broccoli.css.scss")
		.pipe(plumber())
		.pipe(sass())
		.pipe(autoprefixer())
		.pipe(concat('broccoli.css'))
		.pipe(gulp.dest( './client/dist/' ))
		.pipe(gulp.dest( './tests/testdata/htdocs/' ))
		.pipe(concat('broccoli.min.css'))
		.pipe(minifyCss({compatibility: 'ie8'}))
		// .pipe(sourcemaps.write())
		// .pipe(uglify())
		.pipe(gulp.dest( './client/dist/' ))
		.pipe(gulp.dest( './tests/testdata/htdocs/' ))
	;
});

// broccoli.js (frontend) を処理
gulp.task("broccoli.js", function() {
	gulp.src(["client/src/broccoli.js"])
		.pipe(plumber())
		.pipe(browserify({}))
		.pipe(concat('broccoli.js'))
		.pipe(gulp.dest( './client/dist/' ))
		.pipe(gulp.dest( './tests/testdata/htdocs/' ))
		.pipe(concat('broccoli.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest( './client/dist/' ))
		.pipe(gulp.dest( './tests/testdata/htdocs/' ))
	;
});

// test/main.js を処理
gulp.task("test/main.js", function() {
	gulp.src(["tests/testdata/htdocs/index_files/main.src.js"])
		.pipe(plumber())
		.pipe(browserify({}))
		.pipe(concat('main.js'))
		.pipe(gulp.dest( './tests/testdata/htdocs/index_files/' ))
	;
});

// src 中のすべての拡張子を監視して処理
gulp.task("watch", function() {
	gulp.watch(["client/src/**/*","libs/**/*","tests/testdata/htdocs/index_files/main.src.js"], _tasks);

	var port = packageJson.baobabConfig.defaultPort;
	var svrCtrl = require('baobab-fw').createSvrCtrl();
	svrCtrl.boot(function(){
		require('child_process').spawn('open',[svrCtrl.getUrl()]);
	});

});

// src 中のすべての拡張子を処理(default)
gulp.task("default", _tasks);
