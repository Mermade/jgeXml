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

function hoik(obj,target,key) {
	if (target && obj && obj[key]) {
		target[key] = clone(obj[key]);
		delete(obj[key]);
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
	if (key == 'xs:element') rename(obj,key,'object');
	if (key == '@elementFormDefault') delete(obj[key]);
	if (key == '@xmlns:xs') delete(obj[key]);

	if (key == 'xs:sequence') {
		rename(obj,key,'properties');
		hoik(obj,parent,'properties'); //leaves empty complexType to be cleaned up later
	}

	if ((key == '@minOccurs') && (obj[key] > 0)) mandate(obj,parent,key);
	//if (key.startsWith('xs:')) delete obj[key];
	if (key.startsWith('xs:')) rename(obj,key,key.replace('xs:','json:')); //temp
	if (key.startsWith('xmlns:')) rename(obj,key,key.replace('xmlns:','json:')); //temp
	if (key.startsWith('@xmlns:')) rename(obj,key,key.replace('@xmlns:','json:')); //temp
	//if (key.startsWith('@')) delete obj[key];
	if (key.startsWith('@')) rename(obj,key,key.replace('@','')); //temp
}

function postProcess(obj,parent,key) {
	if (key == 'json:required') {
		hoik(obj,parent,key); // as we put it one level too far down, in the properties
	}
	if (key.startsWith('json:')) rename(obj,key,key.replace('json:',''));
}

function isEmpty(obj) {
    for (var prop in obj) {
        if ((obj.hasOwnProperty(prop) && (typeof obj[prop] !== undefined))) {
			return false;
		}
    }
 	return true;
}

function removeEmpties(obj,parent,key) {
	if (isEmpty(obj[key])) {
		delete(obj[key]);
	}
}

function elements(obj,parent,key) {
	var element = obj[key];

	var name = '';
	var type = '';

	if ((element['@name']) && (element['@type'])) {
		name = element['@name'];
		type = element['@type'];
	}
	else if ((element['@name']) && (element['xs:simpleType'])) {
		name = element['@name'];
		type = element['xs:simpleType']['xs:restriction']['@base'];
	}

	if (name && type) {
		var occurs = 1;
		if (element['@minOccurs']) occurs = element['@minOccurs'];

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

		if (type == 'xs:integer') type = 'integer';
		if (type == 'xs:string') type = 'string';
		if (type == 'xs:date') type = 'string';
		if (type == 'xs:boolean') type = 'boolean';
		if (type == 'xs:anyURI') type = 'string';

		parent[name] = {};
		parent[name].type = type;

		if (occurs >= 1) {
			if (!parent['json:required']) {
				parent['json:required'] = [];
			}
			parent['json:required'].push(name);
		}

		// TODO process restrictions and enumerations

		delete(obj[key]);
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
			//else {
			//}
			recurse(obj[key],obj,callback);
		}
		callback(obj,parent,key);

	}
	return obj;
}

module.exports = {
	getJsonSchema : function getJsonSchema(src,title) {
		var obj = clone(src);

		//pre-process
		obj.title = title;
		obj.$schema = 'http://json-schema.org/schema#';

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
			removeEmpties(obj,parent,key); // second pass to clean up anything emptied by first pass
		});

		recurse(obj,{},function(obj,parent,key) {
			postProcess(obj,parent,key);
		});

		return obj;
	}
};