# armorer

Renders SWORD Bible modules as a performant, minimal, well-designed reading website

## Planned Features

- [ ] Infinite scroll (with "jump to next/prev chapter" buttons)
- [ ] Navigate to references intuitively
    - [ ] Enter reference as text
    - [ ] Select book, chapter, verse visually
    - [ ] Save history in local storage
- [ ] Search by keyword
    - [ ] Search indexes on client side?
    - [ ] Save history in local storage
- [ ] Configure display
    - [ ] Verse numbers
    - [ ] Chapter numbers
    - [ ] Paragraph mode
    - [ ] Headings
    - [ ] Save settings in local storage

## Ideas

- Generate static site as rendered HTML.
    - Loads next/previous pages, if they are not already loaded.
    - On scroll into visibility, 
- Provide search functionality via wasm?
    - search(query: string): { url: string (`book/chapter#verse`), result: string }
- Each page contains one chapter; the next and previous chapters are loaded dynamically.
    - Since we already have the pages rendered, we should be able to just fetch the next chunk of HTML.
    - This would also need to update the "next page down" from that page content

## URL Scheme

https://kjv.armorer.io/genesis/c1#v1