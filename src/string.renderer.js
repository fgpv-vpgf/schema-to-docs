const BaseRenderer = require('./base.renderer.js');

class StringRenderer extends BaseRenderer {
    constructor(parent, name) {
        super(parent, name);
    }

    render() {
        return parseInt(this.item) >= 0 ? `<li>${this.item}</li>` : `<li>${this.name} : ${this.item}</li>`;
    }
}

module.exports = StringRenderer;