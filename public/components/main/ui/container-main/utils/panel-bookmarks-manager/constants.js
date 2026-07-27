const VERSION = "1.0.0";
const MODULE_ID = "container-main:panel-bookmarks";
const BOOKMARK_TYPES = Object.freeze({
  PANEL: "panel",
  STATE: "state",
  SHORTCUT: "shortcut"
});
const SORT_MODES = Object.freeze({
  MANUAL: "manual",
  ALPHABETICAL: "alphabetical",
  RECENT: "recent",
  FREQUENCY: "frequency"
});
const DEFAULT_CONFIG = Object.freeze({
  maxBookmarks: 50,
  maxRecentPanels: 10,
  persistBookmarks: true,
  trackFrequency: true,
  enableHotkeys: true,
  hotkeyPrefix: "alt",
  sortMode: SORT_MODES.MANUAL,
  showNotifications: true
});
const STORAGE_KEY = "dsd:container-main:bookmarks";
const RECENT_KEY = "dsd:container-main:recent-panels";
const FREQUENCY_KEY = "dsd:container-main:panel-frequency";
export {
  BOOKMARK_TYPES,
  DEFAULT_CONFIG,
  FREQUENCY_KEY,
  MODULE_ID,
  RECENT_KEY,
  SORT_MODES,
  STORAGE_KEY,
  VERSION
};
