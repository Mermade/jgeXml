'use strict';

var fs = require('fs');
var stax = require('./stax.js');
var xmlWrite = require('./xmlWrite.js');

function x2x(xml) {
	var attributeName = '';

	stax.parse(xml,function(state,token){

		if (state == stax.sDeclaration) {
			xmlWrite.startDocument('UTF-8');
		}
		else if (state == stax.sComment) {
			xmlWrite.comment(token);
		}
		else if (state == stax.sProcessingInstruction) {
			xmlWrite.processingInstruction(token);
		}
		else if (state == stax.sContent) {
			xmlWrite.content(token);
		}
		else if (state == stax.sEndElement) {
			xmlWrite.endElement(token);
		}
		else if (state == stax.sAttribute) {
			attributeName = token;
		}
		else if (state == stax.sValue) {
			xmlWrite.attribute(attributeName,token);
		}
		else if (state == stax.sElement) {
			xmlWrite.startElement(token);
		}
	});
	return xmlWrite.endDocument();
}

var filename = process.argv[2];

var xml = fs.readFileSync(filename,'utf8');

var s1 = x2x(xml); // normalise declaration, spacing and empty elements etc
var s2 = x2x(s1); // compare
var same = (s1 == s2);
console.log(same);
if (!same) {
	console.log(s1);
	console.log();
}
console.log(s2);