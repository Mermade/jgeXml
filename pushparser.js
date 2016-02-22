'use strict';

var fs = require('fs');
var jgeXml = require('./jgeXml.js');

var filename = process.argv[2];

var xml = fs.readFileSync(filename,'utf8');
console.log(xml);
console.log();

var prefixLen = 0;

jgeXml.parse(xml,function(state,token){
	if (state == jgeXml.sElement) {
		prefixLen += 2;
	}
	else if (state == jgeXml.sEndElement) {
		prefixLen -= 2;
	}
	console.log(jgeXml.getStateName(state)+' '+prefixLen+' '+token);
});