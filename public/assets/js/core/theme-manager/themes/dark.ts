// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-manager-dark
// PURPOSE: Theme Manager - Dark Theme v8.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   DARK_THEME — exported value
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

export var MODULE_ID = 'theme-manager-dark';
export var VERSION = '8.1.0-ENTERPRISE';

export var DARK_THEME = {
  id: 'dark',
  label: 'Tema Escuro',
  cssVariant: 'dark',
  tokens: {
    '--primary': '#667eea',
    '--primary-dark': '#5a67d8',
    '--primary-light': '#7c8aef',
    '--secondary': '#764ba2',
    '--success': '#10b981',
    '--warning': '#f59e0b',
    '--danger': '#ef4444',
    '--info': '#3b82f6',
    '--dark': '#0a0e27',
    '--dark-secondary': '#151924',
    '--light': '#f5f5f5',
    '--white': '#ffffff',
    '--muted': '#9aa3b2',
    '--bg-primary': '#0a0e27',
    '--bg-secondary': '#151924',
    '--bg-tertiary': '#1a1f35',
    '--bg-card': '#12162a',
    '--bg-input': '#0d1025',
    '--text-primary': '#ffffff',
    '--text-secondary': '#e2e8f0',
    '--text-tertiary': '#9aa3b2',
    '--text-muted': '#64748b',
    '--border-primary': 'rgba(255, 255, 255, 0.1)',
    '--border-secondary': 'rgba(255, 255, 255, 0.05)',
    '--glass-bg': 'rgba(0, 0, 0, 0.02)',
    '--glass-border': 'rgba(255, 255, 255, 0.1)',
    '--glass-hover': 'rgba(255, 255, 255, 0.08)',
    '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.15)',
    '--shadow-md': '0 4px 16px rgba(0, 0, 0, 0.25)',
    '--shadow-lg': '0 8px 32px rgba(0, 0, 0, 0.4)',
    '--shadow-xl': '0 12px 48px rgba(0, 0, 0, 0.5)',
    '--particles-color': '255, 255, 255',
    '--particles-opacity': '0.10'
  },
  meta: { contrast: 'normal', preferredFor: 'night', isDefault: true }
};

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default DARK_THEME;
