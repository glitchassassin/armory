const fs = require('fs');
const path = require('path');
const slugify = require('slugify');
const NodeSwordInterface = require('node-sword-interface');
const chapterAndVerse = require('chapter-and-verse');

/**
 * Replaces substrings liks `* word *` with `<em>word</em>`
 */
const parseItalics = (text) => text.replace(/\* ([^*]+) \*/g, '<em>$1</em>')

const wrapVerse = (text, verse) => `<p class="verse"><span class="verse-no" id="${verse}">${verse}</span> ${text}</p>`

function cleanText(text) {
    const mappers = [
        parseItalics
    ]
    return mappers.reduce((text, fn) => fn(text), text)
}

async function main() {
    const version = "KJV";

    // Reload Bible module
    try {
        fs.mkdirSync(path.join(__dirname, "../.sword"));
    } catch (e) { }
    const interface = new NodeSwordInterface(path.join(__dirname, "../.sword"));
    interface.refreshLocalModules();
    if (!interface.getLocalModule(version)) {
        // await interface.uninstallModule(version);
        console.log("Updating repository")
        await interface.updateRepositoryConfig();
        console.log("Downloading Bible version")
        await interface.installModule(version);
    }
    console.log("Bible loaded")

    // Generate JSON object

    const books = interface.getBookList(version).map(book => (
        {
            title: chapterAndVerse(book).book.name,
            slug: `/${slugify(chapterAndVerse(book).book.name, { lower: true })}/`,
            testament: chapterAndVerse(book).book.testament,
            chapters: interface.getBookChapterCount(version, book),
            introduction: interface.getBookIntroduction(version, book)
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
        content: interface.getChapterText(version, books[book].title, chapter).map(v => cleanText(wrapVerse(v.content, v.verseNr))).join("\n"),
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
}

main().catch(console.error);