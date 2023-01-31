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
        query: '',
        referenceResults: [],
        searchResults: [],
        searchPending: false,
        paginationCurrentPage: 0,
        paginationCount: 20,
        paginationTotalPages: 0,
        paginationPageList: [0],
        nextPage() {
            // cap at last page
            this.paginationCurrentPage = Math.min(this.paginationTotalPages, this.paginationCurrentPage + 1)
            this.getReferenceResults(this.query);
            this.getSearchResults(this.query);
        },
        prevPage() {
            // cap at first page
            this.paginationCurrentPage = Math.max(0, this.paginationCurrentPage - 1)
            this.getReferenceResults(this.query);
            this.getSearchResults(this.query);
        },
        setPage(page) {
            // cap within bounds
            this.paginationCurrentPage = Math.min(
                this.paginationTotalPages,
                Math.max(0, page)
            )
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