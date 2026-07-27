// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navigation-history-manager
// PURPOSE: Factory para criacao do gerenciador de historico de navegacao
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger — from '../logger.js'
//   VERSION, MODULE_ID, NAVIGATION_TYPES, DEFAULT_CONFIG — from './constants.js'
//   restoreHistory — from './storage/persistence.js'
//   setupBrowserHistory — from './browser/integration.js'
//   push, replace, back, forward, go — from './navigation/core.js'
//   canGoBack, canGoForward, getCurrent, getCurrentIndex,
//     getHistory, getHistorySize, getEntry, getBackStack,
//     getForwardStack, findByPanelId, getLastVisited,
//     clearForward, clear — from './navigation/queries.js'
//
// PROVIDES:
//   createNavigationHistory(options) — factory que retorna manager com:
//     init(), push(), replace(), back(), forward(), go(),
//     goToEntry(), canGoBack(), canGoForward(), getCurrent(),
//     getHistory(), subscribe(), onNavigate(),
//     navigateWithTransition(), healthCheck(), info(), reset()
//
// RECEIVES (via init/options): options (maxHistorySize, persistHistory, useBrowserHistory, etc.)
// EMITS (eventos): nenhum (notifica via _listeners)
// LISTENS (eventos): popstate (via browser integration)
// WINDOW ACCESS: document.querySelector('.dsd-container__content')
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from '../logger.js';
import { VERSION, MODULE_ID, NAVIGATION_TYPES, DEFAULT_CONFIG } from './constants.js';
import { restoreHistory } from './storage/persistence.js';
import { setupBrowserHistory } from './browser/integration.js';
import { push, replace, back, forward, go } from './navigation/core.js';
import { canGoBack, canGoForward, getCurrent, getCurrentIndex, getHistory, getHistorySize, getEntry, getBackStack, getForwardStack, findByPanelId, getLastVisited, clearForward, clear } from './navigation/queries.js';

declare const notify: (...args: any[]) => void;
declare const save: (...args: any[]) => void;
export function createNavigationHistory(options: Record<string, any> = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };
  const _logger = createLogger(MODULE_ID);
  
  const state = {
    history: [] as unknown[],
    currentIndex: -1,
    initialized: false,
    browserHistoryEnabled: false,
    isNavigating: false
  };
  
  const _listeners = new Set();

  function _notifyListeners(event: string, data: Record<string, unknown>) {
    notify(_listeners, event, data, _logger);
  }

  function _saveHistory() {
    save(state.history, state.currentIndex, config, _logger);
  }

  const manager = {
    async init() {
      if (state.initialized) return this;
      
      const restored = await restoreHistory(config, _logger);
      state.history = restored.history;
      state.currentIndex = restored.currentIndex;
      
      state.browserHistoryEnabled = setupBrowserHistory(state, config, _notifyListeners, _logger);
      state.initialized = true;
      
      _logger.debug('Navigation history initialized', { 
        size: state.history.length, 
        browserHistory: state.browserHistoryEnabled 
      });
      
      return this;
    },

    push(panelId: string, entryState: Record<string, any> = {}, title = '') {
      return push(state, config, panelId, entryState, title, _notifyListeners, _saveHistory, _logger);
    },

    replace(panelId: string, entryState: Record<string, any> = {}, title = '') {
      return replace(state, config, panelId, entryState, title, _notifyListeners, _saveHistory, _logger);
    },

    back() {
      return back(state, config, _notifyListeners, _saveHistory, _logger);
    },

    forward() {
      return forward(state, config, _notifyListeners, _saveHistory, _logger);
    },

    go(delta: number) {
      return go(state, config, delta, _notifyListeners, _saveHistory, _logger);
    },

    goToEntry(entryId: unknown) {
      const index = state.history.findIndex(h => (h as Record<string, unknown>).id === entryId);
      if (index === -1) {
        _logger.warn('Entry not found:', (entryId as Record<string, unknown>));
        return null;
      }
      return this.go(index - state.currentIndex);
    },

    canGoBack() { return canGoBack(state); },
    canGoForward() { return canGoForward(state); },
    getCurrent() { return getCurrent(state); },
    getCurrentIndex() { return getCurrentIndex(state); },
    getHistory() { return getHistory(state); },
    getHistorySize() { return getHistorySize(state); },
    getEntry(index: number) { return getEntry(state, index); },
    getBackStack() { return getBackStack(state); },
    getForwardStack() { return getForwardStack(state); },
    findByPanelId(panelId: string) { return findByPanelId(state, panelId); },
    getLastVisited(panelId: string) { return getLastVisited(state, panelId); },
    clearForward() { clearForward(state, _notifyListeners, _saveHistory); },
    clear() { clear(state, _notifyListeners, _saveHistory, _logger); },

    subscribe(listener: (...args: unknown[]) => void) {
      if (typeof listener === 'function') {
        _listeners.add(listener);
        return () => _listeners.delete(listener);
      }
      return () => {};
    },

    onNavigate(callback: (...args: unknown[]) => void) {
      // @ts-expect-error strict migration — TS2322
      config.onNavigate = callback;
      return this;
    },

    async navigateWithTransition(panelId: string, loadContentFn: unknown, transitionManager: unknown, options: Record<string, any> = {}) {
      const { state: entryState = {}, title = '', transitionType = 'auto', replace: doReplace = false } = options;
      const lastVisit = this.getLastVisited(panelId);
      const direction = lastVisit && lastVisit.index < state.currentIndex ? 'backward' : 'forward';
      const entry = doReplace ? this.replace(panelId, entryState, title) : this.push(panelId, entryState, title);
      const content = await (loadContentFn as (...args: unknown[]) => unknown)(panelId, entryState);

      if (transitionManager && content) {
        const container = document.querySelector('.dsd-container__content');
        if (container) {
          await ((transitionManager as Record<string, unknown>).replaceContent as (...args: unknown[]) => unknown)(container, content, { type: transitionType, direction });
        }
      }

      return { entry, content, direction };
    },

    healthCheck() {
      return {
        status: 'HEALTHY',
        version: VERSION,
        moduleId: MODULE_ID,
        initialized: state.initialized,
        historySize: state.history.length,
        currentIndex: state.currentIndex,
        canGoBack: this.canGoBack(),
        canGoForward: this.canGoForward(),
        browserHistoryEnabled: state.browserHistoryEnabled
      };
    },

    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        types: Object.values(NAVIGATION_TYPES),
        config: {
          maxHistorySize: config.maxHistorySize,
          persistHistory: config.persistHistory,
          useBrowserHistory: config.useBrowserHistory
        },
        current: this.getCurrent()
      };
    },

    reset() {
      this.clear();
      _listeners.clear();
      state.initialized = false;
    }
  };

  return manager;
}
