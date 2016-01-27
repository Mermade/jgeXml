var fs = require('fs');
var stax = require('./stax.js');

var filename = process.argv[2];

var xml = fs.readFileSync(filename,'utf8');

String.prototype.replaceAt = function(index, character) {
    return this.substr(0, index) + character + this.substr(index+character.length);
};

String.prototype.insert = function (index, string) {
  if (index > 0)
    return this.substring(0, index) + string + this.substring(index, this.length);
  else
    return string + this;
};

var s = '{';
var hasContent = false;
var lastElement = '';
var stack = [];
var finished = 0;
stack.push(1);

stax.parse(xml,function(state,token){

	if (state == stax.sDeclaration) {
		s += token;
	}
	else if (state == stax.sContent) {
		if (token != '') { // maybe move this in to only omit hasContent = true ??
			if (s.charAt(s.length-1) == '{') {
				s = s.substr(0,s.length-1);
			}
			if (s.charAt(s.length-1) == '"') {
				s += ',';
			}
			s += '"' + token + '"';
			hasContent = true;
		}
	}
	else if (state == stax.sEndElement) {
		// drop hanging comma
		if (s.charAt(s.length-1) == ',') {
			s = s.substr(0,s.length-1);
		}
		// if we're in an array, close it
		if (s.charAt(stack[stack.length-1]) == '[') {
			s += ']';
		}
		//// if we're in an object, close it
		//if (s.charAt(stack[stack.length-2]) == '{') {
		//	s += '}';
		//}
		// close an empty element
		if (!hasContent) {
			s += '}';
		}
		hasContent = false;
		lastElement = token;
		finished = stack.pop();
	}
	else if (state == stax.sAttribute) {
		if (s.charAt(s.length-1) !== '{') {
			s += ',';
		}
		s += '"_' + token + '" : ';
	}
	else if (state == stax.sValue) {
		s += '"' + token + '"';
	}
	else if (state == stax.sElement) {
		if (s.charAt(s.length-1) !== '{') {
			s += ',';
		}
		if (token != lastElement) {
			if (s.charAt(stack[stack.length-1]) == '[') {
				s = s.insert(s.length-1,']');				
			}			
			s += '"' + token + '": ';
			stack[stack.length-1] = s.length;
			stack.push(s.length);
			s += '{';
		}
		else {
			// array detected, new element matches previous endElement
			// only need to insert array opening bracket once
			if (s.charAt(stack[stack.length-1]) != '[') {
				s = s.insert(stack[stack.length-1],'[');
				//s = s.replaceAt(stack[stack.length-1],'[');
			}
			stack.push(s.length);
			s += '{';
		}
	}
	if (token == '') {
		console.log(state);
	}
});

if (s.charAt(s.length-1) == ',') {
	s = s.substr(0,s.length-1);
}

s += '}';

console.log(s);

var obj = {};
try {
	obj = JSON.parse(s);
	console.log();
	console.log(JSON.stringify(obj,null,2));
}
catch (err) {
	console.log('That is not valid JSON');
	console.log(err);
}