import { CATEGORIES } from "../categories.js";
const MODULE_ID = "sidebar-contracts-core";
const VERSION = "1.2.0-ES6";
const CORE_CONTRACTS = {
  favorites: {
    module: "favorites-handler",
    version: "5.8.0",
    category: CATEGORIES.CORE,
    methods: {
      add: { original: "addFavorite", args: ["itemId"], returns: "boolean" },
      remove: { original: "removeFavorite", args: ["itemId"], returns: "boolean" },
      toggle: { original: "toggleFavorite", args: ["itemId"], returns: "boolean|null" },
      has: { original: "isFavorite", args: ["itemId"], returns: "boolean" },
      list: { original: "getFavorites", args: [], returns: "array" },
      clear: { original: "clearFavorites", args: [], returns: "void" },
      mark: { original: "markFavoriteItems", args: ["container?"], returns: "void", requiresEl: true }
    },
    legacyMethods: {
      addFavorite: "add",
      removeFavorite: "remove",
      toggleFavorite: "toggle",
      isFavorite: "has",
      getFavorites: "list",
      clearFavorites: "clear",
      markFavoriteItems: "mark"
    }
  },
  config: {
    module: "config-manager",
    version: "5.0.0",
    category: CATEGORIES.CORE,
    methods: {
      export: { original: "exportConfig", args: [], returns: "object" },
      import: { original: "importConfig", args: ["config"], returns: "boolean" },
      reset: { original: "resetConfig", args: [], returns: "void" },
      summary: { original: "getConfigSummary", args: [], returns: "object" }
    },
    legacyMethods: {
      exportConfig: "export",
      importConfig: "import",
      resetConfig: "reset",
      getConfigSummary: "summary"
    }
  },
  flags: {
    module: "feature-flags",
    version: "5.0.0",
    category: CATEGORIES.CORE,
    methods: {
      isEnabled: { original: "isEnabled", args: ["key"], returns: "boolean" },
      enable: { original: "enable", args: ["key"], returns: "void" },
      disable: { original: "disable", args: ["key"], returns: "void" },
      toggle: { original: "toggle", args: ["key"], returns: "boolean" },
      list: { original: "getAll", args: [], returns: "object" },
      reset: { original: "reset", args: [], returns: "void" }
    },
    legacyMethods: {
      isFeatureEnabled: "isEnabled",
      enableFeature: "enable",
      disableFeature: "disable",
      toggleFeature: "toggle",
      getAllFeatures: "list",
      resetFeatures: "reset"
    }
  }
};
var core_default = CORE_CONTRACTS;
export {
  CORE_CONTRACTS,
  MODULE_ID,
  VERSION,
  core_default as default
};
