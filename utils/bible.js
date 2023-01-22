const fs = require('fs');
const path = require('path');
const slugify = require('slugify');
const NodeSwordInterface = require('node-sword-interface');
const chapterAndVerse = require('chapter-and-verse');

const VERSION = "KJV";

/**
 * Replaces substrings liks `* word *` with `<em>word</em>`
 */
const parseItalics = (text) => text.replace(/\* ([^*]+) \*/g, '<em>$1</em>')
const smallcapsLord = (text) => text.replace(/LORD/g, '<span style="font-variant-caps: small-caps">Lord</span>')

const wrapVerse = (text, verse) => `<p class="verse"><span class="verse-no" id="${verse}">${verse}</span> ${text}</p>`

function cleanText(text) {
    const mappers = [
        parseItalics,
        smallcapsLord
    ]
    return mappers.reduce((text, fn) => fn(text), text)
}

async function main() {

    // Reload Bible module
    try {
        fs.mkdirSync(path.join(__dirname, "../.sword"));
    } catch (e) { }
    const interface = new NodeSwordInterface(path.join(__dirname, "../.sword"));
    interface.refreshLocalModules();
    if (!interface.getLocalModule(VERSION)) {
        // await interface.uninstallModule(version);
        console.log("Updating repository")
        await interface.updateRepositoryConfig();
        console.log("Downloading Bible version")
        await interface.installModule(VERSION);
    }
    console.log("Bible loaded")

    // Generate JSON object

    const books = interface.getBookList(VERSION).map(book => (
        {
            title: chapterAndVerse(book).book.name,
            slug: `/${slugify(chapterAndVerse(book).book.name, { lower: true })}/`,
            testament: chapterAndVerse(book).book.testament,
            chapters: interface.getBookChapterCount(VERSION, book),
            introduction: interface.getBookIntroduction(VERSION, book)
        }
    )).reduce((acc, book) => {
        acc[book.slug] = book;
        return acc;
    }, {});

    const chapterList = Object.values(books).flatMap(({slug, chapters}) => {
        return new Array(chapters).fill(0).map((_, i) => ({
            book: slug,
            chapter: i + 1,
            slug: `${slug}${i + 1}/`
        }))
    });

    const chapters = chapterList.map(({book, chapter, slug}, i) => ({
        book,
        chapter,
        slug,
        content: interface.getChapterText(VERSION, books[book].title, chapter).map(v => cleanText(wrapVerse(v.content, v.verseNr))).join("\n"),
        prevChapter: chapterList[i - 1]?.slug,
        nextChapter: chapterList[i + 1]?.slug,
    }))

    const output = JSON.stringify({
        books,
        chapters
    })

    // write output to src/_data/bible.json
    const outputFile = path.join(__dirname, '../src/_data/bible.json')
    fs.writeFileSync(outputFile, output);
    console.log("Output rendered")

    // generate indexes 
    generateIndexes(interface);
}

/**
 * Generates indexes
 * @param {NodeSwordInterface} interface 
 */
function generateIndexes(interface) {
    const verses = interface.getBibleText(VERSION).map(v => {
        const book = chapterAndVerse(v.bibleBookShortTitle).book.name
        return {
            title: `${book} ${v.chapter}:${v.verseNr}`,
            content: v.content.replace(/<title.*?<\/title>/g, '').replace(/<.+?>/g, '').trim(),
        }
    });
    const verseMap = verses.reduce((acc, v) => {
        acc[v.title] = v.content;
        return acc;
    }, {});

    const outputOriginalFile = path.join(__dirname, '../src/js/verses.json')
    fs.writeFileSync(outputOriginalFile, JSON.stringify(verseMap));
}

main().catch(console.error);