// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: orchestrator-audit-emitter
// PURPOSE: Orchestrator Audit Emitter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   emitPresetApplied() — exported function
//   emitPresetDenied() — exported function
//   emitLayoutReset() — exported function
//   emitRefreshAll() — exported function
//   emitSchedulerToggled() — exported function
//   emitPanelToggled() — exported function
//   emitAccessDenied() — exported function
//   emitMount() — exported function
//   emitUnmount() — exported function
//   emitError() — exported function
//   getVersion() — exported function
//   ... and 1 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   AUDIT_EVENTS.ACTION
//   eventType
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'orchestrator-audit-emitter';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

// P18EC: Local event constants
const AUDIT_EVENTS = {
  ACTION: 'audit:orchestrator:action',
  PRESET_APPLIED: 'audit:orchestrator:preset-applied',
  PRESET_DENIED: 'audit:orchestrator:preset-denied',
  LAYOUT_RESET: 'audit:orchestrator:layout-reset',
  REFRESH_ALL: 'audit:orchestrator:refresh-all',
  SCHEDULER_TOGGLED: 'audit:orchestrator:scheduler-toggled',
  PANEL_TOGGLED: 'audit:orchestrator:panel-toggled',
  ACCESS_DENIED: 'audit:orchestrator:access-denied',
  MOUNT: 'audit:orchestrator:mount',
  UNMOUNT: 'audit:orchestrator:unmount',
  ERROR: 'audit:orchestrator:error'
};

const _getUserContext = (): { userId: unknown; userName: unknown; sessionId?: unknown; level?: unknown } => { const gs = _getPort('globalState'); if (!gs?.get) return { userId: null, userName: null }; const auth = gs.get('auth') || {}; return { userId: auth.userId || auth.id, userName: auth.userName || auth.name || auth.email, sessionId: auth.sessionId, level: auth.level || auth.userLevel || 0 }; };

const _emit = (eventType: string, data: Record<string, unknown> = {}) => { _initPorts(); const bus = _getPort('eventBus'); if (!bus?.emit) return false; const user = _getUserContext(); const payload = { eventType, source: 'panel-orchestrator', moduleId: MODULE_ID, userId: user.userId, userName: user.userName, sessionId: user.sessionId, userLevel: user.level, timestamp: Date.now(), ...data }; bus.emit(eventType, payload); bus.emit(AUDIT_EVENTS.ACTION, payload); return true; };

export const emitPresetApplied = (presetId: string, context: Record<string, unknown>) => _emit(AUDIT_EVENTS.PRESET_APPLIED, { action: 'apply-preset', presetId, context: context || {}, severity: 'INFO' });
export const emitPresetDenied = (presetId: string, reason: string) => _emit(AUDIT_EVENTS.PRESET_DENIED, { action: 'apply-preset-denied', presetId, reason, severity: 'WARNING' });
export const emitLayoutReset = () => _emit(AUDIT_EVENTS.LAYOUT_RESET, { action: 'layout-reset', severity: 'INFO' });
export const emitRefreshAll = (panelCount: number) => _emit(AUDIT_EVENTS.REFRESH_ALL, { action: 'refresh-all', panelCount, severity: 'INFO' });
export const emitSchedulerToggled = (newState: string) => _emit(AUDIT_EVENTS.SCHEDULER_TOGGLED, { action: 'scheduler-toggle', newState, severity: 'INFO' });
export const emitPanelToggled = (panelId: string, visible: boolean) => _emit(AUDIT_EVENTS.PANEL_TOGGLED, { action: 'panel-toggle', panelId, visible, severity: 'INFO' });
export const emitAccessDenied = (reason: string) => _emit(AUDIT_EVENTS.ACCESS_DENIED, { action: 'access-denied', reason, severity: 'SECURITY' });
export const emitMount = (mountTime: number) => _emit(AUDIT_EVENTS.MOUNT, { action: 'mount', mountTime, severity: 'INFO' });
export const emitUnmount = () => _emit(AUDIT_EVENTS.UNMOUNT, { action: 'unmount', severity: 'INFO' });
export const emitError = (error: unknown, context: Record<string, unknown>) => _emit(AUDIT_EVENTS.ERROR, { action: 'error', error: (error as Error)?.message || String(error), context: context || {}, severity: 'ERROR' });

export const getVersion = () => VERSION;
export { AUDIT_EVENTS };
export default { VERSION, MODULE_ID, AUDIT_EVENTS, emitPresetApplied, emitPresetDenied, emitLayoutReset, emitRefreshAll, emitSchedulerToggled, emitPanelToggled, emitAccessDenied, emitMount, emitUnmount, emitError, getVersion, injectPorts, getPorts };
