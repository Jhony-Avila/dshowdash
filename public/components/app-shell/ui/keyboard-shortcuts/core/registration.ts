/**
 * @file Keyboard Shortcuts — Registration
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/ui/keyboard-shortcuts/core/registration
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ../state.js (getShortcuts, getGroups, incrementMetric)
 * @requires ../utils/key-parser.js (parseCombo, comboToString)
 * 
 * @provides register, unregister, unregisterGroup, registerMany
 * @provides get, getAll, getByGroup, getGroupList
 * @provides isRegistered, setShortcutEnabled
 * 
 * @description
 * Core shortcut registration operations. Manages adding, removing, and
 * querying keyboard shortcuts with group support.
 * 
 * @example
 * import { register, unregister, getByGroup } from './registration.js';
 * register({ combo: 'ctrl+s', handler: save, group: 'file' });
 * unregisterGroup('file');
 * ============================================================================
 */
'use strict';

import { getShortcuts, getGroups, incrementMetric } from '../state.js';
import { parseCombo, comboToString } from '../utils/key-parser.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.keyboard-shortcuts.core.registration';

export function register(options: DynObj) {
  if (!options || !options.combo || typeof options.handler !== 'function') {
    return { ok: false, error: 'Invalid options' };
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
    scope: options.scope || 'global',
    group: options.group || null,
    description: options.description || '',
    enabled: options.enabled !== false,
    preventDefault: options.preventDefault !== false,
    stopPropagation: options.stopPropagation || false,
    allowInInput: options.allowInInput || false,
    registeredAt: Date.now()
  };
  
  shortcuts.set(key, shortcut);
  
  if (shortcut.group) {
    if (!groups.has(shortcut.group)) {
      groups.set(shortcut.group, new Set());
    }
    groups.get(shortcut.group).add(key);
  }
  
  incrementMetric('registered');
  
  return { ok: true, shortcut };
}

export function unregister(combo: DynObj) {
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

export function unregisterGroup(groupName: string) {
  const shortcuts = getShortcuts();
  const groups = getGroups();
  
  const group = groups.get(groupName);
  if (!group) {
    return { ok: false, error: `Group not found: ${groupName}` };
  }
  
  const removed: DynObj[] = [];
  group.forEach((key: string) => {
    shortcuts.delete(key);
    removed.push(key);
  });
  
  groups.delete(groupName);
  
  return { ok: true, removed };
}

export function registerMany(shortcuts: DynObj) {
  const results = [];
  
  for (let i = 0; i < shortcuts.length; i++) {
    results.push(register(shortcuts[i]));
  }
  
  return results;
}

export function get(combo: DynObj) {
  const shortcuts = getShortcuts();
  const parsed = parseCombo(combo);
  const key = comboToString(parsed);
  return shortcuts.get(key) || null;
}

export function getAll() {
  const shortcuts = getShortcuts();
  const result: DynObj[] = [];
  
  shortcuts.forEach((shortcut: DynObj) => {
    result.push(Object.assign({}, shortcut));
  });
  
  return result;
}

export function getByGroup(groupName: string) {
  const shortcuts = getShortcuts();
  const groups = getGroups();
  
  const group = groups.get(groupName);
  if (!group) return [];
  
  const result: DynObj[] = [];
  group.forEach((key: string) => {
    const shortcut = shortcuts.get(key);
    if (shortcut) {
      result.push(Object.assign({}, shortcut));
    }
  });
  
  return result;
}

export function getGroupList() {
  const groups = getGroups();
  const result: DynObj[] = [];
  
  groups.forEach((shortcuts: DynObj, name: string) => {
    result.push({
      name,
      count: shortcuts.size
    });
  });
  
  return result;
}

export function isRegistered(combo: DynObj) {
  const shortcuts = getShortcuts();
  const parsed = parseCombo(combo);
  const key = comboToString(parsed);
  return shortcuts.has(key);
}

export function setShortcutEnabled(combo: DynObj, enabled: boolean) {
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

export default {
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
