module.exports = function(broccoli){

	var _resMgr = broccoli.resourceMgr;
	// var _pj = px.getCurrentProject();

	/**
	 * リソースファイルを解析する
	 */
	function parseResource( realpathSelected ){
		var tmpResInfo = {};
		var realpath = JSON.parse( JSON.stringify( realpathSelected ) );
		tmpResInfo.ext = px.utils.getExtension( realpath ).toLowerCase();
		switch( tmpResInfo.ext ){
			case 'csv':                          tmpResInfo.type = 'text/csv';  break;
			case 'doc':                          tmpResInfo.type = 'application/msword';  break;
			case 'xls':                          tmpResInfo.type = 'application/vnd.ms-excel';  break;
			case 'ppt':                          tmpResInfo.type = 'application/vnd.ms-powerpoint';  break;
			case 'docx':                         tmpResInfo.type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';  break;
			case 'xlsx':                         tmpResInfo.type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';  break;
			case 'pptx':                         tmpResInfo.type = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';  break;
			default:
				tmpResInfo.type = 'text/csv'; break;
		}

		return tmpResInfo;
	}

	/**
	 * データをバインドする
	 */
	this.bind = function( fieldData, mode ){
		fieldData = fieldData||{};
		var rtn = '';
		if( fieldData.output ){
			rtn += fieldData.output;
		}

		if( mode == 'canvas' ){
			if( !rtn.length ){
				rtn += '<tr><td style="text-align:center;">ダブルクリックして編集してください。</td></tr>';
			}
		}
		return rtn;
	}

	/**
	 * プレビュー用の簡易なHTMLを生成する
	 */
	this.mkPreviewHtml = function( fieldData, mod ){
		// InstanceTreeViewで利用する
		fieldData = fieldData||{};
		var rtn = '';
		if( fieldData.output ){
			rtn += fieldData.output;
		}
		rtn = $('<table>'+rtn+'</table>');
		return rtn.get(0).outerHTML;
	}

	/**
	 * データを正規化する
	 */
	this.normalizeData = function( fieldData, mode ){
		var rtn = fieldData;
		if( typeof(fieldData) !== typeof({}) ){
			rtn = {
				"resKey":'',
				"output":"",
				"header_row":0,
				"header_col":0,
				"cell_renderer":'text',
				"renderer":'simplify'
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
		var res = _resMgr.getResource( data.resKey );

		var $excel = $('<div>');
		rtn.append( $excel );
		// console.log(data);
		if( data.resKey ){
			$excel.html('')
				.append( $('<button type="button">エクセルで開く</button>')
					.attr({
						'title': _resMgr.getResourceOriginalRealpath( data.resKey ),
						'data-excel-realpath': _resMgr.getResourceOriginalRealpath( data.resKey )
					})
					.click(function(){
						var realpath = $(this).attr('data-excel-realpath');
						px.utils.openURL(realpath);
					})
				)
			;
		}

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
					$excel.html('選択しました');
				}
			})
		);
		rtn.append( $('<div>')
			.append( $('<span>').text('ヘッダー行:') )
			.append( $('<input>')
				.attr({
					"name":mod.name+':header_row' ,
					"type":"number",
					"value":data.header_row
				})
			)
		);
		rtn.append( $('<div>')
			.append( $('<span>').text('ヘッダー列:') )
			.append( $('<input>')
				.attr({
					"name":mod.name+':header_col' ,
					"type":"number",
					"value":data.header_col
				})
			)
		);
		rtn.append( $('<div>')
			.append( $('<span>').text('再現方法:') )
			.append( $('<label>')
				.append( $('<input>')
					.attr({
						"name":mod.name+':renderer' ,
						"type":"radio",
						"value":"simplify"
					})
				)
				.append( $('<span>').text('単純化') )
			)
			.append( $('<label>')
				.append( $('<input>')
					.attr({
						"name":mod.name+':renderer' ,
						"type":"radio",
						"value":"strict"
					})
				)
				.append( $('<span>').text('そのまま表示') )
			)
		);
		rtn.find('input[name="'+mod.name+':renderer"][value="'+data.renderer+'"]').attr({'checked':'checked'});

		rtn.append( $('<div>')
			.append( $('<span>').text('セルの表現方法:') )
			.append( $('<label>')
				.append( $('<input>')
					.attr({
						"name":mod.name+':cell_renderer' ,
						"type":"radio",
						"value":"html"
					})
				)
				.append( $('<span>').text('HTML') )
			)
			.append( $('<label>')
				.append( $('<input>')
					.attr({
						"name":mod.name+':cell_renderer' ,
						"type":"radio",
						"value":"text"
					})
				)
				.append( $('<span>').text('テキスト') )
			)
			.append( $('<label>')
				.append( $('<input>')
					.attr({
						"name":mod.name+':cell_renderer' ,
						"type":"radio",
						"value":"markdown"
					})
				)
				.append( $('<span>').text('Markdown') )
			)
		);
		rtn.find('input[name="'+mod.name+':cell_renderer"][value="'+data.cell_renderer+'"]').attr({'checked':'checked'});

		$(elm).html(rtn);
		setTimeout(function(){ callback(); }, 0);
		return;
	}

	/**
	 * データを複製する
	 */
	this.duplicateData = function( data ){
		data = JSON.parse( JSON.stringify( data ) );
		data.resKey = _resMgr.duplicateResource( data.resKey );
		return data;
	}

	/**
	 * エディタUIで編集した内容を保存
	 */
	this.saveEditorContent = function( $dom, data, mod ){
		if( typeof(data) !== typeof({}) ){
			data = {};
		}
		if( typeof(data.resKey) !== typeof('') ){
			data.resKey = '';
		}
		if( _resMgr.getResource(data.resKey) === false ){
			data.resKey = _resMgr.addResource();
		}

		var realpathSelected = $dom.find('input[name='+mod.name+']').val();
		if( px.utils.isFile(realpathSelected) ){
			var tmpResInfo = parseResource( realpathSelected );
			_resMgr.updateResource( data.resKey, tmpResInfo, realpathSelected );
		}else if( data.resKey ){
			_resMgr.resetBase64FromBin( data.resKey );
		}
		// var res = _resMgr.getResource( data.resKey );
		data.header_row = $dom.find('input[name="'+mod.name+':header_row"]').val();
		data.header_col = $dom.find('input[name="'+mod.name+':header_col"]').val();
		data.cell_renderer = $dom.find('input[name="'+mod.name+':cell_renderer"]:checked').val();
		data.renderer = $dom.find('input[name="'+mod.name+':renderer"]:checked').val();

		var res = _resMgr.getResource( data.resKey );
		res.isPrivateMaterial = true;
			// リソースファイルの設置は resourceMgr が行っている。
			// isPrivateMaterial が true の場合、公開領域への設置は行われない。

		var realpath = _resMgr.getResourceOriginalRealpath( data.resKey );
		if( !px.utils.isFile(realpath) ){
			realpath = res.realpath;
		}
		if( !px.utils.isFile(realpath) ){
			realpath = realpathSelected;
		}

		var cmd = px.cmd('php');
		cmd += ' '+px.path.resolve( _pj.get('path') + '/' + _pj.get('entry_script') );
		cmd += ' "/?PX=px2dthelper.convert_table_excel2html';
		cmd += '&path=' + px.php.urlencode(realpath);
		cmd += '&header_row=' + px.php.urlencode( data.header_row );
		cmd += '&header_col=' + px.php.urlencode( data.header_col );
		cmd += '&cell_renderer=' + px.php.urlencode( data.cell_renderer );
		cmd += '&renderer=' + px.php.urlencode( data.renderer );
		cmd += '"';
		data.output = px.execSync( cmd );
		data.output = JSON.parse(data.output+'');

		return data;
	}// this.saveEditorContent()

}
