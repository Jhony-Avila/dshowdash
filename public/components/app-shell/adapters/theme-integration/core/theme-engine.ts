// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
/**
 * @file Theme Integration — Theme Engine
 * @version 1.2.0-ES6
 * @changelog v1.2.0-ES6 - var → const/let migration
 * @module app-shell/adapters/theme-integration/core/theme-engine
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ../state.js (_state, incrementMetric, notifySubscribers, getConfig)
 * @requires ../constants.js (THEMES, CSS_VARS, STORAGE_KEY)
 * 
 * @provides getCurrentTheme, setTheme, toggleTheme, applyTheme, resolveTheme
 * @provides getSystemPreference, watchSystemPreference
 * 
 * @browserAPI matchMedia, localStorage, document.documentElement.classList
 * 
 * @description
 * Core theme engine operations. Handles theme switching, system preference
 * detection, CSS variable application, and persistence.
 * v1.1.0: Added resolveTheme for theme-api.js compatibility.
 * ============================================================================
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'app-shell.adapters.theme-integration.core.theme-engine';

import { _state, incrementMetric, notifySubscribers, getConfig } from '../state.js';
import { THEMES, CSS_VARS, STORAGE_KEY } from '../constants.js';


export function getCurrentTheme() {
  return _state.currentTheme;
}

export function getSystemPreference() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return THEMES.LIGHT;
  }
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 
         THEMES.DARK : THEMES.LIGHT;
}

export function resolveTheme(theme: DynObj) {
  if (theme === THEMES.SYSTEM || theme === 'system') {
    return getSystemPreference();
  }
  if (theme === THEMES.LIGHT || theme === 'light') {
    return 'light';
  }
  if (theme === THEMES.DARK || theme === 'dark') {
    return 'dark';
  }
  return 'light';
}

export function setTheme(theme: DynObj, options?: DynObj) {
  options = options || {};
  const config = getConfig();
  
  if (theme === THEMES.SYSTEM) {
    theme = getSystemPreference();
    _state.usingSystem = true;
  } else {
    _state.usingSystem = false;
  }
  
  if (!(THEMES as DynObj)[theme.toUpperCase()] && theme !== 'light' && theme !== 'dark') {
    return { ok: false, error: `Invalid theme: ${theme}` };
  }
  
  const previousTheme = _state.currentTheme;
  _state.currentTheme = theme;
  
  applyTheme(theme);
  
  if (options.persist !== false && config.persistTheme) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        theme: _state.usingSystem ? THEMES.SYSTEM : theme,
        appliedAt: Date.now()
      }));
    } catch (e) {}
  }
  
  incrementMetric('themeChanges');
  notifySubscribers('theme-change', { 
    previous: previousTheme, 
    current: theme,
    usingSystem: _state.usingSystem 
  });
  
  return { ok: true, theme };
}

export function toggleTheme() {
  const current = _state.currentTheme;
  const next = current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
  return setTheme(next);
}

export function applyTheme(theme: DynObj) {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  const body = document.body;
  
  root.classList.remove('theme-light', 'theme-dark');
  root.classList.add(`theme-${theme}`);
  
  if (body) {
    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add(`theme-${theme}`);
  }
  
  root.setAttribute('data-theme', theme);
  
  const vars = (CSS_VARS as DynObj)[theme] || CSS_VARS.light;
  const varNames = Object.keys(vars);
  
  for (let i = 0; i < varNames.length; i++) {
    root.style.setProperty(varNames[i], vars[varNames[i]]);
  }
  
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === THEMES.DARK ? '#1a1a1a' : '#ffffff');
  }
}

export function watchSystemPreference() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e: DynObj) => {
    if (_state.usingSystem) {
      const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
      _state.currentTheme = newTheme;
      applyTheme(newTheme);
      
      notifySubscribers('system-theme-change', { theme: newTheme });
    }
  };
  
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
  } else if (mediaQuery.addListener) {
    mediaQuery.addListener(handler);
  }
  
  _state.systemWatcherActive = true;
  
  return () => {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', handler);
    } else if (mediaQuery.removeListener) {
      mediaQuery.removeListener(handler);
    }
    _state.systemWatcherActive = false;
  };
}

export function loadPersistedTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    return data.theme;
  } catch (e) {
    return null;
  }
}

export function initTheme(options?: DynObj) {
  options = options || {};
  
  const persisted = loadPersistedTheme();
  const initial = options.initial || persisted || THEMES.SYSTEM;
  
  setTheme(initial, { persist: false });
  
  if (options.watchSystem !== false) {
    watchSystemPreference();
  }
  
  return { ok: true, theme: _state.currentTheme };
}

// Alias: init delegates to initTheme for index.js compatibility
export function init(options?: DynObj) {
  return initTheme(options);
}

// Cleanup: destroy teardown for index.js compatibility
export function destroy() {
  _state.currentTheme = null;
  _state.usingSystem = false;
  _state.systemWatcherActive = false;
  _state.initialized = false;
}

// Apply theme to a specific DOM element (used by region-themes.js)
export function applyThemeToElement(element: HTMLElement, theme: DynObj) {
  if (!element) return;

  element.classList.remove('theme-light', 'theme-dark');
  element.classList.add(`theme-${theme}`);
  element.setAttribute('data-theme', theme);

  const vars = (CSS_VARS as DynObj)[theme] || CSS_VARS.light;
  const varNames = Object.keys(vars);

  for (let i = 0; i < varNames.length; i++) {
    element.style.setProperty(varNames[i], vars[varNames[i]]);
  }
}

export default {
  getCurrentTheme,
  getSystemPreference,
  resolveTheme,
  setTheme,
  toggleTheme,
  applyTheme,
  applyThemeToElement,
  watchSystemPreference,
  loadPersistedTheme,
  initTheme,
  init,
  destroy
};
