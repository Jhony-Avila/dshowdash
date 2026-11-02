// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-manager-light
// PURPOSE: Theme Manager - Light Theme v8.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   LIGHT_THEME — exported value
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export var MODULE_ID = 'theme-manager-light';
export var VERSION = '8.1.0-ENTERPRISE';

export var LIGHT_THEME = {
  id: 'light',
  label: 'Tema Claro',
  cssVariant: 'light',
  tokens: {
    '--primary': '#5a67d8',
    '--primary-dark': '#4c51bf',
    '--primary-light': '#667eea',
    '--secondary': '#6b46c1',
    '--success': '#059669',
    '--warning': '#d97706',
    '--danger': '#dc2626',
    '--info': '#2563eb',
    '--dark': '#1e293b',
    '--dark-secondary': '#334155',
    '--light': '#f8fafc',
    '--white': '#ffffff',
    '--muted': '#64748b',
    '--bg-primary': '#f8fafc',
    '--bg-secondary': '#f1f5f9',
    '--bg-tertiary': '#e2e8f0',
    '--bg-card': '#ffffff',
    '--bg-input': '#ffffff',
    '--text-primary': '#0f172a',
    '--text-secondary': '#1e293b',
    '--text-tertiary': '#475569',
    '--text-muted': '#94a3b8',
    '--border-primary': 'rgba(0, 0, 0, 0.1)',
    '--border-secondary': 'rgba(0, 0, 0, 0.05)',
    '--glass-bg': 'rgba(255, 255, 255, 0.7)',
    '--glass-border': 'rgba(0, 0, 0, 0.1)',
    '--glass-hover': 'rgba(0, 0, 0, 0.05)',
    '--shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.08)',
    '--shadow-md': '0 4px 12px rgba(0, 0, 0, 0.1)',
    '--shadow-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
    '--shadow-xl': '0 12px 40px rgba(0, 0, 0, 0.15)',
    '--particles-color': '0, 0, 0',
    '--particles-opacity': '0.08'
  },
  meta: { contrast: 'normal', preferredFor: 'day', isDefault: false }
};

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default LIGHT_THEME;
