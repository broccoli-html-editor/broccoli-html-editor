/**
 * instanceTreeView.js
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

	var $instanceTreeView;


	/**
	 * インスタンスツリービューを更新する
	 */
	this.update = function(callback){
		callback = callback||function(){};

		callback();
		return this;
	}


	/**
	 * 初期化する
	 * @param  {Object} domElm     DOM Element of instance path view container.
	 * @param  {Function} callback callback function.
	 * @return {Object}            this
	 */
	this.init = function(domElm, callback){
		$instanceTreeView = $(domElm)
			.addClass('broccoli')
			.addClass('broccoli--instance-tree-view')
		;

		it79.fnc(
			{},
			[
				function( it1, data ){
					$instanceTreeView.html('initialize...');
					it1.next(data);
				} ,
				function( it1, data ){
					callback();
					it1.next(data);
				}
			]
		);
		return this;
	}

	return;
}
