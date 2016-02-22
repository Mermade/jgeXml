'use strict';

var fs = require('fs');
var jgeXml = require('./jgeXml.js');

var filename = process.argv[2];

var xml = fs.readFileSync(filename,'utf8');
console.log(xml);
console.log();

var context = {};
var prefixLen = 0;

while (!context.state || context.state != jgeXml.sEndDocument) {
	context = jgeXml.parse(xml,null,context);
	if (context.token != '') {
		if (context.state == jgeXml.sElement) {
			prefixLen += 2;
		}
		else if (context.state == jgeXml.sEndElement) {
			prefixLen -= 2;
		}
		console.log(jgeXml.getStateName(context.state)+' '+context.position+' '+prefixLen+' '+context.token);
	}
}