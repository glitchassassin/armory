import { CustomElement } from "../custom-element.js";

export class SearchResults extends CustomElement {
    constructor() {
        super();

        this.onStateUpdate("results", () => this.render());
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = `
        <ul class="list-group">
            ${(this.state.results ?? []).reduce((acc, item) => acc + `
            <li class="list-group-item list-group-item-action">
                <a class="stretched-link" href="${item.url}">${item.title}</a>
                <p class="text-muted">${item.content}</p>
            </li>
            `, ``)}
        </ul>`;
    }
}