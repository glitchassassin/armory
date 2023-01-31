import chapterAndVerse from "chapter-and-verse";
import slugify from "../slugify";
import baseUrl from "../base-url";
import { CustomElement } from "../custom-element.js";

const searchWorker = new Worker(SearchWorkerPath);

export class SearchContext extends CustomElement {
    constructor() {
        super();

        const updateResults = () => {
            this.getReferenceResults(this.state.query);
            this.getSearchResults(this.state.query);
        }

        this.onStateUpdate("query", query => {
            this.setState({
                searching: query.length !== 0,
                currentPage: 0,
            });
            updateResults()
        })
        this.onStateUpdate("currentPage", () => updateResults())
    }
    connectedCallback() {
        const input = this.querySelector('[data-search-input]')
        console.log(input)
        input.addEventListener('input', (e) => {
            console.log(e.target.value, this)
            
            this.setState({ query: e.target.value });
        })
        input.addEventListener('keyup', (e) => {
            if (e.key !== "Enter") return;
    
            this.goToReference();
        })

        this.querySelectorAll('pagination').forEach(p => {
            p.addEventListener('page-change', (e) => {
                this.setState({ currentPage: e.page });
            })
        })

        this.setState({
            query: "",
            currentPage: 0,
            countPerPage: 20,
            totalPages: 0,
        })
    }
    goToReference() {
        const result = chapterAndVerse(query);
        if (!result.success) return;

        const book = result.book.name;
        const chapter = result.chapter ?? 1;
        const verse = result.from;

        let url = `${baseUrl()}/${slugify(book, {lower: true})}/${chapter}/`;
        if (verse) url += `#${verse}`;

        window.location.href = url;
    }
    getReferenceResults(query) {
        const result = chapterAndVerse(query);
        const referenceResults = [];
    
        if (result.success) {
            const book = result.book.name;
            const chapter = result.chapter ?? 1;
            const verse = result.from;
    
            let url = `${baseUrl()}/${slugify(book, {lower: true})}/${chapter}/`;
            referenceResults.push({ title: `${book} ${chapter}`, url });
            if (verse) {
                referenceResults.unshift({ title: `${book} ${chapter}:${verse}`, url: url + `#${verse}` });
            }
        }
    
        this.setState({
            referenceResults,
            noReferenceResultsFound: referenceResults.length === 0,
        })
    }
    /**
     * Search the index for matching results
     * @param {string} query
     * @returns {Array<{title: string, content: string, url: string}>}
     */
    async getSearchResults(query) {
        if (query.length < 3) return [];

        this.setState({
            searchResultsLoading: true
        })

        const start = this.state.currentPage * this.state.countPerPage;
        const count = this.state.countPerPage;

        const { results: searchResults, resultCount } = await (new Promise((resolve, reject) => {
            try {
                searchWorker.onmessage = (e) => {
                    resolve(e.data);
                }
                searchWorker.postMessage({ query, start, count });
            } catch (e) {
                reject(e);
            }
        }));

        const totalPages = Math.ceil(resultCount / count)

        this.setState({
            totalPages,
            // display up to 10 pages in pagination list
            paginationStart: Math.max(0, this.state.currentPage - 2),
            paginationEnd: Math.min(totalPages, this.state.currentPage + 3),
            noSearchResultsFound: searchResults.length === 0,
            searchResultsLoading: false,
            searchResults
        });
    }


}