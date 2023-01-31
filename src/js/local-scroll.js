let interval;

window.addEventListener('hashchange', (event) => {
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
        // wait until site-content is visible again; otherwise,
        // alpine sometimes doesn't have enough time to switch back
        const siteContent = document.getElementById('site-content');
        if (siteContent.style.display === 'none') return;
        clearInterval(interval);

        const [path, hash] = event.newURL.split('#');
        if (!hash) return;

        const url = new URL(path);

        const chapter = url.pathname;

        const element = document.querySelector(`[data-chapter="${chapter}"]`)?.querySelector(`[data-verse="${hash}"] .verse-no`);

        if (element) element.scrollIntoView();
    }, 100);
})