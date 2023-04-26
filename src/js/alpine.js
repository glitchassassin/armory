import Alpine from "alpinejs";
import intersect from "@alpinejs/intersect";
import { getReferenceResults, getSearchResults } from "./searchContext";
import { chapterIntersected } from "./infinite-scroll";
import chapterAndVerse from "chapter-and-verse";
import slugify from "./slugify";
import baseUrl from "./base-url";


document.addEventListener('alpine:init', () => {
    Alpine.plugin(intersect);

    Alpine.data('searchContext', () => ({
        getReferenceResults,
        getSearchResults,
        /**
         * When the user presses the enter key, validate the user's query with chapter-and-verse
         * and then redirect to the appropriate page.
         * @param {KeyEvent} e 
         */
        GoToReference(query) {
            const result = chapterAndVerse(query);
            if (!result.success) return;

            const book = result.book.name;
            const chapter = result.chapter ?? 1;
            const verse = result.from;

            let url = `${baseUrl()}/${slugify(book, { lower: true })}/${chapter}/`;
            if (verse) url += `#${verse}`;

            this.query = '';

            window.location.href = url;
        },
        query: new URLSearchParams(window.location.search).get('q') ?? '',
        setLocationQuery(query, page=1) {
            const url = new URL(window.location);
            if (query.length) {
                url.searchParams.set('q', query);
                url.searchParams.set('p', page);
            } else {
                url.searchParams.delete('q');
                url.searchParams.delete('p');
            }
            history.pushState(null, document.title, url);
        },
        referenceResults: [],
        searchResults: [],
        searchResultsQueryTime: undefined,
        searchPending: false,
        paginationCurrentPage: 1 * (new URLSearchParams(window.location.search).get('p') ?? 1),
        paginationCount: 20,
        paginationTotalPages: 0,
        paginationPageList: [1],
        nextPage() {
            // cap at last page
            this.paginationCurrentPage = Math.min(this.paginationTotalPages, this.paginationCurrentPage + 1)
            this.setLocationQuery(this.query, this.paginationCurrentPage);
            this.getReferenceResults(this.query);
            this.getSearchResults(this.query);
        },
        prevPage() {
            // cap at first page
            this.paginationCurrentPage = Math.max(1, this.paginationCurrentPage - 1)
            this.setLocationQuery(this.query, this.paginationCurrentPage);
            this.getReferenceResults(this.query);
            this.getSearchResults(this.query);
        },
        setPage(page) {
            // cap within bounds
            this.paginationCurrentPage = Math.min(
                this.paginationTotalPages,
                Math.max(1, page)
            )
            this.setLocationQuery(this.query, this.paginationCurrentPage);
            this.getReferenceResults(this.query);
            this.getSearchResults(this.query);
        }
    }))

    Alpine.data('infiniteScrollContext', () => ({
        chapterIntersected
    }))
})

window.Alpine = Alpine

Alpine.start()