const BaseRenderer = require('./base.renderer.js');
const svgArrowIcon = require('../assets/arrow.svg');

class ObjectRenderer extends BaseRenderer {
    constructor(parent, name, isRoot = false) {
        super(parent, name);

        this.isRoot = isRoot;
        this.properties = Object.keys(this.item);
        this.properties = sort(this.properties).map(this.propertyChange.bind(this)).filter(p => p);

        this.type = this.item.type;
        delete this.item.type;
    }

    render() {
        const propertyHTML = this.properties.map(property => {
            return super.render(this.item, property);
        }).join('');

        return this.isRoot ?
        `<ul>
            ${propertyHTML}
        </ul>`

        :

        `<li class="object">
            <div class="header" onclick="toggle(this);">${svgArrowIcon} ${this.name}</div>
            <span class="badge badge-pill badge-primary">${this.type}</span> ${this.preRenderedExamples}
            <ul>
                ${propertyHTML}
            </ul>
        </li>`
    }

    propertyChange(property) {
        if (property === 'enum') {
            if (this.item[property].length === 0) {
                delete this.item[property];
                return false;
            } else if (this.item[property].length === 1) {
                this.item['exactly'] = this.item[property];
                delete this.item[property];
                return 'exactly';
            } else {
                this.item['one of'] = this.item[property];
                delete this.item[property];
                return 'one of';
            }
        } else {
            return property;
        }
    }
}

function sort(properties) {
    properties.sort(a => {
        switch (a) {
            case 'description':
                return -2;
            case 'properties':
                return 2
            case '[object Object]':
                return 1;
            default:
                return 0;
        }
    });

    return properties;
}

module.exports = ObjectRenderer;