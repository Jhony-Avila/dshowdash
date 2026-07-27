const VERSION = "1.0.0";
const MODULE_ID = "container-main:panel-search";
const SEARCH_MODES = Object.freeze({
  TEXT: "text",
  REGEX: "regex",
  FUZZY: "fuzzy"
});
const MATCH_TYPES = Object.freeze({
  EXACT: "exact",
  CASE_INSENSITIVE: "case-insensitive",
  WORD_BOUNDARY: "word-boundary"
});
const DEFAULT_CONFIG = Object.freeze({
  hotkey: "ctrl+f",
  mode: SEARCH_MODES.TEXT,
  matchType: MATCH_TYPES.CASE_INSENSITIVE,
  highlightColor: "rgba(139, 92, 246, 0.4)",
  activeHighlightColor: "rgba(139, 92, 246, 0.8)",
  minQueryLength: 2,
  maxResults: 500,
  debounceDelay: 150,
  scrollBehavior: "smooth",
  showResultCount: true,
  showNavigation: true,
  persistLastSearch: true,
  excludeSelectors: ["script", "style", "noscript", ".dsd-no-search"]
});
const STORAGE_KEY = "dsd:container-main:panel-search";
export {
  DEFAULT_CONFIG,
  MATCH_TYPES,
  MODULE_ID,
  SEARCH_MODES,
  STORAGE_KEY,
  VERSION
};
