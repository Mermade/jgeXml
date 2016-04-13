'use strict';

var target; // for new properties
var attributePrefix = '@';

function reset(attrPrefix) {
	target = null;
	attributePrefix = attrPrefix;
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

function mandate(target,name) {
	if (!target.required) target.required = [];
	if (target.required.indexOf(name) < 0) {
		target.required.push(name);
	}
}

function mapType(type) {

	var result = {};

	if (type == 'xs:integer') type = 'integer';
	if (type == 'xs:positiveInteger') {
		type = 'integer';
		result.minimum = 1;
	}
	if (type == 'xs:nonPositiveInteger') {
		type = 'integer';
		result.maximum = 0;
	}
	if (type == 'xs:negativeInteger') {
		type = 'integer';
		result.maximum = -1;
	}
	if (type == 'xs:nonNegativeInteger') {
		type = 'integer';
		result.minimum = 0;
	}
	if (type == 'xs:byte') type = 'integer';
	if (type == 'xs:int') type = 'integer';
	if (type == 'xs:long') type = 'integer';
	if (type == 'xs:short') type = 'integer';
	if (type == 'xs:unsignedLong') type = 'integer';
	if (type == 'xs:unsignedInt') type = 'integer';
	if (type == 'xs:unsignedShort') type = 'integer';
	if (type == 'xs:unsignedByte') type = 'integer';

	if (type == 'xs:string') type = 'string';
	if (type == 'xs:NMTOKEN') type = 'string';
	if (type == 'xs:NMTOKENS') type = 'string';
	if (type == 'xs:ENTITY') type = 'string';
	if (type == 'xs:ENTITIES') type = 'string';
	if (type == 'xs:ID') type = 'string';
	if (type == 'xs:IDREF') type = 'string';
	if (type == 'xs:IDREFS') type = 'string';
	if (type == 'xs:token') type = 'string';
	if (type == 'xs:lamguage') type = 'string';
	if (type == 'xs:Name') type = 'string';
	if (type == 'xs:NCName') type = 'string';
	if (type == 'xs:QName') type = 'string';
	if (type == 'xs:normalizedString') type = 'string';
	if (type == 'xs:base64Binary') type = 'string';
	if (type == 'xs:hexBinary') type = 'string';
	if (type == 'xs:NOTATION') type = 'string';

	if (type == 'xs:boolean') type = 'boolean';

	if (type == 'xs:date') {
		type = 'string';
		result.pattern = '^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$';
	}
	if (type == 'xs:dateTime') {
		type = 'string';
		result.format = 'date-time';
	}
	if (type == 'xs:time') {
		type = 'string';
		//result.pattern = '';
	}
	if (type == 'xs:duration') {
		type = 'string';
		//result.pattern = '';
	}
	if (type == 'xs:gDay') {
		type = 'string';
		//result.pattern = '';
	}
	if (type == 'xs:gMonth') {
		type = 'string';
		//result.pattern = '';
	}
	if (type == 'xs:gMonthDay') {
		type = 'string';
		//result.pattern = '';
	}
	if (type == 'xs:gYear') {
		type = 'string';
		//result.pattern = '';
	}
	if (type == 'xs:gYearMonth') {
		type = 'string';
		//result.pattern = '';
	}

	if (type == 'xs:decimal') type = 'number';
	if (type == 'xs:double') type = 'number';
	if (type == 'xs:float') type = 'number';

	if (type == 'xs:anyURI') {
		type = 'string';
		//result.format = 'uri'; //XSD allows relative URIs, it seems JSON schema uri format may not?
		result.pattern = '^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?';
	}

	result.type = type;
	return result;
}

function doElement(src,parent,key) {
	var type = 'object';
	var name;

	var simpleType;

	var element = src[key];
	if ((typeof element == 'undefined') || (null === element)) {
		console.log('bailing out '+key+' = '+src[key]);
		return false;
	}
	if (key == 'xs:choice') console.log(JSON.stringify(src[key],null,2));

	if (element["@name"]) {
		name = element["@name"];
	}
	if (element["@type"]) {
		type = element["@type"];
	}
	else if ((element["@name"]) && (element["xs:simpleType"])) {
		type = element["xs:simpleType"]["xs:restriction"]["@base"];
		simpleType = element["xs:simpleType"]["xs:restriction"];
	}
	else if (element["@ref"]) {
		name = element["@ref"];
		type = element["@ref"];
	}

	if (name && type) {
		//console.log(name+' '+type);

		var isAttribute = (element["@isAttr"] == true);

		if (!target) target = parent;
		if (!target.properties) target.properties = {};
		var newTarget = target;

		var minOccurs = 1;
		var maxOccurs = 1;
		if (element["@minOccurs"]) minOccurs = parseInt(element["@minOccurs"],10);
		if (element["@maxOccurs"]) maxOccurs = element["@maxOccurs"];
		if (maxOccurs == 'unbounded') maxOccurs = 2;
		if (isAttribute) {
			if ((!element["@use"]) || (element["@use"] != 'required')) minOccurs = 0;
		}
		if (element["@isChoice"]) minOccurs = 0;

		var typeData = mapType(type);
		if (typeData.type == 'object') {
			typeData.properties = {};
			newTarget = typeData;
		}

		var enumSource;

		if (element["xs:simpleType"] && element["xs:simpleType"]["xs:restriction"] && element["xs:simpleType"]["xs:restriction"]["xs:enumeration"]) {
			var enumSource = element["xs:simpleType"]["xs:restriction"]["xs:enumeration"];
		}
		else if (element["xs:restriction"] && element["xs:restriction"]["xs:enumeration"]) {
			var enumSource = element["xs:restriction"]["xs:enumeration"];
		}

		if (enumSource) {
			typeData["enum"] = [];
			for (var i=0;i<enumSource.length;i++) {
				typeData["enum"].push(enumSource[i]["@value"]);
			}
			delete typeData.type; // assert it was a stringish type?
		}
		else {
			if ((typeData.type == 'string') || (typeData.type == 'boolean') || (typeData.type == 'array') || (typeData.type == 'object')
				|| (typeData.type == 'integer') || (typeData.type == 'number') || (typeData.type == 'null')) {
				//typeData.type = typeData.type;
			}
			else {
				typeData["$ref"] = '#/definitions/'+typeData.type;
				delete typeData.type;
			}
		}

		if (maxOccurs > 1) {
			var newTD = {};
			newTD.type = 'array';
			newTD.items = typeData;
			typeData = newTD;
		}
		if (minOccurs > 0) {
			mandate(target,name);
		}

		if (simpleType) {
			if (simpleType["xs:minLength"]) typeData.minLength = parseInt(simpleType["xs:minLength"]["@value"],10);
			if (simpleType["xs:maxLength"]) typeData.maxLength = parseInt(simpleType["xs:maxLength"]["@value"],10);
		}

		if (isAttribute) {
			var newProp = {};
			newProp[name] = typeData;
			target.properties = Object.assign(newProp,target.properties); // force attributes to top
		}
		else {
			target.properties[name] = typeData;
		}
		target.additionalProperties = false;

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
			//console.log('Rename '+key+' to '+name);
			rename(obj,key,name);
			//delete obj["@name"];
		}
		else console.log('no name');
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
}

function removeEmpties(obj,parent,key) {
	var count = 0;
	if (isEmpty(obj[key])) {
		delete obj[key];
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
	getJsonSchema : function getJsonSchema(src,title,attrPrefix) {
		reset(attrPrefix);

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

		//initial root object transformations
		obj.title = title;
		obj.$schema = 'http://json-schema.org/schema#'; //for latest, or 'http://json-schema.org/draft-04/schema#' for v4
		if (id) {
			obj.id = id;
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

		//recurse(obj.properties,{},function(src,parent,key) {
		//	moveAttributes(src,parent,key);
		//});
		recurse(obj,{},function(obj,parent,key) {
			renameObjects(obj,parent,key);
		});

		recurse(obj.properties,{},function(src,parent,key) {
			doElement(src,parent,key);
		});

		recurse(obj,{},function(obj,parent,key) {
			moveProperties(obj,parent,key);
		});

		// remove rootElement to leave ref'd definitions
		if (Array.isArray(src["xs:schema"]["xs:element"])) {
			delete src["xs:schema"]["xs:element"][0];
		}
		else {
			delete src["xs:schema"]["xs:element"];
		}

		obj.definitions = clone(src);
		obj.definitions.properties = {};
		target = obj.definitions;

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