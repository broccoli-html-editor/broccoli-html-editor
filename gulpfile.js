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
	'broccoli-preview-contents.js',
	'.css.scss',
	'test/main.js',
	'client-libs'
];

// client-libs (frontend) を処理
gulp.task("client-libs", function() {
	gulp.src(["node_modules/bootstrap/dist/fonts/**/*"])
		.pipe(gulp.dest( './client/dist/libs/bootstrap/dist/fonts/' ))
		.pipe(gulp.dest( './tests/testdata/htdocs/libs/libs/bootstrap/dist/fonts/' ))
	;
	gulp.src(["node_modules/bootstrap/dist/js/**/*"])
		.pipe(gulp.dest( './client/dist/libs/bootstrap/dist/js/' ))
		.pipe(gulp.dest( './tests/testdata/htdocs/libs/libs/bootstrap/dist/js/' ))
	;
	gulp.src(["node_modules/px2style/dist/scripts.js"])
		.pipe(gulp.dest( './client/dist/libs/px2style/dist/' ))
		.pipe(gulp.dest( './tests/testdata/htdocs/libs/libs/px2style/dist/' ))
	;
	gulp.src(["node_modules/px2style/dist/images/**/*"])
		.pipe(gulp.dest( './client/dist/libs/px2style/dist/images/' ))
		.pipe(gulp.dest( './tests/testdata/htdocs/libs/libs/px2style/dist/images/' ))
	;
});

// src 中の *.css.scss を処理
gulp.task('.css.scss', function(){
	gulp.src("client/src/**/*.css.scss")
		.pipe(plumber())
		.pipe(sass({
			"sourceComments": false
		}))
		.pipe(autoprefixer())
		.pipe(rename({
			extname: ''
		}))
		.pipe(rename({
			extname: '.css'
		}))
		.pipe(gulp.dest( './client/dist/' ))
		.pipe(gulp.dest( './tests/testdata/htdocs/libs/' ))

		.pipe(minifyCss({compatibility: 'ie8'}))
		.pipe(rename({
			extname: '.min.css'
		}))
		.pipe(gulp.dest( './client/dist/' ))
		.pipe(gulp.dest( './tests/testdata/htdocs/libs/' ))
	;
});

// broccoli.js (frontend) を処理
gulp.task("broccoli.js", function() {
	gulp.src(["client/src/broccoli.js"])
		.pipe(plumber())
		.pipe(browserify({}))
		.pipe(concat('broccoli.js'))
		.pipe(gulp.dest( './client/dist/' ))
		.pipe(gulp.dest( './tests/testdata/htdocs/libs/' ))
		.pipe(concat('broccoli.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest( './client/dist/' ))
		.pipe(gulp.dest( './tests/testdata/htdocs/libs/' ))
	;
});

// broccoli.js (frontend) を処理
gulp.task("broccoli-preview-contents.js", function() {
	gulp.src(["client/src/broccoli-preview-contents.js"])
		.pipe(plumber())
		.pipe(browserify({}))
		.pipe(concat('broccoli-preview-contents.js'))
		.pipe(gulp.dest( './client/dist/' ))
		.pipe(gulp.dest( './tests/testdata/htdocs/libs/' ))
		.pipe(concat('broccoli-preview-contents.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest( './client/dist/' ))
		.pipe(gulp.dest( './tests/testdata/htdocs/libs/' ))
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

	var svrCtrl = require( './tests/biflora/serverCtrl.js' );
	svrCtrl.boot(function(){
		require('child_process').spawn('open',[svrCtrl.getUrl()]);
	});

});

// src 中のすべての拡張子を処理(default)
gulp.task("default", _tasks);
