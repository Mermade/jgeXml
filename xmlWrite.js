'use strict';

var xml = '';
var hanging = '';
var followsElement = true;
var followsEndElement = false;
var depth = 0;
var pretty = 0;

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

function encode(s) {
	var es = s;
	if (typeof s === 'string') { // might be a number, boolean or null
		es = es.replaceAll('&','&amp;');
		es = es.replaceAll('<','&lt;');
		es = es.replaceAll('>','&gt;');
		es = es.replaceAll('"','&quot;');
		es = es.replaceAll("'",'&apos;');
	}
	return es;
}

function startFragment(indent) {
	if (indent) pretty = indent
	else pretty = 0;
	followsElement = true;
	followsEndElement = false;
	xml = '';
	hanging = '';
	depth = 0;
}

module.exports = {
	startFragment: startFragment,

	startDocument : function (encoding,standalone,indent) {
		startFragment(indent);
		xml = '<?xml version="1.0" encoding="' + encoding + '"' +
		(standalone ? ' standalone="' + standalone + '"' : '') + ' ?>';
	},

	docType : function (s) {
		xml += '<!DOCTYPE ' + s + '>';
	},

	startElement : function (s) {
		xml += hanging;
		if (s != '') {
			if ((pretty) && (followsElement || followsEndElement)) xml += '\n'+Array(pretty*depth+1).join(' ');
			xml += '<' + s;
			hanging = '>';
			depth++;
			followsElement = true;
		}
		else hanging = '';
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
		followsElement = false;
		followsEndElement = false;
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

	fragment : function (s) {
		xml += hanging + s;
		hanging = '';
		followsElement = false;
		followsEndElement = true;
	},

	endElement : function (s) {
		xml += hanging;
		if (s !== '') {
			depth--;
			if ((pretty) && (followsEndElement)) xml += '\n'+Array(pretty*depth+1).join(' ');
			xml += '</' + s + '>';
			if ((pretty) && (followsElement)) xml += '\n';
			followsElement = false;
			followsEndElement = true;
		}
		hanging = '';
	},

	endFragment : function () {
		xml += hanging;
		hanging = '';
		return xml;
	},

	endDocument : function () {
		//hanging is '' at this point
		return xml;
	}
};