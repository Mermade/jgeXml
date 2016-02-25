'use strict';

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
		
		var item = {}
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
		return traverse(obj,'$',0,{});
	},
	select : select,
	selectRegex : selectRegex,
	path : path
}