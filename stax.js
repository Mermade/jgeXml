/*

stacking xml parser

*/

'use strict';

const sInitial = 0;
const sDeclaration = 1;
const sPreElement = 2;
const sElement = 3;
const sAttribute = 5;
const sAttrNML = 6; // No Mans Land
const sValue = 7;
const sEndElement = 9;
const sContent = 11;
const sElementBoundary = 12;
const sAttributeSpacer = 14;
const sComment = 16;

var state = sInitial;
var boundary;
var token;
var lastElement;

function reset() {
	state = sInitial;
	token = '';
	boundary = '<';
	lastElement = '';
}

function staxParse(s,callback) {
	
	//comments - done trivially, needs hardening
	//TODO empty elements with attributes processing instructions, CDATA segments
	
	var c;
	var keepToken = false;
	reset();
	
	for (var i=0;i<s.length;i++) {
		c = s.charAt(i);
		
		if ((c == '\t') || (c == '\r') || (c == '\n')) {
			c = ' ';
		}
		
		if (boundary.indexOf(c)>=0) {
			
			token = token.trim();
			keepToken = false;
			if (((state & 1) == 1) && (token != '')) {				
				callback(state,token); // nonstandard space handling
			}

			if (state == sInitial) {
				state = sDeclaration;
				boundary = '>';
			}
			else if (state == sDeclaration) {
				state = sPreElement;
				boundary = '<';
			}
			else if (state == sPreElement) {
				state = sElement;
				boundary = ' !/>';
			}
			else if (state == sElement) {
				lastElement = token;
				if (c == '!') {
					state = sComment;
					boundary = '>'; //!
				}
				if (c == '/') {
					state = sEndElement;
					boundary = '>';
					keepToken = true;
				}
				else if (c == ' ') {
					state = sAttribute;
					boundary = '/=>';
				}
				else if (c == '>') {
					state = sContent;
					boundary = '<';
				}
			}
			else if (state == sAttribute) {
				if (c == '=' ) {
					state = sAttrNML;
					boundary = '\'"';
				}
				else if (c == '>') {
					state = sContent;
					boundary = '<';
				}
				else if (c == '/') {
					state = sEndElement;
					keepToken = true;
					token = lastElement;
				}
			}
			else if (state == sAttrNML) {
				state = sValue;
				boundary = c;
			}
			else if (state == sValue) {
				state = sAttribute;
				boundary = '=/>';
			}
			else if (state == sEndElement) {
				//state = sPreElement;
				//boundary = '<';
				state = sContent;
				boundary = '<';
			}
			else if (state == sContent) {
				state = sElement;
				boundary = ' />';
			}
			else if (state == sElementBoundary) {
				attributeCount = 0;
				state = sPreElement;
				boundary = '<';
			}
			else if (state == sComment) {
				state = sPreElement;
				boundary = '<';
			}
			
			if (!keepToken) token = '';
		}		
		else {
			token += c;
		}
		
	}
}

module.exports = {
	parse : function(s,callback) {
		return staxParse(s,callback);
	},
	sInitial : sInitial,
	Declaration : sDeclaration,
	sPreElement : sPreElement,
	sElement : sElement,
	sAttribute : sAttribute,
	sAttrNML : sAttrNML,
	sValue : sValue,
	sEndElement : sEndElement,
	sContent : sContent,
	sElementBoundary : sElementBoundary,
	sAttributeSpacer : sAttributeSpacer
}