let gulp = require('gulp');
let sass = require('gulp-sass');//CSSコンパイラ
let autoprefixer = require("gulp-autoprefixer");//CSSにベンダープレフィックスを付与してくれる
let minifyCss = require('gulp-minify-css');//CSSファイルの圧縮ツール
let uglify = require("gulp-uglify");//JavaScriptファイルの圧縮ツール
let concat = require('gulp-concat');//ファイルの結合ツール
let plumber = require("gulp-plumber");//コンパイルエラーが起きても watch を抜けないようになる
let rename = require("gulp-rename");//ファイル名の置き換えを行う
let twig = require("gulp-twig");//Twigテンプレートエンジン
let browserify = require("gulp-browserify");//NodeJSのコードをブラウザ向けコードに変換
let packageJson = require(__dirname+'/package.json');

// client-libs (frontend) を処理
gulp.task("client-libs:bootstrap-fonts", function() {
	return gulp.src(["node_modules/bootstrap/dist/fonts/**/*"])
		.pipe(gulp.dest( './client/dist/libs/bootstrap/dist/fonts/' ))
	;
});
gulp.task("client-libs:bootstrap-js", function() {
	return gulp.src(["node_modules/bootstrap/dist/js/**/*"])
		.pipe(gulp.dest( './client/dist/libs/bootstrap/dist/js/' ))
	;
});
gulp.task("client-libs:px2style-scripts", function() {
	return gulp.src(["node_modules/px2style/dist/scripts.js"])
		.pipe(gulp.dest( './client/dist/libs/px2style/dist/' ))
	;
});
gulp.task("client-libs:px2style-images", function() {
	return gulp.src(["node_modules/px2style/dist/images/**/*"])
		.pipe(gulp.dest( './client/dist/libs/px2style/dist/images/' ))
	;
});

// src 中の *.css.scss を処理
gulp.task('.css.scss', function(){
	return gulp.src("client/src/**/*.css.scss")
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

		.pipe(minifyCss({compatibility: 'ie8'}))
		.pipe(rename({
			extname: '.min.css'
		}))
		.pipe(gulp.dest( './client/dist/' ))
	;
});

// broccoli.js (frontend) を処理
gulp.task("broccoli.js", function() {
	return gulp.src(["client/src/broccoli.js"])
		.pipe(plumber())
		.pipe(browserify({}))
		.pipe(concat('broccoli.js'))
		.pipe(gulp.dest( './client/dist/' ))
		.pipe(concat('broccoli.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest( './client/dist/' ))
	;
});

// broccoli.js (frontend) を処理
gulp.task("broccoli-preview-contents.js", function() {
	return gulp.src(["client/src/broccoli-preview-contents.js"])
		.pipe(plumber())
		.pipe(browserify({}))
		.pipe(concat('broccoli-preview-contents.js'))
		.pipe(gulp.dest( './client/dist/' ))
		.pipe(concat('broccoli-preview-contents.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest( './client/dist/' ))
	;
});

// test/main.js を処理
gulp.task("test/main.js", function() {
	return gulp.src(["tests/testdata/htdocs/index_files/main.src.js"])
		.pipe(plumber())
		.pipe(browserify({}))
		.pipe(concat('main.js'))
		.pipe(gulp.dest( './tests/testdata/htdocs/index_files/' ))
	;
});

// ブラウザを立ち上げてプレビューする
gulp.task("preview", function(callback) {
	require('child_process').spawn('open',['http://127.0.0.1:8088/']);
	callback();
	return;
});


let _tasks = gulp.parallel(
	'broccoli.js',
	'broccoli-preview-contents.js',
	'.css.scss',
	'test/main.js',
	'client-libs:bootstrap-fonts',
	'client-libs:bootstrap-js',
	'client-libs:px2style-scripts',
	'client-libs:px2style-images'
);

// src 中のすべての拡張子を監視して処理
gulp.task("watch", function() {
	return gulp.watch(["client/src/**/*","fields/client/**/*","fields/**/*","libs/**/*","tests/testdata/htdocs/index_files/main.src.js"], _tasks);
});

// src 中のすべての拡張子を処理(default)
gulp.task("default", _tasks);
