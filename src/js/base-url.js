/**
 * 
 * @returns {string} The base URL of the current page, without domain
 */
export default function baseUrl() {
    const currentUrl = document.querySelector('#home')?.href;
    if (!currentUrl) return "";
    const url = new URL(currentUrl);
    return url.pathname.slice(0, -1);
}