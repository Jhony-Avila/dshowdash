// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-MIGRATION-PHASE5)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.state.url-sync
// PURPOSE: URL State Sync — Sincroniza filtros/tab/contexto com query params da URL
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   URLStateSync — Factory function
//   ALLOWED_KEYS — Whitelisted URL parameter keys
//   info(), healthCheck()
//
// @origin Adapted from panel-01/utils/url-state.js for nav-admin domain
// @changelog
//   10.2.0-MIGRATION-PHASE5: Initial creation — FASE 5 E.1
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.2.0-MIGRATION-PHASE5';
export const MODULE_ID = 'panel-nav-admin.state.url-sync';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[URLStateSync]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * Whitelisted URL parameter keys for nav-admin.
 * Only these keys will be read from or written to the URL.
 * @type {Array<string>}
 */
export const ALLOWED_KEYS = [
  'tab',        // Active tab: items, sections, diagnostic
  'context',    // Display context: sidebar, navrail, header, footer
  'section',    // Section filter
  'q',          // Search query
  'sort',       // Sort field
  'order',      // Sort order: asc, desc
  'page',       // Current page
  'view',       // View mode: table, card, split
  'level',      // Permission level filter
  'status'      // Active/inactive filter
];

/**
 * Factory: creates a URL state synchronizer.
 * Reads/writes state to the URL hash or query parameters.
 *
 * @param {Object} [options]
 * @param {boolean} [options.useHash=true] — Use hash params (#?key=val) instead of query params
 * @param {Function} [options.onPopState] — Callback(state) on browser back/forward
 * @returns {Object} URLStateSync instance
 */
export function URLStateSync(options: Record<string, unknown> = {}) {
  const { useHash = true, onPopState } = options;

  let _popStateHandler: (() => void) | null = null;

  /**
   * Read current state from URL.
   * @returns {Object} Parsed state object with only ALLOWED_KEYS
   */
  function getState() {
    try {
      const params = _getParams();
      const state: Record<string, string> = {};
      for (const key of ALLOWED_KEYS) {
        const val = params.get(key);
        if (val !== null && val !== '') {
          state[key] = val;
        }
      }
      return state;
    } catch (e: any) {
      _log('error', 'Failed to read URL state:', e.message);
      return {};
    }
  }

  /**
   * Write state to URL.
   * Only ALLOWED_KEYS are written. Null/undefined/empty values are removed.
   * @param {Object} state — Key-value pairs to set
   * @param {boolean} [replace=true] — Use replaceState (true) or pushState (false)
   */
  function setState(state: Record<string, unknown>, replace = true) {
    try {
      const params = _getParams();

      for (const key of ALLOWED_KEYS) {
        if (state[key] !== undefined && state[key] !== null && state[key] !== '') {
          params.set(key, String(state[key]));
        } else if (key in state) {
          params.delete(key);
        }
      }

      _setParams(params, replace);
      _log('debug', 'URL state updated');
    } catch (e: any) {
      _log('error', 'Failed to set URL state:', e.message);
    }
  }

  /**
   * Clear all nav-admin state from URL.
   */
  function clearState() {
    try {
      const params = _getParams();
      for (const key of ALLOWED_KEYS) {
        params.delete(key);
      }
      _setParams(params, true);
    } catch (e: any) {
      _log('error', 'Failed to clear URL state:', e.message);
    }
  }

  /**
   * Get a shareable URL with the given state.
   * @param {Object} state
   * @returns {string}
   */
  function getShareableURL(state: Record<string, unknown>) {
    const url = new URL(window.location.href);
    if (useHash) {
      const params = new URLSearchParams();
      for (const key of ALLOWED_KEYS) {
        if (state[key] !== undefined && state[key] !== null && state[key] !== '') {
          params.set(key, String(state[key]));
        }
      }
      url.hash = '?' + params.toString();
    } else {
      for (const key of ALLOWED_KEYS) {
        if (state[key] !== undefined && state[key] !== null && state[key] !== '') {
          url.searchParams.set(key, String(state[key]));
        } else {
          url.searchParams.delete(key);
        }
      }
    }
    return url.toString();
  }

  /**
   * Start listening for popstate (browser back/forward).
   */
  function startListening() {
    if (_popStateHandler) return;
    _popStateHandler = () => {
      const state = getState();
      if (typeof onPopState === 'function') {
        onPopState(state);
      }
    };
    window.addEventListener('popstate', _popStateHandler);
    _log('debug', 'PopState listener started');
  }

  /**
   * Stop listening for popstate.
   */
  function stopListening() {
    if (_popStateHandler) {
      window.removeEventListener('popstate', _popStateHandler);
      _popStateHandler = null;
    }
  }

  /**
   * Get URLSearchParams from current URL.
   * @private
   * @returns {URLSearchParams}
   */
  function _getParams() {
    if (useHash) {
      const hash = window.location.hash;
      const qIndex = hash.indexOf('?');
      return qIndex >= 0 ? new URLSearchParams(hash.substring(qIndex + 1)) : new URLSearchParams();
    }
    return new URLSearchParams(window.location.search);
  }

  /**
   * Set URLSearchParams to current URL.
   * @private
   * @param {URLSearchParams} params
   * @param {boolean} replace
   */
  function _setParams(params: URLSearchParams, replace: boolean) {
    const str = params.toString();
    if (useHash) {
      const newHash = str ? '#?' + str : '';
      if (replace) {
        history.replaceState(null, '', window.location.pathname + window.location.search + newHash);
      } else {
        history.pushState(null, '', window.location.pathname + window.location.search + newHash);
      }
    } else {
      const newSearch = str ? '?' + str : '';
      if (replace) {
        history.replaceState(null, '', window.location.pathname + newSearch + window.location.hash);
      } else {
        history.pushState(null, '', window.location.pathname + newSearch + window.location.hash);
      }
    }
  }

  /** Destroy: stop listeners. */
  function destroy() {
    stopListening();
  }

  return { getState, setState, clearState, getShareableURL, startListening, stopListening, destroy };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, allowedKeys: ALLOWED_KEYS };
}

export function healthCheck() {
  const historyAvailable = typeof history.pushState === 'function';
  return { status: historyAvailable ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, historyAvailable };
}

export default { URLStateSync, ALLOWED_KEYS, injectPorts, info, healthCheck, VERSION, MODULE_ID };
