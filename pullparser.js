'use strict';

var fs = require('fs');
var jgeXml = require('./jgeXml.js');

var filename = process.argv[2];

var xml = fs.readFileSync(filename,'utf8');
console.log(xml);
console.log();

var context = {};
var depth = 0;

while (!context.state || context.state != jgeXml.sEndDocument) {
	context = jgeXml.parse(xml,null,context);
	if (context.state == jgeXml.sElement) {
		depth++;
	}
	else if (context.state == jgeXml.sEndElement) {
		depth--;
	}
	console.log(jgeXml.getStateName(context.state)+' '+context.position+' '+depth+' '+context.token);
	if (depth != 0) process.exitCode = 1;
}