/**
 * contentsSourceData.js
 */
module.exports = function(broccoli){
	var _this = this;
	this.broccoli = broccoli;

	var _ = require('underscore');
	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');

	var _contentsSourceData = broccoli.getBootupInfomations().contentsDataJson; // <= data.jsonの中身
	var _modTpls = broccoli.getBootupInfomations().allModuleList; // <- module の一覧

	var _moduleInternalIdMap = {};
	for(var idx in _modTpls){
		_moduleInternalIdMap[_modTpls[idx].internalId] = idx;
	}

	var _resourceDbReloadRequest =false;

	/**
	 * 初期化
	 */
	this.init = function( callback ){
		_this.history = new (require('./history.js'))(broccoli);
		var resourceDb;
		it79.fnc(
			{},
			[
				function(it1, data){
					// コンテンツデータを整理
					broccoli.resourceMgr.getResourceDb(function(res){
						resourceDb = res;
						it1.next(data);
					});
				} ,
				function(it1, data){
					// コンテンツデータを整理
					_contentsSourceData.bowl = _contentsSourceData.bowl||{};
					_this.initBowlData('main');
					it1.next(data);
				} ,
				function(it1, data){
					// ヒストリーマネージャーの初期化
					_this.history.init(
						_contentsSourceData,
						resourceDb,
						function(){
							it1.next(data);
						}
					);
				} ,
				function(it1, data){
					callback();
				}
			]
		);

		return;
	}

	/**
	 * データを取得する (同期)
	 */
	this.get = function( containerInstancePath, data ){
		data = data || _contentsSourceData;

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
		var modTpl = _this.getModuleByInternalId( data.modId, data.subModName );

		if( container == 'bowl' ){
			return this.get( aryPath, data.bowl[fieldName] );
		}
		if( !modTpl || !modTpl.fields || !modTpl.fields[fieldName] ){
			return false;
		}

		modTpl.fields[fieldName].fieldType = modTpl.fields[fieldName].fieldType || 'input';
		if( !aryPath.length ){
			// ここが最後のインスタンスだったら
			if( !data.fields || isArray(data.fields) ){
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
	 * 親インスタンスのパスを取得する
	 *
	 * @param {*} instancePath インスタンスパス
	 * @returns 親インスタンスのパス
	 */
	this.getParentInstancePath = function(instancePath){
		var parentInstancePath = instancePath.replace(/(?:\/fields\.([a-zA-Z0-9\_\-]+)\@[0-9]*)$/, '');
		return parentInstancePath;
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
		var modTpl = _this.getModuleByInternalId( current.modId, current.subModName );
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
		return;
	}

	/**
	 * インスタンスを追加する (非同期)
	 */
	this.addInstance = function( modId, containerInstancePath, callback, subModName ){
		callback = callback||function(){};

		if( containerInstancePath.match(new RegExp('^\\/bowl\\.[^\\/]+$')) ){
			broccoli.message(broccoli.lb.get('ui_message.cannot_add_to_bowl_add_it_in_appender')); // bowl に追加することはできません。アペンダーに追加してください。
			callback();
			return;
		}

		var containerInstanceData = broccoli.contentsSourceData.get(broccoli.contentsSourceData.getParentInstancePath(containerInstancePath));
		if( containerInstanceData.locked && containerInstanceData.locked.children ){
			// ロックされたインスタンスが含まれている場合、追加できない。 → 中止
			broccoli.message("Failed to insert. Field is locked.");
			callback();
			return;
		}

		var newData = {};
		if( typeof(modId) === typeof('') ){
			var modTpl = _this.getModuleByInternalId( modId, subModName );
			newData = new (function(modId, subModName){
				this.modId =  modId,
				this.fields = {}
				if( typeof(subModName) === typeof('') ){
					this.subModName = subModName;
				}
			})(modTpl.internalId, subModName);

			// 初期データ追加
			var fieldList = _.keys( modTpl.fields );
			for( var idx in fieldList ){
				var fieldName = fieldList[idx];
				modTpl.fields[fieldName].fieldType = modTpl.fields[fieldName].fieldType || 'input';
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

		function set_recursive( aryPath, data, newData ){
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
			var modTpl = _this.getModuleByInternalId( data.modId, data.subModName );

			if( container == 'bowl' ){
				// ルート要素だったらスキップして次へ
				return set_recursive( aryPath, data.bowl[fieldName], newData );
			}

			if( !aryPath.length ){
				// ここが最後のインスタンスだったら
				if( !data.fields || isArray(data.fields) ){
					data.fields = {};
				}
				if( !data.fields[fieldName] ){
					data.fields[fieldName] = [];
				}
				modTpl.fields[fieldName].fieldType = modTpl.fields[fieldName].fieldType || 'input';
				if( modTpl.fields[fieldName].fieldType == 'input'){
					data.fields[fieldName] = newData;
				}else if( modTpl.fields[fieldName].fieldType == 'module'){
					data.fields[fieldName] = data.fields[fieldName]||[];
					var newDataModTpl = _this.getModuleByInternalId( newData.modId );
					if( modTpl.fields[fieldName]['maxLength'] && data.fields[fieldName].length >= modTpl.fields[fieldName]['maxLength'] ){
						// 最大件数に達していたら、追加できない
						broccoli.message(broccoli.lb.get( // モジュールの数が最大件数 000 に達しています。
							'ui_message.number_of_modules_has_reached_the_maximum_number_of_maxLength',
							{
								"maxLength": modTpl.fields[fieldName]['maxLength'],
							}));
						return false;
					}
					if( newDataModTpl && newDataModTpl.info && newDataModTpl.info.enabledParents && newDataModTpl.info.enabledParents.length ){
						var tmpIsEnabledParent = false;
						for(var tmpIdx in newDataModTpl.info.enabledParents){
							if(newDataModTpl.info.enabledParents[tmpIdx] == modTpl.id){
								tmpIsEnabledParent = true;
								break;
							}
						}
						if(!tmpIsEnabledParent){
							// 挿入可能な親指定の条件に合致しないため、追加できない
							broccoli.message(broccoli.lb.get('ui_message.module_cannot_be_added_among_the_specified_modules')); // このモジュールは、指定されたモジュールの中には追加できません。
							return false;
						}
					}
					if(typeof(modTpl.fields[fieldName].enabledChildren)==typeof([]) && modTpl.fields[fieldName].enabledChildren.length){
						var tmpIsEnabledChild = false;
						for(var tmpIdx in modTpl.fields[fieldName].enabledChildren){
							if(modTpl.fields[fieldName].enabledChildren[tmpIdx] == newDataModTpl.id){
								tmpIsEnabledChild = true;
								break;
							}
						}
						if(!tmpIsEnabledChild){
							// 挿入可能な子指定の条件に合致しないため、追加できない
							broccoli.message(broccoli.lb.get('ui_message.module_cannot_be_added')); // このモジュールは追加できません。
							return false;
						}
					}
					if(newDataModTpl && newDataModTpl.info && newDataModTpl.info.enabledBowls && newDataModTpl.info.enabledBowls.length){
						var tmpIsEnabledBowl = false;
						for(var tmpIdx in newDataModTpl.info.enabledBowls){
							if( containerInstancePath.match( new RegExp('^\\/bowl\\.' + (newDataModTpl.info.enabledBowls[tmpIdx]) + '\\/') ) ){
								tmpIsEnabledBowl = true;
								break;
							}
						}
						if(!tmpIsEnabledBowl){
							// 挿入可能なbowl指定の条件に合致しないため、追加できない
							broccoli.message(broccoli.lb.get('ui_message.module_cannot_be_added_inside_the_specified_bowl')); // このモジュールは、指定されたBowlの中には追加できません。
							return false;
						}
					}
					data.fields[fieldName].splice( idx, 0, newData);
				}else if( modTpl.fields[fieldName].fieldType == 'loop'){
					data.fields[fieldName] = data.fields[fieldName]||[];
					if( modTpl.fields[fieldName]['maxLength'] && data.fields[fieldName].length >= modTpl.fields[fieldName]['maxLength'] ){
						// 最大件数に達していたら、追加できない
						broccoli.message(broccoli.lb.get( // モジュールの数が最大件数 000 に達しています。
							'ui_message.number_of_modules_has_reached_the_maximum_number_of_maxLength',
							{
								"maxLength": modTpl.fields[fieldName]['maxLength'],
							}));
						return false;
					}
					data.fields[fieldName].splice( idx, 0, newData);
				}else if( modTpl.fields[fieldName].fieldType == 'if'){
				}else if( modTpl.fields[fieldName].fieldType == 'echo'){
				}
				return true;
			}else{
				// もっと深かったら
				modTpl.fields[fieldName].fieldType = modTpl.fields[fieldName].fieldType || 'input';
				if( modTpl.fields[fieldName].fieldType == 'input'){
					return set_recursive( aryPath, data.fields[fieldName], newData );
				}else if( modTpl.fields[fieldName].fieldType == 'module'){
					return set_recursive( aryPath, data.fields[fieldName][idx], newData );
				}else if( modTpl.fields[fieldName].fieldType == 'loop'){
					return set_recursive( aryPath, data.fields[fieldName][idx], newData );
				}else if( modTpl.fields[fieldName].fieldType == 'if'){
				}else if( modTpl.fields[fieldName].fieldType == 'echo'){
				}
			}

			return false;
		}

		var result = set_recursive( aryPath, _contentsSourceData, newData );

		callback(result);

		return;
	}

	/**
	 * インスタンスを更新する
	 */
	this.updateInstance = function( newData, containerInstancePath, callback ){
		callback = callback || function(){};

		var containerInstancePath = this.parseInstancePath( containerInstancePath );

		function set_recursive( aryPath, data, newData ){
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
			var modTpl = _this.getModuleByInternalId( data.modId, data.subModName );

			if( container == 'bowl' ){
				// ルート要素だったら
				if(!aryPath.length){
					// 対象がルート要素だったら
					return;
				}
				// スキップして次へ
				return set_recursive( aryPath, data.bowl[fieldName], newData );
			}

			modTpl.fields[fieldName].fieldType = modTpl.fields[fieldName].fieldType || 'input';
			if( !aryPath.length ){
				// ここが最後のインスタンスだったら
				if( !data.fields || isArray(data.fields) ){
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
					return set_recursive( aryPath, data.fields[fieldName], newData );
				}else if( modTpl.fields[fieldName].fieldType == 'module'){
					return set_recursive( aryPath, data.fields[fieldName][idx], newData );
				}else if( modTpl.fields[fieldName].fieldType == 'loop'){
					return set_recursive( aryPath, data.fields[fieldName][idx], newData );
				}else if( modTpl.fields[fieldName].fieldType == 'if'){
				}else if( modTpl.fields[fieldName].fieldType == 'echo'){
				}
				return true;
			}

			return true;
		}

		var result = set_recursive( containerInstancePath, _contentsSourceData, newData );

		callback(result);

		return;
	}

	/**
	 * インスタンスを移動する
	 */
	this.moveInstanceTo = function( fromContainerInstancePath, toContainerInstancePath, callback ){
		callback = callback||function(){};

		function isBowlRoot(instancePath){
			if( instancePath.match(new RegExp('^\\/bowl\\.[^\\/]+$')) ){
				return true;
			}
			return false;
		}
		if( isBowlRoot(fromContainerInstancePath) ){
			broccoli.message(broccoli.lb.get('ui_message.bowl_cannot_be_moved')); // bowl を移動することはできません。
			callback(false);
			return;
		}
		if( isBowlRoot(toContainerInstancePath) ){
			broccoli.message(broccoli.lb.get('ui_message.cannot_move_to_bowl_drop_it_in_appender')); // bowl への移動はできません。アペンダーへドロップしてください。
			callback(false);
			return;
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
				callback(false);
				return;
			}
			if( fromParsed.num < toParsed.num ){
				// 上から1つ以上下へ
				toContainerInstancePath = toParsed.container + '@' + ( toParsed.num-1 );
			}
			_this.removeInstance(fromContainerInstancePath, function(result){
				_this.addInstance( dataFrom.modId, toContainerInstancePath, function(result){
					_this.updateInstance( dataFrom, toContainerInstancePath, function(result){
						callback(true);
					} );
				} );
			});
		}else if( toParsed.path.indexOf(fromParsed.path) === 0 ){
			// 自分の子階層への移動
			broccoli.message(broccoli.lb.get('ui_message.cannot_move_to_child_hierarchy')); // 自分の子階層へ移動することはできません。
			callback(false);
		}else if( fromParsed.path.indexOf(toParsed.container) === 0 ){
			// 自分の親階層への移動
			var bak_contentsSourceData = JSON.parse( JSON.stringify(_contentsSourceData) ); // バックアップデータ作成
			_this.removeInstance(fromParsed.path, function(result){
				_this.addInstance( dataFrom.modId, toContainerInstancePath, function(result){
					if(!result){
						// ロールバック
						_contentsSourceData = JSON.parse( JSON.stringify(bak_contentsSourceData) );
						callback(false);
						return;
					}
					_this.updateInstance( dataFrom, toContainerInstancePath, function(result){
						callback(true);
					} );
				} );
			});
		}else{
			// まったく関連しない箱への移動
			_this.addInstance( dataFrom.modId, toContainerInstancePath, function(result){
				if(!result){
					callback(false);
					return _this;
				}
				_this.updateInstance( dataFrom, toContainerInstancePath, function(result){
					_this.removeInstance(fromContainerInstancePath, function(result){
						callback(true);
					});
				} );
			} );
		}

		return;
	}

	/**
	 * インスタンスを複製する(非同期)
	 *
	 * このメソッドは、インスタンスパスではなく、インスタンスの実体を受け取ります。
	 */
	this.duplicateInstance = function( objInstance, objResources, options, callback ){
		callback = callback || function(){};
		options = options || {};
		var _this = this;
		var supplementModPackage = options.supplementModPackage || '';
		var parsedModId = broccoli.parseModuleId(objInstance.modId);
		if( parsedModId.package === null ){
			if( parsedModId.category == '_sys' ){
				objInstance.modId = parsedModId.category + '/' + parsedModId.module;
			}else{
				objInstance.modId = supplementModPackage + ':' + parsedModId.category + '/' + parsedModId.module;
			}
		}

		var newData = JSON.parse( JSON.stringify( objInstance ) );
		var modTpl = _this.getModule( objInstance.modId, objInstance.subModName );

		// 初期データ追加
		var fieldList = _.keys( modTpl.fields );
		it79.ary(
			modTpl.fields,
			function(it1, field, fieldName){
				modTpl.fields[fieldName].fieldType = modTpl.fields[fieldName].fieldType || 'input';
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
				broccoli.resourceMgr.init(function(){
					callback(newData);
				});
			}
		);
		return;
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
		var modTpl = _this.getModuleByInternalId( objInstance.modId, objInstance.subModName );

		// 初期データ追加
		var fieldList = _.keys( modTpl.fields );
		it79.ary(
			modTpl.fields,
			function(it1, field, fieldName){
				modTpl.fields[fieldName].fieldType = modTpl.fields[fieldName].fieldType || 'input';
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
				broccoli.resourceMgr.init(function(){
					callback(resourceIdList);
				});
			}
		);
		return;
	}

	/**
	 * インスタンスを削除する(非同期)
	 */
	this.removeInstance = function( containerInstancePath, callback ){
		callback = callback || function(){};

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
			var modTpl = _this.getModuleByInternalId( data.modId, data.subModName );

			if( container == 'bowl' ){
				// ルート要素だったらスキップして次へ
				return remove_r( aryPath, data.bowl[fieldName] );
			}

			modTpl.fields[fieldName].fieldType = modTpl.fields[fieldName].fieldType || 'input';
			if( !aryPath.length ){
				// ここが最後のインスタンスだったら
				if( !data.fields || isArray(data.fields) ){
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

		callback();

		return;
	}

	/**
	 * インスタンスのパスを解析する(同期)
	 */
	this.parseInstancePath = function( containerInstancePath ){
		if( typeof(containerInstancePath) === typeof([]) ){
			return containerInstancePath;
		}

		containerInstancePath = containerInstancePath||'';
		if( !containerInstancePath ){ containerInstancePath = '/fields.main'; }
		containerInstancePath = containerInstancePath.replace( new RegExp('^\\/*'), '' );
		containerInstancePath = containerInstancePath.replace( new RegExp('\\/*$'), '' );
		containerInstancePath = containerInstancePath.split('/');

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
			if( !rtn.subModule || !rtn.subModule[subModName] ){
				console.error('Undefined subModule "'+subModName+'" was called.');
				return false;
			}
			return rtn.subModule[subModName];
		}
		return rtn;
	}

	/**
	 * internalIdからモジュールを取得 (同期)
	 */
	this.getModuleByInternalId = function( modInternalId, subModName ){
		var modId = _moduleInternalIdMap[modInternalId];
		if( typeof(modId) !== typeof('') || !modId.length ){
			return false;
		}
		return this.getModule(modId, subModName);
	}

	/**
	 * すべてのモジュールを取得 (同期)
	 */
	this.getAllModules = function(){
		return _modTpls;
	}

	/**
	 * 次回のコンテンツ保存時に、resourceDb 全体の更新(ダウンロード)実行を要求する
	 *
	 * ここに要求が出されている場合、次回のコンテンツ保存時にresourceDbが更新されます。
	 */
	this.resourceDbReloadRequest = function(){
		_resourceDbReloadRequest = true;
		return true;
	}

	/**
	 * history: 取り消し (非同期)
	 */
	this.historyBack = function( callback ){
		this.historyBackOrGo(-1, callback);
		return;
	}

	/**
	 * history: やりなおし (非同期)
	 */
	this.historyGo = function( callback ){
		this.historyBackOrGo(1, callback);
		return;
	}

	/**
	 * history: 戻る、または やりなおし (非同期)
	 */
	var historyStepStock = 0;
	var historyTimer;
	var historyLock = false;
	this.historyBackOrGo = function( step, callback ){
		callback = callback || function(){};
		var resourceDb;

		if(historyLock){
			callback(false);
			return;
		}

		broccoli.indicator.saveProgress();
		clearTimeout(historyTimer);

		historyStepStock += step;
		// console.log(historyStepStock);
		(function(){
			if( historyStepStock > 0 ){
				var message = broccoli.lb.get('ui_label.go'); // 進む
				if( historyStepStock > 1 ){
					message += ': ' + Math.abs(historyStepStock) + ' step';
				}
				broccoli.progressMessage(message);
			}else if( historyStepStock < 0 ){
				var message = broccoli.lb.get('ui_label.back'); // 戻る
				if( historyStepStock < -1 ){
					message += ': ' + Math.abs(historyStepStock) + ' step';
				}
				broccoli.progressMessage(message);
			}else{
				broccoli.closeProgress();
			}
		})();
		broccoli.setUiState('standby'); // これがないと、戻る/進む の連続入力ができない。


		var doHistoryCommand = function(step){
			if(!step){
				broccoli.indicator.saveCompleted();
				historyLock = false;
				historyStepStock = 0;
				callback(true);
				return;
			}
			it79.fnc(
				{},
				[
					function( it1, data ){
						// historyからコンテンツデータを復元する
						if( typeof(step) == typeof(0) && ( step > 0 || step < 0 ) ){
							_this.history.step(step, function(data){
								if( data === false ){
									broccoli.indicator.saveCompleted();
									historyLock = false;
									historyStepStock = 0;
									callback(false);
									return;
								}
								_contentsSourceData = data.contents;
								resourceDb = data.resources;
								it1.next(data);
								return;
							});
							return;
						}
						console.error('Error: Invalid argument.', step);
						broccoli.indicator.saveCompleted();
						historyLock = false;
						historyStepStock = 0;
						callback(false);
						return;
					} ,
					function( it1, data ){
						// historyからリソースデータを復元する
						broccoli.resourceMgr.setResourceDb(resourceDb, function(result){
							if(!result){
								alert(broccoli.lb.get('ui_message.failed_to_update_resourceDb')); // リソースデータベースの更新に失敗しました。
							}
							it1.next(data);
						});
						return;
					} ,
					function( it1, data ){
						// コンテンツデータを保存する
						broccoli.gpi(
							'saveContentsData',
							{
								'data': _contentsSourceData
									// ↑保存するたびに、コンテンツデータの全量が送られる。(ただし画像等のリソースはここに含まない)
							},
							function(){
								it1.next(data);
							}
						);
					} ,
					function(it1, data){
						// resourceDbを保存する
						broccoli.resourceMgr.save(function(res){
							it1.next(data);
						});
						return;
					} ,
					function(it1, data){
						// コンテンツを更新
						broccoli.gpi(
							'updateContents',
							{} ,
							function(result){
								it1.next(data);
							}
						);
					} ,
					function(it1, data){
						broccoli.indicator.saveCompleted();
						historyLock = false;
						historyStepStock = 0;
						callback(true);
						return;
					}
				]
			);
		}
		historyTimer = setTimeout(function(){
			historyLock = true;
			doHistoryCommand(historyStepStock);
		}, 500);
		return;
	}


	/**
	 * データを保存する(非同期)
	 */
	this.save = function(callback){
		var _this = this;
		var resourceDb;
		callback = callback||function(){};

		it79.fnc(
			{},
			[
				function( it1, data ){
					// コンテンツデータを保存する
					broccoli.progressMessage(broccoli.lb.get('ui_message.saving_content_data')); // コンテンツデータを保存しています
					broccoli.gpi(
						'saveContentsData',
						{
							'data': _contentsSourceData
								// ↑保存するたびに、コンテンツデータの全量が送られる。(ただし画像等のリソースはここに含まない)
						},
						function(){
							it1.next(data);
						}
					);
				} ,
				function(it1, data){
					// resourceDbを再取得
					// (リロード要求が出されていたら実行する)
					if( !_resourceDbReloadRequest ){
						it1.next(data);
						return;
					}
					broccoli.progressMessage(broccoli.lb.get('ui_message.synchronizing_resources')); // リソースデータを同期しています
					broccoli.resourceMgr.reload(function(resourceDb){
						_resourceDbReloadRequest = false;
						it1.next(data);
					});
					return;
				} ,
				function( it1, data ){
					// リソース全体を取り出す
					broccoli.resourceMgr.getResourceDb(function(res){
						resourceDb = res;
						it1.next(data);
					});
				} ,
				function( it1, data ){
					// 履歴に追加
					broccoli.progressMessage(broccoli.lb.get('ui_message.adding_to_history')); // 履歴に追加しています
					_this.history.put( _contentsSourceData, resourceDb, function(){
						it1.next(data);
					} );
					return;
				} ,
				function( it1, data ){
					callback();
					it1.next(data);
				}
			]
		);
		return;
	}

	/**
	 * 値が、配列型か調べる
	 */
	function isArray(value){
		if( typeof(value) !== typeof({}) || typeof(value.length) !== typeof(0) || typeof(value.splice) !== 'function' || value.propertyIsEnumerable('length') ){
			return false;
		}
		return true;
	}
}
