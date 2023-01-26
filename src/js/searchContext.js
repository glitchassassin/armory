import slugify from "./slugify";
import baseUrl from "./base-url";
import chapterAndVerse from 'chapter-and-verse';

const searchWorker = new Worker(SearchWorkerPath, { type: "module" });

const SearchContext = {
    getInput: () => document.querySelector("[data-search-input]"),
    getSearchResults: () => document.querySelectorAll("[data-search-results]"),
    getNoSearchResults: () => document.querySelectorAll("[data-no-search-results]"),
    getPagination: () => document.querySelectorAll("[data-pagination]"),
    getSearchPending: () => document.querySelectorAll("[data-search-pending]"),
    templates: {},
    currentPage: 0,
    totalPages: 0,
    countPerPage: 20,
    paginationStart: 0,
    paginationEnd: 0,
}

function setPage(page) {
    return () => {
        SearchContext.currentPage = page;
        render();
    }
}

function initialize() {
    console.log('initializing')
    const templates = document.querySelectorAll("template");
    for (const template of templates) {
        SearchContext.templates[template.id] = template;
    }

    const input = SearchContext.getInput();
    input.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            GoToReference(input.value);
        }
    })
    input.addEventListener("input", (e) => {
        // Hide the site content when the user is searching
        if (e.target.value !== "") {
            document.getElementById("site-content").classList.add("d-none");
            document.getElementById("search-results").classList.remove("d-none");
        } else {
            document.getElementById("site-content").classList.remove("d-none");
            document.getElementById("search-results").classList.add("d-none");
        }
        render();
    })
}

/**
 * When the user presses the enter key, validate the user's query with chapter-and-verse
 * and then redirect to the appropriate page.
 * @param {KeyEvent} e 
 */
function GoToReference(query) {
    const result = chapterAndVerse(query);
    if (!result.success) return;

    const book = result.book.name;
    const chapter = result.chapter ?? 1;
    const verse = result.from;

    let url = `${baseUrl()}/${slugify(book, {lower: true})}/${chapter}/`;
    if (verse) url += `#${verse}`;

    window.location.href = url;
}

/**
 * Validate the user's query with chapter-and-verse and then return matching references
 * @param {string} query
 * @returns {Array<{title: string, url: string}>}
 */
function getReferenceResults(query) {
    const result = chapterAndVerse(query);
    const referenceResults = [];

    console.log(result);

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

    return referenceResults;
}

/**
 * Search the index for matching results
 * @param {string} query
 * @returns {Array<{title: string, content: string, url: string}>}
 */
async function getSearchResults(query) {
    if (query.length < 3) return [];

    const start = SearchContext.currentPage * SearchContext.countPerPage;
    const count = SearchContext.countPerPage;

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

    SearchContext.totalPages = Math.ceil(resultCount / count);
    // display up to 10 pages in pagination list
    SearchContext.paginationStart = Math.max(0, SearchContext.currentPage - 2);
    SearchContext.paginationEnd = Math.min(SearchContext.totalPages, SearchContext.currentPage + 3);
    
    return searchResults;
}

async function render() {
    const query = SearchContext.getInput().value;

    console.log("rendering", query)

    // render reference results
    renderAll("[data-reference-results]", renderReferenceResults, { query });

    // set search pending
    const searchPendingContainer = SearchContext.getSearchPending();
    // searchPendingContainer.forEach(container => {
    //     if (container.dataset.searchPending === "true") {
    //         container.classList.remove("d-none");
    //     } else {
    //         container.classList.add("d-none");
    //     }
    // })
      
    // render search results
    const searchResultsContainer = SearchContext.getSearchResults();
    const noSearchResultsContainer = SearchContext.getNoSearchResults();
    const searchResults = await getSearchResults(query);
    searchResultsContainer.forEach(container => {
        if (searchResults.length === 0) {
            container.classList.add("d-none");
            noSearchResultsContainer.forEach(c => c.classList.remove("d-none"));
            return;
        }
        container.classList.remove("d-none");
        noSearchResultsContainer.forEach(c => c.classList.add("d-none"));
        container.innerHTML = "";
        searchResults.forEach(result => {
            const resultFragment = SearchContext.templates["search-result"].content.cloneNode(true);
            const a = resultFragment.querySelector("a");
            const p = resultFragment.querySelector("p");
            a.href = result.url;
            a.innerText = result.title;
            p.innerText = result.content;
            container.appendChild(resultFragment);
        })
    })

    // unset search pending
    searchPendingContainer.forEach(container => {
        if (container.dataset.searchPending === "false") {
            container.classList.remove("d-none");
        } else {
            container.classList.add("d-none");
        }
    })
    
    // render pagination
    const paginationContainer = SearchContext.getPagination();
    paginationContainer.forEach(container => {
        if (SearchContext.totalPages <= 1) {
            container.classList.add("d-none");
        } else {
            container.classList.remove("d-none")
            const ul = container.querySelector("ul");
            
            // update next/prev buttons
            const prevPage = ul.querySelector("[data-prev-page]");
            if (SearchContext.currentPage === 0) {
                prevPage.classList.add("disabled");
                ul.querySelector("[data-prev-page] button").disabled = true;
            } else {
                prevPage.classList.remove("disabled");
                ul.querySelector("[data-prev-page] button").disabled = false;
            }
            const nextPage = ul.querySelector("[data-next-page]");
            if (SearchContext.currentPage === SearchContext.totalPages - 1) {
                prevPage.classList.add("disabled");
                ul.querySelector("[data-next-page] button").disabled = true;
            } else {
                prevPage.classList.remove("disabled");
                ul.querySelector("[data-next-page] button").disabled = false;
            }
            
            // generate page numbers
            ul.innerHTML = "";
            ul.appendChild(prevPage);
            prevPage.onclick = setPage(Math.max(0, SearchContext.currentPage - 1));
            for (let i = SearchContext.paginationStart; i < SearchContext.paginationEnd; i++) {
                const pageFragment = SearchContext.templates["pagination-button"].content.cloneNode(true);
                const button = pageFragment.querySelector("button");
                button.innerText = i + 1;
                button.onclick = setPage(i);
                if (i === SearchContext.currentPage) {
                    button.classList.add("active");
                }
                ul.appendChild(pageFragment);
            }
            ul.appendChild(nextPage);
            nextPage.onclick = setPage(Math.min(SearchContext.totalPages - 1, SearchContext.currentPage + 1));
        }
    })
}

window.addEventListener('load', initialize)

function renderReferenceResults({ query }) {
    const resultsTemplate = fragment(`
        <div class="my-3">
            <h3 class="text-center">References</h3>
            <p class="text-muted d-none" data-no-reference-results>
                No results found
            </p>
            <div class="list-group" data-reference-results-list></div>
        </div>
    `)
    const resultItemTemplate = fragment(`
        <a class="list-group-item list-group-item-action"></a>
    `)

    const referenceResultsContainer = resultsTemplate.querySelector("[data-reference-results-list]");
    const noReferenceResultsContainer = resultsTemplate.querySelector("[data-no-reference-results]");

    const referenceResults = getReferenceResults(query);

    if (referenceResults.length === 0) {
        referenceResultsContainer.classList.add("d-none");
        noReferenceResultsContainer.classList.remove("d-none");
    } else {
        referenceResults.forEach(result => {
            const resultFragment = resultItemTemplate.cloneNode(true);
            const a = resultFragment.querySelector("a");
            a.href = result.url;
            a.innerText = result.title;
            referenceResultsContainer.appendChild(resultFragment);
        })
    }

    return resultsTemplate;
}

function fragment(value) {
    const element = document.createElement("template");
    element.innerHTML = value;
    return element.content;
}

function renderAll(directive, renderFunction, params) {
    document.querySelectorAll(directive)
        .forEach(container => {
            container.innerHTML = "";
            container.appendChild(renderFunction(params));
        });
}