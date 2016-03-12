'use strict';

var util = require('util');
var jgeXml = require('./jgeXml.js');

function emit(token,coerceTypes) {
	if (coerceTypes) {
		var num = parseFloat(token);
		if (!isNaN(num)) {
			return num;
		}
		num = parseInt(token,10);
		if (!isNaN(num)) {
			return num;
		}
		if (Object.keys(token).length === 0) {
			return 'null';
		}
	}
	return token;
}

function getString() {
	// deprecated
	return '';
}

function postProcess(obj,parent) {

	for (var key in obj) {
		// skip loop if the property is from prototype
		if (!obj.hasOwnProperty(key)) continue;

		var propArray = Array.isArray(obj[key]);
		if (propArray && obj[key].length == 1) {
			obj[key] = obj[key][0];
		}
		if ((typeof obj[key] == 'object') && (parent !== '')) {
			var firstKey = Object.keys(obj[key])[0];
			if ((Object.keys(obj[key]).length == 1) && (typeof obj[key][firstKey] != 'object')) {
				obj[key] = obj[key][firstKey];
			}
		}

		if (typeof obj[key] !== 'object') {
		}
		else {
			postProcess(obj[key],key);
		}
	}
	return obj;
}

function parseString(xml,options) {

	var stack = [];
	var context = {};
	var lastElement = '';

	var defaults = {
		attributePrefix: "@",
		textName: '#text',
		valName: 'value',
		valueProperty: false,
		coerceTypes: false
	};

	options = Object.assign({},defaults,options); // merge/extend

	var obj = {};
	var newCursor = obj;
	var cursor = obj;

	var currentElementName = '';
	var currentAttributeName = '';
	var index = -1;

	jgeXml.parse(xml,function(state,token) {

		if (state == jgeXml.sElement) {
			var parentElementName = currentElementName;

			context = {};
			context.cursor = newCursor;
			context.parent = cursor;
			context.index = index;
			context.elementName = currentElementName;
			stack.push(context);

			cursor = newCursor;
			currentElementName = token;

			if (newCursor[currentElementName]) {
				var n = {};
				newCursor[currentElementName].push(n);
				index = newCursor[currentElementName].length-1;
				newCursor = n;
			}
			else {
				newCursor[currentElementName] = [{}]; // we start off assuming each element is an object in an array not just a property
				newCursor = newCursor[currentElementName][0];
				index = 0;
			}
		}
		else if ((state == jgeXml.sContent) || (state == jgeXml.sCData)) {
			token = emit(token,options.coerceTypes);
			var target = cursor[currentElementName][index][options.textName];
			if (!target) {
				target = cursor[currentElementName][index][options.textName] = [];
			}
			var nt = {};
			nt[options.valName] = token;
			target.push(nt);
		}
		else if (state == jgeXml.sEndElement) {
			// finish up
			context = stack[stack.length-1];
			currentElementName = context.elementName;
			newCursor = context.cursor;
			cursor = context.parent;
			index = context.index;

			stack.pop();
		}
		else if (state == jgeXml.sAttribute) {
			currentAttributeName = options.attributePrefix+token;
		}
		else if (state == jgeXml.sValue) {
			token = emit(token,options.coerceTypes);
			cursor[currentElementName][index][currentAttributeName] = token;
		}
	});

	if (!options.valueProperty) {
		obj = postProcess(obj,''); // first pass
		obj = postProcess(obj,''); // second pass
	}

	return obj;
}

module.exports = {
	xml2json : parseString,
	getString : getString
};