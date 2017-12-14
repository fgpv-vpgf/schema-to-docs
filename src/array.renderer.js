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
        if (!renderHTML) {
            renderHTML =  this.items.map((_, i) => super.render(this.items, i)).join(' ');
        }

        return `<li>${this.name} : [<ul class="array">${renderHTML}</ul>]</li>`;
    }

    renderSingle() {
        return this.items.length === 1 ? super.render(this.items, 0) : false;
    }

    allStrings() {
        if (this.items.every(i => typeof i === 'string')) {
            return this.items.map(item => super.render(this.items, item)).join(', ');
        } else {
            return false;
        }
    }
}

module.exports = ArrayRenderer;