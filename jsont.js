'use strict';

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

function fetchFromObjectPath(obj, prop){
    //property not found
    if (typeof obj === 'undefined') return false;

    //index of next property split
    var i = prop.indexOf('.')

    //property split found; recursive call
    if (i >= 0){
        //get object at property (before split), pass on remainder
        return fetchFromObjectPath(obj[prop.substring(0, i)], prop.substr(i+1));
    }
	//no split; get property
    return obj[prop];
}

function fetchFromObject(obj,prop) {
	//this outer routine adds support for array element indexing
	var index = -1;
	if (prop.endsWith(']')) {
		index = 0;
		var a = prop.split('[');
		prop = a[0];
		a[1] = a[1].replace(']','');
		index = parseInt(a[1],10);
	}
	var result;
	if (prop == '') {
		result = obj;
	}
	else {
		result = fetchFromObjectPath(obj,prop);
	}
	if (index>=0) {
		result = result[index];
	}
	return result;
}

function transform(obj,rules) {
	var objName = '$';
	var isArray = false;

	for (var n in obj) {
		objName = n;
		continue;
	}

	var arrRules = [];

	for (var r in rules) {
		var rule = {};
		rule.rule = rules[r];
		rule.ruleName = r;
		rule.processed = false;
		arrRules.push(rule);
	}

	for (var r=arrRules.length-1;r>=0;r--) {
		var inner = arrRules[r].rule;

		if (arrRules[r].ruleName.indexOf('[*]') > 0) {
			isArray = true;
		}

		for (var o in obj) {
			var newObjName = objName;
			if (isArray) {
				newObjName = o;
			}
			var elements = inner.split(/[\{\}]+/);
			for (var i=1;i<elements.length;i=i+2) {
				elements[i] = elements[i].replaceAll('$',arrRules[r].ruleName);
				elements[i] = elements[i].replaceAll('[*]','['+o+']'); //specify the current index
				elements[i] = elements[i].replaceAll('self','');
				elements[i] = fetchFromObject(obj,elements[i]);
			}
			obj[newObjName] = elements.join('');
			if (!isArray) continue;
		}
		arrRules[r].processed = true;
	}
	if (Array.isArray(obj)) return obj[0]
	else return obj;
}

module.exports = {
	transform : transform
};