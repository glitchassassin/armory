import baseUrl from "./base-url";

/**
 * Map of chapters, indexed by chapter URL
 */
const sections = {};

class InfiniteScrollSection {
    chapter = null;
    nextChapter = null;
    prevChapter = null;
    content = null;
    observer = null;
    constructor(chapter) {
        if (sections[chapter]) {
            return sections[chapter];
        }
        this.chapter = chapter;
        sections[chapter] = this;
        this.render();
    }

    async load() {
        if (!this.chapter) return;
        
        const base = baseUrl();

        const res = await fetch(base + this.chapter);
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        this.content = doc.getElementById('content');

        this.nextChapter = this.content.getAttribute('data-next-chapter');
        this.prevChapter = this.content.getAttribute('data-prev-chapter');
    }

    async render() {
        if (!this.content) await this.load();

        // if already rendered, do nothing
        if (document.querySelector(`div[data-chapter="${this.chapter}"]`)) return;
        
        // insert content into dom before next chapter or after previous chapter
        const nextChapterDom = this.nextChapter && document.querySelector(`div[data-chapter="${this.nextChapter}"]`);
        const prevChapterDom = this.prevChapter && document.querySelector(`div[data-chapter="${this.prevChapter}"]`);

        if (nextChapterDom) {
            nextChapterDom.parentNode.insertBefore(this.content, nextChapterDom);
        } else if (prevChapterDom) {
            prevChapterDom.parentNode.insertBefore(this.content, prevChapterDom.nextSibling);
        } else {
            console.error('Could not find insert position for chapter', this.chapter, 'between', this.nextChapter, 'and', this.prevChapter)
        }

        // set up intersection observer
        this.observer = new IntersectionObserver((entries, observer) => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            // create new previous/next chapters (automatically added to sections map)
            new InfiniteScrollSection(this.nextChapter);
            new InfiniteScrollSection(this.prevChapter);
        }, {
            root: document,
            rootMargin: '0px'
        });
        this.observer.observe(this.content);
    }
}

function initialize() {
    // get adjacent chapters
    const content = document.getElementById('content');

    // Since we're scrolled down slightly, browser will remember our position
    // when we insert DOM elements before the current chapter. Otherwise, it
    // would keep showing the previous chapter all the way to Genesis
    content.parentElement.scrollTo(0, 1);

    const nextChapter = content.getAttribute('data-next-chapter');
    const prevChapter = content.getAttribute('data-prev-chapter');

    // create new InfiniteScrollSection for each chapter (automatically added to sections map)
    new InfiniteScrollSection(prevChapter);
    new InfiniteScrollSection(nextChapter);
}

initialize();