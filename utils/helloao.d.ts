export interface AvailableTranslations {
  /**
   * The list of translations.
   */
  translations: Translation[];
}

interface Translation {
  /**
   * The ID of the translation.
   */
  id: string;

  /**
   * The name of the translation.
   * This is usually the name of the translation in the translation's language.
   */
  name: string;

  /**
   * The English name of the translation.
   */
  englishName: string;

  /**
   * The website for the translation.
   */
  website: string;

  /**
   * The URL that the license for the translation can be found.
   */
  licenseUrl: string;

  /**
   * The short name for the translation.
   */
  shortName?: string;

  /**
   * The RFC 5646 letter language tag that the translation is primarily in.
   */
  language: string;

  /**
   * The direction that the language is written in.
   * "ltr" indicates that the text is written from the left side of the page to the right.
   * "rtl" indicates that the text is written from the right side of the page to the left.
   */
  textDirection: 'ltr' | 'rtl';

  /**
   * The available list of formats.
   */
  availableFormats: ('json' | 'usfm')[];

  /**
   * The API link for the list of available books for this translation.
   */
  listOfBooksApiLink: string;
}

export interface TranslationBooks {
  /**
   * The translation information for the books.
   */
  translation: Translation;

  /**
   * The list of books that are available for the translation.
   */
  books: TranslationBook[];
}

interface TranslationBook {
  /**
   * The ID of the book.
   */
  id: string;

  /**
   * The name that the translation provided for the book.
   */
  name: string;

  /**
   * The common name for the book.
   */
  commonName: string;

  /**
   * The number of chapters that the book contains.
   */
  numberOfChapters: number;

  /**
   * The link to the first chapter of the book.
   */
  firstChapterApiLink: string;

  /**
   * The link to the last chapter of the book.
   */
  lastChapterApiLink: string;
}

export interface TranslationBookChapter {
  /**
   * The translation information for the book chapter.
   */
  translation: Translation;

  /**
   * The book information for the book chapter.
   */
  book: TranslationBook;

  /**
   * The link to the next chapter.
   * Null if this is the last chapter in the book.
   */
  nextChapterApiLink: string | null;

  /**
   * The link to the previous chapter.
   * Null if this is the first chapter in the book.
   */
  previousChapterApiLink: string | null;

  /**
   * The information for the chapter.
   */
  chapter: ChapterData;
}

interface ChapterData {
  /**
   * The number of the chapter.
   */
  number: number;

  /**
   * The content of the chapter.
   */
  content: ChapterContent[];

  /**
   * The list of footnotes for the chapter.
   */
  footnotes: ChapterFootnote[];
}

/**
* A union type that represents a single piece of chapter content.
* A piece of chapter content can be one of the following things:
* - A heading.
* - A line break.
* - A verse.
* - A Hebrew Subtitle.
*/
type ChapterContent = ChapterHeading | ChapterLineBreak | ChapterVerse | ChapterHebrewSubtitle;

/**
* A heading in a chapter.
*/
interface ChapterHeading {
  /**
   * Indicates that the content represents a heading.
   */
  type: 'heading';

  /**
   * The content for the heading.
   * If multiple strings are included in the array, they should be concatenated with a space.
   */
  content: string[];
}

/**
* A line break in a chapter.
*/
interface ChapterLineBreak {
  /**
   * Indicates that the content represents a line break.
   */
  type: 'line_break';
}

/**
* A Hebrew Subtitle in a chapter.
* These are often used included as informational content that appeared in the original manuscripts.
* For example, Psalms 49 has the Hebrew Subtitle "To the choirmaster. A Psalm of the Sons of Korah."
*/
interface ChapterHebrewSubtitle {
  /**
   * Indicates that the content represents a Hebrew Subtitle.
   */
  type: 'hebrew_subtitle';

  /**
   * The list of content that is contained in the subtitle.
   * Each element in the list could be a string, formatted text, or a footnote reference.
   */
  content: (string | FormattedText | VerseFootnoteReference)[];
}

/**
* A verse in a chapter.
*/
interface ChapterVerse {
  /**
   * Indicates that the content is a verse.
   */
  type: 'verse';

  /**
   * The number of the verse.
   */
  number: number;
  
  /**
   * The list of content for the verse.
   * Each element in the list could be a string, formatted text, or a footnote reference.
   */
  content: (string | FormattedText | InlineHeading | InlineLineBreak | VerseFootnoteReference)[];
}

/**
* Formatted text. That is, text that is formated in a particular manner.
*/
interface FormattedText {
  /**
   * The text that is formatted.
   */
  text: string;

  /**
   * Whether the text represents a poem.
   * The number indicates the level of indent.
   * 
   * Common in Psalms.
   */
  poem?: number;

  /**
   * Whether the text represents the Words of Jesus.
   */
  wordsOfJesus?: boolean;
}

/**
* Defines an interface that represents a heading that is embedded in a verse.
*/
interface InlineHeading {
  /**
   * The text of the heading.
   */
  heading: string;
}

/**
* Defines an interface that represents a line break that is embedded in a verse.
*/
interface InlineLineBreak {
  lineBreak: true;
}


/**
* A footnote reference in a verse or a Hebrew Subtitle.
*/
interface VerseFootnoteReference {
  /**
   * The ID of the note.
   */
  noteId: number;
}

/**
* Information about a footnote.
*/
interface ChapterFootnote {
  /**
   * The ID of the note that is referenced.
   */
  noteId: number;

  /**
   * The text of the footnote.
   */
  text: string;

  /**
   * The verse reference for the footnote.
   */
  reference?: {
      chapter: number;
      verse: number;
  };

  /**
   * The caller that should be used for the footnote.
   * For footnotes, a "caller" is the character that is used in the text to reference to footnote.
   * 
   * For example, in the text:
   * Hello (a) World
   * 
   * ----
   * (a) This is a footnote.
   * 
   * The "(a)" is the caller.
   * 
   * If "+", then the caller should be autogenerated.
   * If null, then the caller should be empty.
   * If a string, then the caller should be that string.
   */
  caller: '+' | string | null;
}