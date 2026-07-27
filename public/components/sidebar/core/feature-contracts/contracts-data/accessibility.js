import { CATEGORIES } from "../categories.js";
const MODULE_ID = "sidebar-contracts-accessibility";
const VERSION = "1.2.0-ES6";
const ACCESSIBILITY_CONTRACTS = {
  a11y: {
    module: "screen-reader",
    version: "5.0.0",
    category: CATEGORIES.ACCESSIBILITY,
    methods: {
      announce: { original: "announce", args: ["message", "priority?"], returns: "void" },
      enhance: { original: "enhance", args: ["container?"], returns: "void", requiresEl: true },
      highContrast: { original: "enableHighContrast", args: ["container?"], returns: "void", requiresEl: true },
      disableHighContrast: { original: "disableHighContrast", args: ["container?"], returns: "void", requiresEl: true },
      largeText: { original: "enableLargeText", args: ["container?"], returns: "void", requiresEl: true },
      disableLargeText: { original: "disableLargeText", args: ["container?"], returns: "void", requiresEl: true }
    },
    legacyMethods: {
      announce: "announce",
      enhanceAccessibility: "enhance",
      enableHighContrast: "highContrast",
      disableHighContrast: "disableHighContrast",
      enableLargeText: "largeText",
      disableLargeText: "disableLargeText"
    }
  },
  landmarks: {
    module: "accessibility-landmarks",
    version: "5.0.0",
    category: CATEGORIES.ACCESSIBILITY,
    methods: {
      apply: { original: "applyLandmarks", args: ["container?"], returns: "void", requiresEl: true },
      updateActive: { original: "updateActiveItem", args: ["itemId"], returns: "void" },
      setLoading: { original: "setLoadingState", args: ["isLoading", "message?"], returns: "void" }
    },
    legacyMethods: {
      applyLandmarks: "apply",
      updateActiveItemAria: "updateActive",
      setLoadingAria: "setLoading"
    }
  },
  shortcuts: {
    module: "keyboard-shortcuts-extended",
    version: "5.0.0",
    category: CATEGORIES.ACCESSIBILITY,
    methods: {
      register: { original: "register", args: ["id", "shortcut"], returns: "void" },
      unregister: { original: "unregister", args: ["id"], returns: "void" },
      enable: { original: "enable", args: [], returns: "void" },
      disable: { original: "disable", args: [], returns: "void" },
      list: { original: "getAll", args: [], returns: "object" },
      showHelp: { original: "showHelp", args: [], returns: "void" }
    },
    legacyMethods: {
      registerShortcut: "register",
      unregisterShortcut: "unregister",
      enableShortcuts: "enable",
      disableShortcuts: "disable",
      getAllShortcuts: "list",
      showShortcutsHelp: "showHelp"
    }
  }
};
var accessibility_default = ACCESSIBILITY_CONTRACTS;
export {
  ACCESSIBILITY_CONTRACTS,
  MODULE_ID,
  VERSION,
  accessibility_default as default
};
