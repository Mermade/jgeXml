'use strict';

var fs = require('fs');
var x2j = require('./xml2json');
var jpath = require('./jpath');

var filename = process.argv[2];
var valueProperty = false;
if (process.argv.length>3) {
	valueProperty = true;
}

var xml = fs.readFileSync(filename,'utf8');

try {
	var obj = x2j.xml2json(xml,{"attributePrefix": "@","valueProperty": valueProperty, "coerceTypes": false});
}
catch (err) {
	console.error('That is not valid JSON');
	console.error(err);
	console.log(xml);
	console.log();
	console.log(x2j.getString());
	process.exit(1);
}

var result = jpath.build(obj);
// we could do a select('*') here but it's redundant unless we want the bracketed form
for (var i in result) {
	// log our jpath for every item
	console.log(result[i].depth+' '+jpath.path(result[i],false)+' = '+result[i].value);
}
console.log();

var first = jpath.path(result[1]);
var matches = jpath.select(result,first);
for (var m in matches) {
	console.log('First; select('+jpath.path(matches[m])+') = '+matches[m].value);
}

var last = result[result.length-1];
console.log('Last; select('+jpath.path(last,true)+',true) = '+last.value);
console.log(last.parent)

var parents = jpath.select(result,last.parent);
if (parents.length>0) {
	var value = parents[0].value;
	if (typeof(value) === 'object') {
		value = JSON.stringify(value,null,2);
	}
	console.log('select('+jpath.path(parents[0],true)+',true) = '+value);
}
