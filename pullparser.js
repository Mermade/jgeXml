'use strict';

var fs = require('fs');
var stax = require('./stax.js');

var filename = process.argv[2];

var xml = fs.readFileSync(filename,'utf8');
console.log(xml);
console.log();

var context = {};
var prefixLen = 0;

while (!context.state || context.state != stax.sEndDocument) {
	context = stax.parse(xml,null,context);
	if (context.token != '') {
		if (context.state == stax.sElement) {
			prefixLen += 2;
		}
		else if (context.state == stax.sEndElement) {
			prefixLen -= 2;
		}
		console.log(context.state+' '+context.position+' '+prefixLen+' '+context.token);
	}
}