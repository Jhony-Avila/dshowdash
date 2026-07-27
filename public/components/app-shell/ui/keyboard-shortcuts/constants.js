const VERSION = "1.0.0-AAA";
const MODULE_ID = "app-shell-keyboard-shortcuts";
const MODIFIER_KEYS = Object.freeze({
  CTRL: "ctrl",
  ALT: "alt",
  SHIFT: "shift",
  META: "meta"
});
const SHORTCUT_SCOPES = Object.freeze({
  GLOBAL: "global",
  REGION: "region",
  MODAL: "modal",
  INPUT: "input"
});
const DEFAULT_CONFIG = Object.freeze({
  preventDefault: true,
  stopPropagation: true,
  allowInInputs: false,
  debounceMs: 100,
  showHelp: true,
  helpKey: "shift+?"
});
export {
  DEFAULT_CONFIG,
  MODIFIER_KEYS,
  MODULE_ID,
  SHORTCUT_SCOPES,
  VERSION
};
