'use strict';

var fs = require('fs');
var stax = require('./stax.js');

var filename = process.argv[2];

var xml = fs.readFileSync(filename,'utf8');
console.log(xml);
console.log();

var prefixLen = 0;

stax.parse(xml,function(state,token){
	if (state == stax.sElement) {
		prefixLen += 2;
	}
	else if (state == stax.sEndElement) {
		prefixLen -= 2;
	}
	console.log(stax.getStateName(state)+' '+prefixLen+' '+token);
});