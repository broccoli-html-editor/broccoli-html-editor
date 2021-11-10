let gulp = require('gulp');
let webpack = require('webpack');
let webpackStream = require('webpack-stream');
let sass = require('gulp-sass');//CSSコンパイラ
let autoprefixer = require("gulp-autoprefixer");//CSSにベンダープレフィックスを付与してくれる
let minifyCss = require('gulp-minify-css');//CSSファイルの圧縮ツール
let plumber = require("gulp-plumber");//コンパイルエラーが起きても watch を抜けないようになる
let rename = require("gulp-rename");//ファイル名の置き換えを行う
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
	return webpackStream({
		mode: 'production',
		entry: "./client/src/broccoli.js",
		devtool: 'source-map',
		output: {
			filename: "broccoli.js"
		},
		module:{
			rules:[
				{
					test:/\.html$/,
					use:['html-loader']
				}
			]
		},
		externals: {
			fs: 'commonjs fs',
		},
	}, webpack)
		.pipe(plumber())
		.pipe(gulp.dest( './client/dist/' ))
	;
});

// broccoli.js (frontend) を処理
gulp.task("broccoli-preview-contents.js", function() {
	return webpackStream({
		mode: 'production',
		entry: "./client/src/broccoli-preview-contents.js",
		devtool: 'source-map',
		output: {
			filename: "broccoli-preview-contents.js"
		},
		module:{
			rules:[
				{
					test:/\.html$/,
					use:['html-loader']
				}
			]
		}
	}, webpack)
		.pipe(plumber())
		.pipe(gulp.dest( './client/dist/' ))
	;
});

// test/main.js を処理
gulp.task("test/main.js", function() {
	return webpackStream({
		mode: 'production',
		entry: "./tests/testdata/htdocs/index_files/main.src.js",
		devtool: 'source-map',
		output: {
			filename: "main.js"
		},
		module:{
			rules:[
				{
					test:/\.html$/,
					use:['html-loader']
				}
			]
		}
	}, webpack)
		.pipe(plumber())
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
	'client-libs:bootstrap-js'
);

// src 中のすべての拡張子を監視して処理
gulp.task("watch", function() {
	return gulp.watch([
		"client/src/**/*",
		"fields/client/**/*",
		"fields/**/*",
		"libs/**/*",
		"tests/testdata/htdocs/index_files/main.src.js"
	], _tasks);
});

// src 中のすべての拡張子を処理(default)
gulp.task("default", _tasks);
