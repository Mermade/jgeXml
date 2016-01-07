var fs = require('fs');
var stax = require('./stax.js');

var filename = process.argv[2];

var xml = fs.readFileSync(filename,'utf8');

var s = '';
var hanging = '';

stax.parse(xml,function(state,token){
		
	if (state == stax.sDeclaration) {
		s += token;
	}
	else if (state == stax.sContent) {
		s += hanging;
		s += token;
		hanging = '';
	}
	else if (state == stax.sEndElement) {
		s += '</'+token+'>';
	}
	else if (state == stax.sAttribute) {
		s += ' ' + token + '=';
	}
	else if (state == stax.sValue) {
		s += '"' + token + '"';
	}
	else if (state == stax.sElement) {
		s += hanging;
		s += '<' + token;
		hanging = '>';
	}
	if (token == '') {
		console.log(state);
	}
});

console.log(s);

var obj = {};
//try {
//	obj = JSON.parse(s);
//	console.log();
//	console.log(JSON.stringify(obj,null,2));
//}
//catch (err) {
//	console.log('That is not valid JSON');
//}