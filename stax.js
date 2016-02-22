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
const sAttributeSpacer = 12;
const sComment = 13;
const sProcessingInstruction = 15;
const sEndDocument = 17;

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

function stateName(state) {
	if (state == sInitial) {
		return 'INITIAL';
	}
	else if (state == sDeclaration) {
		return 'DECLARATION';
	}
	else if (state == sElement) {
		return 'ELEMENT';
	}
	else if (state == sAttribute) {
		return 'ATTRIBUTE';
	}
	else if (state == sValue) {
		return 'VALUE';
	}
	else if (state == sEndElement) {
		return 'END_ELEMENT';
	}
	else if (state == sContent) {
		return 'CONTENT';
	}
	else if (state == sComment) {
		return 'COMMENT';
	}
	else if (state == sProcessingInstruction) {
		return 'PROCESSING_INSTRUCTION';
	}
	else if (state == sEndDocument) {
		return 'END_DOCUMENT';
	}
}

function reset(context) {
	context.state = sInitial;
	context.newState = sInitial;
	context.token = '';
	context.boundary = '<';
	context.lastElement = '';
	context.keepToken = false;
	context.position = 0;
}

// to create a push parser, pass in a callback function and omit the context parameter
// to create a pull parser, pass in null for the callback function and initially provide an empty object as the context
function staxParse(s,callback,context) {

	//comments - done trivially, needs hardening
	//processing instructions - done trivially, needs hardening
	//TODO CDATA segments

	if (context && context.newState) {
		if (!context.keepToken) context.token = '';
		context.state = context.newState;
	}
	else {
		context = {};
		reset(context);
	}

	var c;
	for (var i=context.position;i<s.length;i++) {
		c = s.charAt(i);

		if ((c == '\t') || (c == '\r') || (c == '\n')) { //other unicode spaces are not treated as whitespace
			c = ' ';
		}

		if (context.boundary.indexOf(c)>=0) {

			context.token = context.token.trim(); // nonstandard space handling
			context.keepToken = false;
			if (((context.state & 1) == 1) && (context.token != '')) {
				context.token = context.token.replaceAll('&amp;','&');
				context.token = context.token.replaceAll('&quot;','"');
				context.token = context.token.replaceAll('&apos;',"'");
				context.token = context.token.replaceAll('&gt;','>');
				context.token = context.token.replaceAll('&lt;','<');
				if (context.token.indexOf('&#') >= 0) {
					context.token = context.token.replace(/&(?:#([0-9]+)|#x([0-9a-fA-F]+));/g, function(match, group1, group2) {
						if (group2) {
							return String.fromCharCode(parseInt(group2,16));
						}
						else {
							return String.fromCharCode(group1);
						}
					});
				}

				if (callback) {
					callback(context.state,context.token);
				}
			}

			if (context.state == sInitial) {
				context.newState = sDeclaration;
				context.boundary = '>';
			}
			else if (context.state == sDeclaration) {
				context.newState = sPreElement;
				context.boundary = '<';
			}
			else if (context.state == sPreElement) {
				context.newState = sElement;
				context.boundary = ' ?!/>';
			}
			else if (context.state == sElement) {
				context.lastElement = context.token;
				if (c == '?') {
					context.newState = sProcessingInstruction;
					context.boundary = '>';
				}
				else if (c == '!') {
					context.newState = sComment;
					context.boundary = '>';
				}
				else if (c == '/') {
					context.newState = sEndElement;
					context.boundary = '>';
					context.keepToken = true;
				}
				else if (c == ' ') {
					context.newState = sAttribute;
					context.boundary = '/=>';
				}
				else if (c == '>') {
					context.newState = sContent;
					context.boundary = '<';
				}
			}
			else if (context.state == sAttribute) {
				if (c == '=' ) {
					context.newState = sAttrNML;
					context.boundary = '\'"';
				}
				else if (c == '>') {
					context.newState = sContent;
					context.boundary = '<';
				}
				else if (c == '/') {
					context.newState = sEndElement;
					context.keepToken = true;
					context.token = context.lastElement;
				}
			}
			else if (context.state == sAttrNML) {
				context.newState = sValue;
				context.boundary = c;
			}
			else if (context.state == sValue) {
				context.newState = sAttribute;
				context.boundary = '=/>';
			}
			else if (context.state == sEndElement) {
				//context.newState = sPreElement;
				//context.boundary = '<';
				context.newState = sContent;
				context.boundary = '<';
			}
			else if (context.state == sContent) {
				context.newState = sElement;
				context.boundary = ' !?/>';
			}
			else if (context.state == sComment) {
				context.newState = sPreElement;
				context.boundary = '<';
			}
			else if (context.state == sProcessingInstruction) {
				context.newState = sPreElement;
				context.boundary = '<';
			}

			if (callback) {
				context.state = context.newState;
			}
			else {
				context.position = i+1;
				return context;
			}

			if (!context.keepToken) context.token = '';
		}
		else {
			context.token += c;
		}

	}
	context.state = sEndDocument;
	if (callback) {
		callback(context.state,context.token);
	}
	else {
		return context;
	}

}

module.exports = {
	parse : function(s,callback,context) {
		return staxParse(s,callback,context);
	},
	getStateName : function(state) {
		return stateName(state);
	},
	sDeclaration : sDeclaration,
	sElement : sElement,
	sAttribute : sAttribute,
	sValue : sValue,
	sEndElement : sEndElement,
	sContent : sContent,
	sComment : sComment,
	sProcessingInstruction: sProcessingInstruction,
	sEndDocument : sEndDocument
}