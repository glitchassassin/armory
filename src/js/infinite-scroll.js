import baseUrl from "./base-url";

/**
 * Map of chapters, indexed by chapter URL
 */
const sections = {};

class InfiniteScrollSection {
    chapter = null;
    nextChapter = null;
    prevChapter = null;
    title = null;
    content = null;
    observer = null;
    constructor(chapter, content = null) {
        if (sections[chapter]) {
            return sections[chapter];
        }
        this.chapter = chapter;
        this.content = content;
        sections[chapter] = this;
        this.render();
    }

    async load() {
        if (!this.chapter) return;
        
        if (!this.content) {
            const base = baseUrl();

            const res = await fetch(base + this.chapter);
            const html = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            this.title = doc.title;
            this.content = doc.getElementById('content');
        }

        this.nextChapter = this.content.getAttribute('data-next-chapter');
        this.prevChapter = this.content.getAttribute('data-prev-chapter');
        this.title ??= document.title;
    }

    async render() {
        await this.load();

        // if already rendered, just setup adjacent chapters
        if (document.querySelector(`div[data-chapter="${this.chapter}"]`)) {
            new InfiniteScrollSection(this.nextChapter);
            new InfiniteScrollSection(this.prevChapter);
        }
        
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
        // If any of the chapter is visible, load the next/prev chapters
        // if > 50% of the chapter is visible, update the URL

        this.observer = new IntersectionObserver((entries, observer) => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            // create new previous/next chapters (automatically added to sections map)
            if (entries.some(entry => entry.intersectionRatio === 1)) {
                console.log('Setting URL to', baseUrl() + this.chapter, entries)
                document.title = this.title;
                history.replaceState(null, "", baseUrl() + this.chapter);
            }
            new InfiniteScrollSection(this.nextChapter);
            new InfiniteScrollSection(this.prevChapter);
        }, {
            threshold: [0, 1],
            root: document,
            rootMargin: '0px'
        });


        for (const intersector of this.content.querySelectorAll('div[data-intersection-trigger]')) {
            console.log('intersection trigger', intersector)
            this.observer.observe(intersector);
        }
    }
}

function initialize() {
    // get adjacent chapters
    const content = document.getElementById('content');

    // Since we're scrolled down slightly, browser will remember our position
    // when we insert DOM elements before the current chapter. Otherwise, it
    // would keep showing the previous chapter all the way to Genesis
    content.parentElement.parentElement.scrollTo(0, 1);

    const chapter = content.getAttribute('data-chapter');

    // create new InfiniteScrollSection for each chapter (automatically added to sections map)
    new InfiniteScrollSection(chapter, content);
}

initialize();