export class CustomElement extends HTMLElement {
    constructor() {
        super();
        this.state = {}
    }
    
    _callbacks = {};
    onStateUpdate(key, callback) {
        if (!(key in this._callbacks)) {
            this._callbacks[key] = [];
        }
        this._callbacks[key].push(callback);
    }
    setState(newState) {
        // Update state
        Object.entries(newState)
            .forEach(([key, value]) => {
                this.state[key] = value;
            });
    
        // Update dependent elements
        // Content binding: set innerHTML to value
        this.querySelectorAll("[data-content]")
            .forEach(node => {
                const key = node.dataset.content;
                if (key in newState) {
                    node.innerHTML = newState[key]
                }
            })
        // bind: map setState to another component's state
        // format: <custom-element data-bind="foo:bar,baz">
        // This maps "foo" to "bar" in the sub-element's state,
        // and "baz" to "baz"
        this.querySelectorAll("[data-bind]")
            .forEach(node => {
                if (!(node instanceof CustomElement)) return;

                const bindings = node.dataset.bind.split(',').reduce((acc, v) => {
                    const [key, value] = v.split(':')
                    acc[key] = value ?? key;
                    return acc;
                }, {});
                
                for (const key in newState) {
                    if (key in bindings) {
                        console.log("updating", node, key, "=>", bindings[key], ":", newState[key])
                        node.setState({
                            [bindings[key]]: newState[key]
                        })
                    }
                }
            })
        // bind: map setState to another component's attrs
        // format: <custom-element data-attr="foo:bar,baz">
        // This maps "foo" to the sub-element's "bar" attribute,
        // and "baz" to "baz"
        this.querySelectorAll("[data-attr]")
            .forEach(node => {
                const bindings = node.dataset.attr.split(',').reduce((acc, v) => {
                    const [key, value] = v.split(':')
                    acc[key] = value ?? key;
                    return acc;
                }, {});
                
                for (const key in newState) {
                    if (key in bindings) {
                        node.setAttribute(bindings[key], newState[key])
                    }
                }
            })
        // show: if value is falsy, set display: none, 
        this.querySelectorAll("[data-show]")
            .forEach(node => {
                const key = node.dataset.show;
                if (!(key in newState)) return;
                if (!newState[key]) {
                    node.classList.add("d-none");
                } else {
                    node.classList.remove("d-none");
                }
            })
        // hide: if value is truthy, set display: none, 
        this.querySelectorAll("[data-hide]")
            .forEach(node => {
                const key = node.dataset.hide;
                if (!(key in newState)) return;
                if (newState[key]) {
                    node.classList.add("d-none");
                } else {
                    node.classList.remove("d-none");
                }
            })
        // call callbacks
        for (const key in newState) {
            if (key in this._callbacks) {
                this._callbacks[key].forEach(callback => callback(newState[key]));
            }
        }
    }
}