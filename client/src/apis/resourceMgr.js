/**
 * resourceMgr.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);

	var _this = this;
	var it79 = require('iterate79');
	var _resourceDb = {};

	/**
	 * initialize resource Manager
	 */
	this.init = function( callback ){
		// console.log('broccoli: Initializing resourceDb...');
		_resourceDb = {};
		it79.fnc({},
			[
				function(it1, data){
					_resourceDb = broccoli.getBootupInfomations().resourceDb;
					it1.next(data);
				},
				function(it1, data){
					// console.log('broccoli: Loading all resources: Done.');
					// console.log(_resourceDb);
					callback();
				}
			]
		);
		return;
	}

	/**
	 * Save resources DB
	 * 
	 * @param  {Function} cb Callback function.
	 * @return {boolean}     Always true.
	 */
	this.save = function( callback ){
		callback = callback || function(){};
		it79.fnc({}, [
			function(it1, data){
				broccoli.gpi(
					'resourceMgr.save',
					{'resourceDb': _resourceDb} ,
					function(rtn){
						callback(rtn);
					}
				);
			}
		]);
		return;
	}

	/**
	 * Reload resources DB
	 * 
	 * @param  {Function} cb Callback function.
	 * @return {boolean}     Always true.
	 */
	this.reload = function( callback ){
		callback = callback || function(){};
		it79.fnc({}, [
			function(it1, data){
				broccoli.gpi(
					'resourceMgr.getResourceDb',
					{} ,
					function(rtn){
						_resourceDb = rtn;
						callback(rtn);
					}
				);
			}
		]);
		return;
	}

	/**
	 * get resource DB
	 */
	this.getResourceDb = function( callback ){
		callback = callback || function(){};
		callback(_resourceDb);
		return;
	}

	/**
	 * set resource DB
	 */
	this.setResourceDb = function( newResourceDb, callback ){
		callback = callback || function(){};
		if( typeof(newResourceDb) !== typeof({}) ){
			callback(false);
			return;
		}
		_resourceDb = newResourceDb;
		callback(true);
		return;
	}

	/**
	 * add resource
	 * リソースの登録を行い、resKeyを生成して返す。
	 */
	this.addResource = function(callback){
		callback = callback || function(){};
		it79.fnc({}, [
			function(it1, data){
				broccoli.gpi(
					'resourceMgr.addResource',
					{} ,
					function(newResKey){
						// console.log('New Resource Key is created on resourceDb: '+newResKey);
						_resourceDb[newResKey] = {};//予約
						callback(newResKey);
					}
				);
			}
		]);
		return;
	}

	/**
	 * add new resource
	 * リソースの登録を行い、リソースを保存し、新しい ResourceKey と publicPath 等を生成して返す。
	 */
	this.addNewResource = function(resInfo, callback){
		callback = callback || function(){};
		it79.fnc({}, [
			function(it1, data){
				broccoli.gpi(
					'resourceMgr.addNewResource',
					{
						'resInfo': resInfo
					} ,
					function(result){
						if( result && result.newResourceKey.length && result.updateResult && result.publicPath ){
							_resourceDb[result.newResourceKey] = resInfo;
						}
						callback(result);
					}
				);
			}
		]);
		return;
	}

	/**
	 * get resource
	 */
	this.getResource = function( resKey, callback ){
		callback = callback || function(){};
		it79.fnc({}, [
			function(it1, data){
				broccoli.gpi(
					'resourceMgr.getResource',
					{'resKey': resKey} ,
					function(resInfo){
						if(resInfo && resInfo.base64 && resInfo.type && resInfo.size === undefined){
							resInfo.size = 0;
						}
						if(resInfo.size === undefined){
							callback(false);
							return;
						}
						_resourceDb[resKey] = resInfo;
						callback(resInfo);
					}
				);
			}
		]);
		return;
	}

	/**
	 * duplicate resource
	 */
	this.duplicateResource = function( resKey, callback ){
		callback = callback || function(){};
		it79.fnc({}, [
			function(it1, data){
				broccoli.gpi(
					'resourceMgr.duplicateResource',
					{'resKey': resKey} ,
					function(newResKey){
						callback( newResKey );
					}
				);
			}
		]);
		return;
	}

	/**
	 * update resource
	 * @param  {string} resKey  Resource Key
	 * @param  {object} resInfo Resource Information.
	 * <dl>
	 * <dt>ext</dt><dd>ファイル拡張子名。</dd>
	 * <dt>type</dt><dd>mimeタイプ。</dd>
	 * <dt>base64</dt><dd>ファイルのBase64エンコードされた値</dd>
	 * <dt>publicFilename</dt><dd>公開時のファイル名</dd>
	 * <dt>isPrivateMaterial</dt><dd>非公開ファイル。</dd>
	 * </dl>
	 * @return {boolean}        always true.
	 */
	this.updateResource = function( resKey, resInfo, callback ){
		console.log('updateResource();', resKey, resInfo);
		callback = callback || function(){};
		it79.fnc({},
			[
				function(it1, data){
					broccoli.gpi(
						'resourceMgr.updateResource',
						{
							'resKey': resKey,
							'resInfo': resInfo
						} ,
						function(rtn){
							// console.log(rtn);
							if(_resourceDb[resKey]){
								_resourceDb[resKey] = resInfo;
								callback(true);
								return;
							}
							callback(false);
							return;
						}
					);
				}
			]
		);
		return;
	}

	/**
	 * Reset bin from base64
	 */
	this.resetBinFromBase64 = function( resKey, callback ){
		callback = callback || function(){};
		it79.fnc({},
			[
				function(it1, data){
					broccoli.gpi(
						'resourceMgr.resetBinFromBase64',
						{'resKey': resKey} ,
						function(rtn){
							// console.log(rtn);
							callback(rtn);
						}
					);
				}
			]
		);
		return;
	}

	/**
	 * Reset base64 from bin
	 */
	this.resetBase64FromBin = function( resKey, callback ){
		callback = callback || function(){};
		var _this = this;
		it79.fnc({},
			[
				function(it1, data){
					broccoli.gpi(
						'resourceMgr.resetBase64FromBin',
						{'resKey': resKey} ,
						function(rtn){
							// console.log(rtn);
							// console.log(_resourceDb[resKey]);
							_this.getResource(resKey, function(resInfo){
								// console.log(resInfo);
								_resourceDb[resKey] = resInfo;
								callback(rtn);
							});
						}
					);
				}
			]
		);
		return;
	}

	/**
	 * get resource public path
	 */
	this.getResourcePublicPath = function( resKey, callback ){
		callback = callback || function(){};
		it79.fnc({},
			[
				function(it1, data){
					broccoli.gpi(
						'resourceMgr.getResourcePublicPath',
						{'resKey': resKey} ,
						function(rtn){
							callback(rtn);
						}
					);
				}
			]
		);
		return;
	}

	/**
	 * get resource public path
	 */
	this.getResourceOriginalRealpath = function( resKey, callback ){
		callback = callback || function(){};
		it79.fnc({},
			[
				function(it1, data){
					broccoli.gpi(
						'resourceMgr.getResourceOriginalRealpath',
						{'resKey': resKey} ,
						function(rtn){
							callback(rtn);
						}
					);
				}
			]
		);
		return;
	}

	/**
	 * remove resource
	 */
	this.removeResource = function( resKey, callback ){
		callback = callback || function(){};
		it79.fnc({},
			[
				function(it1, data){
					broccoli.gpi(
						'resourceMgr.removeResource',
						{'resKey': resKey} ,
						function(rtn){
							callback(rtn);
						}
					);
				}
			]
		);
		return;
	}

}
