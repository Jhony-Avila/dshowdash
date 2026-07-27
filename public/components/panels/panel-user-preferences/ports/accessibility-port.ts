// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences.ports.accessibility
// PURPOSE: Accessibility Port
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   ACCESSIBILITY_INTENTS, ACCESSIBILITY_EVENTS, ANNOUNCE_PRIORITY from /core/run...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ANNOUNCE_PRIORITY — exported value
//   ACCESSIBILITY_INTENTS — exported value
//   A11Y_RESPONSES — exported value
//   announce() — exported function
//   setReducedMotion() — exported function
//   setHighContrast() — exported function
//   setFontSize() — exported function
//   setFocusVisible() — exported function
//   getCurrentSettings() — exported function
//   isManagerAvailable() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   info() — exported function
//   ... and 3 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   ACCESSIBILITY_INTENTS.ANNOUNCE
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.matchMedia
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { ACCESSIBILITY_INTENTS, ACCESSIBILITY_EVENTS, ANNOUNCE_PRIORITY } from '/core/runtime/events/catalog/accessibility.events.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-user-preferences.ports.accessibility';
const hasWindow = typeof window !== 'undefined';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const injectPorts = (p: unknown) => Ports.inject(p);
const getPorts = () => Ports.snapshot();

const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; const prefix = '[A11y]'; const fn = (logger as Record<string, unknown>)[level] || (logger as Record<string, unknown>).info; (fn as ((...a: unknown[]) => void))?.(prefix, (args as string[]).join(' ')); };

const A11Y_RESPONSES = { ANNOUNCED: ACCESSIBILITY_EVENTS.ANNOUNCED, SETTING_APPLIED: ACCESSIBILITY_EVENTS.SETTING_APPLIED, ERROR: ACCESSIBILITY_EVENTS.ERROR };

let _metrics = { announcements: 0, settingsChanged: 0, errors: 0 };

const announce = (message: string, options: Record<string, unknown> = {}) => {
  _initPorts();
  if (!message) return { ok: false, error: 'no-message' };
  _metrics.announcements++;
  const intent = { message, priority: options.priority || ANNOUNCE_PRIORITY.POLITE, context: options.context || 'panel-user-preferences', source: 'panel-user-preferences', timestamp: Date.now() };
  const eb = _getPort('eventBus');
  if (eb?.emit) { eb.emit(ACCESSIBILITY_INTENTS.ANNOUNCE, intent); return { ok: true, method: 'event' }; }
  _log('info', message);
  return { ok: true, method: 'logger' };
};

const setReducedMotion = (enabled: boolean, options: Record<string, unknown> = {}) => { _initPorts(); _metrics.settingsChanged++; const intent = { enabled: !!enabled, source: options.source || 'panel-user-preferences', timestamp: Date.now(), persist: options.persist !== false }; const eb = _getPort('eventBus'); eb?.emit?.(ACCESSIBILITY_INTENTS.SET_REDUCED_MOTION, intent); return { ok: true, intent }; };
const setHighContrast = (enabled: boolean, options: Record<string, unknown> = {}) => { _initPorts(); _metrics.settingsChanged++; const intent = { enabled: !!enabled, source: options.source || 'panel-user-preferences', timestamp: Date.now(), persist: options.persist !== false }; const eb = _getPort('eventBus'); eb?.emit?.(ACCESSIBILITY_INTENTS.SET_HIGH_CONTRAST, intent); return { ok: true, intent }; };

const setFontSize = (size: string, options: Record<string, unknown> = {}) => {
  _initPorts();
  const validSizes = ['small', 'normal', 'large', 'extra-large'];
  if (!validSizes.includes(size)) return { ok: false, error: 'invalid-size', validSizes };
  _metrics.settingsChanged++;
  const intent = { size, source: options.source || 'panel-user-preferences', timestamp: Date.now(), persist: options.persist !== false };
  const eb = _getPort('eventBus');
  eb?.emit?.(ACCESSIBILITY_INTENTS.SET_FONT_SIZE, intent);
  return { ok: true, intent };
};

const setFocusVisible = (enabled: boolean, options: Record<string, unknown> = {}) => { _initPorts(); _metrics.settingsChanged++; const intent = { enabled: !!enabled, source: options.source || 'panel-user-preferences', timestamp: Date.now(), persist: options.persist !== false }; const eb = _getPort('eventBus'); eb?.emit?.(ACCESSIBILITY_INTENTS.SET_FOCUS_VISIBLE, intent); return { ok: true, intent }; };

const getCurrentSettings = () => {
  let reducedMotion = false; let highContrast = false;
  if (hasWindow && window.matchMedia) { const rmq = window.matchMedia('(prefers-reduced-motion: reduce)'); const hcq = window.matchMedia('(prefers-contrast: more)'); reducedMotion = rmq?.matches ?? false; highContrast = hcq?.matches ?? false; }
  return { reducedMotion, highContrast, fontSize: 'normal', focusVisible: true };
};

const isManagerAvailable = () => !!_getPort('eventBus');
const getMetrics = () => ({ ..._metrics });
const resetMetrics = () => { _metrics = { announcements: 0, settingsChanged: 0, errors: 0 }; };

const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), managerAvailable: isManagerAvailable(), currentSettings: getCurrentSettings(), metrics: getMetrics(), p18Source: '/core/runtime/events/index.js' });

const healthCheck = () => {
  _initPorts();
  const eb = _getPort('eventBus');
  const logger = _getPort('logger');
  const checks = { eventBusAvailable: !!eb, canAnnounce: !!(eb?.emit), loggerReady: !!logger, portsInitialized: Ports.isInitialized(), usingP18Core: true };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed >= 4 ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID };
};

export { VERSION, MODULE_ID, ANNOUNCE_PRIORITY, ACCESSIBILITY_INTENTS, A11Y_RESPONSES, announce, setReducedMotion, setHighContrast, setFontSize, setFocusVisible, getCurrentSettings, isManagerAvailable, getMetrics, resetMetrics, info, healthCheck, injectPorts, getPorts };
export default { announce, setReducedMotion, setHighContrast, setFontSize, setFocusVisible, getCurrentSettings, isManagerAvailable, getMetrics, resetMetrics, info, healthCheck, injectPorts, getPorts, ANNOUNCE_PRIORITY, ACCESSIBILITY_INTENTS, A11Y_RESPONSES, VERSION, MODULE_ID };
