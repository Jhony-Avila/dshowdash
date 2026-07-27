// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-theme-manager
// PURPOSE: Container-Main Theme Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   THEMES — exported value
//   injectEventBus() — exported function
//   init() — exported function
//   setTheme() — exported function
//   getTheme() — exported function
//   getResolvedTheme() — exported function
//   isDark() — exported function
//   isLight() — exported function
//   toggle() — exported function
//   subscribe() — exported function
//   getCSSVariables() — exported function
//   destroy() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventType
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.matchMedia
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'container-theme-manager';

export const THEMES = { LIGHT: 'light', DARK: 'dark', SYSTEM: 'system' };

let _currentTheme: string = THEMES.SYSTEM;
let _resolvedTheme: string = THEMES.LIGHT;
let _mediaQuery: MediaQueryList | null = null;
let _listeners = new Set<(resolved: string, theme: string) => void>();
let _injectedEventBus: { emit?: (event: string, payload: Record<string, unknown>) => void } | null = null;

export function injectEventBus(eventBus: { emit?: (event: string, payload: Record<string, unknown>) => void }): void { _injectedEventBus = eventBus; }

function _emitEvent(eventType: string, payload: Record<string, unknown>): void {
  if (_injectedEventBus?.emit) {
    _injectedEventBus.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
  }
}

function _getSystemTheme(): string {
  if (typeof window === 'undefined') return THEMES.LIGHT;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT;
}

function _resolveTheme(theme: string): string {
  if (theme === THEMES.SYSTEM) return _getSystemTheme();
  return theme;
}

function _applyTheme(theme: string): void {
  const resolved = _resolveTheme(theme);
  const root = document.documentElement;

  root.classList.remove('theme-light', 'theme-dark');
  root.classList.add(`theme-${resolved}`);
  root.setAttribute('data-theme', resolved);

  // Update meta theme-color
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');

    // @ts-expect-error TS migration - TS2339
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }

  // @ts-expect-error TS migration - TS2339
  meta.content = resolved === THEMES.DARK ? '#1a1a2e' : '#ffffff';

  _resolvedTheme = resolved;
  _currentTheme = theme;

  // Persist preference
  try { localStorage.setItem('dsd-theme', theme); } catch {}

  // Notify listeners
  _listeners.forEach(fn => fn(resolved, theme));
  _emitEvent('theme:change', { theme, resolved });
}

function _onSystemThemeChange(_e: MediaQueryListEvent): void {
  if (_currentTheme === THEMES.SYSTEM) {
    _applyTheme(THEMES.SYSTEM);
  }
}

export function init(): void {
  // Load saved preference
  try {
    const saved = localStorage.getItem('dsd-theme');
    if (saved && Object.values(THEMES).includes(saved)) {
      _currentTheme = saved;
    }
  } catch {}

  // Listen for system theme changes
  if (typeof window !== 'undefined') {
    _mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    _mediaQuery.addEventListener?.('change', _onSystemThemeChange);
  }

  _applyTheme(_currentTheme);
}

export function setTheme(theme: string): boolean {
  if (!Object.values(THEMES).includes(theme)) return false;
  _applyTheme(theme);
  return true;
}

export function getTheme(): string { return _currentTheme; }
export function getResolvedTheme(): string { return _resolvedTheme; }
export function isDark(): boolean { return _resolvedTheme === THEMES.DARK; }
export function isLight(): boolean { return _resolvedTheme === THEMES.LIGHT; }

export function toggle(): boolean {
  const newTheme = _resolvedTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
  return setTheme(newTheme);
}

export function subscribe(callback: (resolved: string, theme: string) => void): () => void {
  _listeners.add(callback);
  return () => _listeners.delete(callback);
}

export function getCSSVariables(): Record<string, string> {
  return {
    '--dsd-bg-primary': isDark() ? '#1a1a2e' : '#ffffff',
    '--dsd-bg-secondary': isDark() ? '#16213e' : '#f5f5f5',
    '--dsd-text-primary': isDark() ? '#eaeaea' : '#1a1a1a',
    '--dsd-text-secondary': isDark() ? '#a0a0a0' : '#666666',
    '--dsd-border': isDark() ? '#2d2d44' : '#e0e0e0',
    '--dsd-accent': isDark() ? '#4f9cf9' : '#2563eb',
    '--dsd-shadow': isDark() ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.1)'
  };
}

export function destroy(): void {
  if (_mediaQuery) {
    _mediaQuery.removeEventListener?.('change', _onSystemThemeChange);
    _mediaQuery = null;
  }
  _listeners.clear();
}

export function info(): Record<string, unknown> {
  return { moduleId: MODULE_ID, version: VERSION, currentTheme: _currentTheme, resolvedTheme: _resolvedTheme, isDark: isDark() };
}

export function healthCheck(): Record<string, unknown> {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, currentTheme: _currentTheme, resolvedTheme: _resolvedTheme };
}

export default {
  init, setTheme, getTheme, getResolvedTheme, isDark, isLight, toggle, subscribe, getCSSVariables, destroy,
  injectEventBus, info, healthCheck, VERSION, MODULE_ID, THEMES
};
