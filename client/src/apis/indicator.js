/**
 * indicator.js
 */
module.exports = function(broccoli){
	var $ = require('jquery');
	var targetElements = [];
	var timerForRemove;

	this.putElement = function(elm){
		targetElements.push(elm);
	}

	/**
	 * 保存しています
	 */
	this.saveProgress = function(){
		clearTimeout(timerForRemove);
		for( var idx in targetElements ){
			var $indicator = $('<div class="broccoli__indicator">');
			$indicator.text('保存しています');
			var $target = $(targetElements[idx]);
			$target.append($indicator);
			$indicator.css({
				'right': $target.scrollLeft() + 10,
				'top': $target.scrollTop() + 10
			});
		}
	}

	/**
	 * 保存を完了しました
	 */
	this.saveCompleted = function(){
		console.info('保存を完了しました');
		for( var idx in targetElements ){
			$(targetElements[idx]).find('.broccoli__indicator').addClass('broccoli__indicator-completed').text('保存を完了しました').fadeOut(2000);
		}
		timerForRemove = setTimeout(function(){
			for( var idx in targetElements ){
				$(targetElements[idx]).find('.broccoli__indicator').remove();
			}
		}, 2000);
	}
}
