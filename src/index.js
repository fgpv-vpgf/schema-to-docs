fs = require('fs');
const $RefParser = require('json-schema-ref-parser');
const parser = new $RefParser();

class Reference {
    constructor(schema, refId) {
        this.schema = schema;
        this.refId = refId;
        this.ref = parser.$refs.get(refId);
        this.isSelfReferencing = false;
        this.biDirectionalTo = [];
    }

    dereference() {
        this.checkSelfReferencing();
        this.checkBidirectional();
    }

    get clone() {
        return JSON.parse(JSON.stringify(this.ref));
    }

    selfReferenceReplace(refId) {
        const clone = this.clone;
        let hasChild = this.find(clone, refId);
        if (hasChild) {
            hasChild["#refTo"] = refId;
            delete hasChild['$ref'];
        }
        return clone;
    }

    checkSelfReferencing() {
        let selfRef = this.find();
        if (selfRef) {
            selfRef["#refTo"] = this.refId;
            delete selfRef['$ref'];
            this.isSelfReferencing = true;
            this.checkSelfReferencing();
        }
    }

    checkBidirectional() {
        this.schema.getReferences(this.refId)
            .forEach(otherRef => {
                const selfLinkToOther = this.find(this.ref, otherRef.refId);
                const otherLinkToSelf = otherRef.find(otherRef.clone, this.refId);

                if (selfLinkToOther && otherLinkToSelf) {
                    Object.assign(selfLinkToOther, otherRef.selfReferenceReplace(this.refId));
                    delete selfLinkToOther['$ref'];
                    selfLinkToOther['#refTo'] = otherRef.refId;
                    this.checkBidirectional();
                }
        });
    }

    find(currentPosition = this.ref, refId = this.refId, refPropName = '$ref') {
        let result = null;
        // search through arrays which may contain reference objects
        if (currentPosition instanceof Array) {
            for(var i = 0; i < currentPosition.length; i++) {
                result = this.find(currentPosition[i], refId);
                if (result) {
                    break;
                }
            }
        } else {
            for(const prop in currentPosition) {
                if(currentPosition[prop] === refId && prop === refPropName) {
                    return currentPosition;
                }
                if(currentPosition[prop] instanceof Object || currentPosition[prop] instanceof Array) {
                    result = this.find(currentPosition[prop], refId);
                    if (result) {
                        break;
                    }
                }
            }
        }
        return result;
    }
}

class Schema {
    constructor(schema) {
        this.circularReferences = {};

        if (typeof schema === 'string') {
            try {
                JSON.parse(schema);
            } catch (e) {
                schema = JSON.parse(fs.readFileSync(schema, 'utf8'));
            }
        } else if (typeof schema !== 'object') {
            throw new Error('Schema provided is invalid');
        }

        this.schema = schema;
    }

    convert() {
        return this.dereference().then(() => {
            return parser.dereference(this.schema, { dereference: { circular: "ignore" }}).then(schema => {
                this.schema = schema;
                //console.log(JSON.stringify(schema));
                var transformer = require('../node_modules/json-schema-example-loader/lib/transformer.js');
                var transformedSchema = transformer.transformSchema(this.schema);
                console.log(JSON.stringify(transformedSchema, null, 2));
            });
        });
    }

    getReferences(excludeRefId = false) {
        return Object.keys(this.circularReferences)
            .map(key => this.circularReferences[key])
            .filter(refObj => !excludeRefId || refObj.refId !== excludeRefId);
    }

    dereference() {
        return parser.dereference(this.schema, { dereference: { circular: "ignore" }}).then(schema => {
            this.schema = schema;
            this.schemaStr = JSON.stringify(schema);
            let m;
            let regex = /\{"\$ref":"([^"]+)*/g;
            while ((m = regex.exec(this.schemaStr)) !== null) {
                regex.lastIndex += m.index === regex.lastIndex ? 1 : 0;
                if (!this.circularReferences[m[1]]) {
                    this.circularReferences[m[1]] = new Reference(this, m[1]);
                }
            }

            Object.keys(this.circularReferences).forEach(key => this.circularReferences[key].dereference());
        });
    }
}

const a = new Schema('./schema.json');
a.convert();

