'use strict';

var xmlWrite = require('./xmlWrite');

var attributePrefix = '@';

function traverse(obj,parent) {
	
var result = [];
	
	for (var key in obj){
		// skip loop if the property is from prototype
		if (!obj.hasOwnProperty(key)) continue;

		var array = Array.isArray(obj);
		
		if (typeof obj[key] !== 'object'){
			if (key.indexOf(attributePrefix)==0) {
				xmlWrite.attribute(key.substring(1),obj[key]);
			}
			else {
				xmlWrite.startElement(key);
				xmlWrite.content(obj[key]);
				xmlWrite.endElement(key);
			}
		}
		else {
			if (!array) {
				xmlWrite.startElement(key);
			}
			else {
				if (key!=0) xmlWrite.startElement(parent);
			}
			traverse(obj[key],key);
			if (!array) {
				xmlWrite.endElement(key);
			}
			else {
				if (key!=(obj.length-1)) xmlWrite.endElement(parent);
			}
		}
	}
	return result;
}

module.exports = {
	getXml : function(obj,attrPrefix) {
		if (attrPrefix) attributePrefix = attrPrefix;
		xmlWrite.startDocument('UTF8');
		traverse(obj,'');
		return xmlWrite.endDocument();
	}
}