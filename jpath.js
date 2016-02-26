'use strict';

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

function traverse(obj,prefix,depth,parent) {

var result = [];

	for (var key in obj) {
		// skip loop if the property is from prototype
		if (!obj.hasOwnProperty(key)) continue;

		var display = key;
		var sep = '.';
		if (Array.isArray(obj)) {
			display = '['+key+']';
			sep = '';
		}

		var item = {};
		item.prefix = prefix;
		item.key = key;
		item.display = display;
		item.value = obj[key];
		item.depth = depth;
		item.parent = parent;
		result.push(item);
		if (typeof obj[key] === 'object') {
			result = result.concat(traverse(obj[key],prefix+sep+display,depth+1,obj));
		}
	}
	return result;
}

function path(item,bracketed) {
	if (bracketed) {
		var result = '';
		var parents = item.prefix.split('.');
		for (var p=0;p<parents.length;p++) {
			result += "['" + parents[p] + "']";
		}
		if (item.display.charAt(0) == '[') {
			result += item.display;
		}
		else {
			result += '[' + item.display + ']';
		}
		return result;
	}
	else {
		var sep = '.';
		if ((typeof(item.value) === 'object') && (Array.isArray(item.parent)) && (item.prefix != '$')) {
			sep = '';
		}
		if (item.display.charAt(0) == '[') {
			sep = '';
		}
		return item.prefix+sep+item.display;
	}
}

function selectRegex(tree,expr,bracketed) {
	// not currently working, we are going to need some serious escaping of the regex
	if (expr == '') {
		expr = '*';
	}
	var result = [];
	for (var i=0;i<tree.length;i++) {
		var p = path(tree[i],bracketed);
		if (p.match(expr)) {
			result.push(tree[i]);
		}
	}
	return result;
}

function select(tree,target,bracketed) {
	var result = [];
	var returnParent = false;
	var checkEnd = false;

	// ^
	if (target.endsWith('^')) { // unoffical JSONPath extension
		target = target.substring(0,target.length-1);
		returnParent = true;
	}
	// .*
	if (target.endsWith('.*') && (target != '$..*')) {
		target = target.substring(0,target.length-2);
	}
	// [*]
	target = target.replaceAll('[*]','[]');
	// ..
	if ((target.indexOf('..') > 0) && (target != '$..*')) {
		var x = target.split('..');
		target = x[x.length-1];
		//target = target.replaceAll('..','.');
		target = target.replaceAll('$','');
		checkEnd = true;
	}

	for (var i=0;i<tree.length;i++) {
		var p = path(tree[i],bracketed);
		if ((target == '*') || (target == '$..*') || (p == target) || ((p.endsWith(target) && checkEnd))) {
			if (returnParent) {
				result.push(tree[i].parent);
			}
			else {
				result.push(tree[i]);
			}
		}
	}
	return result;
}

module.exports = {
	build : function(obj) {
		return traverse(obj,'$',0,{});
	},
	select : select,
	selectRegex : selectRegex,
	path : path
};