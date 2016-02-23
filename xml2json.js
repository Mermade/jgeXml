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

function parseString(xml,attributePrefix) {

	var hasContent = [];
	var hasAttribute = false;
	var lastElement = '';
	var stack = [];
	//var finished = 0;
	stack.push(1);

	s = '{';
	jgeXml.parse(xml,function(state,token){

		if (state == jgeXml.sContent) {
			if (token != '') { // maybe move this in to only omit hasContent = true ??
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
				if (hasAttribute) {
					s += ' "' + attributePrefix +'" : ';
				}
				else {
					if (hasContent[hasContent.length-1]) {
						//create array
						if (s.charAt(stack[stack.length-1]) != '[') {
							s = s.insert(stack[stack.length-1],'[');
						}
					}
					hasContent[hasContent.length-1] = true;
				}
				s += '"' + encode(token) + '"';
			}
		}
		else if (state == jgeXml.sEndElement) {
			// drop hanging comma
			if (s.charAt(s.length-1) == ',') {
				s = s.substr(0,s.length-1);
			}
			// if we're in an array, close it
			if (s.charAt(stack[stack.length-1]) == '[') {
				s += ']';
			}
			//// if we're in an object, close it or if it is empty
			if ((s.charAt(stack[stack.length-1]) == '{') || (!hasContent[hasContent.length-1])) { //was -2
				s += '}';
			}
			// this has been folded into the test above, which was uncommented
			//// close an empty element
			//if (!hasContent) {
			//	s += '}';
			//}
			lastElement = token;
			stack.pop();
			hasContent.pop(); // todo, combine these into an object on one array?
			
		}
		else if (state == jgeXml.sAttribute) {
			// if not the first attribute, separate the properties with a comma
			if (s.charAt(s.length-1) !== '{') {
				s += ',';
			}
			s += '"' + attributePrefix + token + '": ';
			hasAttribute = true;
		}
		else if (state == jgeXml.sValue) {
			s += '"' + encode(token) + '"';
		}
		else if (state == jgeXml.sElement) {
			hasAttribute = false;
			hasContent.push(false);
			// if this is not the first property, separate with a comma
			if (s.charAt(s.length-1) !== '{') {
				s += ',';
			}
			// if we're in an array and the property name changes, terminate the array
			if (token != lastElement) {
				if (s.charAt(stack[stack.length-1]) == '[') {
					s = s.insert(s.length-1,']');
				}
				s += '"' + token + '": ';
				stack[stack.length-1] = s.length;
				stack.push(s.length);
				s += '{'; // here we assume all elements are containers not values, this supports attributes
			}
			else {
				// array detected, new element matches previous endElement
				// only need to insert array opening bracket once
				if (s.charAt(stack[stack.length-1]) != '[') {
					s = s.insert(stack[stack.length-1],'[');
					//s = s.replaceAt(stack[stack.length-1],'[');
				}
				stack.push(s.length);
				//if (s.charAt(s.length-1) == '{') {
				//	//anonymous object?
				//	//s = s.substr(0,s.length-1); // drop previous opening brace
				//	s += '"anon": ';
				//}
				s += '{';
			}
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