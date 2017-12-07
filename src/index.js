fs = require('fs');
const $RefParser = require('json-schema-ref-parser');
const parser = new $RefParser();
const circularRefs = new Set();
const looseCircularRefs = {};

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

    checkSelfReferencing() {
        let refClone = this.clone;
        let hasChild = this.find(refClone);
        if (hasChild) {
            hasChild["circularSelfReferencing"] = true;
            delete hasChild['$ref'];
            Object.assign(this.find(), hasChild);
            this.isSelfReferencing = true;
        }
    }

    checkBidirectional() {
        this.schema.getReferences(this.refId)
            .forEach(otherRef => {
                const selfLinkToOther = this.find(this.ref, otherRef.refId);
                const otherLinkToSelf = otherRef.find(otherRef.clone, this.refId);

                if (selfLinkToOther && otherLinkToSelf) {


                    // TODO: we need to insert sanitized clone, not just the ref.

                    otherLinkToSelf["biDirectionalReferencing"] = true;
                    delete otherLinkToSelf['$ref'];
                    console.log(otherLinkToSelf);
                    Object.assign(selfLinkToOther, otherLinkToSelf);
                    this.biDirectionalTo.push(otherRef.refId);
                }
        });
    }

    find(currentPosition = this.ref, refId = this.refId) {
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
                if(currentPosition[prop] === refId) {
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
        this.dereference().then(() => {

            //console.log(JSON.stringify(this.schema))
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