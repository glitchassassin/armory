const fs = require('fs');
const path = require('path');
const NodeSwordInterface = require('node-sword-interface');
const chapterAndVerse = require('chapter-and-verse');

const splitParagraphs = (text) => text.split("¶").map(t => `<p>${t.trim()}</p>`).join("\n")
/**
 * Replaces substrings liks `* word *` with `<em>word</em>`
 */
const parseItalics = (text) => text.replace(/\* ([^*]+) \*/g, '<em>$1</em>')

function cleanText(text) {
    const mappers = [
        splitParagraphs,
        parseItalics
    ]
    return mappers.reduce((text, fn) => fn(text), text)
}

async function main() {
    const version = "KJVPCE";

    // Reload Bible module
    const interface = new NodeSwordInterface();
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
            chapters: interface.getBookChapterCount(version, book),
            introduction: interface.getBookIntroduction(version, book)
        }
    ));

    const chapters = books.flatMap(({title, chapters}) => {
        return new Array(chapters).fill(0).map((_, i) => ({
            book: title,
            chapter: i + 1,
            content: cleanText(interface.getChapterText(version, title, i).map(v => v.content).join(" "))
        }))
    })

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