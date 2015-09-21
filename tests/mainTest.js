var assert = require('assert');
var path = require('path');
var fs = require('fs');
var phpjs = require('phpjs');
var Promise = require("es6-promise").Promise;
var broccoli = require('../broccoli.js');

describe('テストを書く準備', function() {

	it("絶対通るテスト", function(done) {
		this.timeout(60*1000);
		assert.equal(1, 1);
		done();
	});

});
