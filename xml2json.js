'use strict';

var jgeXml = require('./jgeXml.js');

String.prototype.replaceAt = function(index, character) {
    return this.substr(0, index) + character + this.substr(index+character.length);
};

String.prototype.insert = function (index, string) {
	if (index > 0)
		return this.substring(0, index) + string + this.substring(index, this.length);
	else
		return string + this;
};

function encode(token) {
	token = token.replaceAll('\\','\\\\');
	token = token.replaceAll('\r','\\r');
	token = token.replaceAll('\n','\\n');
	token = token.replaceAll('\t','\\t');
	token = token.replaceAll('"','\\"');
	return token;
}

var s;

function getString() {
	return s;
}

function newContext() {
	var context = {};
	context.position = s.length;
	context.hasContent = false;
	context.hasAttribute = false;
	return context;
}

function parseString(xml,attributePrefix) {

	var stack = [];
	var depth = 0; //depth tracks the depth of XML element nesting, not the output JSON
	var lastElement = '';

	s = '{';
	stack.push(newContext());

	jgeXml.parse(xml,function(state,token){

		if (state == jgeXml.sContent) {
			if (token != '') {
				// content should be following a property name not the beginning of an object
				// so remove assumption it was a container
				if (s.charAt(s.length-1) == '{') {
					s = s.substr(0,s.length-1);
				}

				// if we're following another property, separate with a comma
				if (s.charAt(s.length-1) == '"') {
					s += ',';
				}
				// if we have had attributes, this is definitely a container not a primitive
				// treat this value as an anonymous property
				if (stack[stack.length-1].hasAttribute) {
					s += ' "' + attributePrefix + '": ';
				}
				else {
					if (stack[stack.length-1].hasContent) {
						//create array for mixed content/elements
						if (s.charAt(stack[stack.length-1].position) != '[') {
							s = s.insert(stack[stack.length-1].position,'[');
						}
					}
					stack[stack.length-1].hasContent = true;
				}
				s += '"' + encode(token) + '"';
			}
		}
		else if (state == jgeXml.sEndElement) {
			// if we're in an array, close it
			if (s.charAt(stack[stack.length-1].position) == '[') {
				s += ']}';
			}
			// if we're in an object, close it
			if (s.charAt(stack[stack.length-1].position) == '{') {
				s += '}';
			}
			// TODO the need for this one is puzzling me
			if (s.charAt(stack[stack.length-1].position) == '"') {
				s += '}';
			}

			stack.pop();
			depth--;
			lastElement = token+'<'+depth+'>';
		}
		else if (state == jgeXml.sAttribute) {
			// if not the first attribute, separate the properties with a comma
			if (s.charAt(s.length-1) !== '{') {
				s += ',';
			}
			s += '"' + attributePrefix + token + '": ';
			stack[stack.length-1].hasAttribute = true;
		}
		else if (state == jgeXml.sValue) {
			s += '"' + encode(token) + '"';
		}
		else if (state == jgeXml.sElement) {
			// if this is not the first property, separate with a comma
			if (s.charAt(s.length-1) != '{') {
				s += ',';
			}

			if (token+'<'+depth+'>' != lastElement) {
				// element has changed, if we're in an array, terminate it
				if (s.charAt(stack[stack.length-1].position) == '[') {
					s = s.insert(s.length-1,']');
				}
				s += '"' + token + '": ';
				stack[stack.length-1].position = s.length; //update position of previous element (array insertion point)
			}
			else {
				// array detected, new element matches previous endElement
				// only need to insert array opening bracket once
				if (s.charAt(stack[stack.length-1].position) != '[') {
					s = s.insert(stack[stack.length-1].position,'[');
				}
			}
			lastElement = token+'<'+depth+'>';
			s += '{'; // here we assume all elements are containers not values, this supports attributes
			depth++;
			stack.push(newContext());
		}
	});

	if (s.charAt(s.length-1) == ',') {
		s = s.substr(0,s.length-1);
	}

	s += '}';

	var obj = JSON.parse(s);
	return obj;
}

module.exports = {
	xml2json : function(xml,attributePrefix) {
		return parseString(xml,attributePrefix);
	},
	getString : getString
}