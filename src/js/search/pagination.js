import { CustomElement } from "../custom-element.js";

export class Pagination extends CustomElement {
    constructor() {
        super();

        this.onStateUpdate("paginationStart", () => this.render());
        this.onStateUpdate("paginationEnd", () => this.render());
        this.onStateUpdate("currentPage", () => this.render());
        
        this.render();
    }

    connectedCallback() {
        this.render()
    }

    render() {
        const pageRange = [];
        console.log(this.state)
        for (let i = this.state.paginationStart; i < this.state.paginationEnd; i++) {
            pageRange.push(i);
        }
        const isFirstPage = this.state.currentPage === this.state.paginationStart;
        const isLastPage = this.state.currentPage === this.state.paginationEnd;
        const prevPage = Math.max(this.state.paginationStart, this.state.currentPage - 1);
        const nextPage = Math.min(this.state.paginationEnd, this.state.currentPage + 1);
        this.innerHTML = `
        <nav aria-label="Search results page" data-pagination class="${this.state.paginationEnd - this.state.paginationEnd > 1 ? 'd-none' : ''}">
            <ul class="pagination justify-content-center">
                <li class="page-item" data-page="${prevPage}">
                    <button 
                    class="page-link ${isFirstPage ? 'disabled' : ''}" 
                    aria-label="Previous"
                    ${isFirstPage ? 'disabled' : ''}
                >
                        <span aria-hidden="true">&laquo;</span>
                    </button>
                </li>
                ${pageRange.map(page => `
                <li class="page-item" data-page="${page}">
                    <button class="page-link ${page === this.state.currentPage ? 'active' : ''}">${page + 1}</button>
                </li>
                `).join("")}
                <li class="page-item" data-page="${nextPage}">
                    <button 
                    class="page-link ${isLastPage ? 'disabled' : ''}"
                    aria-label="Next"
                    ${isLastPage ? 'disabled' : ''}
                >
                        <span aria-hidden="true">&raquo;</span>
                    </button>
                </li>
            </ul>
        </nav>`;

        // attach event listeners
        this.querySelectorAll("[data-page]").forEach(el => {
            el.addEventListener("click", () => {
                this.dispatchEvent(new CustomEvent("page-change", { page: el.dataset.page }));
            });
        })
    }
}