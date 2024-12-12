module.exports = function(broccoli){

	var Promise = require('es6-promise').Promise;
	var it79 = require('iterate79');
	var utils79 = require('utils79');
	var urlParse = require('url-parse');
	var php = require('phpjs');
	var _resMgr = broccoli.resourceMgr;
	var _imgDummy = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTYyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTYyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSIjOTk5OTk5IiBmaWxsLW9wYWNpdHk9IjAuMyIvPgo8ZyBjbGlwLXBhdGg9InVybCgjY2xpcDBfMjExMF80NDYzKSI+CjxwYXRoIGQ9Ik03NzIuMjg4IDQ5Mi44MTJDNzcyLjI4OCA1MDAuMzIxIDc2OS4zMDUgNTA3LjUyMyA3NjMuOTk1IDUxMi44MzJDNzU4LjY4NiA1MTguMTQyIDc1MS40ODQgNTIxLjEyNSA3NDMuOTc1IDUyMS4xMjVDNzM2LjQ2NiA1MjEuMTI1IDcyOS4yNjUgNTE4LjE0MiA3MjMuOTU1IDUxMi44MzJDNzE4LjY0NiA1MDcuNTIzIDcxNS42NjMgNTAwLjMyMSA3MTUuNjYzIDQ5Mi44MTJDNzE1LjY2MyA0ODUuMzA0IDcxOC42NDYgNDc4LjEwMiA3MjMuOTU1IDQ3Mi43OTNDNzI5LjI2NSA0NjcuNDgzIDczNi40NjYgNDY0LjUgNzQzLjk3NSA0NjQuNUM3NTEuNDg0IDQ2NC41IDc1OC42ODYgNDY3LjQ4MyA3NjMuOTk1IDQ3Mi43OTNDNzY5LjMwNSA0NzguMTAyIDc3Mi4yODggNDg1LjMwNCA3NzIuMjg4IDQ5Mi44MTJaIiBmaWxsPSIjQUFBQUFBIiBmaWxsLW9wYWNpdHk9IjAuNyIvPgo8cGF0aCBkPSJNNjk2Ljc4OCA0MDcuODc1QzY4Ni43NzYgNDA3Ljg3NSA2NzcuMTc0IDQxMS44NTIgNjcwLjA5NCA0MTguOTMyQzY2My4wMTUgNDI2LjAxMSA2NTkuMDM4IDQzNS42MTMgNjU5LjAzOCA0NDUuNjI1VjYzNC4zNzVDNjU5LjAzOCA2NDQuMzg3IDY2My4wMTUgNjUzLjk4OSA2NzAuMDk0IDY2MS4wNjhDNjc3LjE3NCA2NjguMTQ4IDY4Ni43NzYgNjcyLjEyNSA2OTYuNzg4IDY3Mi4xMjVIOTIzLjI4OEM5MzMuMyA2NzIuMTI1IDk0Mi45MDIgNjY4LjE0OCA5NDkuOTgxIDY2MS4wNjhDOTU3LjA2MSA2NTMuOTg5IDk2MS4wMzggNjQ0LjM4NyA5NjEuMDM4IDYzNC4zNzVWNDQ1LjYyNUM5NjEuMDM4IDQzNS42MTMgOTU3LjA2MSA0MjYuMDExIDk0OS45ODEgNDE4LjkzMkM5NDIuOTAyIDQxMS44NTIgOTMzLjMgNDA3Ljg3NSA5MjMuMjg4IDQwNy44NzVINjk2Ljc4OFpNOTIzLjI4OCA0MjYuNzVDOTI4LjI5NCA0MjYuNzUgOTMzLjA5NSA0MjguNzM5IDkzNi42MzQgNDMyLjI3OEM5NDAuMTc0IDQzNS44MTggOTQyLjE2MyA0NDAuNjE5IDk0Mi4xNjMgNDQ1LjYyNVY1NjguMzEyTDg3MC44NzIgNTMxLjU2M0M4NjkuMTAyIDUzMC42NzYgODY3LjA5OCA1MzAuMzY5IDg2NS4xNDMgNTMwLjY4NEM4NjMuMTg5IDUzMC45OTkgODYxLjM4MyA1MzEuOTIgODU5Ljk4MSA1MzMuMzE4TDc4OS45NTUgNjAzLjM0NEw3MzkuNzQ3IDU2OS44OThDNzM3LjkzNCA1NjguNjkxIDczNS43NiA1NjguMTQ4IDczMy41OTMgNTY4LjM2MkM3MzEuNDI2IDU2OC41NzUgNzI5LjM5OSA1NjkuNTMxIDcyNy44NTYgNTcxLjA2OEw2NzcuOTEzIDYxNS41VjQ0NS42MjVDNjc3LjkxMyA0NDAuNjE5IDY3OS45MDEgNDM1LjgxOCA2ODMuNDQxIDQzMi4yNzhDNjg2Ljk4MSA0MjguNzM5IDY5MS43ODIgNDI2Ljc1IDY5Ni43ODggNDI2Ljc1SDkyMy4yODhaIiBmaWxsPSIjQUFBQUFBIiBmaWxsLW9wYWNpdHk9IjAuNyIvPgo8L2c+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzIxMTBfNDQ2MyI+CjxyZWN0IHdpZHRoPSIzMDIiIGhlaWdodD0iMzAyIiBmaWxsPSJ3aGl0ZSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNjU5IDM4OSkiLz4KPC9jbGlwUGF0aD4KPC9kZWZzPgo8L3N2Zz4K';
	var _this = this;

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = {};
		if( typeof(fieldData) === typeof({}) ){
			rtn = fieldData;
		}

		var is_image_uploaded = true;

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){

			if( rtn.resType == 'web' ){
				callback(rtn.webUrl);
				return;
			}else if( rtn.resType == 'none' ){
				callback('');
				return;
			}else{
				it79.fnc(
					{},
					[
						function(it1, data){
							_resMgr.getResource( rtn.resKey, function(res){
								data.resourceInfo = res;
								if( !data.resourceInfo ){
									is_image_uploaded = false;
								}else if( data.resourceInfo ){
									if( !data.resourceInfo.base64 ){
										is_image_uploaded = false;
									}else if( !data.resourceInfo.size ){
										is_image_uploaded = false;
									}
								}
								if( mode != 'canvas' && !is_image_uploaded ){
									callback('');
									return;
								}
								it1.next(data);
							} );
							return;
						},
						function(it1, data){
							_resMgr.getResourcePublicRealpath( rtn.resKey, function(realpath){
								// console.log(realpath);
								data.publicRealpath = realpath;
								it1.next(data);
							} );
							return;
						},
						function(it1, data){
							_resMgr.getResourcePublicPath( rtn.resKey, function(publicPath){
								if( !data.resourceInfo ){
									publicPath = '';
								}
								rtn.path = publicPath;
								data.path = publicPath;
								it1.next(data);
							} );
						},
						function(it1, data){
							// console.log(utils79.is_file(data.publicRealpath));
							if( mode == 'canvas' ){
								if( !utils79.is_file(data.publicRealpath) ){
									// ↓ ダミーの Sample Image
									data.path = broccoli.getNoimagePlaceholder() || _imgDummy;
								}else{
									try {
										data.path = 'data:'+data.resourceInfo.type+';base64,' + '{broccoli-html-editor-resource-baser64:{'+rtn.resKey+'}}';
										// var imageBin = fs.readFileSync(data.publicRealpath);
										// data.path = 'data:'+data.resourceInfo.type+';base64,' + utils79.base64_encode( imageBin );
									} catch (e) {
										data.path = false;
									}
								}
							}
							if( data.path == false && data.resourceInfo && data.resourceInfo.base64 ){
								data.path = 'data:'+data.resourceInfo.type+';base64,' + data.resourceInfo.base64;
							}
							it1.next(data);
						},
						function(it1, data){
							// console.log(data.path);
							callback(data.path);
							it1.next();
						}
					]
				);
				return;
			}
			return;
		}); });
		return;
	}

	// /**
	//  * リソースを加工する (Server Side)
	//  */
	// this.resourceProcessor = function( path_orig, path_public, resInfo, callback ){
	// 	// console.log(resInfo);
	// 	function md5(content){
	// 		var md5 = require('crypto').createHash('md5');
	// 		md5.update(content);
	// 		return md5.digest('hex');
	// 	}
	// 	function md5file(path){
	// 		if(!utils79.is_file(path)){return false;}
	// 		var content = require('fs').readFileSync( path );
	// 		return md5(content);
	// 	}

	// 	resInfo.fieldNote = resInfo.fieldNote || {};

	// 	new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){

	// 		if( resInfo.fieldNote.origMd5 == resInfo.md5 && resInfo.fieldNote.base64 ){
	// 			// console.log('変更されていないファイル =-=-=-=-=-=-=-=-=-=-=-=-=');
	// 			require('fs').writeFileSync(
	// 				path_public,
	// 				(new Buffer(resInfo.fieldNote.base64, 'base64'))
	// 			);
	// 			callback(true);
	// 			return;
	// 		}

	// 		it79.fnc(
	// 			{},
	// 			[
	// 				function(it1, data){
	// 					// 公開ディレクトリに複製
	// 					var fsEx = require('fs-extra');
	// 					fsEx.copy( path_orig, path_public, function(err){
	// 						it1.next(data);
	// 					} );
	// 					return;
	// 				},
	// 				function(it1, data){
	// 					// オリジナルのMD5ハッシュを記録
	// 					if( resInfo.md5 ){
	// 						resInfo.fieldNote.origMd5 = resInfo.md5;
	// 					}else{
	// 						resInfo.fieldNote.origMd5 = md5file(path_orig);
	// 					}

	// 					// 加工後のファイルの情報を記録
	// 					var bin = require('fs').readFileSync( path_public );
	// 					// base64
	// 					resInfo.fieldNote.base64 = (new Buffer(bin)).toString('base64');
	// 					// MD5
	// 					resInfo.fieldNote.md5 = md5(bin);
	// 					// size
	// 					resInfo.fieldNote.size = bin.length;

	// 					it1.next(data);
	// 					return;
	// 				},
	// 				function(it1, data){
	// 					callback(true);
	// 					return;
	// 				}
	// 			]
	// 		);
	// 	}); });

	// 	return this;
	// }

	/**
	 * GPI (Server Side)
	 */
	this.gpi = function(options, callback){
		callback = callback || function(){};

		/**
		 * HTTPSリクエストを送信する
		 */
		function httpRequest(url, options, callback){
			callback = callback || function(){};
			var urlParsed = new urlParse(url);
			// console.log(urlParsed);

			var http = require('http');
			if(urlParsed.protocol=='https'){
				http = require('https');
			}

			options = options || {};
			options.hostname = options.hostname || urlParsed.host;
			options.port = options.port || (urlParsed.protocol=='https' ? 443 : 80); // default: 80 for http, 443 for https
			options.path = options.path || urlParsed.pathname;

			var status = 0;
			var responseHeaders = {};
			var data = [];
			var req = http.request(options, function(res){
				status = res.statusCode;
				responseHeaders = res.headers;
				res.setEncoding('binary');
				res.on('data', function(chunk){
					data.push( new Buffer( chunk, 'binary' ) );
					return;
				});
				res.on('end', function(){
					data = Buffer.concat( data );
					callback(data, status, responseHeaders);
					return;
				})
			});

			req.on('error', function(e){
				callback('problem with request: '+ e.message, 0, {});
			});

			// write data to request body
			// req.write();
			req.end();

			return;
		}

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){

			switch(options.api){
				case 'getImageByUrl':
					// console.log(options.data);
					var result = {};
					httpRequest( options.data.url, {}, function(data, status, responseHeaders){
						result.base64 = utils79.base64_encode(data);
						result.status = status;
						result.responseHeaders = responseHeaders;
						// console.log(result);
						callback(result);
					} );
					break;

				default:
					callback('ERROR: Unknown API');
					break;
			}

		}); });

		return this;
	}

}
