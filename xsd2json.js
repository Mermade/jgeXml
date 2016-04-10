'use strict';

/*{}
*/

/*{
	"title": "Example Schema",
	"type": "object",
	"properties": {
		"firstName": {
			"type": "string"
		},
		"lastName": {
			"type": "string"
		},
		"age": {
			"description": "Age in years",
			"type": "integer",
			"minimum": 0
		}
	},
	"required": ["firstName", "lastName"]
}
 */

function reset() {
}

function clone(obj) {
	 return JSON.parse(JSON.stringify(obj));
}

function hoik(obj,target,key,newKey) {
	if (target && obj && obj[key]) {
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

function mandate(obj,parent,key) {
	if (!parent.required) parent.required = [];
	parent.required.push(obj[key]);
}

function clean(obj,parent,key) {
	if (key == 'xs:element') rename(obj,key,'properties');
	if (key == '@elementFormDefault') delete obj[key];
	if (key == '@targetNamespace') delete obj[key];
	if (key == '@attributeFormDefault') delete obj[key];
	if (key == '@xmlns:xs') delete obj[key];
	if (key == '@xmlns') delete obj[key];

	if (key == 'xs:sequence') {
		rename(obj,key,'properties');
		hoik(obj,parent,'properties'); //leaves empty complexType etc to be cleaned up later
	}

	if (key == '@minOccurs') {
		if (obj[key] > 0) mandate(obj,parent,key);
		delete obj[key];
	}
	if (key == '@maxOccurs') {
		delete obj[key];
	}
	//if (key.startsWith('xs:')) delete obj[key];
	if (key.startsWith('xs:')) rename(obj,key,key.replace('xs:','json:')); //temp
	if (key.startsWith('xmlns:')) rename(obj,key,key.replace('xmlns:','json:')); //temp
	if (key.startsWith('@xmlns:')) rename(obj,key,key.replace('@xmlns:','json:')); //temp
	//if (key.startsWith('@')) delete obj[key];
	if (key.startsWith('@')) rename(obj,key,key.replace('@','')); //temp
}

function postProcess(obj,parent,key) {
	if ((key == 'properties') && (typeof obj[key] === 'object')) {
		obj["additionalProperties"] = false;
	}
	//if (key == 'json:additionalProperties') {
	//	hoik(obj,parent,key,'additionalProperties'); // as we put it one level too far down, in the properties
	//}
	if (key == 'json:required') {
		hoik(obj,parent,key,'required'); // as we put it one level too far down, in the properties
	}
	if (key == 'ref') {
		obj[key] = '#/definitions/'+obj[key];
		rename(obj,key,'$ref');
	}

	if (key.startsWith('json:')) rename(obj,key,key.replace('json:',''));
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

function removeEmpties(obj,parent,key) {
	if (isEmpty(obj[key])) {
		delete obj[key];
	}
	else {
		if (Array.isArray(obj[key])) {
			var newArray = [];
			for (var i=0;i<obj[key].length;i++) {
				if (typeof obj[key][i] !== 'undefined') {
					newArray.push(obj[key][i]);
				}
			}
			if (newArray.length == 0) {
				delete obj[key];
			}
			else {
				obj[key] = newArray;
			}
		}
	}
}

function elements(obj,parent,key) {
	var element = obj[key];

	var name = '';
	var type = '';
	var isAttribute = (key == 'xs:attribute');

	if ((element['@name']) && (element['@type'])) {
		name = element['@name'];
		type = element['@type'];
	}
	else if ((element['@name']) && (element['xs:simpleType'])) {
		name = element['@name'];
		type = element['xs:simpleType']['xs:restriction']['@base'];
	}

	if (name && type) {
		var orgName = name;
		var occurs = 1;
		if (element['@minOccurs']) occurs = element['@minOccurs'];
		if (isAttribute) {
			name = '@' + name;
			orgName = name;
			name = '@' + name;
			if ((!element['@use']) || (element['@use'] != 'required')) occurs = 0;
		}

/*
		JSON Schema defines seven primitive types for JSON values:

array   A JSON array.
boolean A JSON boolean.
integer A JSON number without a fraction or exponent part.
number  Any JSON number. Number includes integer.
null    The JSON null value.
object  A JSON object.
string  A JSON string.
		*/
		parent[name] = {};

		if (type == 'xs:integer') type = 'integer';
		if (type == 'xs:string') type = 'string';
		if (type == 'xs:boolean') type = 'boolean';
		if (type == 'xs:date') {
			type = 'string';
			parent[name].pattern = '^[1-9][0-9]{3}-[0-1][0-9]-[0-3][0-9].*';
		}
		if (type == 'xs:positiveInteger') {
			type = 'integer';
			parent[name]["json:minimum"] = 0;
		}
		if (type == 'xs:decimal') type = 'number';
		if (type == 'xs:anyURI') {
			type = 'string';
			parent[name].pattern = '@[a-z]*://(-\.)?([^\s/?\.#-]+\.?)+(/[^\s]*)?$@i';
		}

		if (element['xs:simpleType'] && element['xs:simpleType']['xs:restriction'] && element['xs:simpleType']['xs:restriction']['xs:enumeration']) {
			var source = element['xs:simpleType']['xs:restriction']['xs:enumeration'];
			parent[name]["enum"] = [];
			for (var i=0;i<source.length;i++) {
				parent[name]["enum"].push(source[i]);
			}
		}
		else {
			parent[name].type = type;
		}

		if (occurs >= 1) {
			if (!parent['json:required']) {
				parent['json:required'] = [];
			}
			parent['json:required'].push(orgName);
			//mandate(obj,parent,name);
		}

		// TODO process arrays, restrictions and enumerations

		delete obj[key];
	}
}

function recurse(obj,parent,callback) {
	for (var key in obj) {
		// skip loop if the property is from prototype
		if (!obj.hasOwnProperty(key)) continue;

		var array = Array.isArray(obj);

		if (typeof obj[key] !== 'object') {
			// simple types
		}
		else {
			if (array) {
				for (var i in obj[key]) {
					recurse(obj[key][i],obj[key],callback);
				}
			}
			recurse(obj[key],obj,callback);
		}
		callback(obj,parent,key);

	}
	return obj;
}

function extractDefinitions(obj,parent,top) {
	if (Array.isArray(obj.properties)) {
		var start = 0;
		if (isEmpty(parent)) start = 1;
		if (!top.definitions) top.definitions = {};
		console.log(start);
		for (var i=start;i<obj.properties.length;i++) {
			var o = obj.properties[i];
			if (o) {
				top.definitions[o.name] = {};
				top.definitions[o.name].type = 'object';
				top.definitions[o.name].properties = o.properties;
				if (o.required) {
					top.definitions[o.name].required = o.required;
				}
				parent.properties[o.name] = {};
				parent.properties[o.name]['$ref'] = '#/definitions/'+o.name;
			}
		}
		if (start > 0) {
			obj.properties = obj.properties[0];
		}
		else {
			delete obj.properties;
		}
	}
}

module.exports = {
	getJsonSchema : function getJsonSchema(src,title) {
		var obj = clone(src);
		
		var id = src["xs:schema"]["@targetNamespace"];
		if (!id) {
			id = src["xs:schema"]["@xmlns"];
		}

		//pre-process
		obj.title = title;
		obj.$schema = 'http://json-schema.org/schema#'; //for latest, or 'http://json-schema.org/draft-04/schema#' for v4
		if (id) {
			obj.id = id;
		}
		obj.type = 'object';
		
		var rootElementName = obj["xs:schema"]["xs:element"]["@name"];
		delete obj["xs:schema"]["xs:element"]["@name"]; // as it doesn't have a type it gets left hanging around
		obj.dummy = {};
		obj.dummy["json:required"] = [];
		obj.dummy["json:required"].push(rootElementName);
		obj.properties = {};
		hoik(obj["xs:schema"],obj.properties,'xs:element',rootElementName)

		recurse(obj,{},function(obj,parent,key) {
			elements(obj,parent,key);
		});

		recurse(obj,{},function(obj,parent,key) {
			clean(obj,parent,key);
		});

		hoik(obj['json:schema'],obj,'object');

		recurse(obj,{},function(obj,parent,key) {
			removeEmpties(obj,parent,key); // first pass
		});
		recurse(obj,{},function(obj,parent,key) {
			postProcess(obj,parent,key);
		});
		recurse(obj,{},function(obj,parent,key) {
			removeEmpties(obj,parent,key); // second pass to clean up anything emptied by first pass
		});

		recurse(obj,{},function(sub,parent,key) {
			extractDefinitions(sub,parent,obj);
		});

		obj.additionalProperties = false;
		return obj;
	}
};