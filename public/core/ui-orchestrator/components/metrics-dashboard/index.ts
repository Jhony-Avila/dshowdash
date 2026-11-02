// @upgrade v*.*.*-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// UI Orchestrator - Metrics Dashboard Component
// DEPENDENCY CONTRACT — BARREL FILE
// @version 2.0.0-ENTERPRISE-MODULAR
// v2.0.0: Modularizado (collector, template, styles)
// v1.1.0: Timer cleanup com guards de idempotência
'use strict';

import { collectMetrics, exportMetrics } from './metrics-collector.js';
import { createTemplate as renderTemplate } from './template.js';
import { injectStyles } from './styles.js';

export const VERSION = '2.0.0-ENTERPRISE-MODULAR';
export const MODULE_ID = 'orchestrator-metrics-dashboard';

// Estado
let _container: HTMLElement | null = null;
let _refreshInterval: ReturnType<typeof setInterval> | null = null;
let _mounted = false;

// Render
function _render() {
  if (!_container || !_mounted) return;
  const metrics = collectMetrics();
  _container.innerHTML = renderTemplate(metrics);
}

// Handlers
function _handleClick(e: MouseEvent) {
  const action = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
  if (!action) return;

  switch (action.dataset.action) {
    case 'refresh':
      _render();
      break;
    case 'export':
      exportMetrics();
      break;
  }
}

// Lifecycle
export function mount(container: HTMLElement, options: Record<string, unknown> = {}) {
  // Guard: já montado no mesmo container
  if (_mounted && _container === container) {
    return { success: true, alreadyMounted: true };
  }
  
  // Guard: limpar montagem anterior se existir
  if (_mounted || _refreshInterval) {
    unmount();
  }
  
  if (!container) {
    return { success: false, error: 'Container required' };
  }

  _container = container;
  _container.addEventListener('click', _handleClick);

  injectStyles();
  _render();

  // Auto-refresh com guard
  if (options.autoRefresh !== false) {
    const interval = (options.refreshInterval as number) || 5000;
    _refreshInterval = setInterval(() => {
      if (document.hidden) return;
      if (_mounted) _render();
    }, interval);
  }

  _mounted = true;
  return { success: true, version: VERSION };
}

export function unmount() {
  // Limpar interval primeiro
  if (_refreshInterval) {
    clearInterval(_refreshInterval);
    _refreshInterval = null;
  }
  
  // Limpar container
  if (_container) {
    _container.removeEventListener('click', _handleClick);
    _container.innerHTML = '';
    _container = null;
  }
  
  _mounted = false;
  return { success: true };
}

export function refresh() {
  if (_mounted) _render();
}

export function healthCheck() {
  return {
    status: _mounted ? 'HEALTHY' : 'UNMOUNTED',
    mounted: _mounted,
    hasContainer: !!_container,
    intervalActive: !!_refreshInterval,
    cleanupReady: true
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    mounted: _mounted,
    intervalActive: !!_refreshInterval,
    metrics: collectMetrics()
  };
}

// Re-exports para acesso direto
export { collectMetrics, exportMetrics };

export default {
  VERSION,
  MODULE_ID,
  mount,
  unmount,
  refresh,
  healthCheck,
  info,
  collectMetrics,
  exportMetrics
};
