window.broccoli = new (function(){
	var _this = this;
	var $ = require('jquery');
	var _ = require('underscore');
	this.fieldBase = new (require('../../libs/fieldBase.js'))(this);
	this.fieldDefinitions = {};
	function loadFieldDefinition(mod){
		return _.defaults( new (mod)(_this), _this.fieldBase );
	}
	_this.fieldDefinitions.href = loadFieldDefinition(require('../../libs/fields/app.fields.href.js'));
	_this.fieldDefinitions.html = loadFieldDefinition(require('../../libs/fields/app.fields.html.js'));
	_this.fieldDefinitions.html_attr_text = loadFieldDefinition(require('../../libs/fields/app.fields.html_attr_text.js'));
	_this.fieldDefinitions.image = loadFieldDefinition(require('../../libs/fields/app.fields.image.js'));
	_this.fieldDefinitions.markdown = loadFieldDefinition(require('../../libs/fields/app.fields.markdown.js'));
	_this.fieldDefinitions.multitext = loadFieldDefinition(require('../../libs/fields/app.fields.multitext.js'));
	_this.fieldDefinitions.select = loadFieldDefinition(require('../../libs/fields/app.fields.select.js'));
	_this.fieldDefinitions.table = loadFieldDefinition(require('../../libs/fields/app.fields.table.js'));
	_this.fieldDefinitions.text = loadFieldDefinition(require('../../libs/fields/app.fields.text.js'));
	_this.fieldDefinitions.wysiwyg_rte = loadFieldDefinition(require('../../libs/fields/app.fields.wysiwyg_rte.js'));
	_this.fieldDefinitions.wysiwyg_tinymce = loadFieldDefinition(require('../../libs/fields/app.fields.wysiwyg_tinymce.js'));

})();
