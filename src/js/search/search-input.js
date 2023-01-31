import { CustomElement } from "../custom-element.js";

export class SearchInput extends CustomElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `<input type="search" class="form-control" placeholder="Search/Go to..." />`
        const input = this.querySelector('input')
        input.onchange = (e) => {
            const context = this.closest("search-context");
    
            console.log(e.target.value, context)
    
            if (!context) return;
            
            context.setState({ query: e.target.value });
        }
        input.onkeyup = (e) => {
            if (e.key !== "Enter") return;
    
            const context = this.closest("search-context");
            context.goToReference();
        }
    }
}