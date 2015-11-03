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
		loadResourceList( function(){
			callback();
		} );
		return this;
	}

	/**
	 * Loading resource list
	 */
	function loadResourceList( callback ){
		_resourceDb = {};
		it79.fnc({},
			[
				function(it1, data){
					broccoli.gpi(
						'resourceMgr.getResourceDb',
						{} ,
						function(resourceDb){
							// console.log('Getting resourceDb.');
							// console.log(resourceDb);
							_resourceDb = resourceDb;
							callback();
						}
					);
				}
			]
		);
		return;
	}

	/**
	 * save resources
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
						loadResourceList(function(){
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
						if(resInfo.size === undefined){
							callback(false);
							return ;
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
	 * @return 複製された新しいリソースのキー
	 */
	this.duplicateResource = function( resKey, callback ){
		callback = callback || function(){};
		callback( newResKey );
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
		// _resourceDb = {};
		it79.fnc({},
			[
				function(it1, data){
					broccoli.gpi(
						'resourceMgr.getResourcePublicPath',
						{'resKey': resKey} ,
						function(rtn){
							// console.log('Getting resourceDb.');
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
		// _resourceDb = {};
		it79.fnc({},
			[
				function(it1, data){
					broccoli.gpi(
						'resourceMgr.getResourceOriginalRealpath',
						{'resKey': resKey} ,
						function(rtn){
							// console.log('Getting resourceDb.');
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
		// _resourceDb = {};
		it79.fnc({},
			[
				function(it1, data){
					broccoli.gpi(
						'resourceMgr.removeResource',
						{'resKey': resKey} ,
						function(rtn){
							// console.log('Getting resourceDb.');
							callback(rtn);
						}
					);
				}
			]
		);
		return this;
	}

}
