// toolbar-wiring/helpers.js
// @version 1.3.0-STRICT-MODE
// @description Funções utilitárias compartilhadas entre os módulos de wiring
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
// PROVIDES: getEventBus(), getActivePanelId(), getActivePanelElement(), injectPorts(), getPorts(), info()
// CONSUMERS: wire-refresh, wire-system, wire-content, wire-search-export,
//            wire-clipboard-capture, diagnostics
// BROWSER-APIS: document.querySelector, document.getElementById
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// @changelog v1.3.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v1.2.0-P0-ENTERPRISE - Migrated getEventBus to Ports pattern (no (window as any).EventBus)
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const MODULE_ID = 'toolbar-wiring.helpers';
export const VERSION = '1.4.0-P2-ENTERPRISE';

const Ports = createUiPorts({ moduleId: MODULE_ID });
let _portsInitialized = false;

function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}

export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: EventBus
// ═══════════════════════════════════════════════════════════════
/**
 * Retorna instância do EventBus via Ports (P0 ENTERPRISE)
 */
export function getEventBus() {
  _initPorts();

  // 1. Try Ports first
  const portEventBus = Ports.get('eventBus');
  if (portEventBus) return portEventBus;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && (window as any).Core?.windowAdapter?.get) {
    const waEventBus = (window as any).Core.windowAdapter.get('EventBus');
    if (waEventBus) return waEventBus;
  }

  return null;
}

/**
 * Retorna o ID do painel ativo (.panel-active)
 */
export function getActivePanelId() {
  if (typeof document === 'undefined') return null;
  const el = document.querySelector('.panel-active');
  return el ? el.id : null;
}

/**
 * Retorna o elemento DOM do painel ativo (fallback: container-main)
 */
export function getActivePanelElement(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return (document.querySelector('.panel-active') || document.getElementById('container-main')) as HTMLElement | null;
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p0Enterprise: true,
    portsInitialized: _portsInitialized,
    strictMode: isStrict()
  };
}

export default { getEventBus, getActivePanelId, getActivePanelElement, injectPorts, getPorts, info, MODULE_ID, VERSION };
