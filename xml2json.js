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
	context.position = s.length-1; //mutable
	context.anchor = context.position; //immutable
	context.hasContent = false;
	context.hasAttribute = false;
	return context;
}

function dump(stack) {
	for (var i=0;i<stack.length;i++) {
		console.log('Entry '+i+' points to '+stack[i].anchor+' ->'+s.charAt(stack[i].anchor)+'<');
	}
	console.log('--');
}

function parseString(xml,attributePrefix,valueProperty) {

	var stack = [];
	var depth = 0; //depth tracks the depth of XML element nesting, not the output JSON
	var lastElement = '';

	s = '{';
	stack.push(newContext());

	jgeXml.parse(xml,function(state,token){

		if (state == jgeXml.sContent) {
			if (token != '') {
				var closeObject = false;
				// content should be following a property name not the beginning of an object
				// so remove assumption it was a container
				if ((!valueProperty) && (s.charAt(s.length-1) == '{')) {
					s = s.replaceAt(s.length-1,' ');
				}

				// if we're following another property, separate with a comma
				if (s.charAt(s.length-1) == '"') {
					s += ',';
				}
				// if we have had attributes, this is definitely a container not a primitive
				// treat this value as an anonymous property
				if ((stack[stack.length-1].hasAttribute) && (!valueProperty)) {
					s += ' "' + attributePrefix + '": ';
				}
				else {
					if (stack[stack.length-1].hasContent) {
						//create array for mixed content/elements
						if (s.charAt(stack[stack.length-1].position) != '[') {
							s = s.insert(stack[stack.length-1].position,'[');
						}
						if (valueProperty) {
							s += ',{';
							closeObject = true;
						}
					}
					stack[stack.length-1].hasContent = true;
				}
				if (valueProperty) {
					s += '"value": ';
				}
				s += '"' + encode(token) + '"';
				if (closeObject) {
					s += '}';
				}

			}
		}
		else if (state == jgeXml.sEndElement) {
			//dump(stack);

			if (s.charAt(stack[stack.length-1].position) == '[') {
				// if we're in an array, close it
				s += ']';
			}
			if (s.charAt(stack[stack.length-1].anchor) == '{') {
				// if we're in an object, close it
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
				// element has changed, if we're in an array, terminate it just before the comma we (maybe) added
				if (s.charAt(stack[stack.length-1].position) == '[') {
					s = s.insert(s.length-1,']');
				}
				s += '"' + token + '": ';
				stack[stack.length-1].position = s.length; //update position of previous element (array insertion point)
			}
			else {
				// array detected, new element matches previous endElement and at same depth
				// only need to insert array opening bracket once
				if (s.charAt(stack[stack.length-1].position) != '[') {
					s = s.insert(stack[stack.length-1].position,'[');
				}
			}
			lastElement = token+'<'+depth+'>';
			s += '{'; // here we assume all elements are containers not values, this supports attributes
			stack.push(newContext());
			depth++;
		}
	});

	// remove final trailing comma, if any
	if (s.charAt(s.length-1) == ',') {
		s = s.substr(0,s.length-1);
	}

	s += '}';

	var obj = JSON.parse(s);
	return obj;
}

module.exports = {
	xml2json : function(xml,attributePrefix,valueProperty) {
		return parseString(xml,attributePrefix,valueProperty);
	},
	getString : getString
}