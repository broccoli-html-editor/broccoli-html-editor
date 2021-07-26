/**
 * panels.js
 */
module.exports = function(broccoli){
	// delete(require.cache[require('path').resolve(__filename)]);
	if(!window){ callback(); return false; }

	var _this = this;

	var it79 = require('iterate79');
	var path = require('path');
	var php = require('phpjs');
	var twig = require('twig');
	var $ = require('jquery');

	var $panels;
	var $contentsElements;

	var selectedInstance;
	var focusedInstance;
	var isOnDragging = false;

	/**
	 * 各パネルを描画する
	 */
	function drawPanel(idx, domElm){
		if( !domElm.visible ){
			return;
		}
		function calcHeight($me, idx){//パネルの高さを計算する
			var $nextElm = (function(){
				var instancePath = domElm.instancePath;
				if( instancePath.match( /\@[0-9]*$/ ) ){
					var instancePathNext = instancePath.replace( /([0-9]*)$/, '' );
					instancePathNext += php.intval(RegExp.$1) + 1;
					// console.log("from: "+ instancePath);
					// console.log("to: "+instancePathNext);
					$nextElm = $contentsElements[instancePathNext];
					return $nextElm;
				}
				return null;
			})();
			if( !$nextElm ){
				return $me.outerHeight;
			}
			var rtn = ($nextElm.offsetTop - $me.offsetTop);
			if( $me.outerHeight > rtn ){
				return $me.outerHeight;
			}
			return rtn;
		}
		var $this = domElm;
		var $panel = $('<div>');
		var isAppender = $this.isAppender;

		// if( $this.instancePath.match(new RegExp('^\\/bowl\\.[^\\/]+$')) ){
		// 		// bowl自体は選択も操作もできないので、パネルを描画しない。
		// 	return;
		// }

		var modInfo = broccoli.contentsSourceData.getModuleByInternalId($this.modId);
			//postMessageから得られるモジュールのidは、実際にはinternalIdを格納するため、ここで翻訳する。

		$panels.append($panel);
		$panel
			.css({
				'width': $this.outerWidth,
				'height': calcHeight($this, idx),
				'position': 'absolute',
				'left': $this.offsetLeft,
				'top': $this.offsetTop
			})
			.addClass('broccoli--panel')
			.attr({
				'data-broccoli-instance-path': $this.instancePath,
				'data-broccoli-is-appender': 'no',
				'data-broccoli-mod-id': modInfo.id,
				'data-broccoli-mod-internal-id': modInfo.internalId,
				'data-broccoli-sub-mod-name': $this.subModName,
				'draggable': (isAppender ? false : true) // <- HTML5のAPI https://developer.mozilla.org/ja/docs/Web/API/HTML_Drag_and_Drop_API
			})
			.append( $('<div>')
				.addClass('broccoli--panel-drop-to-insert-here')
			)
		;
		_this.setPanelEventHandlers($panel);
		if( !isAppender ){
			$panel
				.append( $('<div>')
					.addClass('broccoli--panel-module-name')
					.text($this.modName)
				)
			;
		}
		if( isAppender ){
			$panel
				.attr({
					'data-broccoli-is-appender': 'yes'
				})
			;
		}
		return;
	}

	/**
	 * パネルの ondrop イベントハンドラ
	 * このメソッドは、 this.setPanelEventHandlers() の他、
	 * editWindow からもコールされています。
	 */
	this.onDrop = function(e, elm, callback){
		callback = callback || function(){};
		e.stopPropagation();
		e.preventDefault();
		var event = e.originalEvent;
		// console.log('=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=', event);
		$(elm).removeClass('broccoli--panel__drag-entered');
		$(elm).removeClass('broccoli--panel__drag-entered-u');
		$(elm).removeClass('broccoli--panel__drag-entered-d');

		var ud = getUd(e, elm);
		// console.info(ud);

		var transferData = event.dataTransfer.getData("text/json");
		try {
			transferData = JSON.parse(transferData);
		} catch (e) {}
		var method = transferData.method;
		// options.drop($(elm).attr('data-broccoli-instance-path'), method);
		// console.log(method);
		var subModNameFrom = transferData["data-broccoli-sub-mod-name"] || '';
		var subModName = $(elm).attr('data-broccoli-sub-mod-name');
		var isAppenderFrom = (transferData["data-broccoli-is-appender"] == 'yes');
		var isAppender = ($(elm).attr('data-broccoli-is-appender') == 'yes');
		var moveFrom = transferData["data-broccoli-instance-path"] || '';
		var moveFroms = [];
		var moveTo = $(elm).attr('data-broccoli-instance-path');
		var isInstanceTreeView = $(elm).attr('data-broccoli-is-instance-tree-view') == 'yes';
		var isEditWindow = $(elm).attr('data-broccoli-is-edit-window') == 'yes';

		if( !moveFrom ){
			moveFroms = [];
		}else if( broccoli.isInstanceSelected(moveFrom) ){
			moveFroms = broccoli.getSelectedInstanceRegion();
		}else{
			moveFroms = [moveFrom];
		}

		if( !isAppender && ud.y == 'd' ){
			moveTo = (function(moveTo){
				// console.log(moveTo);
				if(!moveTo.match(/^([\S]+)\@([0-9]+)$/)){
					console.error('FATAL: Instance path has an illegal format.');
					return moveTo;
				}

				var moveToPath = RegExp.$1;
				var moveToIdx = Number(RegExp.$2);

				return moveToPath + '@' + (moveToIdx + 1);
			})(moveTo);
		}

		if( event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length ){
			console.log('外部からファイルがドロップされました。', event.dataTransfer.files);
			return onDropFile(e, moveTo, callback);
		}

		if( moveFroms[0] === moveTo || ( broccoli.isInstanceSelected( moveTo ) && method === 'moveTo' ) ){
			// 移動元と移動先が同一の場合、
			// または、移動先が選択状態の場合キャンセルとみなす
			$(elm).removeClass('broccoli--panel__drag-entered');
			$(elm).removeClass('broccoli--panel__drag-entered-u');
			$(elm).removeClass('broccoli--panel__drag-entered-d');
			callback();
			return;
		}

		// 処理後の選択状態に影響します。
		var newInstancePath = moveFroms[0];

		var fncMoveWhile = function(moveFroms, moveTo){
			// console.log('length:', moveFroms.length);
			// console.log('====== move from, to', moveFroms, moveTo);
			var currentMoveFrom = moveFroms.shift();
			// console.log('*** currentMoveFrom:', currentMoveFrom);
			broccoli.contentsSourceData.moveInstanceTo( currentMoveFrom, moveTo, function(result){
				if(!result){
					console.error('移動に失敗しました。', currentMoveFrom, moveTo, result);
				}

				newInstancePath = broccoli.utils.getInstancePathWhichWasAffectedRemovingInstance(newInstancePath, currentMoveFrom);

				if( moveFroms.length ){
					for(var idx in moveFroms){
						moveFroms[idx] = broccoli.utils.getInstancePathWhichWasAffectedRemovingInstance(moveFroms[idx], currentMoveFrom);
						moveFroms[idx] = broccoli.utils.getInstancePathWhichWasAffectedInsertingInstance(moveFroms[idx], moveTo);
					}

					currentMoveFrom = broccoli.utils.getInstancePathWhichWasAffectedInsertingInstance(currentMoveFrom, moveTo);
					moveTo = broccoli.utils.getInstancePathWhichWasAffectedRemovingInstance(moveTo, currentMoveFrom);
					moveTo = broccoli.utils.getInstancePathWhichWasAffectedInsertingInstance(moveTo, moveTo);
					// console.log('====-- move from, to', moveFroms, moveTo);
					fncMoveWhile(moveFroms, moveTo);
				}else{
					// コンテンツを保存
					broccoli.unselectInstance(function(){
						broccoli.saveContents(function(){
							// alert('インスタンスを移動しました。');
							broccoli.redraw(function(){
								broccoli.closeProgress(function(){
									broccoli.selectInstance(newInstancePath, function(){
										callback();
									});
								});
							});
						});
					});
				}
			} );
		}

		if( subModNameFrom.length ){ // ドロップ元のインスタンスがサブモジュールだったら

			if( method === 'moveTo' ){
				// これはloop要素(=subModNameがある場合)を並べ替えるための moveTo です。
				// その他のインスタンスをここに移動したり、作成することはできません。

				function removeNum(str){
					return str.replace(new RegExp('[0-9]+$'),'');
				}
				if( removeNum(moveFroms[0]) !== removeNum(moveTo) ){
					broccoli.message('並べ替え以外の移動操作はできません。');
					$(elm).removeClass('broccoli--panel__drag-entered');
					$(elm).removeClass('broccoli--panel__drag-entered-u');
					$(elm).removeClass('broccoli--panel__drag-entered-d');
					callback();
					return;
				}

				broccoli.progress(function(){
					newInstancePath = moveTo;
					fncMoveWhile(moveFroms, moveTo);
				});
				return;
			}
			broccoli.message('ダブルクリックしてください。ドロップできません。');
			callback();
			return;
		}
		if( method === 'moveTo' ){
			if(subModName){
				broccoli.message('loopフィールドへの移動はできません。');
				$(elm).removeClass('broccoli--panel__drag-entered');
				$(elm).removeClass('broccoli--panel__drag-entered-u');
				$(elm).removeClass('broccoli--panel__drag-entered-d');
				callback();
				return;
			}
			broccoli.progress(function(){
				newInstancePath = moveTo;
				fncMoveWhile(moveFroms, moveTo);
			});
			return;
		}

		newInstancePath = broccoli.utils.getInstancePathWhichWasAffectedRemovingInstance(moveTo, newInstancePath);

		if( subModName && method === 'add' ){
			// loopフィールドのサブモジュールに新しいモジュールを追加しようとした場合の処理
			broccoli.message('loopフィールドに新しいモジュールを追加することはできません。');
			callback();
			return;
		}
		if( method !== 'add' ){
			// 移動(moveTo)でも追加(add)でもない場合の処理
			broccoli.message('追加するモジュールをドラッグしてください。ここに移動することはできません。');
			callback();
			return;
		}

		broccoli.progress(function(){

			var transferData = event.dataTransfer.getData("text/json");
			try {
				transferData = JSON.parse(transferData);
			} catch (e) {}
			var modId = transferData["modId"];
			var modInternalId = transferData["modInternalId"];
			var modClip = transferData["modClip"];
			try {
				modClip = JSON.parse(modClip);
			} catch (e) {
				modClip = false;
			}

			if( modClip !== false ){
				console.log('クリップがドロップされました。');
				var parsedModId = broccoli.parseModuleId(modId);

				broccoli.gpi(
					'getClipModuleContents',
					{
						'moduleId': modId,
						'resourceMode': 'temporaryHash'
					} ,
					function(clipContents){
						// console.log('------ clipModuleContents --', clipContents);

						it79.ary(
							clipContents.data ,
							function(it1, row1, idx1){
								broccoli.contentsSourceData.duplicateInstance(clipContents.data[idx1], clipContents.resources, {'supplementModPackage': parsedModId.package}, function(newData){
									// console.log(newData);

									broccoli.contentsSourceData.addInstance( newData, moveTo, function(result){
										// 上から順番に挿入していくので、
										// moveTo を1つインクリメントしなければいけない。
										// (そうしないと、天地逆さまに積み上げられることになる。)
										moveTo = broccoli.incrementInstancePath(moveTo);
										it1.next();
									} );

								});
							} ,
							function(){
								broccoli.gpi(
									'replaceClipModuleResources',
									{
										'moduleId': modId
									} ,
									function(affectedResources){
										// console.log(affectedResources);
										broccoli.resourceMgr.getResourceDb(function(tmpResourceDb){
											for( var resKey in affectedResources ){
												tmpResourceDb[resKey] = affectedResources[resKey];
											}
											broccoli.resourceMgr.setResourceDb(tmpResourceDb, function(result){
												broccoli.unselectInstance(function(){
													broccoli.saveContents(function(){
														broccoli.message('クリップを挿入しました。');
														broccoli.redraw(function(){
															broccoli.closeProgress(function(){
																broccoli.selectInstance(newInstancePath, function(){
																	callback();
																});
															});
														});
													});
												});
											});
										});

									}
								);
							}
						);

					}
				);


			}else{
				broccoli.contentsSourceData.addInstance( modInternalId, moveTo, function(result){
					if(!result){
						console.error('Failed addInstance()', modInternalId, moveTo);
						broccoli.closeProgress(function(){
							callback();
						});
						return;
					}

					// コンテンツを保存
					broccoli.unselectInstance(function(){
						broccoli.saveContents(function(){
							// alert('インスタンスを追加しました。');
							broccoli.redraw(function(){
								broccoli.closeProgress(function(){
									broccoli.selectInstance(newInstancePath, function(){
										callback();
									});
								});
							});
						});
					});
				} );

			}
			return;
		});
		return;
	} // onDrop()

	/**
	 * パネルの ondrop イベントハンドラ: ファイルを受け取った場合の処理
	 */
	function onDropFile(e, moveTo, callback){
		callback = callback || function(){};
		var event = e.originalEvent;
		if( !event.dataTransfer || !event.dataTransfer.files || !event.dataTransfer.files.length ){
			broccoli.message('外部からドロップされたファイルが取得できません。');
			console.error('外部からドロップされたファイルが取得できません。', event);
			callback();
			return;
		}

		// console.info( event.dataTransfer.files );

		it79.ary(
			event.dataTransfer.files,
			function( it1, fileInfo, idx ){
				// console.log(idx, fileInfo);

				var mimetype = fileInfo.type;
				if( !mimetype ){
					it1.next();
					return;
				}

				broccoli.progressMessage( fileInfo.name + ' を処理中...' );

				var originalFileSize = fileInfo.size;
				var originalFileName = fileInfo.name;
				var originalFileFirstname = originalFileName;
				var originalFileExt = 'png';
				if( originalFileName.match( /^(.*)\.([a-zA-Z0-9\_]+)$/i ) ){
					originalFileFirstname = RegExp.$1;
					originalFileExt = RegExp.$2;
					originalFileExt = originalFileExt.toLowerCase();
				}

				var customFunc = false;
				if( typeof(broccoli.options.droppedFileOperator[mimetype]) == typeof(function(){}) ){
					// mimetypeで登録されていたら、そちらへ転送
					customFunc = broccoli.options.droppedFileOperator[mimetype];
				}else if( typeof(broccoli.options.droppedFileOperator[originalFileExt]) == typeof(function(){}) ){
					// 拡張子で登録されていたら、そちらへ転送
					customFunc = broccoli.options.droppedFileOperator[originalFileExt];
				}
				if(customFunc){
					customFunc( fileInfo, function(clipContents){
						if( typeof(clipContents) == typeof({}) && clipContents.data && clipContents.resources ){
							insertClipModule(clipContents, moveTo, {}, function(){
								it1.next();
							});
							return;
						}
					} );
					return;
				}

				var reader = new FileReader();
				reader.onload = function(evt) {
					// console.log(evt.target);
					var content = evt.target.result;
					// console.log(content);

					switch( mimetype ){

						// --------------------------------------
						// JSON形式のファイルドロップを処理
						case 'text/json':
						case 'application/json':
							var jsonContents = false;
							try{
								jsonContents = JSON.parse(content);
							}catch(e){
								console.error(e);
								broccoli.message('JSON形式をデコードできません。');
								it1.next();
								return;
							}
							// console.log(jsonContents);
							if( jsonContents && jsonContents.data && jsonContents.resources ){
								// クリップモジュール形式と評価される場合は、
								// クリップモジュールドロップと同様の挿入処理をする。

								if(!confirm('クリップデータを挿入しますか？')){
									it1.next();
									return;
								}

								insertClipModule(jsonContents, moveTo, {}, function(){
									it1.next();
								});

								return;
							}

							broccoli.message('対応していないJSON形式です。');
							it1.next();
							return;
							break;

						// --------------------------------------
						// 画像ファイルのドロップを処理
						// _sys/image に当てはめて挿入します。
						case 'image/jpeg':
						case 'image/png':
						case 'image/gif':
						case 'image/svg+xml':
							originalFileFirstname = originalFileFirstname.split(/[^a-zA-Z0-9]/).join('_');

							var base64 = content.replace(/^data\:[a-zA-Z0-9]+\/[a-zA-Z0-9]+\;base64\,/i, '');
							var clipContents = {
								'data': [
									{
										"modId": "_sys/image",
										"fields": {
											"src": {
												"resKey": "___dropped_local_image___",
												"path": "",
												"resType": "",
												"webUrl": ""
											}
										}
									}
								],
								'resources': {
									"___dropped_local_image___": {
										"ext": originalFileExt,
										"type": mimetype,
										"size": originalFileSize,
										"base64": base64,
										"isPrivateMaterial": false,
										"publicFilename": originalFileFirstname,
										"md5": "",
										"field": "image",
										"fieldNote": {}
									}
								}
							};
							insertClipModule(clipContents, moveTo, {}, function(){
								it1.next();
							});
							return;
							break;

						// --------------------------------------
						// 対応していないファイル形式
						default:
							broccoli.message('対応していないファイル形式です。');
							console.error('対応していないファイル形式です。', fileInfo.type);
							it1.next();
							return;
							break;
					}
					it1.next();
					return;
				}

				switch( mimetype ){
					case 'image/jpeg':
					case 'image/png':
					case 'image/gif':
					case 'image/svg+xml':
						reader.readAsDataURL(fileInfo);
						break;
					case 'text/plain':
					case 'text/json':
					case 'application/json':
					case 'text/html':
					case 'text/markdown':
						reader.readAsText(fileInfo);
						break;
					default:
						broccoli.message('処理できないファイルです。');
						console.error('処理できないファイルです。', mimetype);
						it1.next();
						break;
				}
			},
			function(){

				broccoli.contentsSourceData.resourceDbReloadRequest();
					// 複数のリソースファイルを同時に挿入したあとに、
					// 末尾の画像がロードされない場合があるので、
					// resourceDb をリロードするようにした。


				broccoli.unselectInstance(function(){
					broccoli.saveContents(function(){
						broccoli.message('ファイルを挿入しました。');
						broccoli.redraw(function(){
							broccoli.closeProgress(function(){
								callback();
							});
						});
					});
				});
			}
		);

		return;
	} // onDropFile()

	/**
	 * パネルの ondblclick イベントハンドラ
	 * このメソッドは、 this.setPanelEventHandlers() の他、
	 * editWindow からもコールされています。
	 */
	this.onDblClick = function(e, elm, callback){
		callback = callback || function(){};

		e.stopPropagation();
		var $this = $(elm);
		var instancePath = $this.attr('data-broccoli-instance-path');

		if( $this.attr('data-broccoli-sub-mod-name') && $this.attr('data-broccoli-is-appender') == 'yes' ){
			// loopモジュールの繰り返し要素を増やします。
			var modInternalId = $this.attr("data-broccoli-mod-internal-id");
			var subModName = $this.attr("data-broccoli-sub-mod-name");
			broccoli.contentsSourceData.addInstance( modInternalId, instancePath, function(result){
				if(!result){
					callback();
					return;
				}
				broccoli.saveContents(function(){
					broccoli.redraw(function(){
						broccoli.closeProgress(function(){
							callback();
						});
					});
				});
			}, subModName );
			e.preventDefault();
			return;
		}

		if( $this.attr('data-broccoli-is-appender') == 'yes' ){
			broccoli.message('編集できません。ここには、モジュールをドロップして追加または移動することができます。');
			// instancePath = php.dirname(instancePath);
			callback();
			return;
		}
		broccoli.editInstance( instancePath );
		callback();
		return;
	} // onDblClick()

	/**
	 * パネルの oncontextmenu イベントハンドラ
	 * このメソッドは、 this.setPanelEventHandlers() からコールされています。
	 */
	function onContextMenu(e, elm, callback){
		// console.log(e);
		callback = callback || function(){};
		broccoli.contextmenu.show(
			false,
			e.clientX,
			e.clientY,
			callback
		);
		return;
	} // onDblClick()

	/**
	 * パネルにイベントハンドラをセットする
	 */
	this.setPanelEventHandlers = function($panel){
		var timerTouchStart;
		var isTouchStartHold = false;
		var timerFocus;
		$panel
			.attr({
				'tabindex': 1
			})
			.on('click', function(e){
				if(isOnDragging){
					return;
				}
				e.preventDefault();
				e.stopPropagation();
				// console.log(e);
				clearTimeout(timerFocus);
				var $this = $(this);
				var instancePath = $this.attr('data-broccoli-instance-path');
				// var selectedInstancePath = broccoli.getSelectedInstance();

				if( e.shiftKey ){
					broccoli.selectInstanceRegion( instancePath, function(){
					} );
					return;
				}

				broccoli.selectInstance( instancePath, function(){
					if( $this.hasClass('broccoli--instance-tree-view-panel-item') ){
						// インスタンスツリービュー上でインスタンスクリックした場合の処理
						broccoli.focusInstance( instancePath );
						return;
					}
					// プレビューカンヴァス上でインスタンスクリックした場合の処理
					broccoli.instanceTreeView.focusInstance( instancePath, function(){} );
				} );
				return;
			})
			.on('contextmenu', function(e){
				e.preventDefault();
				e.stopPropagation();
				onContextMenu(e, this, function(){
					// nothing to do.
				});
			})
			.on('focus', function(e){
				e.preventDefault();
				e.stopPropagation();
				var $this = $(this);
				clearTimeout(timerFocus);
				timerFocus = setTimeout(function(){
					$this.click();
				}, 200);
			})
			.on('keypress', function(e){
				// console.log(e);
				try {
					if( e.key.toLowerCase() == 'enter' ){
						_this.onDblClick(e, this, function(){
							// console.log('dblclick event done.');
						});
					}
				} catch (e) {
				}
				return;
			})
			.on('dblclick', function(e){
				_this.onDblClick(e, this, function(){
					// console.log('dblclick event done.');
				});
				return;
			})
			.on('touchstart', function(e){
				// タッチデバイス向けの処理
				clearTimeout(timerTouchStart);
				if( isTouchStartHold ){
					_this.onDblClick(e, this, function(){
						// console.log('dblclick event done.');
					});
					return;
				}
				isTouchStartHold = true;
				timerTouchStart = setTimeout(function(){
					isTouchStartHold = false;
				}, 250);
				return;
			})
			.on('dragleave', function(e){
				e.stopPropagation();
				e.preventDefault();
				$(this).removeClass('broccoli--panel__drag-entered');
				$(this).removeClass('broccoli--panel__drag-entered-u');
				$(this).removeClass('broccoli--panel__drag-entered-d');
			})
			.on('dragover', function(e){
				e.stopPropagation();
				e.preventDefault();
				var instancePath = $(this).attr('data-broccoli-instance-path');
				if( instancePath.match(new RegExp('^\\/bowl\\.[^\\/]+$')) ){
					// bowl に追加することはできません。アペンダーに追加してください。
					return;
				}

				$(this).addClass('broccoli--panel__drag-entered');
				if( $(this).attr('data-broccoli-is-instance-tree-view') == 'yes' ){
					if(focusedInstance != instancePath){
						// if( $(this).attr('data-broccoli-is-appender') == 'yes' ){
						// 	instancePath = php.dirname(instancePath);
						// }
						dragOvered = instancePath;
						broccoli.focusInstance( instancePath );
					}
				}

				if( $(this).attr('data-broccoli-is-appender') != 'yes' ){
					var ud = getUd(e, this);
					// console.info(ud);
					if( ud.y == 'u' ){
						$(this).addClass('broccoli--panel__drag-entered-u');
						$(this).removeClass('broccoli--panel__drag-entered-d');
					}else{
						$(this).addClass('broccoli--panel__drag-entered-d');
						$(this).removeClass('broccoli--panel__drag-entered-u');
					}
				}
			})
			.on('dragstart', function(e){
				isOnDragging = true;
				e.stopPropagation();
				var event = e.originalEvent;
				var transferData = {
					'method': 'moveTo',
					'data-broccoli-instance-path': $(this).attr('data-broccoli-instance-path'),
					'data-broccoli-is-appender': $(this).attr('data-broccoli-is-appender')
				};
				var subModName = $(this).attr('data-broccoli-sub-mod-name');
				if( typeof(subModName) === typeof('') && subModName.length ){
					transferData['data-broccoli-sub-mod-name'] = subModName;
				}
				event.dataTransfer.setData("text/json", JSON.stringify(transferData) );
			})
			.on('drop', function(e){
				_this.onDrop(e, this, function(){
					console.log('drop event done.');
				});
				return;
			})
			.on('dragend', function(e){
				isOnDragging = false;
			})
		;
		return $panel;
	}

	/**
	 * 初期化する
	 * @param  {Object} domElm     DOM Element of instance path view container.
	 * @param  {Function} callback [description]
	 * @return {[type]}            [description]
	 */
	this.init = function(domElm, callback){
		$panels = $(domElm);
		it79.fnc(
			{},
			[
				function( it1, data ){
					broccoli.postMessenger.send(
						'getAllInstance',
						{},
						function(_contentsElements){
							// console.log(_contentsElements);
							$contentsElements = _contentsElements;
							it1.next(data);
						}
					);
				} ,
				function( it1, data ){
					$panels
						.html('')
						.removeClass('broccoli')
						.addClass('broccoli')
					;
					it1.next(data);
				} ,
				function( it1, data ){
					// console.log($contentsElements.length;
					for( var idx in $contentsElements ){
						drawPanel(idx, $contentsElements[idx]);
					}
					// $contentsElements.each(drawPanel);
					it1.next(data);
				} ,
				function( it1, data ){
					callback();
					it1.next(data);
				}
			]
		);
	}

	/**
	 * インスタンスを選択する
	 */
	this.updateInstanceSelection = function( callback ){
		callback = callback || function(){};
		var instancePath = broccoli.getSelectedInstance();
		var instancePathRegion = broccoli.getSelectedInstanceRegion();
		this.unselectInstance(function(){
			$panels.find('[data-broccoli-instance-path]')
				.filter(function (index) {
					var isPathSelected = $.inArray($(this).attr("data-broccoli-instance-path"), instancePathRegion);
					if( isPathSelected === false || isPathSelected < 0 ){
						return false;
					}
					return true;
				})
				.addClass('broccoli--panel__selected')
			;
			// this.updateInstancePathView();
			callback();
		});
		return this;
	}

	/**
	 * モジュールインスタンスの選択状態を解除する
	 */
	this.unselectInstance = function(callback){
		callback = callback || function(){};
		$panels.find('[data-broccoli-instance-path]')
			.removeClass('broccoli--panel__selected')
		;
		// this.updateInstancePathView();
		callback();
		return this;
	}

	/**
	 * クリップモジュールを挿入する
	 */
	function insertClipModule(clipContents, moveTo, options, callback){
		options = options || {};
		options.packageId = options.packageId || undefined;

		it79.ary(
			clipContents.data ,
			function(it1, row1, idx1){
				broccoli.contentsSourceData.duplicateInstance(clipContents.data[idx1], clipContents.resources, {'supplementModPackage': options.packageId}, function(newData){
					// console.log(newData, moveTo);

					broccoli.contentsSourceData.addInstance( newData, moveTo, function(result){
						// 上から順番に挿入していくので、
						// moveTo を1つインクリメントしなければいけない。
						// (そうしないと、天地逆さまに積み上げられることになる。)

						moveTo = broccoli.incrementInstancePath(moveTo);
						it1.next();
					} );

				});
			} ,
			function(){
				broccoli.resourceMgr.getResourceDb(function(tmpResourceDb){
					for( var resKey in clipContents.resources ){
						tmpResourceDb[resKey] = clipContents.resources[resKey];
					}
					broccoli.resourceMgr.setResourceDb(tmpResourceDb, function(result){
						callback();
					});
				});
			}
		);
		return;
	}

	/**
	 * マウス座標の四象限の位置を得る
	 */
	function getUd(e, elm){
		var posx = 0;
		var posy = 0;
		if (!e) e = window.event;
		if (e.pageX || e.pageY)     {
			posx = e.pageX;
			posy = e.pageY;
		}else if (e.clientX || e.clientY)    {
			posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		var mousepos = { x : posx, y : posy };
		// console.info(instancePath, mousepos);

		var docScrolls = {
			left : document.body.scrollLeft + document.documentElement.scrollLeft,
			top : document.body.scrollTop + document.documentElement.scrollTop
		};
		var bounds = elm.getBoundingClientRect();//対象要素の情報取得
		var relmousepos = {
			x : mousepos.x - bounds.left - docScrolls.left,
			y : mousepos.y - bounds.top - docScrolls.top
		};
		// console.info(instancePath, relmousepos);

		var ud = {};
		if( relmousepos.y < $(elm).height()/2 ){
			ud.y = 'u';
		}else{
			ud.y = 'd';
		}
		if( relmousepos.x < $(elm).width()/2 ){
			ud.x = 'l';
		}else{
			ud.x = 'r';
		}
		return ud;
	}

	/**
	 * モジュールインスタンスにフォーカスする
	 * フォーカス状態の囲みで表現され、画面に収まるようにスクロールする
	 */
	this.focusInstance = function( instancePath, callback ){
		callback = callback || function(){};
		focusedInstance = instancePath;
		$panels.find('[data-broccoli-instance-path]')
			.filter(function (index) {
				return $(this).attr("data-broccoli-instance-path") == instancePath;
			})
			.addClass('broccoli--panel__focused')
		;
		callback();
		return this;

	}

	/**
	 * モジュールインスタンスのフォーカス状態を解除する
	 */
	this.unfocusInstance = function(callback){
		callback = callback || function(){};
		selectedInstance = null;
		focusedInstance = null;

		$panels.find('.broccoli--panel__focused')
			.removeClass('broccoli--panel__focused')
		;
		callback();
		return this;
	}

	/**
	 * 指定したInstancePathのパネルの要素を得る
	 */
	this.getPanelElement = function(instancePath){
		var $rtn = $panels.find('[data-broccoli-instance-path="'+php.htmlspecialchars(instancePath)+'"]');
		return $rtn.get(0);
	}

	/**
	 * パネルを消去する
	 */
	this.clearPanels = function(callback){
		callback = callback || function(){};
		if($panels){
			$panels.html('');
		}
		callback();
		return this;
	}

	return;
}
