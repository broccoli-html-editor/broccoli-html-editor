(function(){
	var $ = require('jquery');
	var $iframeWindow = $(window.document);

	var e=document.querySelector('[data-broccoli-receive-message]');
	e.parentNode.removeChild(e);

	var _origin;


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
			console.log(data);
			for(var idx in data.options.htmls){
				$iframeWindow.find(data.options.contents_area_selector).html('...');
			}
			for(var idx in data.options.htmls){
				$iframeWindow.find('['+data.options.contents_bowl_name_by+'='+idx+']').html(data.options.htmls[idx]);
			}
			callbackMessage(data.callback, true);
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
