// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:theme-manager-v2
// PURPOSE: Theme Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   THEMES — exported value
//   createThemeManager() — exported function
//   getThemeManager() — exported function
//   resetThemeManager() — exported function
//   setTheme() — exported function
//   toggleTheme() — exported function
//   isDarkMode() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
// WINDOW ACCESS:
//   window.matchMedia
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE6';
export const MODULE_ID = 'container-main:theme-manager-v2';

export const THEMES = Object.freeze({ LIGHT: 'light', DARK: 'dark', SYSTEM: 'system', CUSTOM: 'custom' });

const DEFAULT_LIGHT: Record<string, string> = {
  '--cm-bg-primary': '#ffffff', '--cm-bg-secondary': '#f5f5f5', '--cm-bg-tertiary': '#e8e8e8',
  '--cm-text-primary': '#1a1a2e', '--cm-text-secondary': '#4a4a6a', '--cm-text-muted': '#8a8aa0',
  '--cm-accent': '#3b82f6', '--cm-accent-hover': '#2563eb', '--cm-accent-text': '#ffffff',
  '--cm-border': '#e0e0e0', '--cm-shadow': 'rgba(0, 0, 0, 0.1)',
  '--cm-success': '#22c55e', '--cm-warning': '#f59e0b', '--cm-error': '#ef4444', '--cm-info': '#3b82f6'
};

const DEFAULT_DARK: Record<string, string> = {
  '--cm-bg-primary': '#1a1a2e', '--cm-bg-secondary': '#16213e', '--cm-bg-tertiary': '#0f3460',
  '--cm-text-primary': '#e8e8e8', '--cm-text-secondary': '#b8b8c8', '--cm-text-muted': '#6a6a8a',
  '--cm-accent': '#60a5fa', '--cm-accent-hover': '#93c5fd', '--cm-accent-text': '#1a1a2e',
  '--cm-border': '#2a2a4e', '--cm-shadow': 'rgba(0, 0, 0, 0.4)',
  '--cm-success': '#4ade80', '--cm-warning': '#fbbf24', '--cm-error': '#f87171', '--cm-info': '#60a5fa'
};

export function createThemeManager(options: Record<string, unknown> = {}): Record<string, unknown> {
  const { defaultTheme = THEMES.SYSTEM, storageKey = 'cm_theme', transitionDuration = 200, onThemeChange = null } = options as { defaultTheme?: string; storageKey?: string; transitionDuration?: number; onThemeChange?: ((theme: string, resolved: string) => void) | null };

  const _logger = createLogger(MODULE_ID);
  let _currentTheme: string = defaultTheme as string;
  let _resolvedTheme: string = THEMES.LIGHT;
  let _customThemes = new Map<string, Record<string, string>>();
  let _mediaQuery: MediaQueryList | null = null;
  let _metrics: { changes: number } = { changes: 0 };

  function _getSystemTheme(): string {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT;
  }

  function _applyVariables(variables: Record<string, string>): void {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(variables)) {
      root.style.setProperty(key, value as string);
    }
  }

  function _applyTheme(theme: string, withTransition: boolean = true): void {
    let variables: Record<string, string>;
    let resolved = theme;

    if (theme === THEMES.SYSTEM) {
      resolved = _getSystemTheme();
    }

    if (resolved === THEMES.LIGHT) {
      variables = DEFAULT_LIGHT;
    } else if (resolved === THEMES.DARK) {
      variables = DEFAULT_DARK;
    } else if (_customThemes.has(theme)) {
      variables = _customThemes.get(theme) as Record<string, string>;
      resolved = theme;
    } else {
      _logger.warn(`Unknown theme: ${theme}, falling back to light`);
      variables = DEFAULT_LIGHT;
      resolved = THEMES.LIGHT;
    }

    if (withTransition) {
      document.documentElement.style.setProperty('--cm-transition', `all ${transitionDuration}ms ease`);
      document.body.style.transition = `background-color ${transitionDuration}ms ease, color ${transitionDuration}ms ease`;
    }

    _applyVariables(variables);
    document.documentElement.setAttribute('data-theme', resolved);
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${resolved}`);

    _resolvedTheme = resolved;
    _metrics.changes++;

    if (withTransition) {
      setTimeout(() => {
        document.body.style.transition = '';
      }, transitionDuration as number);
    }
  }

  function _persist(theme: string): void {
    try {
      localStorage.setItem(storageKey as string, theme);
    } catch (e) {
      // @ts-expect-error strict migration — TS2345
      _logger.warn('Failed to persist theme:', e);
    }
  }

  function _restore(): string | null {
    try {
      return localStorage.getItem(storageKey as string);
    } catch (e) {
      return null;
    }
  }

  function _setupSystemListener(): void {
    if (_mediaQuery) return;
    _mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    _mediaQuery.addEventListener('change', () => {
      if (_currentTheme === THEMES.SYSTEM) {
        _applyTheme(THEMES.SYSTEM);
        if (typeof onThemeChange === 'function') onThemeChange(THEMES.SYSTEM, _resolvedTheme);
      }
    });
  }

  // Inicialização
  const savedTheme = _restore();
  if (savedTheme && (savedTheme === THEMES.LIGHT || savedTheme === THEMES.DARK || savedTheme === THEMES.SYSTEM)) {
    _currentTheme = savedTheme;
  }
  _applyTheme(_currentTheme, false);
  _setupSystemListener();

  const manager: Record<string, unknown> = {
    setTheme(theme: string): boolean {
      if (theme !== THEMES.LIGHT && theme !== THEMES.DARK && theme !== THEMES.SYSTEM && !_customThemes.has(theme)) {
        _logger.warn(`Invalid theme: ${theme}`);
        return false;
      }
      _currentTheme = theme;
      _applyTheme(theme);
      _persist(theme);
      if (typeof onThemeChange === 'function') onThemeChange(theme, _resolvedTheme);
      return true;
    },

    getTheme(): string { return _currentTheme; },
    getResolvedTheme(): string { return _resolvedTheme; },
    isDark(): boolean { return _resolvedTheme === THEMES.DARK; },
    isLight(): boolean { return _resolvedTheme === THEMES.LIGHT; },

    toggle(): string {
      const newTheme = _resolvedTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
      (manager.setTheme as (t: string) => boolean)(newTheme);
      return newTheme;
    },

    registerCustomTheme(name: string, variables: Record<string, string>): string {
      const merged = { ...DEFAULT_LIGHT, ...variables };
      _customThemes.set(name, merged);
      return name;
    },

    unregisterCustomTheme(name: string): boolean {
      return _customThemes.delete(name);
    },

    getVariable(name: string): string {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    },

    setVariable(name: string, value: string): void {
      document.documentElement.style.setProperty(name, value);
    },

    getThemeVariables(theme: string): Record<string, string> | null {
      if (theme === THEMES.LIGHT) return { ...DEFAULT_LIGHT };
      if (theme === THEMES.DARK) return { ...DEFAULT_DARK };
      if (_customThemes.has(theme)) return { ..._customThemes.get(theme) };
      return null;
    },

    listThemes(): string[] {
      return [THEMES.LIGHT, THEMES.DARK, THEMES.SYSTEM, ...Array.from(_customThemes.keys())];
    },

    getMetrics(): Record<string, unknown> { return { ..._metrics, currentTheme: _currentTheme, resolvedTheme: _resolvedTheme }; },
    resetMetrics(): void { _metrics = { changes: 0 }; },

    healthCheck(): Record<string, unknown> { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, currentTheme: _currentTheme, resolvedTheme: _resolvedTheme, customThemes: _customThemes.size }; },
    info(): Record<string, unknown> { return { moduleId: MODULE_ID, version: VERSION, currentTheme: _currentTheme, resolvedTheme: _resolvedTheme, themes: (manager.listThemes as () => string[])() }; },

    destroy(): void {
      if (_mediaQuery) {
        _mediaQuery.removeEventListener('change', () => {});
        _mediaQuery = null;
      }
    }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getThemeManager(options: Record<string, unknown> = {}): Record<string, unknown> { if (!_instance) _instance = createThemeManager(options); return _instance; }
export function resetThemeManager(): void { if (_instance) { (_instance.destroy as () => void)(); _instance = null; } }

export function setTheme(theme: string): unknown { return (getThemeManager().setTheme as (t: string) => boolean)(theme); }
export function toggleTheme(): unknown { return (getThemeManager().toggle as () => string)(); }
export function isDarkMode(): unknown { return (getThemeManager().isDark as () => boolean)(); }

export function info(): Record<string, unknown> { return { moduleId: MODULE_ID, version: VERSION, themes: Object.keys(THEMES) }; }
export function healthCheck(): Record<string, unknown> { if (_instance) return (_instance.healthCheck as () => Record<string, unknown>)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, THEMES, createThemeManager, getThemeManager, resetThemeManager, setTheme, toggleTheme, isDarkMode, info, healthCheck };
