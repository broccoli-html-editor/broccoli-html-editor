/**
 * getModuleListByPackageId.js
 */
module.exports = function(broccoli, packageId, callback){
	delete(require.cache[require('path').resolve(__filename)]);
	var _this = this;
	callback = callback || function(){};

	var it79 = require('iterate79');
	var path = require('path');
	var fs = require('fs');
	var Promise = require('es6-promise').Promise;
	var LangBank = require('langbank');
	var FncsReadme = require('./fncs/readme.js');
	var rtn = {};

	function isFile(path){
		if( !fs.existsSync(path) || !fs.statSync(path).isFile() ){
			return false;
		}
		return true;
	}
	function isDir(path){
		if( !fs.existsSync(path) || !fs.statSync(path).isDirectory() ){
			return false;
		}
		return true;
	}
	function base64_encode( bin ){
		var base64 = bin.toString('base64');
		return base64;
	}
	function sortModuleDirectoryNames(dirNames, sortBy){
		if( typeof(sortBy) != typeof([]) ){ return dirNames; }
		dirNames.sort();
		function deleteArrayElm(ary, val){
			for( var i in ary ){
				if( ary[i] === val ){
					ary.splice( i , 1 );
					return true;
				}
			}
			return false;
		}
		function arrayFind(ary, val){
			for( var i in ary ){
				if( ary[i] === val ){return true;}
			}
			return false;
		}

		var rtn = [];
		for( var i in sortBy ){
			if( !arrayFind(dirNames, sortBy[i]) ){continue;}
			rtn.push(sortBy[i]);
			deleteArrayElm(dirNames, sortBy[i]);
		}
		for( var i in dirNames ){
			rtn.push(dirNames[i]);
		}
		return rtn;
	}
	function fncFindLang( $lb, $key, $default ){
		var $tmpName = $lb.get($key);
		if( $tmpName.length && $tmpName !== '---' ){
			return $tmpName;
		}
		return $default;
	};


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
				rtn.packageInfo = JSON.parse(fs.readFileSync( rtn.realpath + 'info.json' ));
			} catch (e) {
				rtn.packageInfo = {};
			}
			rlv();
		}); })
		.then(function(){ return new Promise(function(rlv, rjt){
			// モジュールカテゴリをリスト化
			fs.readdir( rtn.realpath, function(err, fileList){
				rtn.categories = {};
				fileList = sortModuleDirectoryNames(fileList, rtn.packageInfo.sort);
				it79.ary(
					fileList,
					function( it1, row, idx ){
						var realpath = path.resolve(rtn.realpath, row);
						if( fs.statSync(realpath).isDirectory() ){
							realpath += '/';
							var lb = new LangBank(path.resolve( realpath, 'language.csv' ), function(){
								lb.setLang(broccoli.lb.lang);
								rtn.categories[row] = {};
								rtn.categories[row].categoryId = row;
								try {
									rtn.categories[row].categoryInfo = JSON.parse(fs.readFileSync( path.resolve( realpath, 'info.json' ) ));
								} catch (e) {
									rtn.categories[row].categoryInfo = {};
								}
								rtn.categories[row].categoryName = rtn.categories[row].categoryInfo.name||row;
								rtn.categories[row].realpath = realpath;
								rtn.categories[row].hidden = (rtn.categories[row].categoryInfo.hidden || false)
								rtn.categories[row].deprecated = (rtn.categories[row].categoryInfo.deprecated || false)

								// Multi Language
								rtn.categories[row].categoryInfo.name = fncFindLang( lb, 'name', rtn.categories[row].categoryInfo.name );
								rtn.categories[row].categoryName = fncFindLang( lb, 'name', rtn.categories[row].categoryName );

								rtn.categories[row].modules = {};
								it1.next();
							});
							return;
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
						fileList = sortModuleDirectoryNames(fileList, row.categoryInfo.sort);
						it79.ary(
							fileList,
							function( it2, row2, idx2 ){
								var realpath = path.resolve(rtn.categories[idx].realpath, row2);
								if( !realpath || !fs.statSync(realpath).isDirectory() ){
									it2.next();
									return;
								}

								var lb = new LangBank(path.resolve( realpath, 'language.csv' ), function(){
									lb.setLang(broccoli.lb.lang);

									realpath += '/';
									rtn.categories[idx].modules[row2] = {};

									// moduleId
									var moduleId = rtn.packageId+':'+rtn.categories[idx].categoryId+'/'+row2;
									rtn.categories[idx].modules[row2].moduleId = moduleId;

									// info.json
									try {
										rtn.categories[idx].modules[row2].moduleInfo = JSON.parse(fs.readFileSync( path.resolve( realpath, 'info.json' ) ));
										rtn.categories[idx].modules[row2].moduleInfo.enabledParents = broccoli.normalizeEnabledParentsOrChildren(rtn.categories[idx].modules[row2].moduleInfo.enabledParents, moduleId);
										if( typeof(rtn.categories[idx].modules[row2].moduleInfo.enabledBowls) == typeof('') ){
											rtn.categories[idx].modules[row2].moduleInfo.enabledBowls = [rtn.categories[idx].modules[row2].moduleInfo.enabledBowls];
										}
									} catch (e) {
										rtn.categories[idx].modules[row2].moduleInfo = {};
									}
									rtn.categories[idx].modules[row2].hidden = (rtn.categories[idx].modules[row2].moduleInfo.hidden||false);
									rtn.categories[idx].modules[row2].deprecated = (rtn.categories[idx].modules[row2].moduleInfo.deprecated||false);

									// moduleInternalId
									rtn.categories[idx].modules[row2].moduleInternalId = moduleId;
									if( typeof(rtn.categories[idx].modules[row2].moduleInfo) == typeof({}) && rtn.categories[idx].modules[row2].moduleInfo.id ){
										rtn.categories[idx].modules[row2].moduleInternalId = broccoli.getModuleInternalId(moduleId, rtn.categories[idx].modules[row2].moduleInfo.id);
									}
					
									// clip.json
									rtn.categories[idx].modules[row2].clip = false;
									try {
										if( isFile( path.resolve( realpath, 'clip.json' ) ) ){
											rtn.categories[idx].modules[row2].clip = true;
										}
									} catch (e) {
										rtn.categories[idx].modules[row2].clip = false;
									}

									// moduleName
									rtn.categories[idx].modules[row2].moduleName = rtn.categories[idx].modules[row2].moduleInfo.name||moduleId;

									// realpath
									rtn.categories[idx].modules[row2].realpath = realpath;

									// thumb.png
									var realpathThumb = path.resolve( realpath, 'thumb.png' );
									rtn.categories[idx].modules[row2].thumb = null;
									try{
										if( isFile(realpathThumb) ){
											rtn.categories[idx].modules[row2].thumb = 'data:image/png;base64,'+base64_encode( fs.readFileSync( realpathThumb ) );
										}
									} catch (e) {
										rtn.categories[idx].modules[row2].thumb = null;
									}

									// README.md (html)
									var readmeHelper = new FncsReadme(broccoli);
									var readme = readmeHelper.get_html(realpath);

									rtn.categories[idx].modules[row2].readme = readme;

									// Multi Language
									rtn.categories[idx].modules[row2].moduleName = fncFindLang( lb, 'name', rtn.categories[idx].modules[row2].moduleName );
									rtn.categories[idx].modules[row2].moduleInfo.name = fncFindLang( lb, 'name', rtn.categories[idx].modules[row2].moduleInfo.name );


									broccoli.getModule(moduleId, null, function(modInstance){
										rtn.categories[idx].modules[row2].moduleInfo.interface = rtn.categories[idx].modules[row2].moduleInfo.interface || modInstance.fields;
										it2.next();
									});
								});
								return;
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
