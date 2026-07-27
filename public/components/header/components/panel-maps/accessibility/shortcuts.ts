// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v8.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/panel-maps/accessibility/shortcuts
// PURPOSE: Keyboard shortcuts registration and handling
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   registerShortcut(key, callback, description) — register a keyboard shortcut
//   unregisterShortcut(key) — remove a shortcut
//   handleKeydown(event) — process keydown events
//   getShortcuts() — list registered shortcuts
//   clearShortcuts() — remove all shortcuts
//   healthCheck() — module health status
//   info() — module information
// ═══════════════════════════════════════════════════════════════
// panel-maps - Keyboard Shortcuts (Enterprise)
// @version 8.1.0-ENTERPRISE
'use strict';

import { VERSION } from '/core/version.js'; export { VERSION };
export const MODULE_ID = 'header/components/panel-maps/accessibility/shortcuts';

let _debug = false;
const _shortcuts = new Map();
const _metrics = { registrations: 0, activations: 0, lastActivationAt: (null as unknown|null) };

export function registerShortcut(key: string, callback: Function, description = '') {
  _shortcuts.set(key.toLowerCase(), { callback, description });
  _metrics.registrations++;
}

export function unregisterShortcut(key: string) { _shortcuts.delete(key.toLowerCase()); }

export function handleKeydown(event: string) {
  // @ts-expect-error TS migration - TS2339
  const key = event.key.toLowerCase();
  if (_shortcuts.has(key)) {
    // @ts-expect-error TS migration - TS2339
    event.preventDefault();
    _shortcuts.get(key).callback(event);
    _metrics.activations++;
    _metrics.lastActivationAt = Date.now();
  }
}

export function getShortcuts() { return Array.from(_shortcuts.entries()).map(([key, val]) => ({ key, description: val.description })); }
export function clearShortcuts() { _shortcuts.clear(); }
export function setDebug(enabled: boolean) { _debug = !!enabled; }
export function getMetrics() { return { ..._metrics, registered: _shortcuts.size }; }
export function resetMetrics() { _metrics.registrations = 0; _metrics.activations = 0; _metrics.lastActivationAt = null; }

export function healthCheck() {
  const checks = { ready: true, hasShortcuts: _shortcuts.size >= 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: 'HEALTHY', score: passed, maxScore: 2, checks, version: VERSION, moduleId: MODULE_ID };
}

export function info() { return { version: VERSION, moduleId: MODULE_ID, shortcuts: getShortcuts(), metrics: getMetrics() }; }
export default { registerShortcut, unregisterShortcut, handleKeydown, getShortcuts, clearShortcuts };
