'use strict';

function traverse(obj,prefix,depth) {
	
var result = [];
	
	for (var key in obj){
		// skip loop if the property is from prototype
		if (!obj.hasOwnProperty(key)) continue;

		var display = key;
		var sep = '/';
		if (Array.isArray(obj)) {
			display = '['+key+']';
			sep = '';
		}
		
		if (typeof obj[key] !== 'object'){
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

module.exports = {
	build : function(obj) {
		return traverse(obj,'',0);
	}
}