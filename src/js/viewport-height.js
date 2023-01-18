// see https://css-tricks.com/the-trick-to-viewport-units-on-mobile/

window.addEventListener('resize', () => {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
});