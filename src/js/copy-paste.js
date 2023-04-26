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

        // check if anchorNode is in a chapter
        if (!selection.anchorNode.parentElement.closest('[data-chapter]')) return;

        // get just the verse text
        const text = [];
        let reference;
        for (let range = 0; range < selection.rangeCount; range++) {
            const contents = selection.getRangeAt(range).cloneContents()

            const fromNode = selection.getRangeAt(range).startContainer;
            const fromElement = fromNode.nodeType === Node.TEXT_NODE ? fromNode.parentElement : fromNode;
            const fromBook = fromElement.closest('[data-book]').dataset.book;
            const fromChapter = fromElement.closest('[data-chapter]').dataset.chapter.replace(/[^\d]/g, '');
            const fromVerse = fromElement.closest('[data-verse]').dataset.verse;
            const toNode = selection.getRangeAt(range).endContainer;
            const toElement = toNode.nodeType === Node.TEXT_NODE ? toNode.parentElement : toNode;
            const toBook = toElement.closest('[data-book]').dataset.book;
            const toChapter = toElement.closest('[data-chapter]').dataset.chapter.replace(/[^\d]/g, '');
            const toVerse = toElement.closest('[data-verse]').dataset.verse;

            reference ??= `${fromBook} ${fromChapter}:${fromVerse}`
            reference = mergeReferences(reference, `${toBook} ${toChapter}:${toVerse}`);

            const verses = contents.querySelectorAll('.verse');
            if (verses.length !== 0) {
                // strip out verse numbers
                verses.forEach(v => {
                    v.querySelectorAll('.verse-no').forEach(e => e.remove())
                    text.push(v.textContent.trim());
                })
            } else {
                // partial verse without verse numbers
                text.push(contents.textContent.trim());
            }
        }

        if (reference) text.push(reference);

        // update the clipboard
        event.clipboardData.setData('text/plain', text.filter(t => t !== "").join("\n"));
        event.preventDefault();
    });
}

window.addEventListener('load', initializeCopyPaste);