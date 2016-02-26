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
	
	for (var ruleName in rules) {
		var text = '';
		var inner = fetchFromObject(rules,ruleName);
		var elements = inner.split(/[\{\}]+/);
		for (var i=1;i<elements.length;i=i+2) {
			var oei = elements[i];
			//console.log(ruleName+' '+objName);
			console.log(obj);
			elements[i] = elements[i].replaceAll('$',objName);
			//console.log(elements.join(''));
			if (oei != '$') {
				elements[i] = fetchFromObject(obj,elements[i]);
			}
		}
		obj[objName] = elements.join('');
		console.log(obj[objName]);
	}
	return obj[objName];
}

module.exports = {
	transform : transform
};