import baseUrl from "./base-url";

/**
 * Map of chapters, indexed by chapter URL
 */
const sections = {};

async function loadDataIfNeeded(chapter) {
    const content = document.querySelector(`[data-chapter="${chapter}"]`);
    if (content) return {
        content,
        title: document.title
    };

    const base = baseUrl();
    const res = await fetch(base + chapter);
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return {
        content: doc.getElementById('content'),
        title: doc.title,
    }
}

async function loadChapter(chapter) {
    if (sections[chapter]) return;

    // load content
    const { content, title } = await loadDataIfNeeded(chapter);

    const { nextChapter, prevChapter } = content.dataset;

    // insert content into dom before next chapter or after previous chapter
    if (!document.querySelector(`div[data-chapter="${chapter}"]`)) {
        // insert content into dom before next chapter or after previous chapter
        const nextChapterDom = nextChapter && document.querySelector(`div[data-chapter="${nextChapter}"]`);
        const prevChapterDom = prevChapter && document.querySelector(`div[data-chapter="${prevChapter}"]`);

        if (nextChapterDom) {
            const scrollElement = document.querySelector('#site-content');
            const scrollPos = scrollElement.scrollTop;
            nextChapterDom.parentNode.insertBefore(content, nextChapterDom);
            scrollElement.scrollTop = scrollPos + content.getBoundingClientRect().height;
        } else if (prevChapterDom) {
            prevChapterDom.parentNode.insertBefore(content, prevChapterDom.nextSibling);
        } else {
            console.error('Could not find insert position for chapter', chapter, 'between', nextChapter, 'and', prevChapter)
        }
    }

    // set up intersection triggers
    const observer = new IntersectionObserver((entries) => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        // create new previous/next chapters (automatically added to sections map)
        if (entries.some(entry => entry.intersectionRatio === 1)) {
            document.title = title;
            history.replaceState(null, "", baseUrl() + chapter);
        }
        if (nextChapter) loadChapter(nextChapter);
        if (prevChapter) loadChapter(prevChapter);
    }, {
        threshold: [0, 1],
        root: document,
        rootMargin: '0px'
    });


    for (const intersector of content.querySelectorAll('[data-intersection-trigger]')) {
        observer.observe(intersector);
    }

    // record as set up
    sections[chapter] = observer;
}

function initialize() {
    const content = document.getElementById('content');
    const chapter = content.getAttribute('data-chapter');

    loadChapter(chapter);
}

window.addEventListener('load', initialize);