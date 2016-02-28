'use strict';

var xw = require('./xmlWrite');

xw.startFragment(2);
xw.startElement('foo');
xw.startElement('bar');
xw.content('baz');
xw.endElement('bar');
xw.endElement('foo');

console.log(xw.endFragment());