// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/user-menu/core/ports
// PURPOSE: User Menu - Ports Infrastructure & HardNav Service
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   initPorts() — exported function
//   getPort() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   getHardNavService() — exported function
//   loadCSS() — exported function
//   setDebug() — exported function
//   getLogs() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   UI_EVENTS.HARD_NAV (via _internalHardNavService)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.location.href (via _internalHardNavService redirect)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'header/components/user-menu.core.ports';

let _debug = false;
// @ts-expect-error strict migration — TS7034
let _logBuffer = [];
function _log(level: string, ...args: unknown[]) {
  if (!_debug && level === 'debug') return;
  _logBuffer.push({ level, args, ts: Date.now() });
  // @ts-expect-error strict migration — TS7005
  if (_logBuffer.length > 50) _logBuffer.shift();
}

// ── Ports ────────────────────────────────────────────────────
const Ports = createUiPorts({ moduleId: MODULE_ID });

export function initPorts() {
  Ports.init();
}

export function getPort(name: string) {
  return Ports.get(name);
}

export function injectPorts(p: Record<string,unknown>) {
  return Ports.inject(p);
}

export function getPorts() {
  return Ports.snapshot();
}

export function isPortsInitialized() {
  return Ports.isInitialized();
}

// ── Internal HardNav Service (fallback) ─────────────────────
const _internalHardNavService = {
  redirect(url: string, reason: string, source: string) {
    const eb = getPort('eventBus');
    if (eb && eb.emit) {
      eb.emit(UI_EVENTS.HARD_NAV, {
        action: 'redirect',
        url,
        reason,
        source,
        timestamp: Date.now()
      });
    }
    window.location.href = url;
  },
  VERSION: '1.0.0-INTERNAL'
};

export function getHardNavService() {
  const external = getPort('hardNavService');
  return external || _internalHardNavService;
}

// ── CSS Auto-Loader ─────────────────────────────────────────
export function loadCSS() {
  const cssPath = '/components/header/components/user-menu/component.css';
  if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssPath;
    document.head.appendChild(link);
  }
}

// ── Observability ───────────────────────────────────────────
export function healthCheck() {
  const hasEventBus = !!getPort('eventBus');
  const hasHardNav = !!getHardNavService();
  const checks = {
    portsInitialized: Ports.isInitialized(),
    hasEventBus,
    hasHardNavService: hasHardNav
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID + '/core/ports',
    timestamp: new Date().toISOString()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID + '/core/ports',
    portsInitialized: Ports.isInitialized(),
    hardNavServiceVersion: _internalHardNavService.VERSION,
    healthCheck: healthCheck()
  };
}

export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
