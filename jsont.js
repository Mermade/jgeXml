'use strict';

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

function fetchFromObject(obj, prop){
    //property not found
    if (typeof obj === 'undefined') return false;

    //index of next property split
    var i = prop.indexOf('.')

    //property split found; recursive call
    if (i >= 0){
        //get object at property (before split), pass on remainder
        return fetchFromObject(obj[prop.substring(0, i)], prop.substr(i+1));
    }
	//no split; get property
    return obj[prop];
}

function transform(obj,rules) {
	var objName = '$';

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
		var elements = inner.split(/[\{\}]+/);
		for (var i=1;i<elements.length;i=i+2) {
			var oei = elements[i];
			elements[i] = elements[i].replaceAll('$',objName);
			if (oei != '$') {
				elements[i] = fetchFromObject(obj,elements[i]);
			}
		}
		obj[objName] = elements.join('');
		arrRules[r].processed = true;
	}
	return obj[objName];
}

module.exports = {
	transform : transform
};