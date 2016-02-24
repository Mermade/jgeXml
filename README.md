# jgeXml
The Just-Good-Enough XML Parser

jgeXml provides routines to parse XML (both pull and push modes are supported), to write XML and to convert XML to JSON.

The code has no dependencies on other modules or native libraries.

## Events (stateCodes)

```
sDeclaration
sElement
sAttribute
sValue
sEndElement
sContent
sComment
sProcessingInstruction
sEndDocument
```

No event is generated for ignoreable whitespace.

## Notes

Both when reading and writing, attributes follow the element event, as per the ordering in the source XML.

The attributePrefix (to avoid name clashes with child elements) is configurable per parse.

Child elements can be represented as properties or objects.

## Limitations

jgeXml is currently schema/DTD agnostic. It can parse XML documents with schema information, but it is up to the
consumer to interpret the namespace portions of element names.

It can parse and transform XSD files as XML, conversion to JSON schema is planned.

The parser currently does not support CDATA segments, though the xmlWrite module does.

The parser treats all content as strings when converting to JSON, i.e. data is not coerced
to primitive numbers or null values.

The parser is string-based, to process streams, read the data into a string first.

## Examples

See testx2x for parsing XML to XML, testx2j for parsing XML to JSON, pullparser and pushparser for how to set up and run the parser.