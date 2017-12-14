class BaseRenderer {
    constructor(parent, name) {

        if (!parent || (name !== 0 && !name)) {
            throw new Error('parent and name parameters must be provided');
        }

        this.parent = parent;
        this.name = name;
        this.item = parent[name];

        this.preRenderedExamples = this.renderExample();
    }

    renderExample() {
        let example;

        try {
            example = this.item.example.replace(/\n/g, '<br/>');
            example = example.replace(/\s/g, '&nbsp;');
            delete this.item['example'];
        } catch (e) {
            return '';
        }

        return `<button type="button" class="btn badge badge-pill badge-success" data-toggle="modal" data-target="#exampleModal" data-example='<li><pre><code class=json>${example}</code></pre></li>'>View Sample</button>`;
    }

    render(parent, name) {
        const newItem = parent[name];
        let Renderer;

        if (newItem instanceof Array) {
            Renderer = require('./array.renderer');
        } else if (typeof newItem === 'object' && newItem !== null) {
            Renderer = require('./object.renderer');
        } else {
            Renderer = require('./string.renderer');
        }

        return (new Renderer(parent, name)).render();
    }
}

module.exports = BaseRenderer;