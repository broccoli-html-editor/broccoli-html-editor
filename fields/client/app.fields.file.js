module.exports = function(broccoli){

	var Promise = require('es6-promise').Promise;
	var it79 = require('iterate79');
	var utils79 = require('utils79');
	var urlParse = require('url-parse');
	var _resMgr = broccoli.resourceMgr;
	var _imgDummy = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAYAAACAvzbMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3hpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDY3IDc5LjE1Nzc0NywgMjAxNS8wMy8zMC0yMzo0MDo0MiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpiZTdmZmNiZS1lMTgwLTQwZGUtOTA3My1lNjk2MDk5YmYyNDkiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MzlGNUUyODQ5NzU4MTFFNTg0MTBGRkY3MEQzOTdDQTQiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MzlGNUUyODM5NzU4MTFFNTg0MTBGRkY3MEQzOTdDQTQiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDphMDI5NWE5YS05YzRkLTQzNjYtYjhjOS05NWQ1MjM0ZThhNDgiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6YmU3ZmZjYmUtZTE4MC00MGRlLTkwNzMtZTY5NjA5OWJmMjQ5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';
	var md5 = require('md5');
	var _this = this;

	/**
	 * パスから拡張子を取り出して返す
	 */
	function getExtension(path){
		var ext = '';
		try {
			var ext = path.replace( new RegExp('^.*?\.([a-zA-Z0-9\_\-]+)$'), '$1' );
			ext = ext.toLowerCase();
		} catch (e) {
			ext = false;
		}
		return ext;
	}

	/**
	 * データを正規化する
	 */
	this.normalizeData = function( fieldData, mode ){
		var rtn = fieldData;
		if( typeof(fieldData) !== typeof({}) ){
			rtn = {
				"resKey":'',
				"path":'about:blank',
				"resType":'',
				"webUrl":''
			};
		}
		return rtn;
	}// normalizeData()

	/**
	 * プレビュー用の簡易なHTMLを生成する
	 */
	this.mkPreviewHtml = function( fieldData, mod, callback ){
		var cheerio = require('cheerio');
		var rtn = {}
		if( typeof(fieldData) === typeof({}) ){
			rtn = fieldData;
		}

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){

			if( rtn.resType == 'web' ){
				var $ = cheerio.load('<img>', {decodeEntities: false});
				$('img')
					.attr({'src': rtn.webUrl})
					.css({
						'max-width': '80px',
						'max-height': '80px'
					})
				;
				callback( $.html() );
				return;
			}else if( rtn.resType == 'none' ){
				callback( 'No File' );
				return;
			}else{
				_resMgr.getResourceDb( function(resDb){
					var res, imagePath;
					try {
						res = resDb[rtn.resKey];
						imagePath = 'data:'+res.type+';base64,' + '{broccoli-html-editor-resource-baser64:{'+rtn.resKey+'}}';
						// var imagePath = 'data:'+res.type+';base64,' + res.base64;
					} catch (e) {
					}
					if( !imagePath || !res.base64 ){
						// ↓ ダミーの Sample Image
						imagePath = _imgDummy;
					}
					var $ = cheerio.load('<img>', {decodeEntities: false});
					$('img')
						.attr({'src': imagePath})
						.css({
							'max-width': '80px',
							'max-height': '80px'
						})
					;
					callback( $.html() );
				} );
				return;
			}
			return;
		}); });
		return;
	}// mkPreviewHtml()

	/**
	 * エディタUIを生成
	 */
	this.mkEditor = function( mod, data, elm, callback ){
		var rtn = $('<div>');
		var $uiImageResource = $('<div>');
		var $imagePreviewArea = $('<div>');
		var $uiNoImage = $('<div>');
		var $uiWebResource = $('<div>');
		var _this = this;
		if( typeof(data) !== typeof({}) ){ data = {}; }
		if( typeof(data.resKey) !== typeof('') ){
			data.resKey = '';
		}
		if( typeof(data.resType) !== typeof('') ){
			data.resType = '';
		}
		if( typeof(data.webUrl) !== typeof('') ){
			data.webUrl = '';
		}
		// if( typeof(data.original) !== typeof({}) ){ data.original = {}; }
		var $img = $('<img>');
		var $imgNotImage = $('<div>').css({
			'padding': '3em',
			'font-weight': 'bold',
			'font-size': '24px',
			'color': '#aaa',
		});
		var $inputImageName = $('<input class="px2-input px2-input--block" style="margin: 0 5px;">');
		var $displayExtension = $('<span>');
		var $inputWebUrl = $('<input class="px2-input px2-input--block">');
		var confFilenameAutoSetter = mod.filenameAutoSetter || 'ifEmpty';

		function selectResourceType(){
			var val = rtn.find('[name='+mod.name+'-resourceType]:checked').val();
			$uiWebResource.hide();
			$uiNoImage.hide();
			$uiImageResource.hide();
			if(val == 'web'){
				$uiWebResource.show();
			}else if(val == 'none'){
				$uiNoImage.show();
			}else{
				$uiImageResource.show();
			}
		}

		/**
		 * ランダムなファイル名を自動生成する
		 */
		function generateRandomFileName(){
			// Dateオブジェクトを作成
			var date = new Date();

			// UNIXタイムスタンプを取得する (ミリ秒単位)
			var a = date.getTime();

			var S = "abcdefghijklmnopqrstuvwxyz0123456789";
			var N = 16;
			var randomFileName = Array.from(
				crypto
					.getRandomValues(new Uint16Array(N)))
					.map(function(n){
						return S[n%S.length];
					})
					.join('')
			;
			randomFileName += '-' + md5(a);
			return randomFileName;
		}

		/**
		 * 画像としてプレビューできる種類か評価する
		 */
		function canPreviewAsImage(mimetype, ext){
			if( mimetype ){
				if( mimetype.match(/^image\//) ){
					return true;
				}
			}else if( ext ){
				switch( ext ){
					case 'jpg':
					case 'jpeg':
					case 'jpe':
					case 'png':
					case 'gif':
					case 'webp':
						return true;
						break;
				}
			}
			return false;
		}

		/**
		 * fileAPIからファイルを取り出して反映する
		 */
		function applyFile(fileInfo){
			function readSelectedLocalFile(fileInfo, callback){
				var reader = new FileReader();
				reader.onload = function(evt) {
					callback( evt.target.result );
				}
				reader.readAsDataURL(fileInfo);
			}

			// 画像名をセット
			if( confFilenameAutoSetter == 'random' ){
				// 自動的に生成したファイル名を適用する
				var fname = generateRandomFileName();
				$inputImageName.val(fname);
			}else{
				// アップした画像名から取得する
				// ただし、 `mod.filenameAutoSetter` オプションが `ifEmpty` で、
				// かつ既に名前がセットされている場合は更新しない。
				// `mod.filenameAutoSetter` オプションが `always` の場合、画像を選択し直すたびに更新する。
				if( !$inputImageName.val() || confFilenameAutoSetter == 'always' ){
					var fname = fileInfo.name;
					fname = fname.replace(/\.[a-zA-Z0-9]*$/, '');
					fname = fname.split(/[^0-9a-zA-Z\-\_\.]/).join('_');
					$inputImageName.val(fname);
				}
			}
			// mod.filename
			readSelectedLocalFile(fileInfo, function(dataUri){
				$displayExtension.text('.'+getExtension( fileInfo.name ));
				setImagePreview({
					'src': dataUri,
					'size': fileInfo.size,
					'ext': getExtension( fileInfo.name ),
					'mimeType': fileInfo.type,
					'base64': (function(dataUri){
						dataUri = dataUri.replace(new RegExp('^data\\:[^\\;]*\\;base64\\,'), '');
						// console.log(dataUri);
						return dataUri;
					})(dataUri),
				});
			});
		}

		/**
		 * 画像プレビューを更新する
		 */
		function setImagePreview(fileInfo){
			var fileSrc = fileInfo.src;
			var fileMimeType = fileInfo.mimeType;
			if( !fileInfo.src || !fileInfo.ext || !fileInfo.size){
				fileSrc = _imgDummy;
				fileMimeType = 'image/png';
			}
			$img
				.attr({
					"src": fileSrc ,
					"data-size": fileInfo.size ,
					"data-extension": fileInfo.ext,
					"data-mime-type": fileMimeType ,
					"data-base64": fileInfo.base64,
					"data-is-updated": 'yes'
				})
			;
			$imgNotImage.text( fileInfo.ext );
			if( canPreviewAsImage(fileMimeType, fileInfo.ext) ){
				$img.show();
				$imgNotImage.hide();
			}else{
				$img.hide();
				$imgNotImage.show();
			}
			return;
		}

		_resMgr.getResource( data.resKey, function(res){
			// console.log(res);
			if(res.ext){
				$displayExtension.text( '.'+res.ext );
			}
			var path = 'data:'+res.type+';base64,' + res.base64;
			if( !res.base64 ){
				// ↓ ダミーの Sample Image
				path = _imgDummy;
			}

			var tmpListStyle = {
				'list-style-type': 'none',
				'display': 'inline-block',
				'padding': '0.2em 1em',
				'margin': '0'
			}
			rtn.append( $('<ul>')
				.css({'padding': 0})
				.append( $( '<li>' )
					.css(tmpListStyle)
					.append( $( '<label>' )
						.append( $( '<input type="radio">' )
							.change(selectResourceType)
							.attr({
								"name":mod.name+'-resourceType',
								"value":"",
								"checked": (data.resType=='')
							})
						)
						.append( $( '<span>' ).text('ファイルアップロード') )
					)
				)
				.append( $( '<li>' )
					.css(tmpListStyle)
					.append( $( '<label>' )
						.append( $( '<input type="radio">' )
							.change(selectResourceType)
							.attr({
								"name":mod.name+'-resourceType',
								"value":"web",
								"checked": (data.resType=='web')
							})
						)
						.append( $( '<span>' ).text('ウェブリソース') )
					)
				)
				.append( $( '<li>' )
					.css(tmpListStyle)
					.append( $( '<label>' )
						.append( $( '<input type="radio">' )
							.change(selectResourceType)
							.attr({
								"name":mod.name+'-resourceType',
								"value":"none",
								"checked": (data.resType=='none')
							})
						)
						.append( $( '<span>' ).text('なし') )
					)
				)
			);

			$uiImageResource.append( $imagePreviewArea
				.css({
					'border':'1px solid #999',
					'padding': 10,
					'margin': '10px auto',
					'background': '#fff',
					'outline': 'none',
					'border-radius': 5,
					'text-align': 'center',
				})
				.addClass('broccoli__user-selectable')
				.on('paste', function(e){
					var items = e.originalEvent.clipboardData.items;
					// console.log(items);
					for (var i = 0 ; i < items.length ; i++) {
						var item = items[i];
						// console.log(item);
						if(item.type.indexOf("image") != -1){
							var file = item.getAsFile();
							file.name = file.name||'clipboard.'+(function(type){
								if(type.match(/png$/i)){return 'png';}
								if(type.match(/gif$/i)){return 'gif';}
								if(type.match(/(?:jpeg|jpg|jpe)$/i)){return 'jpg';}
								if(type.match(/svg/i)){return 'svg';}
								return 'txt';
							})(file.type);
							// console.log(file);
							applyFile(file);
						}
					}
				})
				.attr({'tabindex': '1'})
				.on('focus', function(e){
					$(this).css({'background': '#eee'});
				})
				.on('blur', function(e){
					$(this).css({'background': '#fff'});
				})
				.append( $img
					.attr({
						"src": path ,
						"data-size": res.size ,
						"data-extension": res.ext,
						"data-mime-type": res.type,
						"data-base64": res.base64,
						"data-is-updated": 'no'
					})
					.css({
						'min-width':'10%',
						'max-width':'100%',
						'min-height':'1px',
						'max-height':'200px',
						'user-select': 'none',
						'pointer-events': 'none',
					})
				)
				.append( $imgNotImage
					.text(res.ext)
					.hide()
				)
				.on('dragleave', function(e){
					e.stopPropagation();
					e.preventDefault();
					$(this).css({'background': '#fff'});
				})
				.on('dragover', function(e){
					// console.log(123478987654.123456);
					e.stopPropagation();
					e.preventDefault();
					$(this).css({'background': '#eee'});
					// console.log(event);
				})
				.on('drop', function(e){
					e.stopPropagation();
					e.preventDefault();
					var event = e.originalEvent;
					var fileInfo = event.dataTransfer.files[0];
					applyFile(fileInfo);
				})
			);

			setImagePreview({
				'src': path,
				'size': res.size,
				'ext': res.ext,
				'mimeType': res.type,
				'base64': res.base64,
			});

			$uiImageResource.append(
				$('<p>')
					.append( $('<label>')
						.text('ファイルを選択する')
						.addClass('px2-btn')
						.append( $('<input>')
							.attr({
								"name":mod.name ,
								"type":"file",
								"webkitfile":"webkitfile"
							})
							.css({'display': 'none'})
							.on('change', function(e){
								// console.log(e.target.files);
								var fileInfo = e.target.files[0];
								var realpathSelected = $(this).val();

								if( realpathSelected ){
									applyFile(fileInfo);
								}

							})
						)
					)
					.append( $('<button>')
						.text('URLから取得する')
						.attr({'type': 'button'})
						.addClass('px2-btn')
						.on('click', function(){
							var url = prompt('指定のURLからファイルを取得して保存します。'+"\n"+'ファイルのURLを入力してください。');
							if( !url ){
								return;
							}
							var params = {
								'url': url
							}
							// console.log(params);
							_this.callGpi(
								{
									'api': 'getImageByUrl',
									'data': params
								} ,
								function(result){
									// console.log(result);
									var dataUri = 'data:'+result.responseHeaders['content-type']+';base64,' + result.base64;
									switch(result.status){
										case 200:
										case 301:
										case 302:
										case 304:
											// 成功
											break;
										case 404:
											alert('ファイルが見つかりません。 ('+result.status+')');
											return; // この場合は反映させない
											break;
										case 400:
										case 405:
											alert('不正なリクエストです。 ('+result.status+')');
											return; // この場合は反映させない
											break;
										case 401:
										case 402:
										case 403:
											alert('アクセスが許可されていません。 ('+result.status+')');
											return; // この場合は反映させない
											break;
										case 0:
											// おそらくURLの形式としてリクエストできない値が送られた。
											alert('画像の取得に失敗しました。 ('+result.status+')');
											return; // この場合は反映させない
											break;
										default:
											alert('画像の取得に失敗しました。 ('+result.status+')');
											// とれたデータが画像ではないとも限らないので、
											// 失敗を伝えるが、反映はしてみることにする。
											break;
									}

									setImagePreview({
										'src': dataUri,
										'size': result.responseHeaders['content-length'],
										'ext': getExtension( params.url ),
										'mimeType': result.responseHeaders['content-type'],
										'base64': (function(dataUri){
											dataUri = dataUri.replace(new RegExp('^data\\:[^\\;]*\\;base64\\,'), '');
											// console.log(dataUri);
											return dataUri;
										})(dataUri),
									});

									if( !$inputImageName.val() ){
										// アップした画像名をプリセット
										// ただし、既に名前がセットされている場合は変更しない
										var fname = utils79.basename( params.url );
										fname = fname.replace(new RegExp('\\.[a-zA-Z0-9]*$'), '');
										$inputImageName.val(fname);
									}

									return;
								}
							);
						})
					)
					.append( $('<button>')
						.text('名前を付けて保存する')
						.attr({'type': 'button'})
						.addClass('px2-btn')
						.on('click', function(){
							var base64 = $img.attr('data-base64');
							var ext = $img.attr('data-extension');
							if( !base64 || !ext ){
								alert('ファイルがセットされていません。');
								return;
							}
							var anchor = document.createElement("a");
							anchor.href = 'data:application/octet-stream;base64,'+base64;
							anchor.download = "bin."+ext;
							anchor.click();
							return;
						})
					)
			);
			var $fileNameDisplay = $('<div>')
				.append( $('<span>')
					.text('出力ファイル名:')
				)
				.append( $inputImageName
					.attr({
						"name":mod.name+'-publicFilename' ,
						"type":"text",
						"placeholder": "output file name"
					})
					.css({
						'display': 'inline-block',
						'width': 210,
						'max-width': '70%'
					})
					.val( (typeof(res.publicFilename)==typeof('') ? res.publicFilename : '') )
				)
				.append( $displayExtension )
			;
			$uiImageResource.append( $fileNameDisplay );
			if( confFilenameAutoSetter == 'random' ){
				$fileNameDisplay.css({'display': 'none'});
			}
			$uiWebResource.append(
				$('<p>').text('このモードでは、ファイルリソースを URL で指定します。画像は取得して保存されることはありません。指定したURLが直接参照されます。')
			);
			$uiWebResource.append(
				$('<div>')
					.append( $('<span>')
						.text('URL: ')
					)
					.append( $inputWebUrl
						.attr({
							"name":mod.name+'-webUrl' ,
							"type":"text",
							"placeholder": "https://example.com/example.png"
						})
						.val( (typeof(data.webUrl)==typeof('') ? data.webUrl : '') )
					)
			);

			rtn.append($uiImageResource).append($uiWebResource).append($uiNoImage);
			rtn.append( $('<input>')
				.attr({
					'type': 'hidden',
					'name': mod.name+'-resKey',
					'value': data.resKey
				})
			);
			$(elm).html(rtn);
			selectResourceType();

			new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
				callback();
			}); });
		} );
		return;

	} // this.mkEditor()

	/**
	 * データを複製する (Client Side)
	 */
	this.duplicateData = function( data, callback, resources ){
		data = JSON.parse( JSON.stringify( data ) );
		it79.fnc(
			data,
			[
				function(it1, data){
					_resMgr.addNewResource( resources[data.resKey], function(result){
						data.resKey = result.newResourceKey;
						data.path = result.publicPath;
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
	 * データから使用するリソースのリソースIDを抽出する (Client Side)
	 */
	this.extractResourceId = function( data, callback ){
		callback = callback||function(){};
		resourceIdList = [];
		resourceIdList.push(data.resKey);
		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			callback(resourceIdList);
		}); });
		return this;
	}

	/**
	 * エディタUIで編集した内容を検証する (Client Side)
	 */
	this.validateEditorContent = function( elm, mod, callback ){
		var errorMsgs = [];
		var resourceDb = null;
		var $img = $(elm).find('img');
		var resType = $(elm).find('[name='+mod.name+'-resourceType]:checked').val();
		var resKey = $(elm).find('[name='+mod.name+'-resKey]').val();
		var filename = $(elm).find('[name='+mod.name+'-publicFilename]').val();
		var webUrl = $(elm).find('[name='+mod.name+'-webUrl]').val();
		var rules = mod.validate || [];
		if(typeof(rules) == typeof('')){rules = [rules];}
		var rulesIsRequired = false;
		var rulesMaxFileSize = null;
		var rulesMinFileSize = 0;
		for(var idx in rules){
			if(rules[idx] == 'required'){
				rulesIsRequired = true;
			}else if(rules[idx].match(/^max\-filesize\:([0-9]*)?$/)){
				rulesMaxFileSize = Number(RegExp.$1);
			}else if(rules[idx].match(/^min\-filesize\:([0-9]*)?$/)){
				rulesMinFileSize = Number(RegExp.$1);
			}
		}

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				// Validate required
				var msgRequired = 'ファイルを必ず選択してください。';
				if(rulesIsRequired){
					if(resType == 'none'){
						errorMsgs.push(msgRequired);
					}else if(resType == 'web'){
						if(!webUrl){
							errorMsgs.push(msgRequired);
						}
					}else{
						if($img.get(0).src == _imgDummy){
							errorMsgs.push(msgRequired);
						}
					}
				}
				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// Validate image src
				if(!$img.get(0)){
					errorMsgs.push('[FATAL] ファイルを取得できませんでした。');
					rlv();
					return;
				}
				if(resType == 'none' || resType == 'web'){
					// 画像を登録しない場合、またはURL指定の場合は、画像の内容をバリデートできない。
					rlv();
					return;
				}

				var nH, nW;
				var filesize = Number($img.attr('data-size'));
				nH = $img.get(0).naturalHeight;
				nW = $img.get(0).naturalWidth;
				// console.log(nH, nW, filesize);

				if( rulesMaxFileSize && filesize > rulesMaxFileSize ){
					errorMsgs.push('ファイルサイズが '+rulesMaxFileSize+'バイト より小さいファイルを選択してください。');
				}
				if( rulesMinFileSize && filesize < rulesMinFileSize ){
					errorMsgs.push('ファイルサイズが '+rulesMinFileSize+'バイト より大きいファイルを選択してください。');
				}

				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				_resMgr.getResourceDb(function(res){
					resourceDb = res;
					rlv();
				});
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				var isImageUpdated = false;
				if( $img.attr('data-is-updated') == 'yes' ){
					isImageUpdated = true;
				}
				var isFilenameChanged = false;
				if( !resourceDb[resKey] || resourceDb[resKey].publicFilename !== filename ){
					isFilenameChanged = true;
				}
				for( var idx in resourceDb ){
					if( resourceDb[idx].isPrivateMaterial ){
						// 非公開リソースにファイル名は与えられない
						continue;
					}
					if( idx == resKey ){
						// 自分
						continue;
					}
					if( !isImageUpdated && !isFilenameChanged ){
						// 画像もファイル名も変更されていなければ、重複チェックをスキップ
						continue;
					}
					if( resType === '' && filename !== '' && resourceDb[idx].publicFilename == filename ){
						errorMsgs.push('ファイル名が重複しています。');
						continue;
					}
				}
				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				callback( errorMsgs );
			}); })
		;
		return this;
	}

	/**
	 * エディタUIで編集した内容を保存
	 */
	this.saveEditorContent = function( elm, data, mod, callback, options ){
		options = options || {};
		options.message = options.message || function(msg){};//ユーザーへのメッセージテキストを送信

		var resInfo;
		var $dom = $(elm);
		if( typeof(data) !== typeof({}) ){
			data = {};
		}
		if( typeof(data.resKey) !== typeof('') ){
			data.resKey = '';
		}

		it79.fnc(
			data,
			[
				function(it1, data){
					data.resType = $dom.find('[name='+mod.name+'-resourceType]:checked').val();
					data.webUrl = $dom.find('[name='+mod.name+'-webUrl]').val();
					it1.next(data);
					return;
				} ,
				function(it1, data){
					// console.log('saving image field data.');
					options.message('リソース領域を初期化中...');
					_resMgr.getResource(data.resKey, function(result){
						// console.log(result);
						if( result === false ){
							// console.log('result is false');
							_resMgr.addResource(function(newResKey){
								// console.log('new Resource Key is: '+newResKey);
								data.resKey = newResKey;
								// console.log(data.resKey);
								it1.next(data);
							});
							return;
						}
						it1.next(data);
						return;
					});
				} ,
				function(it1, data){
					options.message('リソース領域を初期化中... '+data.resKey);
					_resMgr.getResource(data.resKey, function(res){
						// console.log(res);
						resInfo = res;
						it1.next(data);
					});
					return;
				} ,
				function(it1, data){
					var $img = $dom.find('img');

					resInfo.field = resInfo.field || mod.type; // フィールド名をセット
					resInfo.fieldNote = resInfo.fieldNote || {}; // <= フィールド記録欄を初期化

					if( $img.attr('data-is-updated') == 'yes' ){
						resInfo.ext = $img.attr('data-extension');
						resInfo.type = $img.attr('data-mime-type');
						resInfo.size = parseInt($img.attr('data-size'));
						resInfo.base64 = $img.attr('data-base64');
						resInfo.field = mod.type;
						resInfo.fieldNote = {}; // <= フィールド記録欄をクリア
					}
					resInfo.isPrivateMaterial = (data.resType == 'web' ? true : false);
					resInfo.publicFilename = $dom.find('input[name='+mod.name+'-publicFilename]').val();

					options.message('リソースを更新中...');
					_resMgr.updateResource( data.resKey, resInfo, function(result){
						options.message('リソースの公開パスを取得中...');
						_resMgr.getResourcePublicPath( data.resKey, function(publicPath){
							data.path = publicPath;
							it1.next(data);
						} );
					} );
					return;

				} ,
				function(it1, data){
					options.message('リソースの処理を完了しました。');
					callback(data);
					it1.next(data);
				}
			]
		);
		return;
	}// this.saveEditorContent()

}
