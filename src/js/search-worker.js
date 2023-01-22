import slugify from "./slugify";
import * as JsSearch from 'js-search';
import { stemmer } from 'porter-stemmer';
import chapterAndVerse from 'chapter-and-verse';

const searchIndex = fetch(`./verses.json`)
    .then(r => r.json())
    .then(verses => {
        const search = new JsSearch.Search('title');
        search.tokenizer =  new JsSearch.StemmingTokenizer(stemmer, 
                            new JsSearch.StopWordsTokenizer(
                            new JsSearch.SimpleTokenizer()));
        search.searchIndex = new JsSearch.UnorderedSearchIndex();
        search.addIndex('content');
        search.addDocuments(Object.entries(verses).map(([title, content]) => ({ title, content })));
        return search;
    });

searchIndex.then(() => console.log("Search index loaded"));

/**
 * Given a query and some pagination parameters, search with Fuse
 * and return the matching results
 */
onmessage = async function ({data: { query, start, count } }) {
    const results = (await searchIndex).search(query);

    postMessage({
        results: results.map(r => {
            const reference = chapterAndVerse(r.title)
            const book = reference.book.name;
            const chapter = reference.chapter;
            const verse = reference.from;
    
            return {
                title: r.title,
                content: r.content,
                url: `/${slugify(book, {lower: true})}/${chapter}/#${verse}`,
            }
        }).slice(start, start + count),
        resultCount: results.length
    })
}