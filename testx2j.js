'use strict';

var fs = require('fs');
var x2j = require('./xml2json');

var filename = process.argv[2];

var xml = fs.readFileSync(filename,'utf8');
console.log(xml);

try {
	var obj = x2j.xml2json(xml,'@');
	console.log();
	console.log(JSON.stringify(obj,null,2));
}
catch (err) {
	console.error('That is not valid JSON');
	console.error(err);
	console.log(x2j.getString());
}