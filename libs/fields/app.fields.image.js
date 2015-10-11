module.exports = function(broccoli){

	var it79 = require('iterate79');
	var _resMgr = broccoli.resourceMgr;
	var _imgDummy = 'data:image/png;base64,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';

	/**
	 * リソースファイルを解析する
	 */
	function parseResource( realpathSelected, res ){
		var tmpResInfo = res || {};
		var realpath = JSON.parse( JSON.stringify( realpathSelected ) );
		tmpResInfo.ext = px.utils.getExtension( realpath ).toLowerCase();
		switch( tmpResInfo.ext ){
			case 'gif':                          tmpResInfo.type = 'image/gif';  break;
			case 'png':                          tmpResInfo.type = 'image/png';  break;
			case 'jpg': case 'jpeg': case 'jpe': tmpResInfo.type = 'image/jpeg'; break;
			case 'svg':                          tmpResInfo.type = 'image/svg+xml'; break;
			default:
				tmpResInfo.type = 'image/gif'; break;
		}
		tmpResInfo.isPrivateMaterial = false;
		return tmpResInfo;
	}

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode, mod, callback ){
		var rtn = {}
		if( typeof(fieldData) === typeof({}) ){
			rtn = fieldData;
		}
		it79.fnc(
			{},
			[
				function(it1, data){
					_resMgr.getResource( rtn.resKey, function(res){
						if( mode == 'finalize' ){
							_resMgr.getResourcePublicPath( rtn.resKey, function(publicPath){
								rtn.path = publicPath;
								it1.next();
							} );
							return;
						}else if( mode == 'canvas' ){
							rtn.path = 'data:'+res.type+';base64,' + res.base64;

							if( !res.base64 ){
								// ↓ ダミーの Sample Image
								rtn.path = _imgDummy;
							}
							it1.next();
							return;
						}
						it1.next();
						return;
					} );
				},
				// function(it1, data){
				// 	it1.next();
				// },
				function(it1, data){
					callback(rtn.path);
					it1.next();
				}
			]
		);
		return;
	}

	/**
	 * プレビュー用の簡易なHTMLを生成する
	 */
	this.mkPreviewHtml = function( fieldData, mod, callback ){
		var rtn = {}
		if( typeof(fieldData) === typeof({}) ){
			rtn = fieldData;
		}
		_resMgr.getResource( rtn.resKey, function(res){
			rtn.path = 'data:'+res.type+';base64,' + res.base64;
			if( !res.base64 ){
				// ↓ ダミーの Sample Image
				rtn.path = _imgDummy;
			}
			rtn = $('<img src="'+rtn.path+'" />');
			rtn.css({
				'max-width': 200,
				'max-height': 200
			});

			callback( rtn.get(0).outerHTML );
		} );
		return;
	}

	/**
	 * データを正規化する
	 */
	this.normalizeData = function( fieldData, mode ){
		var rtn = fieldData;
		if( typeof(fieldData) !== typeof({}) ){
			rtn = {
				"resKey":'',
				"path":'about:blank'
			};
		}
		return rtn;
	}

	/**
	 * エディタUIを生成
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var rtn = $('<div>');
		if( typeof(data) !== typeof({}) ){ data = {}; }
		if( typeof(data.resKey) !== typeof('') ){
			data.resKey = '';
		}
		// if( typeof(data.original) !== typeof({}) ){ data.original = {}; }
		_resMgr.getResource( data.resKey, function(res){
			var path = 'data:'+res.type+';base64,' + res.base64;
			if( !res.base64 ){
				// ↓ ダミーの Sample Image
				path = _imgDummy;
			}

			var $img = $('<img>');
			rtn.append( $img
				.attr({
					"src": path
				})
				.css({
					'min-width':'100px',
					'max-width':'100%',
					'min-height':'100px',
					'max-height':'200px'
				})
			);
			rtn.append( $('<input>')
				.attr({
					"name":mod.name ,
					"type":"file",
					"webkitfile":"webkitfile"
				})
				.css({'width':'100%'})
				.bind('change', function(){
					var realpathSelected = $(this).val();
					if( realpathSelected ){
						var tmpResInfo = parseResource( realpathSelected );
						var bin = px.fs.readFileSync( realpathSelected, {} );
						var newPath = 'data:'+tmpResInfo.type+';base64,' + px.utils.base64encode( bin );
						$img
							.attr({
								"src": newPath
							})
						;
					}else{
						$img
							.attr({
								"src": path
							})
						;
					}
				})
			);
			rtn.append(
				$('<div>')
					.append( $('<span>')
						.text('出力ファイル名(拡張子を含まない):')
					)
					.append( $('<input>')
						.attr({
							"name":mod.name+'-publicFilename' ,
							"type":"text",
							"placeholder": "output file name"
						})
						.val( (typeof(res.publicFilename)==typeof('') ? res.publicFilename : '') )
					)
			);
			$(elm).html(rtn);

			setTimeout(function(){ callback(); }, 0);
		} );
		return;
	}

	/**
	 * データを複製する
	 */
	this.duplicateData = function( data, callback ){
		data = JSON.parse( JSON.stringify( data ) );
		it79.fnc(
			data,
			[
				function(it1, data){
					_resMgr.duplicateResource( data.resKey, function(newResKey){
						data.resKey = newResKey;
						it1.next(data);
					} );
				} ,
				function(it1, data){
					_resMgr.getResourcePublicPath( data.resKey, function(publicPath){
						data.path = publicPath;
						it1.next(data);
					} );
				} ,
				function(it1, data){
					callback(data);
					it1.next(data);
				}
			]
		);
		return;
	}

	/**
	 * エディタUIで編集した内容を保存
	 */
	this.saveEditorContent = function( elm, data, mod, callback ){
		var $dom = $(elm);
		if( typeof(data) !== typeof({}) ){
			data = {};
		}
		if( typeof(data.resKey) !== typeof('') ){
			data.resKey = '';
		}
		var resInfo, realpathSelected;
		it79.fnc(
			data,
			[
				function(it1, data){
					_resMgr.getResource(data.resKey, function(result){
						if( result === false ){
							_resMgr.addResource(function(newResKey){
								data.resKey = newResKey;
								it1.next(data);
							});
							return;
						}
						it1.next(data);
					});
				} ,
				function(it1, data){
					_resMgr.getResource(data.resKey, function(res){
						resInfo = res;
						it1.next(data);
					});
					return;
				} ,
				function(it1, data){
					realpathSelected = $dom.find('input[type=file]').val();
					if( realpathSelected ){
						resInfo = parseResource( realpathSelected, resInfo );
					}
					resInfo.publicFilename = $dom.find('input[name='+mod.name+'-publicFilename]').val();

					_resMgr.updateResource( data.resKey, resInfo, realpathSelected, function(){
						// var res = _resMgr.getResource( data.resKey );
						_resMgr.getResourcePublicPath( data.resKey, function(publicPath){
							data.path = publicPath;
							it1.next(data);
						} );
					} );

				} ,
				function(it1, data){
					callback(data);
					it1.next(data);
				}
			]
		);
		return;
	}// this.saveEditorContent()

}
