import { CATEGORIES } from "../categories.js";
const MODULE_ID = "sidebar-contracts-data";
const VERSION = "1.3.0-ES6";
const DATA_CONTRACTS = {
  badges: {
    module: "dynamic-badges",
    version: "5.0.0",
    category: CATEGORIES.DATA,
    methods: {
      set: { original: "setBadge", args: ["itemId", "options"], returns: "void" },
      get: { original: "getBadge", args: ["itemId"], returns: "object" },
      remove: { original: "removeBadge", args: ["itemId"], returns: "void" },
      increment: { original: "incrementBadge", args: ["itemId", "amount?"], returns: "void" },
      decrement: { original: "decrementBadge", args: ["itemId", "amount?"], returns: "void" },
      live: { original: "setLiveBadge", args: ["itemId", "fetchFn", "interval?"], returns: "void" },
      countdown: { original: "setCountdownBadge", args: ["itemId", "seconds", "onComplete?"], returns: "void" },
      listAll: { original: "getAllBadges", args: [], returns: "object" },
      clearAll: { original: "clearAllBadges", args: [], returns: "void" }
    },
    legacyMethods: {
      setDynamicBadge: "set",
      getDynamicBadge: "get",
      removeDynamicBadge: "remove",
      incrementBadge: "increment",
      decrementBadge: "decrement",
      setLiveBadge: "live",
      setCountdownBadge: "countdown",
      getAllBadges: "listAll",
      clearAllBadges: "clearAll"
    }
  },
  notifications: {
    module: "notification-dots",
    version: "5.0.0",
    category: CATEGORIES.DATA,
    methods: {
      show: { original: "showDot", args: ["itemId", "variant?", "count?"], returns: "void" },
      hide: { original: "hideDot", args: ["itemId"], returns: "void" },
      update: { original: "updateCount", args: ["itemId", "count"], returns: "void" },
      increment: { original: "incrementCount", args: ["itemId"], returns: "void" },
      clearAll: { original: "clearAll", args: [], returns: "void" }
    },
    legacyMethods: {
      showNotificationDot: "show",
      hideNotificationDot: "hide",
      updateNotificationCount: "update",
      incrementNotification: "increment",
      clearAllNotifications: "clearAll"
    }
  }
};
var data_default = DATA_CONTRACTS;
export {
  DATA_CONTRACTS,
  MODULE_ID,
  VERSION,
  data_default as default
};
