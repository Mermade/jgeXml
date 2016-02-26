'use strict';

var fs = require('fs');
var j2x = require('./json2xml');

var filename = process.argv[2];

var json = fs.readFileSync(filename,'utf8');
console.log(json);

var obj = {};
try {
	obj = JSON.parse(json);
}
catch (err) {
	console.error('That is not valid JSON');
	console.error(err);
	process.exit(1);
}

var xml = j2x.getXml(obj,'@','',2);
console.log();
console.log(xml);
console.log();
console.log(true);
