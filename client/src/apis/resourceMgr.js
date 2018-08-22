/**
 * resourceMgr.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var _this = this;
	var _resourceDb = {};

	/**
	 * initialize resource Manager
	 */
	this.init = function( callback ){
		loadResourceDb( function(){
			callback();
		} );
		return this;
	}

	/**
	 * Loading resource DB
	 */
	function loadResourceDb( callback ){
		console.log('broccoli: Loading all resources...');
		_resourceDb = {};
		it79.fnc({},
			[
				function(it1, data){
					data.resourceList = broccoli.getBootupInfomations().resourceList;
					console.log('broccoli: Resource List:', data.resourceList);
					it1.next(data);
				},
				function(it1, data){
					it79.ary(
						data.resourceList,
						function(it2, resKey, idx){
							broccoli.progressMessage('リソースを読み込んでいます...。('+(Number(idx)+1)+'/'+(data.resourceList.length)+')');
							console.log("broccoli: Loading Resource:", resKey);
							broccoli.gpi(
								'resourceMgr.getResource',
								{
									resKey: resKey
								} ,
								function(resource){
									console.log('broccoli: done:', resKey);
									// console.log(resource);
									_resourceDb[resKey] = resource;
									it2.next();
								}
							);
						},
						function(){
							it1.next(data);
						}
					);
				},
				// function(it1, data){
				// 	broccoli.gpi(
				// 		'resourceMgr.getResourceDb',
				// 		{} ,
				// 		function(resourceDb){
				// 			_resourceDb = resourceDb;
				// 			it1.next(data);
				// 		}
				// 	);
				// },
				function(it1, data){
					console.log('broccoli: Loading all resources: Done.');
					// console.log(_resourceDb);
					callback();
				}
			]
		);
		return;
	}

	/**
	 * Save resources DB
	 * @param  {Function} cb Callback function.
	 * @return {boolean}     Always true.
	 */
	this.save = function( callback ){
		// console.log('resourceDb save method: called.');
		callback = callback || function(){};
		it79.fnc({}, [
			function(it1, data){
				broccoli.gpi(
					'resourceMgr.save',
					{'resourceDb': _resourceDb} ,
					function(rtn){
						// console.log('resourceDb save method: done.');
						loadResourceDb(function(){
							callback(rtn);
						});
					}
				);
			}
		]);
		return this;
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
		return this;
	}

	/**
	 * get resource DB
	 */
	this.getResourceDb = function( callback ){
		callback = callback || function(){};
		callback(_resourceDb);
		return this;
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
		return this;
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
		return this;
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
		return this;
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
		return this;
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
		return this;
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
		return this;
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
		return this;
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
		return this;
	}

}
