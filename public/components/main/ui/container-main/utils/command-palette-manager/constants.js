const VERSION = "1.0.0";
const MODULE_ID = "container-main:command-palette";
const COMMAND_TYPES = Object.freeze({
  ACTION: "action",
  NAVIGATION: "navigation",
  SETTING: "setting",
  RECENT: "recent",
  SEARCH: "search"
});
const PALETTE_MODES = Object.freeze({
  COMMANDS: "commands",
  SEARCH: "search",
  GOTO: "goto",
  SETTINGS: "settings"
});
const DEFAULT_CONFIG = Object.freeze({
  hotkey: "ctrl+k",
  placeholder: "Digite um comando ou busque...",
  maxResults: 10,
  maxRecentCommands: 5,
  showIcons: true,
  showShortcuts: true,
  showCategories: true,
  fuzzySearch: true,
  highlightMatches: true,
  closeOnSelect: true,
  closeOnEscape: true,
  closeOnClickOutside: true,
  animationDuration: 150,
  debounceDelay: 100
});
const STORAGE_KEY = "dsd:container-main:command-palette";
export {
  COMMAND_TYPES,
  DEFAULT_CONFIG,
  MODULE_ID,
  PALETTE_MODES,
  STORAGE_KEY,
  VERSION
};
