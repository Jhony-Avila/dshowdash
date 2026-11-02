// Kernel Governance Panel - UI de Monitoramento
// DEPENDENCY CONTRACT — Core kernel module (ORCHESTRATOR)
// @version 2.1.0-P2-ENTERPRISE
// @changelog v2.1.0-P2-ENTERPRISE - Migrado para Ports pattern (elimina window.EventBus direto)
// @changelog v2.0.0-MODULAR - Modularizado em 6 submodulos: constants, state, data, helpers, events, renderer
// @changelog v1.1.0-P2 - Versao monolitica original (640 linhas)
// @description Painel visual para monitoramento do Kernel Governance
// @theme Dark mode com tokens globais
// @note Usa window.Governance em vez de import para evitar referencia circular
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { VERSION, MODULE_ID } from './kernel-governance-panel/constants.js';

// P2 ENTERPRISE: Ports-based access
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() { if (_portsInitialized) return; Ports.init(); _portsInitialized = true; }
function _getEventBus() { _initPorts(); return (Ports as unknown as Record<string, unknown>)['getEventBus'] ? (Ports as unknown as { getEventBus: () => unknown })['getEventBus']() : null; }

// Helper for emitting events via Ports
function _emit(eventName: string, data: Record<string, unknown>) {
  const eb = _getEventBus() as Record<string, unknown> | null;
  if (eb && typeof eb['emit'] === 'function') {
    (eb['emit'] as (...args: unknown[]) => void)(eventName, { ...data, source: MODULE_ID, timestamp: Date.now() });
  }
}
import { state, config, resetState } from './kernel-governance-panel/state.js';
import { fetchData, injectCSS } from './kernel-governance-panel/data.js';
import { render } from './kernel-governance-panel/renderer.js';
import { setApiRef } from './kernel-governance-panel/events.js';

// Re-export constants
export { VERSION, MODULE_ID };

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export function show(options?: Record<string, unknown>) {
  options = options || {};

  injectCSS();

  if (!state.container) {
    state.container = document.createElement('div');
    state.container.className = 'kgp';
    state.container.id = 'kernel-governance-panel';
    document.body.appendChild(state.container);
  }

  render();

  requestAnimationFrame(() => {
    // @ts-expect-error strict migration — TS18047
    state.container.classList.add('kgp--visible');
  });

  state.visible = true;

  if (config.autoRefresh && !state.refreshInterval) {
    state.refreshInterval = setInterval(() => {
      if (state.visible && !state.minimized) {
        render();
      }
    }, config.refreshInterval);
  }

  _emit('governance-panel:opened', {});

  return { ok: true };
}

export function hide() {
  if (state.container) {
    state.container.classList.remove('kgp--visible');
  }

  state.visible = false;

  if (state.refreshInterval) {
    clearInterval(state.refreshInterval);
    state.refreshInterval = null;
  }

  _emit('governance-panel:closed', {});

  return { ok: true };
}

export function toggle() {
  if (state.visible) {
    return hide();
  } else {
    return show();
  }
}

export function refresh() {
  render();

  _emit('governance-panel:refresh', { data: state.data });

  return { ok: true, data: state.data };
}

export function getData() {
  return fetchData();
}

export function exportJSON() {
  const data = fetchData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `kernel-governance-${Date.now()}.json`;
  a.click();

  URL.revokeObjectURL(url);

  return { ok: true };
}

export function isVisible() {
  return state.visible;
}

export function destroy() {
  hide();

  if (state.container && state.container.parentNode) {
    state.container.parentNode.removeChild(state.container);
  }

  resetState();

  return { ok: true };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    visible: state.visible,
    minimized: state.minimized,
    lastUpdate: state.lastUpdate,
    filter: state.filter,
    autoRefresh: config.autoRefresh,
    governanceAvailable: !!( window.Governance || (window.Core && window.Core.Governance) ),
    p2Enterprise: true,
    portsInitialized: _portsInitialized,
    timestamp: Date.now()
  };
}

export function healthCheck() {
  const checks = {
    portsInitialized: _portsInitialized,
    containerExists: !!state.container,
    governanceAvailable: !!( window.Governance || (window.Core && window.Core.Governance) )
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: _portsInitialized ? 'HEALTHY' : 'NOT_INITIALIZED',
    score: { passed, total, percentage: Math.round((passed / total) * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    p2Enterprise: true,
    portsInitialized: _portsInitialized,
    checks,
    timestamp: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// WIRE API REF TO EVENTS (breaks circular dependency)
// ═══════════════════════════════════════════════════════════════

setApiRef({ hide, refresh, exportJSON, render });

// ═══════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUT (Ctrl+Shift+G)
// ═══════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'g') {
      e.preventDefault();
      toggle();
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// DEVTOOLS EXPOSURE
// ═══════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  window.__dev = window.__dev || {};
  window.__dev.governancePanel = {
    show,
    hide,
    toggle,
    refresh,
    getData,
    exportJSON,
    isVisible,
    destroy,
    info
  };
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  VERSION,
  MODULE_ID,
  show,
  hide,
  toggle,
  refresh,
  getData,
  exportJSON,
  isVisible,
  destroy,
  info,
  healthCheck
};
