'use strict';

var xml = '';
var hanging = '';

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

function encode(s) {
	var es = s.replaceAll('&','&amp;');
	es = es.replaceAll('<','&lt;');
	es = es.replaceAll('>','&gt;');
	es = es.replaceAll('"','&quot;');
	es = es.replaceAll("'",'&apos;');
	return es;
}

module.exports = {
	startDocument : function (encoding,standalone) {
		xml = '<?xml version="1.0" encoding="' + encoding + '"' +
		(standalone ? ' standalone="' + standalone + '"' : '') + ' ?>';
	},

	docType : function (s) {
		xml += '<!DOCTYPE ' + s + '>';
	},

	startElement : function (s) {
		xml += hanging + '<' + s;
		hanging = '>';
	},

	emptyElement : function (s) {
		xml += hanging + '<' + s;
		hanging = '/>';
	},

	attribute : function (a,v) {
		xml += ' ' + a + '="' + encode(v) + '"';
	},

	content : function (s) {
		xml += hanging + encode(s);
		hanging = '';
	},

	comment : function (s) {
		xml += hanging + '<!-- ' + encode(s) + ' -->';
		hanging = '';
	},

	processingInstruction : function (s) {
		xml += hanging + '<?' + encode(s) + ' ?>';
		hanging = '';
	},

	cdata : function (s) {
		xml += hanging + '<![CDATA[' + s + ']]>';
		hanging = '';
	},

	endElement : function (s) {
		xml += hanging + '</' + s + '>';
		hanging = '';
	},

	endDocument : function () {
		//hanging is '' at this point
		return xml;
	}
};