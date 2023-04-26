import slugify from "./slugify";
import baseUrl from "./base-url";
import chapterAndVerse from 'chapter-and-verse';

const searchWorker = new Worker(SearchWorkerPath, { type: "module" });

/**
 * Validate the user's query with chapter-and-verse and then return matching references
 * @param {string} query
 * @returns {Array<{title: string, url: string}>}
 */
export function getReferenceResults(query) {
    const result = chapterAndVerse(query);
    const referenceResults = [];
    const searchResults = [];

    if (result.success) {
        const book = result.book.name;
        const chapter = result.chapter ?? 1;
        const verse = result.from;

        let url = `${baseUrl()}/${slugify(book, { lower: true })}/${chapter}/`;
        referenceResults.push({ title: `${book} ${chapter}`, url });
        if (verse) {
            referenceResults.unshift({ title: `${book} ${chapter}:${verse}`, url: url + `#${verse}` });
        }
    }

    if (query.length) searchResults.push({ url: '/genesis/1/#1', title: 'Genesis 1:1', content: 'In the beginning God created the heaven and the earth' })

    this.referenceResults = referenceResults;
}

/**
 * Search the index for matching results
 * @param {string} query
 * @returns {Array<{title: string, content: string, url: string}>}
 */
export async function getSearchResults(query) {
    if (query.length < 3) return [];

    this.searchPending = true;

    const start = (this.paginationCurrentPage - 1) * this.paginationCount;
    const count = this.paginationCount;
    const queryTime = Date.now();

    const { results, resultCount } = await (new Promise((resolve, reject) => {
        try {
            searchWorker.onmessage = (e) => {
                if (e.data?.key === queryTime) resolve(e.data);
            }
            searchWorker.postMessage({ query, start, count, key: queryTime });
        } catch (e) {
            reject(e);
        }
    }));

    if (this.searchResultsQueryTime > queryTime) return; // ignore stale results

    this.searchResults = results;
    this.searchResultsKey = queryTime;
    this.paginationTotalPages = Math.ceil(resultCount / this.paginationCount);
    // display up to 10 pages in pagination list
    const paginationStart = Math.max(1, this.paginationCurrentPage - 2);
    const paginationEnd = Math.min(this.paginationTotalPages, this.paginationCurrentPage + 2);
    this.paginationPageList = Array.from({ length: paginationEnd - paginationStart + 1 }, (_, i) => i + paginationStart);
    console.log(paginationStart, paginationEnd, this.paginationPageList)
    this.searchPending = false;
}