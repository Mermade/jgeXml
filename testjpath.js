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
	//var result = jpath.traverse(obj,'',0);
	var result = jpath.build(obj);
	for (var i in result) {
		// log our jpath for each item
		console.log(result[i].depth+' '+result[i].parent+'.'+result[i].display+' = '+result[i].value);
	}
}
catch (err) {
	console.error('That is not valid JSON');
	console.error(err);
	console.log(xml);
	console.log();
	console.log(x2j.getString());
	process.exitCode = 1;
}