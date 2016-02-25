'use strict';

function traverse(obj,prefix,depth) {
	
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
		
		if (typeof obj[key] !== 'object') {
			var item = {}
			item.parent = prefix;
			item.key = key;
			item.display = display;
			item.value = obj[key];
			item.depth = depth;
			result.push(item);
		}
		else {
			result = result.concat(traverse(obj[key],prefix+sep+display,depth+1));
		}
	}
	return result;
}

function path(item,bracketed) {
	if (bracketed) {
		var parents = item.parent.split('.');
		var result = '';
		for (var p=0;p<parents.length;p++) {
			result += '[' + parents[p] + '].';
		}
		result += '[' + item.display + ']';
		return result;
	}
	else {
		return item.parent+'.'+item.display;
	}		
}

function selectRegex(tree,expr,bracketed) {
	if (expr == '') {
		expr = '*';
	}
	expr = '/' + expr + '/';
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
	for (var i=0;i<tree.length;i++) {
		var p = path(tree[i],bracketed);
		if ((target == '*') || (p == target)) {
			result.push(tree[i]);
		}
	}
	return result;
}

module.exports = {
	build : function(obj) {
		return traverse(obj,'$',0);
	},
	select : select,
	selectRegex : selectRegex,
	path : path
}