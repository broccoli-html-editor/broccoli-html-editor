(function(){
	var $ = require('jquery');
	var $iframeWindowDocument = $(window.document);

	var scriptElement = document.querySelector('[data-broccoli-receive-message]');
	if(scriptElement){scriptElement.parentNode.removeChild(scriptElement);}

	var _origin;


	// クリックイベントを登録
	$iframeWindowDocument.on('click', function(){
		callbackMessage('unselectInstance');
		callbackMessage('unfocusInstance');
	});
	// dropイベントをキャンセル
	$iframeWindowDocument.on('dragover', function(e){
		e.stopPropagation();
		e.preventDefault();
		return;
	}).on('drop', function(e){
		e.stopPropagation();
		e.preventDefault();
		return;
	});

	function callbackMessage(callbackId, data){
		if(!_origin){return;}
		if(typeof(callbackId)!==typeof('')){return;}

		try {
			var event;
			event = document.createEvent("Event");
			event.initEvent("message", false, false);
			event.data = {
				'api':callbackId ,
				'options': data
			};
			event.origin = _origin;
			window.parent.dispatchEvent(event);
		}catch(e){
			window.parent.postMessage(
				{
					'api':callbackId ,
					'options': data
				},
				_origin
			);
		}
	}

	function resetPreviewDomElements(){
		$('body *').attr({'tabindex':'-1'}).css({'outline':'none'});
		$('img').off("load").on("load", function() {
			var data = {};
			callbackMessage( 'adjustPanelsPosition', data );
			return;
		});
	}

	function getInstance($this){
		var elm = {};
		elm.instancePath = $this.attr('data-broccoli-instance-path');
		elm.modId = $this.attr('data-broccoli-mod-id');// <- このidは、コンテンツデータ由来なので、実際にはinternalIdを扱っている。が、名前は id でよい。
		elm.subModName = $this.attr('data-broccoli-sub-mod-name');
		elm.isAppender = ($this.attr('data-broccoli-is-appender') == 'yes');
		elm.areaSizeDetection = $this.attr('data-broccoli-area-size-detection');
		elm.modName = $this.attr('data-broccoli-module-name');
		elm.offsetLeft = $this.offset().left;
		elm.offsetTop = $this.offset().top;
		elm.outerWidth = elm.offsetLeft + $this.outerWidth();
		elm.outerHeight = elm.offsetTop + $this.outerHeight();
		if( elm.areaSizeDetection == 'deep' ){
			$this.find('*').each(function(){
				var $this = $(this);
				if( $this.is(":hidden") ){
					return;
				}
				var oL = $this.offset().left;
				var oT = $this.offset().top;
				var oW = oL + $this.outerWidth();
				var oH = oT + $this.outerHeight();
				if( elm.offsetLeft > oL ){
					elm.offsetLeft = oL;
				}
				if( elm.offsetTop > oT ){
					elm.offsetTop = oT;
				}
				if( elm.outerWidth < oW ){
					elm.outerWidth = oW;
				}
				if( elm.outerHeight < oH ){
					elm.outerHeight = oH;
				}
			});
		}
		elm.outerWidth = elm.outerWidth - elm.offsetLeft;
		elm.outerHeight = elm.outerHeight - elm.offsetTop;
		elm.visible = true;
		if( $this.is(":hidden") ){
			elm.visible = false;
		}
		return elm;
	}

	window.addEventListener('message',function(event){
		var data=event.data;
		_origin = event.origin;

		if(data.api == 'ping'){
			callbackMessage(data.callback, {
				"result": true,
				"message": "OK"
			});
			return;
		}else if(data.api == 'updateHtml'){
			var htmls = data.options.htmls;
			$iframeWindowDocument
				.find(data.options.contents_area_selector)
				.html('...')
				.each(function(){
					var $this = $(this);
					var bowlName = $this.attr(data.options.contents_bowl_name_by);
					if(!bowlName){ bowlName = 'main'; }
					if(htmls[bowlName]){
						$this.html(htmls[bowlName]);
						htmls[bowlName] = undefined;
						delete htmls[bowlName];
					}
				})
			;
			resetPreviewDomElements();
			callbackMessage(data.callback, true);
			return;

		}else if(data.api == 'getInstance'){
			var rtn = {};
			var $instance = $iframeWindowDocument.find('[data-broccoli-instance-path="'+data.options.instancePath+'"]');
			var elm = getInstance($instance);
			rtn = elm;
			callbackMessage(data.callback, rtn);
			return;

		}else if(data.api == 'getAllInstance'){
			var rtn = {};
			var $instances = $iframeWindowDocument.find('[data-broccoli-instance-path]');
			$instances.each(function(){
				var $this = $(this);
				var elm = getInstance($this);
				rtn[elm.instancePath] = elm;
			});
			callbackMessage(data.callback, rtn);
			return;

		}else if(data.api == 'getHtmlContentHeightWidth'){
			var hw = {};
			hw.h = Math.max.apply( null, [document.body.clientHeight, document.body.scrollHeight, document.documentElement.scrollHeight, document.documentElement.clientHeight] );
			hw.w = Math.max.apply( null, [document.body.clientWidth, document.body.scrollWidth, document.documentElement.scrollWidth, document.documentElement.clientWidth] );
			callbackMessage(data.callback, hw);
			return;

		}else if(data.api == 'getBowlList'){
			var bowls = [];
			$iframeWindowDocument
				.find(data.options.contents_area_selector)
				.each(function(){
					var $this = $(this);
					var bowlName = $this.attr(data.options.contents_bowl_name_by);
					if( typeof(bowlName) !== typeof('') || !bowlName.length ){
						bowlName = 'main';// <- default bowl name
					}
					bowls.push(bowlName);
				})
			;
			callbackMessage(data.callback, bowls);
			return;

		}else{
			callbackMessage(data.callback, false);
			return;
		}
		return;
	});

	$iframeWindowDocument.on("click", "a", function() {
		var data = {};
		var $this = $(this);
		data.url = $this.prop('href');
		data.tagName = this.tagName.toLowerCase();
		data.href = $this.attr('href');
		data.target = $this.attr('target');
		callbackMessage( 'onClickContentsLink', data );
		return false;
	});
	$iframeWindowDocument.find('form').on("submit", function() {
		var data = {};
		var $this = $(this);
		data.url = $this.prop('action');
		data.tagName = this.tagName.toLowerCase();
		data.action = $this.attr('action');
		data.target = $this.attr('target');
		callbackMessage( 'onClickContentsLink', data );
		return false;
	});
	$(window).on("resize", function() {
		var data = {};
		callbackMessage( 'adjustPanelsPosition', data );
		return;
	});

	resetPreviewDomElements();

})();
