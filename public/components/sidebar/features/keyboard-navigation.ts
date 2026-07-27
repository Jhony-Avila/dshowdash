// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-keyboard-navigation
// PURPOSE: Sidebar Features - Keyboard Navigation
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//   CSS_CLASSES as C from ../ui/constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   setupKeyboardNavigation() — exported function
//   setupGlobalShortcut() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.KEYBOARD_INITIALIZED
//   SIDEBAR_EVENTS.TOGGLE
// LISTENS (eventos):
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { CSS_CLASSES as C } from '../ui/constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '6.1.0-ES6';
export const MODULE_ID = 'sidebar-keyboard-navigation';

let _metrics = { keystrokes: 0, shortcuts: 0, navigations: 0, errors: 0 };
let _cleanups: (() => void)[] = [];
let _focusedIndex = -1;

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function getNavigableItems(container: HTMLElement) { return Array.from(container.querySelectorAll(`.${C.LINK}:not([aria-disabled="true"])`)); }

function focusItem(items: DynObj[], index: number) {
  if (index < 0 || index >= items.length) return;
  if (items[index]) items[index].focus();
  _focusedIndex = index;
  _metrics.navigations++;
}

export function init(eventBus: DynObj) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.KEYBOARD_INITIALIZED);
}

export function setupKeyboardNavigation(dependencies: DynObj) {
  const { container, eventBus, onNavigate, onToggleSection } = dependencies || {};
  if (!container) return () => {};
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  const handler = (e: DynObj) => {
    _metrics.keystrokes++;
    try {
      const items = getNavigableItems(container);
      const activeElement = document.activeElement;
      // @ts-expect-error strict migration — TS2345
      let currentIndex = items.indexOf(activeElement);
      if (currentIndex === -1) currentIndex = _focusedIndex;
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); focusItem(items, Math.min(currentIndex + 1, items.length - 1)); break;
        case 'ArrowUp': e.preventDefault(); focusItem(items, Math.max(currentIndex - 1, 0)); break;
        case 'Home': e.preventDefault(); focusItem(items, 0); break;
        case 'End': e.preventDefault(); focusItem(items, items.length - 1); break;
        case 'PageDown': e.preventDefault(); focusItem(items, Math.min(currentIndex + 5, items.length - 1)); break;
        case 'PageUp': e.preventDefault(); focusItem(items, Math.max(currentIndex - 5, 0)); break;
        case 'Enter':
        case ' ':
          if (activeElement && activeElement.classList.contains(C.LINK)) {
            const item = activeElement.closest(`.${C.ITEM}`);
            const itemId = item ? (item as HTMLElement).dataset.itemId : null;
            if (itemId) { e.preventDefault(); if (onNavigate) onNavigate(itemId); (activeElement as HTMLElement).click(); }
          } else if (activeElement && activeElement.classList.contains(C.GROUP_BUTTON)) {
            const section = activeElement.closest(`.${C.SECTION}`);
            const sectionId = section ? (section as HTMLElement).dataset.sectionId : null;
            if (sectionId) { e.preventDefault(); if (onToggleSection) onToggleSection(sectionId); }
          }
          break;
        case 'ArrowRight':
          if (activeElement) {
            const section = activeElement.closest(`.${C.SECTION}`);
            if (section && section.classList.contains(C.SECTION_COLLAPSIBLE) && !section.classList.contains(C.SECTION_EXPANDED)) {
              e.preventDefault(); const sectionId = (section as HTMLElement).dataset.sectionId; if (onToggleSection) onToggleSection(sectionId);
            }
          }
          break;
        case 'ArrowLeft':
          if (activeElement) {
            const section = activeElement.closest(`.${C.SECTION}`);
            if (section && section.classList.contains(C.SECTION_EXPANDED)) {
              e.preventDefault(); const sectionId = (section as HTMLElement).dataset.sectionId; if (onToggleSection) onToggleSection(sectionId);
            }
          }
          break;
        case '/':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            const searchInput = container.querySelector(`.${C.SEARCH_INPUT}`);
            if (searchInput && document.activeElement !== searchInput) { e.preventDefault(); searchInput.focus(); }
          }
          break;
      }
    } catch (error) { _metrics.errors++; }
  };
  container.addEventListener('keydown', handler);
  if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
  const cleanup = () => container.removeEventListener('keydown', handler);
  _cleanups.push(cleanup);
  return cleanup;
}

export function setupGlobalShortcut(dependencies: DynObj) {
  const { eventBus, shortcut = 'b', modifier = 'ctrl', onToggle } = dependencies || {};
  const handler = (e: DynObj) => {
    const modifierPressed = modifier === 'ctrl' ? e.ctrlKey : modifier === 'alt' ? e.altKey : modifier === 'meta' ? e.metaKey : modifier === 'shift' ? e.shiftKey : false;
    if (modifierPressed && e.key.toLowerCase() === shortcut.toLowerCase()) {
      e.preventDefault();
      _metrics.shortcuts++;
      if (onToggle) { onToggle(); }
      else {
        const sidebar = _getPort('sidebar');
        if (sidebar && sidebar.toggle) { sidebar.toggle(); }
        else { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.TOGGLE, { source: 'keyboard-shortcut' }); }
      }
    }
  };
  document.addEventListener('keydown', handler);
  const cleanup = () => document.removeEventListener('keydown', handler);
  _cleanups.push(cleanup);
  return cleanup;
}

export function destroy() { _cleanups.forEach(fn => { try { fn(); } catch { } }); _cleanups = []; _focusedIndex = -1; }
export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, focusedIndex: _focusedIndex, cleanupCount: _cleanups.length, metrics: getMetrics(), portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: _metrics.errors === 0 ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { noErrors: _metrics.errors === 0, cleanupCount: _cleanups.length, focusedIndex: _focusedIndex, portsInitialized: Ports.isInitialized() }, portsInitialized: Ports.isInitialized(), metrics: getMetrics() }; }

export default { init, setupKeyboardNavigation, setupGlobalShortcut, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
