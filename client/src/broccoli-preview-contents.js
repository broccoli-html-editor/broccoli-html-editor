(function(){
	var $ = require('jquery');
	var $iframeWindow = $(window.document);

	var e=document.querySelector('[data-broccoli-receive-message]');
	e.parentNode.removeChild(e);

	var _origin;


	// クリックイベントを登録
	$iframeWindow.bind('click', function(){
		callbackMessage('unselectInstance');
		callbackMessage('unfocusInstance');
	});

	// console.log(window.location);

	function callbackMessage(callbackId, data){
		if(!_origin){return;}
		if(typeof(callbackId)!==typeof('')){return;}
		window.parent.postMessage(
			{
				'api':callbackId ,
				'options': data
			},
			_origin
		);
	}

	window.addEventListener('message',function(event){
		var data=event.data;
		_origin = event.origin;

		if(data.api == 'updateHtml'){
			// console.log(data);
			var htmls = data.options.htmls;
			$iframeWindow
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
			callbackMessage(data.callback, true);
			return;

		}else if(data.api == 'getAllInstance'){
			var rtn = {};
			var $instances = $iframeWindow.find('[data-broccoli-instance-path]');
			$instances.each(function(){
				var $this = $(this);
				var elm = {};
				elm.instancePath = $this.attr('data-broccoli-instance-path');
				elm.modId = $this.attr('data-broccoli-mod-id');
				elm.subModName = $this.attr('data-broccoli-sub-mod-name');
				elm.isAppender = ($this.attr('data-broccoli-is-appender') == 'yes');
				elm.areaSizeDetection = $this.attr('data-broccoli-area-size-detection');
				elm.offsetLeft = $this.offset().left;
				elm.offsetTop = $this.offset().top;
				elm.outerWidth = elm.offsetLeft + $this.outerWidth();
				elm.outerHeight = elm.offsetTop + $this.outerHeight();
				if( elm.areaSizeDetection == 'deep' ){
					$this.find('*').each(function(){
						var $this = $(this);
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
				rtn[elm.instancePath] = elm;
			});
			callbackMessage(data.callback, rtn);
			return;

		}else if(data.api == 'getHtmlContentHeight'){
			var height = $iframeWindow.outerHeight();
			callbackMessage(data.callback, height);
			return;

		}else{
			callbackMessage(data.callback, false);
			return;
		}
	});

})();
