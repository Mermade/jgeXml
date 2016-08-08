'use strict';

var util = require('util');
var debuglog = util.debuglog('jgexml');

var target; // for new properties
var attributePrefix = '@';
var laxURIs = false;
var defaultNameSpace = '';

function reset(attrPrefix,laxURIprocessing) {
	target = null;
	attributePrefix = attrPrefix;
	laxURIs = laxURIprocessing;
	defaultNameSpace = '';
}

function clone(obj) {
	 return JSON.parse(JSON.stringify(obj));
}

function hoik(obj,target,key,newKey) {
	if (target && obj && (typeof obj[key] != 'undefined')) {
		if (!newKey) {
			newKey = key;
		}
		target[newKey] = clone(obj[key]);
		delete obj[key];
	}
}

function rename(obj,key,newName) {
	obj[newName] = obj[key];
	delete obj[key];
}

function isEmpty(obj) {
	if (typeof obj !== 'object') return false;
    for (var prop in obj) {
        if ((obj.hasOwnProperty(prop) && (typeof obj[prop] !== 'undefined'))) {
			return false;
		}
    }
 	return true;
}

function toArray(item) {
	if (!(item instanceof Array)) {
		var newitem = [];
		if (item) {
			newitem.push(item);
		}
		return newitem;
	}
	else {
		return item;
	}
}

function mandate(target,inAnyOf,inAllOf,name) {
	if ((name != '#text') && (name != '#')) {
		var tempTarget = target;
		if (inAnyOf>=0) {
			tempTarget = target.anyOf[inAnyOf];
		}
		if (inAllOf>=0) {
			tempTarget = target.allOf[inAllOf];
		}
		if (!tempTarget.required) tempTarget.required = [];
		if (tempTarget.required.indexOf(name) < 0) {
			tempTarget.required.push(name);
		}
	}
}

function finaliseType(typeData) {
	if ((typeData.type == 'string') || (typeData.type == 'boolean') || (typeData.type == 'array') || (typeData.type == 'object')
		|| (typeData.type == 'integer') || (typeData.type == 'number') || (typeData.type == 'null')) {
		//typeData.type = typeData.type;
	}
	else {
		if (typeData.type.startsWith('xml:')) { // id, lang, space, base, Father
			typeData.type = 'string';
		}
		else {
			var tempType = typeData.type;
			if (defaultNameSpace) {
				tempType = tempType.replace(defaultNameSpace+':','');
			}
			if (tempType.indexOf(':')>=0) {
				var tempComp = tempType.split(':');
				typeData["$ref"] = tempComp[0]+'.json#/definitions/'+tempComp[1]; //'/'+typeData.type.replace(':','/');
			}
			else {
				typeData["$ref"] = '#/definitions/'+tempType;
			}
			delete typeData.type;
		}
	}
	return typeData;
}

function mapType(type) {

	var result = {};
	result.type = type;

	if (Array.isArray(type)) {
		result.type = 'object';
		result.oneOf = [];
		for (var t in type) {
			result.oneOf.push(finaliseType(mapType(type[t])));
		}
	}
    else if (type == 'xs:integer') {
		result.type = 'integer';
	}
	else if (type == 'xs:positiveInteger') {
		result.type = 'integer';
		result.minimum = 1;
	}
	else if (type == 'xs:nonPositiveInteger') {
		result.type = 'integer';
		result.maximum = 0;
	}
	else if (type == 'xs:negativeInteger') {
		result.type = 'integer';
		result.maximum = -1;
	}
	else if (type == 'xs:nonNegativeInteger') {
		result.type = 'integer';
		result.minimum = 0;
	}
	else if (type == 'xs:unsignedInt') {
		result.type = 'integer';
		result.minimum = 0;
		result.maximum = 4294967295;
	}
	else if (type == 'xs:unsignedShort') {
		result.type = 'integer';
		result.minimum = 0;
		result.maximum = 65535;
	}
	else if (type == 'xs:unsignedByte') {
		result.type = 'integer';
		result.minimum = 0;
		result.maximum = 255;
	}
	else if (type == 'xs:int') {
		result.type = 'integer';
		result.maximum = 2147483647;
		result.minimum = -2147483648;
	}
	else if (type == 'xs:short') {
		result.type = 'integer';
		result.maximum = 32767;
		result.minimum = -32768;
	}
	else if (type == 'xs:byte') {
		result.type = 'integer';
		result.maximum = 127;
		result.minimum = -128;
	}
	else if (type == 'xs:long') {
		result.type = 'integer';
	}
	else if (type == 'xs:unsignedLong') {
		result.type = 'integer';
		result.minimum = 0;
	}

	if (type == 'xs:string') result.type = 'string';
	if (type == 'xs:NMTOKEN') result.type = 'string';
	if (type == 'xs:NMTOKENS') result.type = 'string';
	if (type == 'xs:ENTITY') result.type = 'string';
	if (type == 'xs:ENTITIES') result.type = 'string';
	if (type == 'xs:ID') result.type = 'string';
	if (type == 'xs:IDREF') result.type = 'string';
	if (type == 'xs:IDREFS') result.type = 'string';
	if (type == 'xs:NOTATION') result.type = 'string';
	if (type == 'xs:token') result.type = 'string';
	if (type == 'xs:Name') result.type = 'string';
	if (type == 'xs:NCName') result.type = 'string';
	if (type == 'xs:QName') result.type = 'string';
	if (type == 'xs:normalizedString') result.type = 'string';
	if (type == 'xs:base64Binary') {
		result.type = 'string';
		result.format = 'byte';
	}
	if (type == 'xs:hexBinary') {
		result.type = 'string';
		result.format = '^[0-9,a-f,A-F]*';
	}

	if (type == 'xs:boolean') result.type = 'boolean';

	if (type == 'xs:date') {
		result.type = 'string';
		result.pattern = '^[0-9]{4}\-[0-9]{2}\-[0-9]{2}.*$'; //timezones
	}
	else if (type == 'xs:dateTime') {
		result.type = 'string';
		result.format = 'date-time';
	}
	else if (type == 'xs:time') {
		result.type = 'string';
		result.pattern = '^[0-9]{2}\:[0-9]{2}:[0-9]{2}.*$'; // timezones
	}
	else if (type == 'xs:duration') {
		result.type = 'string';
		result.pattern = '^(-)?P(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)W)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?$';
	}
	else if (type == 'xs:gDay') {
		result.type = 'string';
		result.pattern = '[0-9]{2}';
	}
	else if (type == 'xs:gMonth') {
		result.type = 'string';
		result.pattern = '[0-9]{2}';
	}
	else if (type == 'xs:gMonthDay') {
		result.type = 'string';
		result.pattern = '[0-9]{2}\-[0-9]{2}';
	}
	else if (type == 'xs:gYear') {
		result.type = 'string';
		result.pattern = '[0-9]{4}';
	}
	else if (type == 'xs:gYearMonth') {
		result.type = 'string';
		result.pattern = '[0-9]{4}\-[0-9]{2}';
	}

	if (type == 'xs:language') {
		result.type = 'string';
		result.pattern = '[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*';
	}

	if (type == 'xs:decimal') {
		result.type = 'number';
	}
	else if (type == 'xs:double') {
		result.type = 'number';
		result.format = 'double';
	}
	else if (type == 'xs:float') {
		result.type = 'number';
		result.format = 'float';
	}

	if (type == 'xs:anyURI') {
		result.type = 'string';
		if (!laxURIs) {
			result.format = 'uri'; //XSD allows relative URIs, it seems JSON schema uri format may not?
			// this regex breaks swagger validators
			//result.pattern = '^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?';
		}
	}

	return result;
}

function initTarget(parent) {
	if (!target) target = parent;
	if (!target.properties) {
		target.properties = {};
		target.required = [];
		target.additionalProperties = false;
	}
	if (!target.allOf) target.allOf = [];
}

function doElement(src,parent,key) {
	var type = 'object';
	var name;

	var simpleType;
	var doc;
	var inAnyOf = -1; // used for attributeGroups - properties can get merged in here later, see mergeAnyOf
	var inAllOf = (target && target.allOf) ? target.allOf.length-1 : -1; // used for extension based composition

	var element = src[key];
	if ((typeof element == 'undefined') || (null === element)) {
		return false;
	}

	if ((key == "xs:any") || (key == "xs:anyAttribute")) {
		if (target) target.additionalProperties = true; // target should always be defined at this point
	}

	if (element["xs:annotation"]) {
		doc = element["xs:annotation"]["xs:documentation"];
	}

	if (element["@name"]) {
		name = element["@name"];
	}
	if (element["@type"]) {
		type = element["@type"];
	}
	else if ((element["@name"]) && (element["xs:simpleType"])) {
		type = element["xs:simpleType"]["xs:restriction"]["@base"];
		simpleType = element["xs:simpleType"]["xs:restriction"];
		if (element["xs:simpleType"]["xs:annotation"]) {
			simpleType["xs:annotation"] = element["xs:simpleType"]["xs:annotation"];
		}
	}
	else if ((element["@name"]) && (element["xs:restriction"])) {
		type = element["xs:restriction"]["@base"];
		simpleType = element["xs:restriction"];
		if (element["xs:annotation"]) {
			simpleType["xs:annotation"] = element["xs:annotation"];
		}
	}
	else if ((element["xs:extension"]) && (element["xs:extension"]["@base"])) {
		type = element["xs:extension"]["@base"];
		var tempType = finaliseType(mapType(type));
		if (!tempType["$ref"]) {
			name = "#text"; // see anonymous types
		}
		else {
			var oldP = clone(target);
			oldP.additionalProperties = true;
			for (var v in target) {
				delete target[v];
			}
			if (!target.allOf) target.allOf = [];
			var newt = {};
			target.allOf.push(newt);
			target.allOf.push(oldP);
			name = '#';
			inAllOf = 0; //target.allOf.length-1;
		}
	}
	else if (element["xs:union"]) {
		var types = element["xs:union"]["@memberTypes"].split(' ');
		type = [];
		for (var t in types) {
			type.push(types[t]);
		}
	}
	else if (element["xs:list"]) {
		type = 'string';
	}
	else if (element["@ref"]) {
		name = element["@ref"];
		type = element["@ref"];
	}

	if (name && type) {
		var isAttribute = (element["@isAttr"] == true);

		initTarget(parent);
		var newTarget = target;

		var minOccurs = 1;
		var maxOccurs = 1;
		if (element["@minOccurs"]) minOccurs = parseInt(element["@minOccurs"],10);
		if (element["@maxOccurs"]) maxOccurs = element["@maxOccurs"];
		if (maxOccurs == 'unbounded') maxOccurs = Number.MAX_SAFE_INTEGER;
		if (isAttribute) {
			if ((!element["@use"]) || (element["@use"] != 'required')) minOccurs = 0;
		}
		if (element["@isChoice"]) minOccurs = 0;

		var typeData = mapType(type);
		if (isAttribute && (typeData.type == 'object')) {
			typeData.type = 'string'; // handle case where attribute has no defined type
		}

		if (doc) {
			typeData.description = doc;
		}

		if (typeData.type == 'object') {
			typeData.properties = {};
			typeData.required = [];
			typeData.additionalProperties = false;
			newTarget = typeData;
		}

		// handle @ref / attributeGroups
		if ((key == "xs:attributeGroup") && (element["@ref"])) { // || (name == '$ref')) {
			if (!target.anyOf) target.anyOf = [];
			var newt = {};
			newt.properties = {};
			newt.required = clone(target.required);
			target.anyOf.push(newt);
			inAnyOf = target.anyOf.length-1;
			target.required = [];
			delete src[key];
			minOccurs = 0;
		}

		if ((parent["xs:annotation"]) && ((parent["xs:annotation"]["xs:documentation"]))) {
			target.description = parent["xs:annotation"]["xs:documentation"];
		}
		if ((element["xs:annotation"]) && ((element["xs:annotation"]["xs:documentation"]))) {
			target.description = (target.description ? target.decription + '\n' : '') + element["xs:annotation"]["xs:documentation"];
		}

		var enumSource;

		if (element["xs:simpleType"] && element["xs:simpleType"]["xs:restriction"] && element["xs:simpleType"]["xs:restriction"]["xs:enumeration"]) {
			var enumSource = element["xs:simpleType"]["xs:restriction"]["xs:enumeration"];
		}
		else if (element["xs:restriction"] && element["xs:restriction"]["xs:enumeration"]) {
			var enumSource = element["xs:restriction"]["xs:enumeration"];
		}

		if (enumSource) {
			typeData.description = '';
			typeData["enum"] = [];
			for (var i=0;i<enumSource.length;i++) {
				typeData["enum"].push(enumSource[i]["@value"]);
				if ((enumSource[i]["xs:annotation"]) && (enumSource[i]["xs:annotation"]["xs:documentation"])) {
					if (typeData.description) {
						typeData.description += '';
					}
					typeData.description += enumSource[i]["@value"]+': '+enumSource[i]["xs:annotation"]["xs:documentation"];
				}
			}
			if (!typeData.description) delete typeData.description;
			delete typeData.type; // assert it was a stringish type?
		}
		else {
			typeData = finaliseType(typeData);
		}

		if (maxOccurs > 1) {
			var newTD = {};
			newTD.type = 'array';
			if (minOccurs > 0) newTD.minItems = parseInt(minOccurs,10);
			if (maxOccurs < Number.MAX_SAFE_INTEGER) newTD.maxItems = parseInt(maxOccurs,10);
			newTD.items = typeData;
			typeData = newTD;
			// TODO add mode where if array minOccurs is 1, add oneOf allowing single object or array with object as item
		}
		if (minOccurs > 0) {
			mandate(target,inAnyOf,inAllOf,name);
		}

		if (simpleType) {
			if (simpleType["xs:minLength"]) typeData.minLength = parseInt(simpleType["xs:minLength"]["@value"],10);
			if (simpleType["xs:maxLength"]) typeData.maxLength = parseInt(simpleType["xs:maxLength"]["@value"],10);
			if (simpleType["xs:pattern"]) typeData.pattern = simpleType["xs:pattern"]["@value"];
			if ((simpleType["xs:annotation"]) && (simpleType["xs:annotation"]["xs:documentation"])) {
				typeData.description = simpleType["xs:annotation"]["xs:documentation"];
			}
		}

		if (inAllOf>=0) {
			target.allOf[inAllOf]["$ref"] = typeData["$ref"];
		}
		else if (inAnyOf>=0) {
			target.anyOf[inAnyOf]["$ref"] = typeData["$ref"];
		}
		else {
			target.properties[name] = typeData; // Object.assign 'corrupts' property ordering
		}

		target = newTarget;
	}
}

function moveAttributes(obj,parent,key) {
	if (key == 'xs:attribute') {

		obj[key] = toArray(obj[key]);

		var target;

		if (obj["xs:sequence"] && obj["xs:sequence"]["xs:element"]) {
			obj["xs:sequence"]["xs:element"] = toArray(obj["xs:sequence"]["xs:element"]);
			target = obj["xs:sequence"]["xs:element"];
		}
		if (obj["xs:choice"] && obj["xs:choice"]["xs:element"]) {
			obj["xs:choice"]["xs:element"] = toArray(obj["xs:choice"]["xs:element"]);
			target = obj["xs:choice"]["xs:element"];
		}

		if (target) target = toArray(target);

		for (var i=0;i<obj[key].length;i++) {
			var attr = clone(obj[key][i]);
			if (attributePrefix) {
				attr["@name"] = attributePrefix+attr["@name"];
			}
			if (typeof attr == 'object') {
				attr["@isAttr"] = true;
			}
			if (target) target.push(attr)
			else obj[key][i] = attr;
		}
		if (target) delete obj[key];
	}
}

function processChoice(obj,parent,key) {
	if (key == 'xs:choice') {
		var e = obj[key]["xs:element"] = toArray(obj[key]["xs:element"]);
		for (var i=0;i<e.length;i++) {
			if (!e[i]["@isAttr"]) {
				e[i]["@isChoice"] = true;
			}
		}
		if (obj[key]["xs:group"]) {
			var g = obj[key]["xs:group"] = toArray(obj[key]["xs:group"]);
			for (var i=0;i<g.length;i++) {
				if (!g[i]["@isAttr"]) {
					g[i]["@isChoice"] = true;
				}
			}
		}
	}
}

function renameObjects(obj,parent,key) {
	if (key == 'xs:complexType') {
		var name = obj["@name"];
		if (name) {
			rename(obj,key,name);
		}
		else debuglog('complexType with no name');
	}
}

function moveProperties(obj,parent,key) {
	if (key == 'xs:sequence') {
		if (obj[key].properties) {
			obj.properties = obj[key].properties;
			obj.required = obj[key].required;
			obj.additionalProperties = false;
			delete obj[key];
		}
	}
}

function clean(obj,parent,key) {
	if (key == '@name') delete obj[key];
	if (key == '@type') delete obj[key];
	if (obj.properties && (Object.keys(obj.properties).length == 1) && obj.properties["#text"] && obj.properties["#text"]["$ref"]) {
		obj.properties["$ref"] = obj.properties["#text"]["$ref"];
		delete obj.properties["#text"]; // anonymous types
	}
	if (obj.properties && obj.anyOf) { // mergeAnyOf
		var newI = {};
		if (obj.properties["$ref"]) {
			newI["$ref"] = obj.properties["$ref"];
		}
		else if (Object.keys(obj.properties).length > 0) {
			newI.properties = obj.properties;
			newI.required = obj.required;
		}
		if (Object.keys(newI).length > 0) {
			obj.anyOf.push(newI);
		}
		obj.properties = {}; // gets removed later
		obj.required = []; // ditto

		if (obj.anyOf.length==1) {
			if (obj.anyOf[0]["$ref"]) {
				obj["$ref"] = clone(obj.anyOf[0]["$ref"]);
				delete obj.type;
				delete obj.additionalProperties;
			}
			// possible missing else here for properties !== {}
			obj.anyOf = []; // also gets removed later
		}
	}
}

function removeEmpties(obj,parent,key) {
	var count = 0;
	if (isEmpty(obj[key])) {
		delete obj[key];
		if (key == 'properties') {
			if ((!obj.oneOf) && (!obj.anyOf)) {
				if (obj.type == 'object') obj.type = 'string';
				delete obj.additionalProperties;
			}
		}
		count++;
	}
	else {
		if (Array.isArray(obj[key])) {
			var newArray = [];
			for (var i=0;i<obj[key].length;i++) {
				if (typeof obj[key][i] !== 'undefined') {
					newArray.push(obj[key][i]);
				}
				else {
					count++;
				}
			}
			if (newArray.length == 0) {
				delete obj[key];
				count++;
			}
			else {
				obj[key] = newArray;
			}
		}
	}
	return count;
}

function recurse(obj,parent,callback,depthFirst) {

	var oTarget = target;

	if (typeof obj != 'string') {
		for (var key in obj) {
			target = oTarget;
			// skip loop if the property is from prototype
			if (!obj.hasOwnProperty(key)) continue;

			if (!depthFirst) callback(obj,parent,key);

			var array = Array.isArray(obj);

			if (typeof obj[key] === 'object') {
				if (array) {
					for (var i in obj[key]) {
						recurse(obj[key][i],obj[key],callback);
					}
				}
				recurse(obj[key],obj,callback);
			}

			if (depthFirst) callback(obj,parent,key);
		}
	}

	return obj;
}

module.exports = {
	getJsonSchema : function getJsonSchema(src,title,outputAttrPrefix,laxURIs) { // TODO convert to options parameter
		reset(outputAttrPrefix,laxURIs);

		recurse(src,{},function(src,parent,key) {
			moveAttributes(src,parent,key);
		});
		recurse(src,{},function(src,parent,key) {
			processChoice(src,parent,key);
		});

		var obj = {};

		var id = src["xs:schema"]["@targetNamespace"];
		if (!id) {
			id = src["xs:schema"]["@xmlns"];
		}

		for (var a in src["xs:schema"]) {
			if (a.startsWith('@xmlns:')) {
				if (src["xs:schema"][a] == id) {
					defaultNameSpace = a.replace('@xmlns:','');
				}
			}
		}

		//initial root object transformations
		obj.title = title;
		obj.$schema = 'http://json-schema.org/schema#'; //for latest, or 'http://json-schema.org/draft-04/schema#' for v4
		if (id) {
			obj.id = id;
		}
		if (src["xs:schema"]["xs:annotation"]) {
			obj.description = '';
			src["xs:schema"]["xs:annotation"] = toArray(src["xs:schema"]["xs:annotation"]);
			for (var a in src["xs:schema"]["xs:annotation"]) {
				var annotation = src["xs:schema"]["xs:annotation"][a];
				if ((annotation["xs:documentation"]) && (annotation["xs:documentation"]["#text"])) {
					obj.description += (obj.description ? '\n' : '') + annotation["xs:documentation"]["#text"];
				}
				else {
					if (annotation["xs:documentation"]) obj.description += (obj.description ? '\n' : '') + annotation["xs:documentation"];
				}
			}
		}

		var rootElement = src["xs:schema"]["xs:element"];
		if (Array.isArray(rootElement)) {
			rootElement = rootElement[0];
		}
		var rootElementName = rootElement["@name"];

		obj.type = 'object';
		obj.properties = clone(rootElement);

		obj.required = [];
		obj.required.push(rootElementName);
		obj.additionalProperties = false;

		recurse(obj,{},function(obj,parent,key) {
			renameObjects(obj,parent,key);
		});

		// support for schemas with just a top-level name and type (no complexType/sequence etc)
		if (obj.properties["@type"]) {
			target = obj; // tell it where to put the properties
		}
		else {
			delete obj.properties["@name"]; // to prevent root-element being picked up twice
		}

		// main processing of the root element
		recurse(obj,{},function(src,parent,key) { // was obj.properties
			doElement(src,parent,key);
		});

		recurse(obj,{},function(obj,parent,key) {
			moveProperties(obj,parent,key);
		});

		// remove rootElement to leave ref'd definitions
		if (Array.isArray(src["xs:schema"]["xs:element"])) {
			//src["xs:schema"]["xs:element"] = src["xs:schema"]["xs:element"].splice(0,1);
			delete src["xs:schema"]["xs:element"][0];
		}
		else {
			delete src["xs:schema"]["xs:element"];
		}

		obj.definitions = clone(src);
		obj.definitions.properties = {};
		target = obj.definitions;

		// main processing of the ref'd elements
		recurse(obj.definitions,{},function(src,parent,key) {
			doElement(src,parent,key);
		});

		// correct for /definitions/properties
		obj.definitions = obj.definitions.properties;

		recurse(obj,{},function(obj,parent,key) {
			clean(obj,parent,key);
		});

		delete(obj.definitions["xs:schema"]);

		var count = 1;
		while (count>0) { // loop until we haven't removed any empties
			count = 0;
			recurse(obj,{},function(obj,parent,key) {
				count += removeEmpties(obj,parent,key);
			});
		}

		return obj;
	}
};