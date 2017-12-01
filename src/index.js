fs = require('fs');
const $RefParser = require('json-schema-ref-parser');
const parser = new $RefParser();

function main (schema, options) {
    parser.dereference(isSchema(schema), { dereference: { circular: "ignore" }}, deRefStage1);
}

function deRefStage1(err, schemaJSON) {
    if (err) {
        throw new Error('Error parsing schema file at stage 1', err);
    }

    entangleCircularRefs(JSON.stringify(schemaJSON));

    //console.log(JSON.stringify(schemaJSON));
}

function isSchema(schema) {
    return typeof schema === 'string' ? JSON.parse(fs.readFileSync(schema, 'utf8')) : schema;
}

function entangleCircularRefs(schemaStr) {
    let m;
    let regex = /\{"\$ref":"([^"]+)*/g;
    const uniqueDefs = new Set();

    while ((m = regex.exec(schemaStr)) !== null) {
        regex.lastIndex += m.index === regex.lastIndex ? 1 : 0;
        uniqueDefs.add(m[1]);
    }

    console.log(uniqueDefs.values());
    //console.log(parser.$refs.get(uniqueDefs.values().next().value));
}

main('./schema.json');