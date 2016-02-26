'use strict';

var jsont = require('./jsont');

function run(obj,rules) {
	console.log();
	console.log(obj);
	console.log('+');
	console.log(rules);
	console.log('=');
	console.log(jsont.transform(obj,rules));	
}

var obj = { "link": {"uri":"http://company.com", "title":"company homepage" }};
var rules = { "link": "<a href=\"{link.uri}\">{link.title}: {$}</a>" };
run(obj,rules);
