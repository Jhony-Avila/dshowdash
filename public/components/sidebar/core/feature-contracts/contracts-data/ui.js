import { CATEGORIES } from "../categories.js";
const MODULE_ID = "sidebar-contracts-ui";
const VERSION = "1.3.0-ES6";
const UI_CONTRACTS = {
  theme: {
    module: "theme-handler",
    version: "5.0.0",
    category: CATEGORIES.UI,
    methods: {
      set: { original: "setTheme", args: ["theme", "container?"], returns: "void", requiresEl: true },
      get: { original: "getTheme", args: [], returns: "string" },
      toggle: { original: "toggleTheme", args: ["container?"], returns: "string", requiresEl: true },
      list: { original: "getAvailableThemes", args: [], returns: "array" },
      auto: { original: "enable", altModule: "auto-theme", args: ["container?"], returns: "void", requiresEl: true },
      disableAuto: { original: "disable", altModule: "auto-theme", args: [], returns: "void" }
    },
    legacyMethods: {
      setTheme: "set",
      getTheme: "get",
      toggleTheme: "toggle",
      getAvailableThemes: "list",
      enableAutoTheme: "auto",
      disableAutoTheme: "disableAuto"
    }
  },
  layout: {
    module: "compact-mode",
    version: "5.0.0",
    category: CATEGORIES.UI,
    methods: {
      compact: { original: "enable", args: ["container?"], returns: "void", requiresEl: true },
      disableCompact: { original: "disable", args: ["container?"], returns: "void", requiresEl: true },
      toggleCompact: { original: "toggle", args: ["container?"], returns: "boolean", requiresEl: true },
      mini: { original: "enable", altModule: "mini-mode", args: ["container?"], returns: "void", requiresEl: true },
      disableMini: { original: "disable", altModule: "mini-mode", args: ["container?"], returns: "void", requiresEl: true },
      toggleMini: { original: "toggle", altModule: "mini-mode", args: ["container?"], returns: "boolean", requiresEl: true }
    },
    legacyMethods: {
      enableCompactMode: "compact",
      disableCompactMode: "disableCompact",
      toggleCompactMode: "toggleCompact",
      enableMiniMode: "mini",
      disableMiniMode: "disableMini",
      toggleMiniMode: "toggleMini"
    }
  },
  resize: {
    module: "resize-handler",
    version: "5.0.0",
    category: CATEGORIES.UI,
    methods: {
      setWidth: { original: "setWidth", args: ["container", "width"], returns: "void", requiresEl: true },
      resetWidth: { original: "resetWidth", args: ["container?"], returns: "void", requiresEl: true },
      getWidth: { original: "getWidth", args: ["container?"], returns: "number", requiresEl: true }
    },
    legacyMethods: { setWidth: "setWidth", resetWidth: "resetWidth", getWidth: "getWidth" }
  },
  context: {
    module: "context-menu",
    version: "5.0.0",
    category: CATEGORIES.UI,
    methods: {
      show: { original: "showMenu", args: ["x", "y", "itemId", "actions?"], returns: "void" },
      hide: { original: "hideMenu", args: [], returns: "void" }
    },
    legacyMethods: { showContextMenu: "show", hideContextMenu: "hide" }
  },
  submenu: {
    module: "submenu-handler",
    version: "5.0.0",
    category: CATEGORIES.UI,
    methods: {
      toggle: { original: "toggleSubmenu", args: ["element"], returns: "void" },
      closeAll: { original: "closeAllSubmenus", args: ["container?"], returns: "void", requiresEl: true }
    },
    legacyMethods: { toggleSubmenu: "toggle", closeAllSubmenus: "closeAll" }
  }
};
var ui_default = UI_CONTRACTS;
export {
  MODULE_ID,
  UI_CONTRACTS,
  VERSION,
  ui_default as default
};
