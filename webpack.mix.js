const mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel applications. By default, we are compiling the CSS
 | file for the application as well as bundling up all the JS files.
 |
 */

mix
	.webpackConfig({
		module: {
			rules:[
				{
					test: /\.txt$/i,
					use: ['raw-loader'],
				},
				{
					test: /\.csv$/i,
					loader: 'csv-loader',
					options: {
						dynamicTyping: true,
						header: false,
						skipEmptyLines: false,
					},
				},
				{
					test:/\.twig$/,
					use:['twig-loader']
				},
				{
					test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
					type: "asset/inline"
				},
			],
		},
		resolve: {
			fallback: {
				"fs": false,
				"path": false,
				"crypto": false,
				"stream": require.resolve("stream-browserify"),
			}
		}
	})


	// --------------------------------------
	// Broccoli HTML Editor
	.js('client/src/broccoli.js', 'client/dist/')
	.js('client/src/broccoli-preview-contents.js', 'client/dist/')
	.sass('client/src/broccoli.css.scss', 'client/dist/broccoli.css')

	// --------------------------------------
	// DevScripts
	.js('tests/testdata/htdocs/index_files/main.src.js', 'tests/testdata/htdocs/index_files/main.js')
;
