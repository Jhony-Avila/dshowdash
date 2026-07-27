const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.keyboard-shortcuts.utils.key-parser";
const KEY_ALIASES = {
  "control": "ctrl",
  "command": "meta",
  "cmd": "meta",
  "option": "alt",
  "esc": "escape",
  "del": "delete",
  "ins": "insert",
  "pgup": "pageup",
  "pgdn": "pagedown",
  "up": "arrowup",
  "down": "arrowdown",
  "left": "arrowleft",
  "right": "arrowright",
  " ": "space",
  "spacebar": "space"
};
function normalizeKey(key) {
  if (!key) return "";
  key = key.toLowerCase().trim();
  return KEY_ALIASES[key] || key;
}
function parseCombo(combo) {
  if (!combo) return null;
  const parts = combo.toLowerCase().split("+").map((p) => p.trim());
  const modifiers = { ctrl: false, alt: false, shift: false, meta: false };
  let key = null;
  for (let i = 0; i < parts.length; i++) {
    const part = normalizeKey(parts[i]);
    if (part === "ctrl") modifiers.ctrl = true;
    else if (part === "alt") modifiers.alt = true;
    else if (part === "shift") modifiers.shift = true;
    else if (part === "meta") modifiers.meta = true;
    else key = part;
  }
  return { modifiers, key };
}
function comboToString(parsed) {
  if (!parsed) return "";
  const parts = [];
  if (parsed.modifiers.ctrl) parts.push("ctrl");
  if (parsed.modifiers.alt) parts.push("alt");
  if (parsed.modifiers.shift) parts.push("shift");
  if (parsed.modifiers.meta) parts.push("meta");
  if (parsed.key) parts.push(parsed.key);
  return parts.join("+");
}
function eventToCombo(event) {
  const modifiers = {
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey
  };
  const key = normalizeKey(event.key);
  if (["ctrl", "alt", "shift", "meta", "control"].indexOf(key) >= 0) {
    return null;
  }
  return { modifiers, key };
}
function matchesCombo(eventCombo, shortcutCombo) {
  if (!eventCombo || !shortcutCombo) return false;
  return eventCombo.key === shortcutCombo.key && eventCombo.modifiers.ctrl === shortcutCombo.modifiers.ctrl && eventCombo.modifiers.alt === shortcutCombo.modifiers.alt && eventCombo.modifiers.shift === shortcutCombo.modifiers.shift && eventCombo.modifiers.meta === shortcutCombo.modifiers.meta;
}
function isInputElement(el) {
  if (!el) return false;
  const tagName = el.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select" || el.isContentEditable;
}
var key_parser_default = {
  normalizeKey,
  parseCombo,
  comboToString,
  eventToCombo,
  matchesCombo,
  isInputElement
};
export {
  MODULE_ID,
  VERSION,
  comboToString,
  key_parser_default as default,
  eventToCombo,
  isInputElement,
  matchesCombo,
  normalizeKey,
  parseCombo
};
