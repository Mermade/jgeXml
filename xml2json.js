'use strict';

var util = require('util');
var jgeXml = require('./jgeXml.js');

var debuglog = util.debuglog('jgexml');

function emit(token,coerceTypes) {
	if (coerceTypes) {
		var num = parseInt(token,10);
		if (!isNaN(num)) {
			return num;
		}
		num = parseFloat(token);
		if (!isNaN(num)) {
			return num;
		}
		if (token == '') {
			return 'null';
		}
	}
	return token;
}

function getString() {
	// deprecated
	return '';
}

function clone(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function parseString(xml,options) {

	var stack = [];
	var depth = 0; //depth tracks the depth of XML element nesting, not the output JSON
	var lastElement = '';

	var defaults = {
		attributePrefix: "@",
		textName: '#text',
		valueProperty: false,
		coerceTypes: false
	};

	options = Object.assign({},defaults,options); // merge/extend

	var obj = {};
	var o = obj;
	var oo = obj;

	var currentElementName = '';
	var currentAttributeName = '';
	var currentContent = '';
	var index = -1;
	var attributes = [];

	jgeXml.parse(xml,function(state,token) {

		if (state == jgeXml.sElement) {

			var context = {};
			context.cursor = o;
			context.parent = oo;
			context.index = index;
			context.attributes = clone(attributes);
			context.elementName = currentElementName;
			context.content = clone(currentContent);
			stack.push(context);

			oo = o;
			index = -1;
			attributes = [];
			currentElementName = token;

			if (o[currentElementName]) {
				if (!Array.isArray(o[currentElementName])) {
					debuglog('arrayising '+currentElementName);
					var a = [];
					a.push(o[currentElementName]);
					o[currentElementName] = a;
				}
				var n = {};
				o[currentElementName].push(n);
				index = o[currentElementName].length-1;
				o = n;
			}
			else {
				o[currentElementName] = {}; // we start off assuming each element is an object not just a property
				o = o[currentElementName];
				if (options.valueProperty) {
					currentElementName = 'value';
					oo = o;
				}
			}
		}
		else if (state == jgeXml.sContent) {
			token = emit(token,options.coerceTypes);
			if (currentContent != '') {
				// arrayise currentContent
				var a = [];
				a.push(currentContent);
				currentContent = a;
			}
			if (Array.isArray(currentContent)) {
				currentContent.push(token);
			}
			else {
				currentContent = (currentContent ? currentContent + ' ' + token : token);
			}

			if (index>=0) {
				oo[currentElementName][index] = currentContent;
			}
			else {
				oo[currentElementName] = currentContent;
			}
		}
		else if (state == jgeXml.sEndElement) {
			// do attributes

			for (var i=0;i<attributes.length;i++) {
				var target = o;
				var check;

				if (index>=0) {
					check = oo[currentElementName][index];
				}
				else {
					check = oo[currentElementName];
				}
				debuglog('check = '+JSON.stringify(check));

				if ((Object.keys(o).length == 0) && (typeof check === 'string')) {
					debuglog('Objectifying '+currentElementName+'['+index+']');
					debuglog(JSON.stringify(o));
					target = {};
					if (currentContent !== '') {
						target[options.textName] = currentContent;
					}
					if (index>=0) {
						oo[currentElementName][index] = target;
					}
					else {
						oo[currentElementName] = target;
					}
				}
				debuglog('Adding '+attributes[i].name+'='+attributes[i].value);
				if (index>=0) {
					target[attributes[i].name] = attributes[i].value;
				}
				else {
					target[attributes[i].name] = attributes[i].value;
				}
				debuglog(JSON.stringify(oo[currentElementName]));
			}

			// finish up
			var context = stack[stack.length-1];
			currentElementName = context.elementName;
			o = context.cursor;
			oo = context.parent;
			index = context.index;
			attributes = context.attributes;
			currentContent = context.content;
			if (options.valueProperty) currentContent = '';
			stack.pop();
		}
		else if (state == jgeXml.sAttribute) {
			currentAttributeName = options.attributePrefix+token;
		}
		else if (state == jgeXml.sValue) {
			token = emit(token,options.coerceTypes);
			var attr = {};
			attr.name = currentAttributeName;
			attr.value = token;
			attributes.push(attr);
		}
	});

	return obj;
}

module.exports = {
	xml2json : parseString,
	getString : getString
};