import { Pagination } from "./search/pagination";
import { SearchContext } from "./search/search-context";
import { SearchInput } from "./search/search-input";
import { SearchResults } from "./search/search-results";

customElements.define("search-context", SearchContext)
customElements.define("search-input", SearchInput)
customElements.define("search-results", SearchResults)
customElements.define("search-pagination", Pagination)