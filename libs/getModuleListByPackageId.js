/**
 * getModuleListByPackageId.js
 */
module.exports = function(broccoli, packageId, callback){
	delete(require.cache[require('path').resolve(__filename)]);
	var _this = this;
	callback = callback || function(){};

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var fs = require('fs');
	var rtn = {};

	function isFile(path){
		if( !fs.existsSync(path) || !fs.statSync(path).isFile() ){
			return false;
		}
		return true;
	}
	function base64_encode( bin ){
		var base64 = bin.toString('base64');
		return base64;
	}

	new Promise(function(rlv){rlv();})
		.then(function(){ return new Promise(function(rlv, rjt){
			// パッケージ情報を取得
			rtn.packageId = packageId;
			try {
				rtn.realpath = broccoli.paths_module_template[packageId];
			} catch (e) {
				rtn.packageId = false;
				rtn.realpath = false;
				rjt();
				return;
			}
			try {
				rtn.packageInfo = require( rtn.realpath + 'info.json' );
			} catch (e) {
				rtn.packageInfo = false;
			}
			rlv();
		}); })
		.then(function(){ return new Promise(function(rlv, rjt){
			// モジュールカテゴリをリスト化
			fs.readdir( rtn.realpath, function(err, fileList){
				// console.log(fileList);
				rtn.categories = {};
				it79.ary(
					fileList,
					function( it1, row, idx ){
						var realpath = path.resolve(rtn.realpath, row);
						if( fs.statSync(realpath).isDirectory() ){
							realpath += '/';
							rtn.categories[row] = {};
							rtn.categories[row].categoryId = row;
							try {
								rtn.categories[row].categoryInfo = require( path.resolve( realpath, 'info.json' ) );
							} catch (e) {
								rtn.categories[row].categoryInfo = {};
							}
							rtn.categories[row].categoryName = rtn.categories[row].categoryInfo.name||row;
							rtn.categories[row].realpath = realpath;
							rtn.categories[row].modules = {};
						}
						it1.next();
					} ,
					function(){
						rlv();
					}
				);
			} );
		}); })
		.then(function(){ return new Promise(function(rlv, rjt){
			// 各カテゴリのモジュールをリスト化

			it79.ary(
				rtn.categories,
				function( it1, row, idx ){

					fs.readdir( rtn.categories[idx].realpath, function(err, fileList){
						it79.ary(
							fileList,
							function( it2, row2, idx2 ){
								var realpath = path.resolve(rtn.categories[idx].realpath, row2);
								if( fs.statSync(realpath).isDirectory() ){
									realpath += '/';
									rtn.categories[idx].modules[row2] = {};
									rtn.categories[idx].modules[row2].moduleId = rtn.packageId+':'+rtn.categories[idx].categoryId+'/'+row2;
									try {
										rtn.categories[idx].modules[row2].moduleInfo = require( path.resolve( realpath, 'info.json' ) );
									} catch (e) {
										rtn.categories[idx].modules[row2].moduleInfo = {};
									}
									rtn.categories[idx].modules[row2].moduleName = rtn.categories[idx].modules[row2].moduleInfo.name||rtn.categories[idx].modules[row2].moduleId;
									rtn.categories[idx].modules[row2].realpath = realpath;
									var realpathThumb = path.resolve( realpath, 'thumb.png' );
									rtn.categories[idx].modules[row2].thumb = null;
									try{
										if( isFile(realpathThumb) ){
											rtn.categories[idx].modules[row2].thumb = 'data:image/png;base64,'+base64_encode( fs.readFileSync( realpathThumb ) );
										}
									} catch (e) {
										rtn.categories[idx].modules[row2].thumb = null;
									}
								}
								it2.next();
							} ,
							function(){
								it1.next();
							}
						);
					} );
				} ,
				function(){
					rlv();
				}
			);

		}); })
		.then(function(){ return new Promise(function(rlv, rjt){
			// 返却
			callback(rtn);
			rlv();
		}); })
	;

	return;
}
