import { CATEGORIES } from "../categories.js";
const MODULE_ID = "sidebar-contracts-performance";
const VERSION = "1.2.0-ES6";
const PERFORMANCE_CONTRACTS = {
  virtual: {
    module: "virtual-list",
    version: "5.0.0",
    category: CATEGORIES.PERFORMANCE,
    methods: {
      enable: { original: "enable", args: ["items"], returns: "void" },
      disable: { original: "disable", args: [], returns: "void" },
      isEnabled: { original: "isEnabled", args: [], returns: "boolean" },
      state: { original: "getState", args: [], returns: "object" },
      scrollTo: { original: "scrollToItem", args: ["itemId"], returns: "void" }
    },
    legacyMethods: {
      enableVirtualList: "enable",
      disableVirtualList: "disable",
      isVirtualListEnabled: "isEnabled",
      getVirtualListState: "state",
      scrollToVirtualItem: "scrollTo"
    }
  }
};
var performance_default = PERFORMANCE_CONTRACTS;
export {
  MODULE_ID,
  PERFORMANCE_CONTRACTS,
  VERSION,
  performance_default as default
};
