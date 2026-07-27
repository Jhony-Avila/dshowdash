// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:focus-manager
// PURPOSE: Focus Manager - Gerenciamento de foco e acessibilidade
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createFocusManager() — exported function
//   getFocusManager() — exported function
//   resetFocusManager() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'blur'
//   'focus'
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE6';
export const MODULE_ID = 'container-main:focus-manager';

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

export function createFocusManager(options: Record<string, unknown> = {}) {
  const { trapSelector = null, autoFocus = true, restoreFocus = true, wrapAround = true } = options;

  const _logger = createLogger(MODULE_ID);
  const _traps = new Map();
  const _history: Record<string, unknown>[] = [];
  let _activeTrap: Record<string, unknown> | null = null;
  let _counter = 0;
  let _metrics = { trapsCreated: 0, focusChanges: 0 };

  function _getFocusableElements(container: HTMLElement) {
    const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));

    // @ts-expect-error TS migration - TS2339, TS2345
    return elements.filter(el => !el.disabled && el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden');
  }

  function _handleKeydown(e: KeyboardEvent) {
    if (!_activeTrap) return;
    if (e.key !== 'Tab') return;

    const focusable = _getFocusableElements((_activeTrap.container as HTMLElement));
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement;

    if (e.shiftKey) {
      if (current === first || !(_activeTrap.container as HTMLElement).contains(current)) {
        e.preventDefault();

        // @ts-expect-error TS migration - TS2339
        if (wrapAround) last.focus();
      }
    } else {
      if (current === last || !(_activeTrap.container as HTMLElement).contains(current)) {
        e.preventDefault();

        // @ts-expect-error TS migration - TS2339
        if (wrapAround) first.focus();
      }
    }
  }

  document.addEventListener('keydown', _handleKeydown);

  const manager = {
    // Cria focus trap
    createTrap(container: HTMLElement, options: Record<string, unknown> = {}) {
      // @ts-expect-error strict migration — TS2322
      if (typeof container === 'string') container = document.querySelector(container);
      if (!container) return null;

      const id = `trap-${++_counter}`;
      const config = { id, container, initialFocus: options.initialFocus || null, returnFocus: options.returnFocus !== false, previousFocus: document.activeElement };

      _traps.set(id, config);
      _metrics.trapsCreated++;
      return id;
    },

    // Ativa trap
    activateTrap(id: string) {
      const trap = _traps.get(id);
      if (!trap) return false;

      if (_activeTrap && restoreFocus) {
        _history.push(_activeTrap);
      }

      _activeTrap = trap;

      const focusable = _getFocusableElements(trap.container);
      if (trap.initialFocus) {
        const initial: any = typeof trap.initialFocus === 'string' ? trap.container.querySelector(trap.initialFocus) : trap.initialFocus;
        initial?.focus();
      } else if (autoFocus && focusable.length > 0) {

        // @ts-expect-error TS migration - TS2339
        focusable[0].focus();
      }

      _metrics.focusChanges++;
      return true;
    },

    // Desativa trap
    deactivateTrap(id: string) {
      const trap = _traps.get(id);
      if (!trap) return false;

      if (_activeTrap?.id === id) {
        if (trap.returnFocus && trap.previousFocus) {
          trap.previousFocus.focus();
        }

        if (_history.length > 0) {
          _activeTrap = _history.pop() as Record<string, unknown>;
        } else {
          _activeTrap = null;
        }
      }

      return true;
    },

    // Remove trap
    removeTrap(id: string) {
      this.deactivateTrap(id);
      return _traps.delete(id);
    },

    // Focus no primeiro elemento focável
    focusFirst(container: HTMLElement) {
      // @ts-expect-error strict migration — TS2322
      if (typeof container === 'string') container = document.querySelector(container);
      const focusable = _getFocusableElements(container || document.body);

      // @ts-expect-error TS migration - TS2339
      if (focusable.length > 0) { focusable[0].focus(); _metrics.focusChanges++; return true; }
      return false;
    },

    // Focus no último elemento focável
    focusLast(container: HTMLElement) {
      // @ts-expect-error strict migration — TS2322
      if (typeof container === 'string') container = document.querySelector(container);
      const focusable = _getFocusableElements(container || document.body);

      // @ts-expect-error TS migration - TS2339
      if (focusable.length > 0) { focusable[focusable.length - 1].focus(); _metrics.focusChanges++; return true; }
      return false;
    },

    // Próximo/anterior focável
    focusNext() {
      // @ts-expect-error TS migration - TS2551
      const focusable = _getFocusableElements((_activeTrap as unknown as HTMLElement)?.container || document.body);
      // @ts-expect-error strict migration — TS2345
      const current = focusable.indexOf(document.activeElement);
      const next = (current + 1) % focusable.length;

      // @ts-expect-error TS migration - TS2339
      focusable[next]?.focus();
      (_metrics as any).focusChanges++;
    },

    focusPrevious() {
      // @ts-expect-error TS migration - TS2551
      const focusable = _getFocusableElements((_activeTrap as unknown as HTMLElement)?.container || document.body);
      // @ts-expect-error strict migration — TS2345
      const current = focusable.indexOf(document.activeElement);
      const prev = current <= 0 ? focusable.length - 1 : current - 1;

      // @ts-expect-error TS migration - TS2339
      focusable[prev]?.focus();
      _metrics.focusChanges++;
    },

    // Salva/restaura foco
    saveFocus(key = 'default') {
      const saved = document.activeElement;
      _history.push({ key, element: saved });
      return saved;
    },

    restoreFocus(key = 'default') {
      const index = _history.findIndex(h => h.key === key);
      if (index !== -1) {
        const { element } = _history.splice(index, 1)[0];
        // @ts-expect-error TS migration - TS2339
        element?.focus();
        _metrics.focusChanges++;
        return true;
      }
      return false;
    },

    // Obtém elementos focáveis
    getFocusable(container: HTMLElement) {
      // @ts-expect-error strict migration — TS2322
      if (typeof container === 'string') container = document.querySelector(container);
      return _getFocusableElements(container || document.body);
    },

    // Verifica se é focável
    isFocusable(element: HTMLElement) {
      if (!element) return false;
      // @ts-expect-error TS migration - TS2339
      return element.matches(FOCUSABLE_SELECTOR) && !element.disabled && element.offsetParent !== null;
    },

    // Skip link helper
    createSkipLink(targetId: unknown, label = 'Pular para conteúdo principal') {
      const link = document.createElement('a');
      link.href = `#${targetId}`;
      link.className = 'cm-skip-link';
      link.textContent = label;
      link.style.cssText = 'position:absolute;top:-100px;left:0;background:#1a1a2e;color:#fff;padding:8px 16px;z-index:99999;transition:top 0.2s;';
      link.addEventListener('focus', () => { link.style.top = '0'; });
      link.addEventListener('blur', () => { link.style.top = '-100px'; });
      document.body.insertBefore(link, document.body.firstChild);
      return link;
    },

    getActiveTrap() { return _activeTrap?.id || null; },
    getMetrics() { return { ..._metrics, traps: _traps.size, historySize: _history.length }; },
    resetMetrics() { _metrics = { trapsCreated: 0, focusChanges: 0 }; },

    healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, traps: _traps.size, activeTrap: _activeTrap?.id || null, metrics: _metrics }; },
    info() { return { moduleId: MODULE_ID, version: VERSION, traps: _traps.size, activeTrap: _activeTrap?.id || null }; },

    destroy() {
      document.removeEventListener('keydown', _handleKeydown);
      _traps.clear();
      _history.length = 0;
      _activeTrap = null;
    }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getFocusManager(options: Record<string, unknown> = {}) { if (!_instance) _instance = createFocusManager(options); return _instance; }
export function resetFocusManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, createFocusManager, getFocusManager, resetFocusManager, info, healthCheck };
