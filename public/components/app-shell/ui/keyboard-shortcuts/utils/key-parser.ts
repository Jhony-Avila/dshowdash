/**
 * @file Keyboard Shortcuts - Key Parser
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/ui/keyboard-shortcuts/utils/key-parser
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires none (standalone utility)
 * 
 * @provides normalizeKey, parseCombo, comboToString, eventToCombo
 * @provides matchesCombo, isInputElement
 * 
 * @description
 * Utilities for normalizing and parsing keyboard combinations.
 * Handles key aliases, modifier detection, and combo matching.
 * 
 * @example
 * import { parseCombo, matchesCombo, eventToCombo } from './key-parser.js';
 * const combo = parseCombo('ctrl+shift+s');
 * const eventCombo = eventToCombo(keyboardEvent);
 * if (matchesCombo(eventCombo, combo)) executeShortcut();
 * ============================================================================
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.keyboard-shortcuts.utils.key-parser';

// ============================================================================
// KEY ALIASES
// ============================================================================

const KEY_ALIASES = {
  'control': 'ctrl',
  'command': 'meta',
  'cmd': 'meta',
  'option': 'alt',
  'esc': 'escape',
  'del': 'delete',
  'ins': 'insert',
  'pgup': 'pageup',
  'pgdn': 'pagedown',
  'up': 'arrowup',
  'down': 'arrowdown',
  'left': 'arrowleft',
  'right': 'arrowright',
  ' ': 'space',
  'spacebar': 'space'
};

// ============================================================================
// NORMALIZAÇÃO
// ============================================================================

/**
 * Normaliza uma tecla para formato padrão
 * @param {string} key
 * @returns {string}
 */
export function normalizeKey(key: string) {
  if (!key) return '';
  key = key.toLowerCase().trim();
  return (KEY_ALIASES as DynObj)[key] || key;
}

// ============================================================================
// PARSE
// ============================================================================

/**
 * Faz parse de uma string de combo (ex: 'ctrl+s')
 * @param {string} combo
 * @returns {Object|null} { modifiers: {...}, key: string }
 */
export function parseCombo(combo: DynObj) {
  if (!combo) return null;
  
  const parts = combo.toLowerCase().split('+').map((p: DynObj) => p.trim());
  const modifiers = { ctrl: false, alt: false, shift: false, meta: false };
  let key = null;
  
  for (let i = 0; i < parts.length; i++) {
    const part = normalizeKey(parts[i]);
    if (part === 'ctrl') modifiers.ctrl = true;
    else if (part === 'alt') modifiers.alt = true;
    else if (part === 'shift') modifiers.shift = true;
    else if (part === 'meta') modifiers.meta = true;
    else key = part;
  }
  
  return { modifiers, key };
}

/**
 * Converte combo parseado para string
 * @param {Object} parsed
 * @returns {string}
 */
export function comboToString(parsed: DynObj) {
  if (!parsed) return '';
  
  const parts = [];
  if (parsed.modifiers.ctrl) parts.push('ctrl');
  if (parsed.modifiers.alt) parts.push('alt');
  if (parsed.modifiers.shift) parts.push('shift');
  if (parsed.modifiers.meta) parts.push('meta');
  if (parsed.key) parts.push(parsed.key);
  return parts.join('+');
}

/**
 * Extrai combo de um evento de teclado
 * @param {KeyboardEvent} event
 * @returns {Object|null}
 */
export function eventToCombo(event: DynObj) {
  const modifiers = {
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey
  };
  
  const key = normalizeKey(event.key);
  
  // Ignora se é apenas tecla modificadora
  if (['ctrl', 'alt', 'shift', 'meta', 'control'].indexOf(key) >= 0) {
    return null;
  }
  
  return { modifiers, key };
}

/**
 * Verifica se dois combos são iguais
 * @param {Object} eventCombo
 * @param {Object} shortcutCombo
 * @returns {boolean}
 */
export function matchesCombo(eventCombo: DynObj, shortcutCombo: DynObj) {
  if (!eventCombo || !shortcutCombo) return false;
  
  return eventCombo.key === shortcutCombo.key &&
    eventCombo.modifiers.ctrl === shortcutCombo.modifiers.ctrl &&
    eventCombo.modifiers.alt === shortcutCombo.modifiers.alt &&
    eventCombo.modifiers.shift === shortcutCombo.modifiers.shift &&
    eventCombo.modifiers.meta === shortcutCombo.modifiers.meta;
}

/**
 * Verifica se elemento é um input
 * @param {HTMLElement} el
 * @returns {boolean}
 */
export function isInputElement(el: DynObj) {
  if (!el) return false;
  const tagName = el.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || el.isContentEditable;
}

export default {
  normalizeKey,
  parseCombo,
  comboToString,
  eventToCombo,
  matchesCombo,
  isInputElement
};
