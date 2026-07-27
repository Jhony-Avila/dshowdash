import { getShortcuts, getGroups, incrementMetric } from "../state.js";
import { parseCombo, comboToString } from "../utils/key-parser.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.keyboard-shortcuts.core.registration";
function register(options) {
  if (!options || !options.combo || typeof options.handler !== "function") {
    return { ok: false, error: "Invalid options" };
  }
  const shortcuts = getShortcuts();
  const groups = getGroups();
  const parsed = parseCombo(options.combo);
  if (!parsed || !parsed.key) {
    return { ok: false, error: `Invalid combo: ${options.combo}` };
  }
  const key = comboToString(parsed);
  if (shortcuts.has(key) && !options.override) {
    return { ok: false, error: `Shortcut already registered: ${key}` };
  }
  const shortcut = {
    id: options.id || key,
    combo: key,
    parsed,
    handler: options.handler,
    scope: options.scope || "global",
    group: options.group || null,
    description: options.description || "",
    enabled: options.enabled !== false,
    preventDefault: options.preventDefault !== false,
    stopPropagation: options.stopPropagation || false,
    allowInInput: options.allowInInput || false,
    registeredAt: Date.now()
  };
  shortcuts.set(key, shortcut);
  if (shortcut.group) {
    if (!groups.has(shortcut.group)) {
      groups.set(shortcut.group, /* @__PURE__ */ new Set());
    }
    groups.get(shortcut.group).add(key);
  }
  incrementMetric("registered");
  return { ok: true, shortcut };
}
function unregister(combo) {
  const shortcuts = getShortcuts();
  const groups = getGroups();
  const parsed = parseCombo(combo);
  const key = comboToString(parsed);
  const shortcut = shortcuts.get(key);
  if (!shortcut) {
    return { ok: false, error: `Shortcut not found: ${key}` };
  }
  if (shortcut.group && groups.has(shortcut.group)) {
    groups.get(shortcut.group).delete(key);
  }
  shortcuts.delete(key);
  return { ok: true };
}
function unregisterGroup(groupName) {
  const shortcuts = getShortcuts();
  const groups = getGroups();
  const group = groups.get(groupName);
  if (!group) {
    return { ok: false, error: `Group not found: ${groupName}` };
  }
  const removed = [];
  group.forEach((key) => {
    shortcuts.delete(key);
    removed.push(key);
  });
  groups.delete(groupName);
  return { ok: true, removed };
}
function registerMany(shortcuts) {
  const results = [];
  for (let i = 0; i < shortcuts.length; i++) {
    results.push(register(shortcuts[i]));
  }
  return results;
}
function get(combo) {
  const shortcuts = getShortcuts();
  const parsed = parseCombo(combo);
  const key = comboToString(parsed);
  return shortcuts.get(key) || null;
}
function getAll() {
  const shortcuts = getShortcuts();
  const result = [];
  shortcuts.forEach((shortcut) => {
    result.push(Object.assign({}, shortcut));
  });
  return result;
}
function getByGroup(groupName) {
  const shortcuts = getShortcuts();
  const groups = getGroups();
  const group = groups.get(groupName);
  if (!group) return [];
  const result = [];
  group.forEach((key) => {
    const shortcut = shortcuts.get(key);
    if (shortcut) {
      result.push(Object.assign({}, shortcut));
    }
  });
  return result;
}
function getGroupList() {
  const groups = getGroups();
  const result = [];
  groups.forEach((shortcuts, name) => {
    result.push({
      name,
      count: shortcuts.size
    });
  });
  return result;
}
function isRegistered(combo) {
  const shortcuts = getShortcuts();
  const parsed = parseCombo(combo);
  const key = comboToString(parsed);
  return shortcuts.has(key);
}
function setShortcutEnabled(combo, enabled) {
  const shortcuts = getShortcuts();
  const parsed = parseCombo(combo);
  const key = comboToString(parsed);
  const shortcut = shortcuts.get(key);
  if (!shortcut) {
    return { ok: false, error: `Shortcut not found: ${key}` };
  }
  shortcut.enabled = !!enabled;
  return { ok: true };
}
var registration_default = {
  register,
  unregister,
  unregisterGroup,
  registerMany,
  get,
  getAll,
  getByGroup,
  getGroupList,
  isRegistered,
  setShortcutEnabled
};
export {
  MODULE_ID,
  VERSION,
  registration_default as default,
  get,
  getAll,
  getByGroup,
  getGroupList,
  isRegistered,
  register,
  registerMany,
  setShortcutEnabled,
  unregister,
  unregisterGroup
};
