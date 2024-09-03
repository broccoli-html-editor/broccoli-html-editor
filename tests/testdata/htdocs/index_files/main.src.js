// console.log(broccoli);

/**
 * main.js
 */
window.main = new (function(){
	var _this = this;
	var it79 = require('iterate79');
	var socket;
	if(window.biflora){
		socket = this.socket = window.biflora
			.createSocket(
				this,
				io,
				{
					'showSocketTest': function( data, callback, main, socket ){
						// console.log(data);
						// alert(data.message);
						// console.log(callback);
						callback(data);
						return;
					}
				}
			)
		;
	}
	var serverType = 'biflora';

	// broccoli をインスタンス化
	var broccoli = new Broccoli();
	this.broccoli = window.broccoli = broccoli;

	(function(){
		var h = $(window).height() - 70;
		$('.instanceTreeView').css({'height':h});
		$('.canvas').css({'height':h});
		$('.palette').css({'height':h});
	})();

	this.init = function(options, callback){
		callback = callback||function(){};
		options = options||{};
		if(options.serverType){
			serverType = options.serverType;
		}
		// this.socketTest();
		// broccoli を初期化
		broccoli.init(
			{
				'elmCanvas': $('.canvas').get(0),
				'elmModulePalette': $('.palette').get(0),
				'elmInstancePathView': $('.instancePathView').get(0),
				'elmInstanceTreeView': $('.instanceTreeView').get(0),
				'contents_area_selector': '[data-contents]',
				'contents_bowl_name_by': 'data-contents',
				'lang': options.lang || 'ja',
				'appearance': window.optionsAppearance,
				'customFields': {
					'custom1': function(broccoli){
						/**
						 * データをバインドする
						 */
						this.bind = function( fieldData, mode, mod, callback ){
							var php = require('phpjs');
							var rtn = ''
							if(typeof(fieldData)===typeof('')){
								rtn = php.htmlspecialchars( fieldData ); // ←HTML特殊文字変換
								rtn = rtn.replace(new RegExp('\r\n|\r|\n','g'), '<br />'); // ← 改行コードは改行タグに変換
							}
							if( mode == 'canvas' && !rtn.length ){
								rtn = '<span style="color:#999;background-color:#ddd;font-size:10px;padding:0 1em;max-width:100%;overflow:hidden;white-space:nowrap;">(ダブルクリックしてテキストを編集してください)</span>';
							}
							rtn = '<div style="background-color:#993; color:#fff; padding:1em;">'+rtn+'</div>';
							setTimeout(function(){
								callback(rtn);
							}, 0);
							return;
						}

					}
				},
				'customValidationRules': {
					'customValidation1': function(value, req, attribute, passes) {
						// カスタムバリデーションを定義します。
						// フィールドの validate に登録して呼び出すことができます。
						console.log('---- customValidation1');
						console.log(value, req, attribute);
						var ok = (value == 'customvalidation');
						if( ok ){
							passes(); // if available
						}else{
							passes(false, 'The '+attribute+' is not valid.'); // if not available
						}
					}
				},
				'droppedFileOperator': {
					'jpg': function(fileInfo, callback){
						console.log('tests/main.js: JPEG Operator', fileInfo);
						var mimetype = fileInfo.type;
						var originalFileSize = fileInfo.size;
						var originalFileName = fileInfo.name;
						var originalFileFirstname = originalFileName;
						var originalFileExt = 'png';
						if( originalFileName.match( /^(.*)\.([a-zA-Z0-9\_]+)$/i ) ){
							originalFileFirstname = RegExp.$1;
							originalFileExt = RegExp.$2;
							originalFileExt = originalFileExt.toLowerCase();
						}

						var reader = new FileReader();
						reader.onload = function(evt) {
							// console.log(evt.target);
							var content = evt.target.result;
							// console.log(content);

							// --------------------------------------
							// 画像ファイルのドロップを処理
							// _sys/image に当てはめて挿入します。
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
											},
											"alt": "JPEGドロップ"
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
							callback(clipContents);
							return;
						}

						reader.readAsDataURL(fileInfo);
						return;
					},
					'dropcancel': function(fileInfo, callback){
						// ドロップ処理をキャンセルするテスト
						// 拡張子 `*.dropcancel` のファイルドロップを処理します
						console.log('------ *.dropcancel dropped;', fileInfo);
						callback(false);
					},
				},
				'gpiBridge': function(api, options, callback){
					// General Purpose Interface Bridge
					console.info('=----= GPI Request =----=', api, options);
					var millitime = (new Date()).getTime();

					if(serverType == 'biflora'){
						socket.send(
							'broccoli',
							{
								'api': 'gpiBridge' ,
								'bridge': {
									'api': api ,
									'options': options
								}
							} ,
							function(rtn){
								console.info('-- GPI result', (new Date()).getTime() - millitime, rtn);
								callback(rtn);
							}
						);
					}else if(serverType == 'php'){
						var res;
						$.ajax({
							"url": "./_api.php",
							"method": "post",
							"data":{
								'api': api ,
								'options': JSON.stringify(options)
							},
							"success": function(data){
								try{
									res = JSON.parse(data);
								}catch(e){
									console.error(e, data);
								}
							},
							"error": function(error){
								console.error(error);
							},
							"complete": function(){
								console.info('-- GPI result', (new Date()).getTime() - millitime, res);
								callback(res);
							}
						});
					}
					return;
				},
				'onClickContentsLink': function( uri, data ){
					alert(uri + ' へ移動');
					console.log(data);
					return false;
				},
				'onMessage': function(message){
					console.info('message: '+message);
					px2style.flashMessage(message);
				},
				'onEditWindowOpen': function(instancePath, elmEditWindow){
					console.info('onEditWindowOpen():', instancePath, elmEditWindow);
				},
				'onEditWindowClose': function(instancePath, result){
					console.info('onEditWindowClose():', instancePath, result);
				},
				'enableModuleAnchor': true, // モジュールごとのid属性入力の有効/無効 (デフォルトは `true`)
				'enableModuleDec': true // DEC入力の有効/無効 (デフォルトは `true`)
			} ,
			function(){
				console.log('broccoli standby.');
				$(window).resize(function(){
					var h = $(window).height() - 70;
					$('.instanceTreeView').css({'height':h});
					$('.canvas').css({'height':h});
					$('.palette').css({'height':h});
					broccoli.adjust();
				});
				callback();
			}
		);
	}

	/**
	 * WebSocket疎通確認
	 */
	this.socketTest = function(){
		socket.send(
			'socketTest',
			{'message': 'socketTest from frontend.'} ,
			function(data){
				console.log(data);
				// alert('callback function is called!');
			}
		);
		return this;
	}

	/**
	 * Broccoliをリロード
	 */
	this.reloadBroccoli = function(){
		this.init({
			'serverType': serverType
		},function(){
			console.log('TestPage: Re-initialize Broccoli: done');
		});
	}

})();
