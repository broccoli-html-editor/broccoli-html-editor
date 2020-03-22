/**
 * contentsSourceData.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);

	var _this = this;
	this.broccoli = broccoli;

	var _ = require('underscore');
	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');

	var _contentsSourceData = broccoli.getBootupInfomations().contentsDataJson; // <= data.jsonの中身
	var _modTpls = broccoli.getBootupInfomations().allModuleList; // <- module の一覧

	/**
	 * 初期化
	 */
	this.init = function( callback ){
		_this.history = new (require('./history.js'))(broccoli);
		it79.fnc(
			{},
			[
				function(it1, data){
					// コンテンツデータを整理
					_contentsSourceData.bowl = _contentsSourceData.bowl||{};
					_this.initBowlData('main');
					// console.log(_contentsSourceData);
					it1.next(data);
				} ,
				function(it1, data){
					// ヒストリーマネージャーの初期化
					_this.history.init(
						_contentsSourceData,
						function(){
							it1.next(data);
						}
					);
				} ,
				function(it1, data){
					// console.log(_contentsSourceData);
					callback();
				}
			]
		);

		return this;
	}// init()

	/**
	 * データを取得する (同期)
	 */
	this.get = function( containerInstancePath, data ){
		data = data || _contentsSourceData;

		// console.log( containerInstancePath );
		if( containerInstancePath === undefined || !containerInstancePath.length ){
			return data;
		}
		var aryPath = this.parseInstancePath( containerInstancePath );
		if( !aryPath.length ){
			return data;
		}

		var cur = aryPath.shift();
		var idx = null;
		var tmpSplit = cur.split('@');
		cur = tmpSplit[0];
		if( tmpSplit.length >=2 ){
			idx = Number(tmpSplit[1]);
		}
		var tmpCur = cur.split('.');
		var container = tmpCur[0];
		var fieldName = tmpCur[1];
		var modTpl = _this.getModule( data.modId, data.subModName );

		if( container == 'bowl' ){
			return this.get( aryPath, data.bowl[fieldName] );
		}

		if( !aryPath.length ){
			// ここが最後のインスタンスだったら
			if( !data.fields ){
				data.fields = {};
			}
			if( !data.fields[fieldName] ){
				data.fields[fieldName] = [];
			}
			if( modTpl.fields[fieldName].fieldType == 'input'){
				return data.fields[fieldName];
			}else if( modTpl.fields[fieldName].fieldType == 'module'){
				data.fields[fieldName] = data.fields[fieldName]||[];
				return data.fields[fieldName][idx];
			}else if( modTpl.fields[fieldName].fieldType == 'loop'){
				data.fields[fieldName] = data.fields[fieldName]||[];
				return data.fields[fieldName][idx];
			}else if( modTpl.fields[fieldName].fieldType == 'if'){
			}else if( modTpl.fields[fieldName].fieldType == 'echo'){
			}
		}else{
			// もっと深かったら
			if( modTpl.fields[fieldName].fieldType == 'input'){
				return this.get( aryPath, data.fields[fieldName] );
			}else if( modTpl.fields[fieldName].fieldType == 'module'){
				return this.get( aryPath, data.fields[fieldName][idx] );
			}else if( modTpl.fields[fieldName].fieldType == 'loop'){
				return this.get( aryPath, data.fields[fieldName][idx] );
			}else if( modTpl.fields[fieldName].fieldType == 'if'){
			}else if( modTpl.fields[fieldName].fieldType == 'echo'){
			}
		}
		return false;
	}

	/**
	 * 指定したインスタンスパスの子ノードの一覧を取得 (非同期)
	 */
	this.getChildren = function( containerInstancePath, callback ){
		callback = callback|| function(){};
		var current = this.get(containerInstancePath);
		if( !current ){
			callback([]);return;
		}
		var modTpl = _this.getModule( current.modId, current.subModName );
		var targetFieldNames = {};
		for( var fieldName in modTpl.fields ){
			switch( modTpl.fields[fieldName].fieldType ){
				case 'module':
				case 'loop':
					targetFieldNames[fieldName] = modTpl.fields[fieldName].fieldType;
					break;
			}
		}
		var rtn = [];
		for( var fieldName in targetFieldNames ){
			for( var idx in current.fields[fieldName] ){
				rtn.push(containerInstancePath+'/fields.'+fieldName+'@'+idx);
			}
		}
		callback(rtn);
		return this;
	}

	/**
	 * インスタンスを追加する (非同期)
	 */
	this.addInstance = function( modId, containerInstancePath, cb, subModName ){
		// console.log( '----- addInstance: '+modId+': '+containerInstancePath );
		cb = cb||function(){};

		if( containerInstancePath.match(new RegExp('^\\/bowl\\.[^\\/]+$')) ){
			broccoli.message('bowl に追加することはできません。アペンダーに追加してください。');
			cb();
			return this;
		}

		var newData = {};
		if( typeof(modId) === typeof('') ){
			newData = new (function(){
				this.modId = modId ,
				this.fields = {}
				if( typeof(subModName) === typeof('') ){
					this.subModName = subModName;
				}
			})(modId, subModName);
			var modTpl = _this.getModule( newData.modId, subModName );

			// 初期データ追加
			var fieldList = _.keys( modTpl.fields );
			for( var idx in fieldList ){
				var fieldName = fieldList[idx];
				if( modTpl.fields[fieldName].fieldType == 'input' ){
					newData.fields[fieldName] = '';
					if( modTpl.fields[fieldName].default !== undefined ){
						// デフォルト値の設定がある場合、セット
						newData.fields[fieldName] = JSON.parse(JSON.stringify(modTpl.fields[fieldName].default));
					}
					newData.fields[fieldName] = broccoli.getFieldDefinition(modTpl.fields[fieldName].type).normalizeData( newData.fields[fieldName] );
				}else if( modTpl.fields[fieldName].fieldType == 'module' ){
					newData.fields[fieldName] = [];
				}else if( modTpl.fields[fieldName].fieldType == 'loop' ){
					newData.fields[fieldName] = [];
				}else if( modTpl.fields[fieldName].fieldType == 'if' ){
				}else if( modTpl.fields[fieldName].fieldType == 'echo' ){
				}
			}
		}else{
			newData = JSON.parse( JSON.stringify(modId) );
		}

		var aryPath = this.parseInstancePath( containerInstancePath );
		// console.log( aryPath );

		function set_r( aryPath, data, newData ){
			// console.log( data );
			var cur = aryPath.shift();
			var idx = null;
			var tmpSplit = cur.split('@');
			cur = tmpSplit[0];
			if( tmpSplit.length >=2 ){
				idx = Number(tmpSplit[1]);
				// console.log(idx);
			}
			var tmpCur = cur.split('.');
			var container = tmpCur[0];
			var fieldName = tmpCur[1];
			var modTpl = _this.getModule( data.modId, data.subModName );

			if( container == 'bowl' ){
				// ルート要素だったらスキップして次へ
				return set_r( aryPath, data.bowl[fieldName], newData );
			}

			if( !aryPath.length ){
				// ここが最後のインスタンスだったら
				if( !data.fields ){
					data.fields = {};
				}
				if( !data.fields[fieldName] ){
					data.fields[fieldName] = [];
				}
				if( modTpl.fields[fieldName].fieldType == 'input'){
					data.fields[fieldName] = newData;
				}else if( modTpl.fields[fieldName].fieldType == 'module'){
					data.fields[fieldName] = data.fields[fieldName]||[];
					var newDataModTpl = _this.getModule( newData.modId );
					if( modTpl.fields[fieldName]['maxLength'] && data.fields[fieldName].length >= modTpl.fields[fieldName]['maxLength'] ){
						// 最大件数に達していたら、追加できない
						broccoli.message('モジュールの数が最大件数 '+modTpl.fields[fieldName]['maxLength']+' に達しています。');
						return false;
					}
					if(newDataModTpl.info.enabledParents.length){
						var tmpIsEnabledParent = false;
						for(var tmpIdx in newDataModTpl.info.enabledParents){
							if(newDataModTpl.info.enabledParents[tmpIdx] == modTpl.id){
								tmpIsEnabledParent = true;
								break;
							}
						}
						if(!tmpIsEnabledParent){
							// 挿入可能な親指定の条件に合致しないため、追加できない
							broccoli.message('このモジュールは、指定されたモジュールの中には追加できません。');
							return false;
						}
					}
					if(modTpl.fields[fieldName].enabledChildren.length){
						var tmpIsEnabledChild = false;
						for(var tmpIdx in modTpl.fields[fieldName].enabledChildren){
							if(modTpl.fields[fieldName].enabledChildren[tmpIdx] == newDataModTpl.id){
								tmpIsEnabledChild = true;
								break;
							}
						}
						if(!tmpIsEnabledChild){
							// 挿入可能な子指定の条件に合致しないため、追加できない
							broccoli.message('このモジュールは追加できません。');
							return false;
						}
					}
					if(newDataModTpl.info.enabledBowls.length){
						var tmpIsEnabledBowl = false;
						for(var tmpIdx in newDataModTpl.info.enabledBowls){
							if( containerInstancePath.match( new RegExp('^\\/bowl\\.' + (newDataModTpl.info.enabledBowls[tmpIdx]) + '\\/') ) ){
								tmpIsEnabledBowl = true;
								break;
							}
						}
						if(!tmpIsEnabledBowl){
							// 挿入可能なbowl指定の条件に合致しないため、追加できない
							broccoli.message('このモジュールは、指定されたBowlの中には追加できません。');
							return false;
						}
					}
					data.fields[fieldName].splice( idx, 0, newData);
				}else if( modTpl.fields[fieldName].fieldType == 'loop'){
					data.fields[fieldName] = data.fields[fieldName]||[];
					if( modTpl.fields[fieldName]['maxLength'] && data.fields[fieldName].length >= modTpl.fields[fieldName]['maxLength'] ){
						// 最大件数に達していたら、追加できない
						broccoli.message('モジュールの数が最大件数 '+modTpl.fields[fieldName]['maxLength']+' に達しています。');
						return false;
					}
					data.fields[fieldName].splice( idx, 0, newData);
				}else if( modTpl.fields[fieldName].fieldType == 'if'){
				}else if( modTpl.fields[fieldName].fieldType == 'echo'){
				}
				return true;
			}else{
				// もっと深かったら
				if( modTpl.fields[fieldName].fieldType == 'input'){
					return set_r( aryPath, data.fields[fieldName], newData );
				}else if( modTpl.fields[fieldName].fieldType == 'module'){
					return set_r( aryPath, data.fields[fieldName][idx], newData );
				}else if( modTpl.fields[fieldName].fieldType == 'loop'){
					return set_r( aryPath, data.fields[fieldName][idx], newData );
				}else if( modTpl.fields[fieldName].fieldType == 'if'){
				}else if( modTpl.fields[fieldName].fieldType == 'echo'){
				}
			}

			return false;
		} // set_r()

		var result = set_r( aryPath, _contentsSourceData, newData );

		cb(result);

		return this;
	}// addInstance()

	/**
	 * インスタンスを更新する
	 */
	this.updateInstance = function( newData, containerInstancePath, cb ){
		// console.log( '----- updateInstance:', containerInstancePath, newData );
		cb = cb||function(){};

		var containerInstancePath = this.parseInstancePath( containerInstancePath );
		// console.log( containerInstancePath );

		function set_r( aryPath, data, newData ){
			// console.log( data );
			var cur = aryPath.shift();
			var idx = null;
			var tmpSplit = cur.split('@');
			cur = tmpSplit[0];
			if( tmpSplit.length >=2 ){
				idx = Number(tmpSplit[1]);
				// console.log(idx);
			}
			var tmpCur = cur.split('.');
			var container = tmpCur[0];
			var fieldName = tmpCur[1];
			var modTpl = _this.getModule( data.modId, data.subModName );

			if( container == 'bowl' ){
				// ルート要素だったら
				if(!aryPath.length){
					// 対象がルート要素だったら
					return;
				}
				// スキップして次へ
				return set_r( aryPath, data.bowl[fieldName], newData );
			}

			if( !aryPath.length ){
				// ここが最後のインスタンスだったら
				if( !data.fields ){
					data.fields = {};
				}
				if( !data.fields[fieldName] ){
					data.fields[fieldName] = [];
				}
				if( modTpl.fields[fieldName].fieldType == 'input'){
					data.fields[fieldName] = newData;
				}else if( modTpl.fields[fieldName].fieldType == 'module'){
					data.fields[fieldName] = data.fields[fieldName]||[];
					data.fields[fieldName][idx] = newData;
				}else if( modTpl.fields[fieldName].fieldType == 'loop'){
					data.fields[fieldName] = data.fields[fieldName]||[];
					data.fields[fieldName][idx] = newData;
				}else if( modTpl.fields[fieldName].fieldType == 'if'){
				}else if( modTpl.fields[fieldName].fieldType == 'echo'){
				}
				return true;
			}else{
				// もっと深かったら
				if( modTpl.fields[fieldName].fieldType == 'input'){
					return set_r( aryPath, data.fields[fieldName], newData );
				}else if( modTpl.fields[fieldName].fieldType == 'module'){
					return set_r( aryPath, data.fields[fieldName][idx], newData );
				}else if( modTpl.fields[fieldName].fieldType == 'loop'){
					return set_r( aryPath, data.fields[fieldName][idx], newData );
				}else if( modTpl.fields[fieldName].fieldType == 'if'){
				}else if( modTpl.fields[fieldName].fieldType == 'echo'){
				}
				return true;
			}

			return true;
		}

		var result = set_r( containerInstancePath, _contentsSourceData, newData );

		cb(result);

		return this;
	}// updateInstance()

	/**
	 * インスタンスを移動する
	 */
	this.moveInstanceTo = function( fromContainerInstancePath, toContainerInstancePath, cb ){
		cb = cb||function(){};

		function isBowlRoot(instancePath){
			if( instancePath.match(new RegExp('^\\/bowl\\.[^\\/]+$')) ){
				return true;
			}
			return false;
		}
		if( isBowlRoot(fromContainerInstancePath) ){
			broccoli.message('bowl を移動することはできません。');
			cb(false);
			return this;
		}
		if( isBowlRoot(toContainerInstancePath) ){
			broccoli.message('bowl への移動はできません。アペンダーへドロップしてください。');
			cb(false);
			return this;
		}

		function parseInstancePath(path){
			function parsePath( path ){
				function escapeRegExp(str) {
					if( typeof(str) !== typeof('') ){return str;}
					return str.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1");
				}
				var rtn = {};
				rtn.path = path;
				rtn.basename = php.basename( rtn.path );
				rtn.dirname = php.dirname( rtn.path );
				rtn.ext = rtn.basename.replace( new RegExp('^.*\\.'), '' );
				rtn.basenameExtless = rtn.basename.replace( new RegExp('\\.'+escapeRegExp(rtn.ext)+'$'), '' );
				return rtn;
			}
			var rtn = {};
			rtn = parsePath( path );
			var basenameParse = rtn.basename.split('@');
			rtn.container = rtn.dirname+'/'+basenameParse[0];
			rtn.num = Number(basenameParse[1]);
			return rtn;
		}

		var fromParsed = parseInstancePath(fromContainerInstancePath);
		var toParsed = parseInstancePath(toContainerInstancePath);

		var dataFrom = this.get( fromContainerInstancePath );
		dataFrom = JSON.parse(JSON.stringify( dataFrom ));//←オブジェクトのdeepcopy

		if( fromParsed.container == toParsed.container ){
			// 同じ箱の中での並び替え
			if( fromParsed.num == toParsed.num ){
				// to と from が一緒だったら何もしない。
				cb(false);
				return this;
			}
			if( fromParsed.num < toParsed.num ){
				// 上から1つ以上下へ
				toContainerInstancePath = toParsed.container + '@' + ( toParsed.num-1 );
			}
			_this.removeInstance(fromContainerInstancePath, function(result){
				_this.addInstance( dataFrom.modId, toContainerInstancePath, function(result){
					_this.updateInstance( dataFrom, toContainerInstancePath, function(result){
						cb(true);
					} );
				} );
			});
		}else if( toParsed.path.indexOf(fromParsed.path) === 0 ){
			// 自分の子階層への移動
			broccoli.message('自分の子階層へ移動することはできません。');
			cb(false);
		}else if( fromParsed.path.indexOf(toParsed.container) === 0 ){
			// 自分の親階層への移動
			var bak_contentsSourceData = JSON.parse( JSON.stringify(_contentsSourceData) ); // バックアップデータ作成
			_this.removeInstance(fromParsed.path, function(result){
				_this.addInstance( dataFrom.modId, toContainerInstancePath, function(result){
					if(!result){
						// ロールバック
						_contentsSourceData = JSON.parse( JSON.stringify(bak_contentsSourceData) );
						cb(false);
						return;
					}
					_this.updateInstance( dataFrom, toContainerInstancePath, function(result){
						cb(true);
					} );
				} );
			});
		}else{
			// まったく関連しない箱への移動
			_this.addInstance( dataFrom.modId, toContainerInstancePath, function(result){
				if(!result){
					cb(false);
					return _this;
				}
				_this.updateInstance( dataFrom, toContainerInstancePath, function(result){
					_this.removeInstance(fromContainerInstancePath, function(result){
						cb(true);
					});
				} );
			} );
		}

		return this;
	} // moveInstanceTo()

	/**
	 * インスタンスを複製する(非同期)
	 *
	 * このメソッドは、インスタンスパスではなく、インスタンスの実体を受け取ります。
	 */
	this.duplicateInstance = function( objInstance, objResources, options, callback ){
		callback = callback || function(){};
		options = options || {};
		var _this = this;
		var supplementModPackage = options.supplementModPackage;
		var parsedModId = broccoli.parseModuleId(objInstance.modId);
		if( parsedModId.package === null ){
			objInstance.modId = supplementModPackage + ':' + parsedModId.category + '/' + parsedModId.module;
		}

		var newData = JSON.parse( JSON.stringify( objInstance ) );
		var modTpl = _this.getModule( objInstance.modId, objInstance.subModName );

		// 初期データ追加
		var fieldList = _.keys( modTpl.fields );
		it79.ary(
			modTpl.fields,
			function(it1, field, fieldName){
				if( modTpl.fields[fieldName].fieldType == 'input' ){
					broccoli.getFieldDefinition(modTpl.fields[fieldName].type).duplicateData( objInstance.fields[fieldName], function( result ){
						newData.fields[fieldName] = result;
						it1.next();
						return;
					}, objResources );
					return;
				}else if( modTpl.fields[fieldName].fieldType == 'module' ){
					it79.ary(
						objInstance.fields[fieldName],
						function(it2, row2, idx2){
							_this.duplicateInstance( objInstance.fields[fieldName][idx2], objResources, options, function( result ){
								newData.fields[fieldName][idx2] = result;
								it2.next();
							} );
						},
						function(){
							it1.next();
						}
					);
					return;
				}else if( modTpl.fields[fieldName].fieldType == 'loop' ){
					it79.ary(
						objInstance.fields[fieldName],
						function(it2, row2, idx2){
							_this.duplicateInstance( objInstance.fields[fieldName][idx2], objResources, options, function( result ){
								newData.fields[fieldName][idx2] = result;
								it2.next();
							} );
						},
						function(){
							it1.next();
						}
					);
					return;
				}else if( modTpl.fields[fieldName].fieldType == 'if' ){
					it1.next();
					return;
				}else if( modTpl.fields[fieldName].fieldType == 'echo' ){
					it1.next();
					return;
				}
				it1.next();
				return;
			},
			function(){
				// setTimeout( function(){ cb(newData); }, 0 );
				broccoli.resourceMgr.init(function(){
					callback(newData);
				});
			}
		);
		return this;
	} // duplicateInstance()

	/**
	 * インスタンスからリソースIDを抽出する(非同期)
	 *
	 * このメソッドは、リソースの実体ではなく、IDを格納する配列を返します。
	 */
	this.extractResourceId = function( objInstance, callback ){
		callback = callback || function(){};
		var _this = this;
		var resourceIdList = [];
		var modTpl = _this.getModule( objInstance.modId, objInstance.subModName );

		// 初期データ追加
		var fieldList = _.keys( modTpl.fields );
		it79.ary(
			modTpl.fields,
			function(it1, field, fieldName){
				if( modTpl.fields[fieldName].fieldType == 'input' ){
					broccoli.getFieldDefinition(modTpl.fields[fieldName].type).extractResourceId( objInstance.fields[fieldName], function( result ){
						resourceIdList = resourceIdList.concat(result);
						it1.next();
						return;
					} );
					return;
				}else if( modTpl.fields[fieldName].fieldType == 'module' ){
					it79.ary(
						objInstance.fields[fieldName],
						function(it2, row2, idx2){
							_this.extractResourceId( objInstance.fields[fieldName][idx2], function( result ){
								resourceIdList = resourceIdList.concat(result);
								it2.next();
							} );
						},
						function(){
							it1.next();
						}
					);
					return;
				}else if( modTpl.fields[fieldName].fieldType == 'loop' ){
					it79.ary(
						objInstance.fields[fieldName],
						function(it2, row2, idx2){
							_this.extractResourceId( objInstance.fields[fieldName][idx2], function( result ){
								resourceIdList = resourceIdList.concat(result);
								it2.next();
							} );
						},
						function(){
							it1.next();
						}
					);
					return;
				}else if( modTpl.fields[fieldName].fieldType == 'if' ){
					it1.next();
					return;
				}else if( modTpl.fields[fieldName].fieldType == 'echo' ){
					it1.next();
					return;
				}
				it1.next();
				return;
			},
			function(){
				// setTimeout( function(){ cb(resourceIdList); }, 0 );
				broccoli.resourceMgr.init(function(){
					callback(resourceIdList);
				});
			}
		);
		return this;
	}// extractResourceId()

	/**
	 * インスタンスを削除する(非同期)
	 */
	this.removeInstance = function( containerInstancePath, cb ){
		cb = cb||function(){};

		var containerInstancePath = this.parseInstancePath( containerInstancePath );

		function remove_r( aryPath, data ){
			if( !aryPath.length ){
				return false;
			}
			var cur = aryPath.shift();
			var idx = null;
			var tmpSplit = cur.split('@');
			cur = tmpSplit[0];
			if( tmpSplit.length >=2 ){
				idx = Number(tmpSplit[1]);
			}
			var tmpCur = cur.split('.');
			var container = tmpCur[0];
			var fieldName = tmpCur[1];
			var modTpl = _this.getModule( data.modId, data.subModName );

			if( container == 'bowl' ){
				// ルート要素だったらスキップして次へ
				return remove_r( aryPath, data.bowl[fieldName] );
			}

			if( !aryPath.length ){
				// ここが最後のインスタンスだったら
				if( !data.fields ){
					data.fields = {};
				}
				if( !data.fields[fieldName] ){
					data.fields[fieldName] = [];
				}
				if( modTpl.fields[fieldName].fieldType == 'input'){
					delete data.fields[fieldName];
				}else if( modTpl.fields[fieldName].fieldType == 'module'){
					data.fields[fieldName].splice(idx, 1);
				}else if( modTpl.fields[fieldName].fieldType == 'loop'){
					data.fields[fieldName].splice(idx, 1);
				}else if( modTpl.fields[fieldName].fieldType == 'if'){
				}else if( modTpl.fields[fieldName].fieldType == 'echo'){
				}
				return true;
			}else{
				// もっと深かったら
				if( modTpl.fields[fieldName].fieldType == 'input'){
					return remove_r( aryPath, data.fields[fieldName] );
				}else if( modTpl.fields[fieldName].fieldType == 'module'){
					return remove_r( aryPath, data.fields[fieldName][idx] );
				}else if( modTpl.fields[fieldName].fieldType == 'loop'){
					return remove_r( aryPath, data.fields[fieldName][idx] );
				}else if( modTpl.fields[fieldName].fieldType == 'if'){
				}else if( modTpl.fields[fieldName].fieldType == 'echo'){
				}
			}
			return true;
		}

		remove_r( containerInstancePath, _contentsSourceData );

		cb();

		return this;
	}// removeInstance()

	/**
	 * インスタンスのパスを解析する(同期)
	 */
	this.parseInstancePath = function( containerInstancePath ){
		if( typeof(containerInstancePath) === typeof([]) ){
			return containerInstancePath;
		}
		// console.log(containerInstancePath);
		containerInstancePath = containerInstancePath||'';
		if( !containerInstancePath ){ containerInstancePath = '/fields.main'; }
		containerInstancePath = containerInstancePath.replace( new RegExp('^\\/*'), '' );
		containerInstancePath = containerInstancePath.replace( new RegExp('\\/*$'), '' );
		containerInstancePath = containerInstancePath.split('/');
		// console.log(containerInstancePath);
		return containerInstancePath;
	}

	/**
	 * bowl別のコンテンツデータを初期化する
	 */
	this.initBowlData = function( bowlName ){
		bowlName = bowlName||'main';
		if( _contentsSourceData.bowl[bowlName] ){
			return true;
		}
		_contentsSourceData.bowl[bowlName] = _contentsSourceData.bowl[bowlName]||{
			'modId':'_sys/root',
			'fields':{}
		};
		return true;
	}

	/**
	 * bowl別のコンテンツデータを取得
	 */
	this.getBowlData = function( bowlName ){
		bowlName = bowlName||'main';
		if( !_contentsSourceData.bowl[bowlName] ){
			return false;
		}
		return _contentsSourceData.bowl[bowlName];
	}

	/**
	 * bowl別のコンテンツデータをセット
	 */
	this.setBowlData = function( bowlName, data ){
		bowlName = bowlName||'main';
		_contentsSourceData.bowl[bowlName] = data;
		return;
	}

	/**
	 * bowlの一覧を取得
	 */
	this.getBowlList = function(){
		var rtn = [];
		for(var bowlName in _contentsSourceData.bowl){
			rtn.push(bowlName);
		}
		return rtn;
	}

	/**
	 * モジュールを取得 (同期)
	 */
	this.getModule = function( modId, subModName ){
		var rtn = _modTpls[modId];
		if( typeof( rtn ) !== typeof({}) ){
			return false;
		}
		if( typeof(subModName) === typeof('') ){
			// console.log(subModName);
			// console.log(rtn.subModule[subModName]);
			if( !rtn.subModule || !rtn.subModule[subModName] ){
				console.error('Undefined subModule "'+subModName+'" was called.');
				return false;
			}
			return rtn.subModule[subModName];
		}
		return rtn;
	}

	/**
	 * すべてのモジュールを取得 (同期)
	 */
	this.getAllModules = function(){
		return _modTpls;
	}

	/**
	 * history: 取り消し (非同期)
	 */
	this.historyBack = function( cb ){
		cb = cb || function(){};
		this.history.back(function(data){
			if( data === false ){
				cb(false);
				return;
			}
			_contentsSourceData = data;
			cb(true);
			return;
		});
		return this;
	}

	/**
	 * history: やりなおし (非同期)
	 */
	this.historyGo = function( cb ){
		cb = cb || function(){};
		this.history.go(function(data){
			if( data === false ){
				cb(false);
				return;
			}
			_contentsSourceData = data;
			cb(true);
			return;
		});
		return this;
	}

	/**
	 * データを保存する(非同期)
	 */
	this.save = function(callback){
		var _this = this;
		callback = callback||function(){};
		it79.fnc(
			{},
			[
				function( it1, data ){
					broccoli.gpi(
						'saveContentsData',
						{
							'data': _contentsSourceData
						},
						function(){
							it1.next(data);
						}
					);
				} ,
				function( it1, data ){
					// 履歴に追加
					var historyInfo = _this.history.getHistory();
					if(historyInfo.index === 0){
						_this.history.put( _contentsSourceData, function(){
							it1.next(data);
						} );
						return;
					}else{
						it1.next(data);
						return;
					}
				} ,
				function( it1, data ){
					callback();
					it1.next(data);
				}
			]
		);
		return this;
	}

}
