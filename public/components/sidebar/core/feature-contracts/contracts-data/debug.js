import { CATEGORIES } from "../categories.js";
const MODULE_ID = "sidebar-contracts-debug";
const VERSION = "1.2.0-ES6";
const DEBUG_CONTRACTS = {
  debug: {
    module: "debug-panel",
    version: "5.0.0",
    category: CATEGORIES.DEBUG,
    methods: {
      open: { original: "open", args: [], returns: "void" },
      close: { original: "close", args: [], returns: "void" },
      toggle: { original: "toggle", args: [], returns: "void" }
    },
    legacyMethods: { openDebugPanel: "open", closeDebugPanel: "close", toggleDebugPanel: "toggle" }
  }
};
var debug_default = DEBUG_CONTRACTS;
export {
  DEBUG_CONTRACTS,
  MODULE_ID,
  VERSION,
  debug_default as default
};
