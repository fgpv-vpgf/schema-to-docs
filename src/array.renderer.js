const BaseRenderer = require('./base.renderer.js');

class ArrayRenderer extends BaseRenderer {
    constructor(parent, name) {
        super(parent, name);

        this.items = this.item; // for sanity sake
    }

    render() {
        if (this.items.length === 0) {
            return '';
        }

        let renderHTML = this.renderSingle() || this.allStrings();

        if (renderHTML) {
            return renderHTML;
        } else {
            renderHTML =  this.items.map((_, i) => super.render(this.items, i)).join(' ');
            return `<li>${this.name} : [<ul class="array">${renderHTML}</ul>]</li>`;
        }
    }

    renderSingle() {
        return this.items.length === 1 ? `<li>${this.name} : [${this.items[0]}]</li>` : false;
    }

    allStrings() {
        if (this.items.every(i => typeof i === 'string')) {
            return `<li>${this.name} : [${this.items.join(', ')}]</li>`;
        } else {
            return false;
        }
    }
}

module.exports = ArrayRenderer;