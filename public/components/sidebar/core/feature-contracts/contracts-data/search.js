import { CATEGORIES } from "../categories.js";
const MODULE_ID = "sidebar-contracts-search";
const VERSION = "1.2.0-ES6";
const SEARCH_CONTRACTS = {
  search: {
    module: "fuzzy-search",
    version: "5.0.0",
    category: CATEGORIES.SEARCH,
    methods: {
      fuzzy: { original: "applyFuzzySearch", args: ["container", "query"], returns: "array", requiresEl: true },
      highlight: { original: "highlightMatches", altModule: "highlight-matches", args: ["query"], returns: "number" },
      clearHighlights: { original: "clearHighlights", altModule: "highlight-matches", args: [], returns: "void" },
      navigate: { original: "navigateToMatch", altModule: "highlight-matches", args: ["direction"], returns: "void" },
      matchCount: { original: "getMatchCount", altModule: "highlight-matches", args: [], returns: "number" }
    },
    legacyMethods: {
      fuzzySearch: "fuzzy",
      highlightMatches: "highlight",
      clearHighlights: "clearHighlights",
      navigateToMatch: "navigate",
      getMatchCount: "matchCount"
    }
  },
  commands: {
    module: "command-palette",
    version: "5.0.0",
    category: CATEGORIES.SEARCH,
    methods: {
      show: { original: "show", args: [], returns: "void" },
      hide: { original: "hide", args: [], returns: "void" },
      toggle: { original: "toggle", args: [], returns: "void" },
      register: { original: "registerCommand", args: ["command"], returns: "object" }
    },
    legacyMethods: {
      showCommandPalette: "show",
      hideCommandPalette: "hide",
      toggleCommandPalette: "toggle",
      registerCommand: "register"
    }
  }
};
var search_default = SEARCH_CONTRACTS;
export {
  MODULE_ID,
  SEARCH_CONTRACTS,
  VERSION,
  search_default as default
};
