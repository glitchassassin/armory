import slugify from "@sindresorhus/slugify";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import chapterAndVerse from "chapter-and-verse";
    
const __dirname = dirname(fileURLToPath(import.meta.url));

const TRANSLATION_TO_BUILD = process.argv[2];
if (!TRANSLATION_TO_BUILD) {
  console.error("Usage: node utils/helloao_bible.mjs <translation>");
  process.exit(1);
}
const BASENAME = "https://bible.helloao.org";

/**
 * @param {string} url
 */
async function api(url) {
  try {
    return await (await fetch(`${BASENAME}${url}`)).json();
  } catch (e) {
    console.error("Error invoking", url);
    throw e;
  }
}

/**
 * @returns {Promise<import("./helloao").AvailableTranslations>}
 */
async function getTranslations() {
  return api("/api/available_translations.json");
}

/**
 * @param {string} translation
 * @returns {Promise<import("./helloao").TranslationBooks>}
 */
async function getBooks(translation) {
  return api(`/api/${translation}/books.json`);
}

/**
 * @param {string} chapterUrl
 * @returns {Promise<import("./helloao").TranslationBookChapter>}
 */
async function getChapter(chapterUrl) {
  return api(chapterUrl);
}

function smallcapsLord(text) {
  return text
    .replace(/LORD'S/g, "<span class='small-caps'>Lord's</span>")
    .replace(/LORD/g, "<span class='small-caps'>Lord</span>");
}

/**
 * @param {import('./helloao').TranslationBookChapter} chapter
 * @param {boolean} withVerseIds
 * @returns {string}
 */
function renderChapter(chapter, withVerseIds) {
  let render = "";
  let currentParagraph = "";
  function endCurrentParagraph() {
    if (currentParagraph.length) {
      render += `<p>${currentParagraph.trim()}</p>`;
    }
    currentParagraph = "";
  }
  for (const line of chapter.chapter.content) {
    if (line.type === "heading") {
      endCurrentParagraph();
      if (!line.content.every((v) => typeof v === "string"))
        throw new Error(
          "Heading with non-string content found: " + JSON.stringify(chapter)
        );
      render += `<h2>${line.content.join(" ")}</h2>`;
    } else if (line.type === "line_break") {
      endCurrentParagraph();
    } else if (line.type === "verse") {
      // when pre-rendering the next and prior chapters, we use data-id instead of id
      const verseId = withVerseIds
        ? `id="${line.number}"`
        : `data-id="${line.number}"`;
      
      /**
       * Paragraph logic
       * The eng_kjv version from helloao has paragraph markers instead of line breaks
       * Here, we normalize on the line break format used by other versions
       */
      // check if next verse begins a paragraph
      if (typeof line.content[0] === "string" && line.content[0].startsWith("¶")) {
        endCurrentParagraph();
        line.content[0] = line.content[0].slice(1);
      }
      // remap paragraph markers
      line.content = line.content.flatMap((chunk) => {
        if (typeof chunk === "string") {
          return chunk.split(/¶/).flatMap((v, i) => {
            if (v.trim() === "") {
              return []
            } else if (i === 0) {
              return [v.trim()];
            } else {
              return [{ lineBreak: true }, v.trim()];
            }
          });
        } else {
          return [chunk];
        }
      })
      /**
       * End paragraph logic
       */

      currentParagraph += ` <span class="verse-no ${line.content[0]?.poem ? "poem" : ""}" ${verseId}>${line.number}</span>`;

      for (const chunk of line.content) {
        if (typeof chunk === "string") {
          currentParagraph += smallcapsLord(` ${chunk}`);
        } else if (typeof chunk === "object") {
          if ("noteId" in chunk) {
            currentParagraph += ` <span class="footnote">${chunk.noteId}</span>`;
          } else if ("text" in chunk) {
            if (chunk.poem && chunk.wordsOfJesus)
              throw new Error(
                "Formatted text with both poem and words of Jesus found: " +
                  JSON.stringify(chapter)
              );
            if (chunk.poem) {
              currentParagraph += `<span data-indent="${chunk.poem}">${chunk.text}</span>`;
            } else if (chunk.wordsOfJesus) {
              currentParagraph += ` <span class="words-of-jesus">${chunk.text}</span>`;
            }
          } else if ("lineBreak" in chunk) {
            endCurrentParagraph();
          } else if ("heading" in chunk) {
            endCurrentParagraph();
            render += `<h3>${chunk.heading}</h3>`;
          }
        }
      }
    }
  }
  endCurrentParagraph();

  return render;
}

async function main() {
    const translationBooks = await getBooks(TRANSLATION_TO_BUILD);
    console.log("Processing translation", translationBooks.translation.englishName)
    const books = {};
    const chapters = {};
    const chapterSlugs = [];
    for (const book of translationBooks.books) {
      console.log('[Starting]', book.commonName);
      const bookDetails = chapterAndVerse(book.commonName);
      books[book.name] = {
        title: book.name,
        slug: `/${slugify(book.name)}/`,
        testament: bookDetails.book.testament,
        numberOfChapters: book.numberOfChapters,
      };
      let nextChapter = book.firstChapterApiLink;
      while (nextChapter) {
        const chapter = await getChapter(nextChapter);
        // break loop at the end of the book
        nextChapter =
          chapter.chapter.number === chapter.book.numberOfChapters
            ? null
            : chapter.nextChapterApiLink;
        const chapterSlug = `${books[book.name].slug}${
          chapter.chapter.number
        }/`;
        const prevChapter = chapterSlugs[chapterSlugs.length - 1] ?? null;
        if (prevChapter) {
          chapters[prevChapter].nextChapter = chapterSlug;
        }
        chapters[chapterSlug] = {
          book: books[book.name],
          content: renderChapter(chapter),
          title: `${book.name} ${chapter.chapter.number}`,
          number: chapter.chapter.number,
          slug: chapterSlug,
          nextChapter: null,
          prevChapter,
        };
        chapterSlugs.push(chapterSlug);
      }
    }

    const filename = path.join(
      __dirname,
      "../src/_data/bible.json"
    );
    await writeFile(
      filename,
      JSON.stringify({
        translation: translationBooks.translation,
        books,
        chapters,
      })
    );
  }

main().catch(console.error);