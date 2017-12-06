fs = require('fs');
const $RefParser = require('json-schema-ref-parser');
const parser = new $RefParser();
const strictlyCircularRefs = new Set();
const looseCircularRefs = {};

/**
 * First stage uses the `json-schema-ref-parser` library to resolve all `$ref` objects that are not
 * strictly circular.
 *
 * @param {String | Object} schema  strings can be stringified JSON or a url path to a schema file
 */
function stage1(schema) {
    switch(typeof schema) {
        case 'string':
            try {
                JSON.parse(schema);
            } catch (e) {
                schema = JSON.parse(fs.readFileSync(schema, 'utf8'));
            }
            break;

        case 'object':
            schema = JSON.stringify(schema);
            break;

        default:
            throw new Error('[stage1]: schema provided is invalid');
    }

    parser.dereference(schema, { dereference: { circular: "ignore" }}).then(stage2);
}

/**
 * Determines a unique set of circular references that stage 1 ignored, and replaces any
 * strictly circular references into a special string for easy identification later in the process.
 *
 * @param {String}  schema   schema with non-circular references resolved
 */
function stage2(schema) {
    schema = JSON.stringify(schema);

    let m;
    let regex = /\{"\$ref":"([^"]+)*/g;
    while ((m = regex.exec(schema)) !== null) {
        regex.lastIndex += m.index === regex.lastIndex ? 1 : 0;
        strictlyCircularRefs.add(m[1]);
    }

    strictlyCircularRefs.forEach(updateRefs);
    const aa = JSON.stringify(parser.schema);
    //console.log(aa);
    reParser = new $RefParser();
    reParser.dereference(parser.schema, { dereference: { circular: "ignore" }}).then(s => {
        console.log(JSON.stringify(s));
    });
}

function updateRefs(ref) {
    const foundRef = findCircularRef(parser.$refs.get(ref), ref);

    if (foundRef) {
        replaceCircularRef(foundRef)
        updateRefs(ref);
    }
}


function findCircularRef(obj, ref, directParentObj = obj, grandParentObj = obj) {
    let result = null;

    // search through arrays which may contain reference objects
    if (obj instanceof Array) {
        for(var i = 0; i < obj.length; i++) {
            result = findCircularRef(obj[i], ref, directParentObj, grandParentObj);
            if (result) {
                break;
            }
        }
    } else {
        if (typeof directParentObj === 'object') {
            grandParentObj = directParentObj;
            directParentObj = obj;
        }
        for(const prop in obj) {
            if (strictlyCircularRefs.has(obj[prop])) {
                // determine and save any circular dependencies that both link to each other
                strictlyCircularRefs.filter(r => r !== ref).forEach(r => {
                    const linkedRef = findCircularRef(parser.$refs.get(r), ref);
                    if (linkedRef) {
                        const selfLinkedRef = findCircularRef(ref, r);
                        selfLinkedRefCopy = JSON.parse(JSON.stringify(selfLinkedRef));
                        selfLinkedRefCopy['isCircular'] = true;
                        // TODO: replaceCircularRef change to find and replace
                        // undo bad typeof directParentObj === 'object' idea
                    }
                });
            }
            if(obj[prop] === ref) {
                if (typeof directParentObj !== 'object') {
                    obj[prop] = grandParentObj;
                    return;
                }
                return [directParentObj, grandParentObj];
            }
            if(obj[prop] instanceof Object || obj[prop] instanceof Array) {
                result = findCircularRef(obj[prop], ref, directParentObj, grandParentObj);
                if (result) {
                    break;
                }
            }
        }
    }
    return result;
}

function replaceCircularRef(obj) {
    for(const prop in obj[1]) {
        if (obj[1][prop] instanceof Array) {
            const i = obj[1][prop].indexOf(obj[0]);
            obj[1][prop][i] = "circularSelf";
        } else if (obj[1][prop] == obj.parent) {
            obj[1][prop] = "circularSelf";
        }
    }
}

stage1('./schema.json');