import slugify from "@sindresorhus/slugify";
import { writeFile } from "node:fs/promises";

const TRANSLATIONS_TO_BUILD = ["engbsb"];
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
      currentParagraph += ` <span class="verse-no" ${verseId}>${line.number}</span>`;
      for (const chunk of line.content) {
        if (typeof chunk === "string") {
          currentParagraph += ` ${chunk}`;
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
              endCurrentParagraph();
              render += `<p data-indent="${chunk.poem}">${chunk.text}</p>`;
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
  for (const translation of TRANSLATIONS_TO_BUILD) {
    const translationBooks = await getBooks(translation);
    console.log("Processing translation", translationBooks.translation.englishName)
    const books = {};
    const chapters = {};
    const chapterSlugs = [];
    for (const book of translationBooks.books) {
      console.log('[Starting]', book.commonName);
      books[book.name] = {
        title: book.name,
        slug: `/${slugify(book.name)}/`,
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
          slug: chapterSlug,
          nextChapter: null,
          prevChapter,
        };
        chapterSlugs.push(chapterSlug);
      }
    }

    const filename = path.join(
      __dirname,
      `../src/_data/${translationBooks.translation.id}.bible.json`
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
}

main().catch(console.error);