import chapterAndVerse from "chapter-and-verse";

function mergeReferences(from, to) {
    const fromRef = chapterAndVerse(from);
    const toRef = chapterAndVerse(to);

    console.log(from, to, fromRef, toRef);

    if (!fromRef.success || !toRef.success) return "";

    if (fromRef.book.id !== toRef.book.id) {
        return `${fromRef.book.name} ${fromRef.chapter}:${fromRef.from} - ${toRef.book.name} ${toRef.chapter}:${toRef.to}`;
    } else if (fromRef.chapter !== toRef.chapter) {
        return `${fromRef.book.name} ${fromRef.chapter}:${fromRef.from} - ${toRef.chapter}:${toRef.to}`;
    } else if (fromRef.from !== toRef.to) {
        return `${fromRef.book.name} ${fromRef.chapter}:${fromRef.from}-${toRef.to}`;
    } else {
        return `${fromRef.book.name} ${fromRef.chapter}:${fromRef.from}`;
    }
}

function initializeCopyPaste() {
    document.addEventListener('copy', (event) => {
        const selection = document.getSelection();
        if (!selection.anchorNode.parentElement.closest('.verse')) return; // only deal with copying verses

        const fromBook = selection.anchorNode.parentElement.closest('[data-book]').dataset.book.replace(/[^a-z]/gi, '');
        const fromChapter = selection.anchorNode.parentElement.closest('[data-chapter]').dataset.chapter.replace(/[^\d]/g, '');
        const fromVerse = selection.anchorNode.parentElement.closest('[data-verse]').dataset.verse;
        const toBook = selection.focusNode.parentElement.closest('[data-book]').dataset.book.replace(/[^a-z]/gi, '');
        const toChapter = selection.focusNode.parentElement.closest('[data-chapter]').dataset.chapter.replace(/[^\d]/g, '');
        const toVerse = selection.focusNode.parentElement.closest('[data-verse]').dataset.verse;

        const reference = mergeReferences(`${fromBook} ${fromChapter}:${fromVerse}`, `${toBook} ${toChapter}:${toVerse}`);

        // get just the verse text
        const contents = selection.getRangeAt(0).cloneContents()
        const text = [];
        const verses = contents.querySelectorAll('.verse')

        // strip out verse numbers
        verses.forEach(v => {
            v.querySelectorAll('.verse-no').forEach(e => e.remove())
            text.push(v.textContent.trim());
        })

        if (reference) text.push(reference);

        // update the clipboard
        event.clipboardData.setData('text/plain', text.join("\n"));
        event.preventDefault();
    });
}

window.addEventListener('load', initializeCopyPaste);