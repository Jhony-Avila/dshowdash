// @upgrade v*.*.*-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// Timeline Panel - Constants
// DEPENDENCY CONTRACT — UI Orchestrator module
// @version 1.0.0-ENTERPRISE
'use strict';

export const VERSION = '1.0.0-ENTERPRISE-MODULAR';
export const MODULE_ID = 'timeline-panel';

export const CATEGORY_COLORS = {
  intent: '#a371f7',
  navigation: '#58a6ff',
  panel: '#3fb950',
  canvas: '#d29922',
  auth: '#f85149',
  error: '#f85149',
  system: '#8b949e'
};

export const CATEGORY_ICONS = {
  intent: '🎯',
  navigation: '🧭',
  panel: '📋',
  canvas: '🎨',
  auth: '🔐',
  error: '❌',
  system: '⚙️'
};

export const DEFAULT_FILTERS = {
  categories: ['intent', 'navigation', 'panel', 'canvas', 'auth', 'error', 'system'],
  searchTerm: ''
};

export const MAX_EVENTS = 500;
export const DISPLAY_LIMIT = 200;

export default { VERSION, MODULE_ID, CATEGORY_COLORS, CATEGORY_ICONS, DEFAULT_FILTERS, MAX_EVENTS, DISPLAY_LIMIT };
