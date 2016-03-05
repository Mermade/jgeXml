'use strict';

var fs = require('fs');
var jgeXml = require('./jgeXml.js');

var filename = process.argv[2];

var xml = fs.readFileSync(filename,'utf8');
console.log(xml);
console.log();

var depth = 0;

var result = jgeXml.parse(xml,function(state,token){
	if (state == jgeXml.sElement) {
		depth++;
	}
	else if (state == jgeXml.sEndElement) {
		depth--;
	}
	console.log(jgeXml.getStateName(state)+' '+depth+' "'+token+'"');
});
console.log(result);
if (!result) process.exitCode = 1;
