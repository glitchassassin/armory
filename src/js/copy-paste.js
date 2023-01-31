function initializeCopyPaste() {
    console.log('initializing');
    const content = document.getElementById('content');
    document.addEventListener('copy', (event) => {
        const selection = document.getSelection();
        console.log(selection);
    });
}

window.addEventListener('load', initializeCopyPaste);