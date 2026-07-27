// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer.adapters.confirmation-factory
// PURPOSE: Overlay Layer - Confirmation Dialog Factory v1.4.0-P18EC
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   UI_INTENTS from /core/runtime/events/index.js
//   * as Manager from ../core/manager.js
//   * as Accessibility from ../core/accessibility.js
//
// PROVIDES:
//   confirm() — exported function
//   doConfirm() — exported function
//   doCancel() — exported function
//   dismiss() — exported function
//   confirmDelete() — exported function
//   confirmAction() — exported function
//   confirmSave() — exported function
//   confirmDiscard() — exported function
//   confirmLogout() — exported function
//   alert() — exported function
//   getPending() — exported function
//   getPendingList() — exported function
//   cancelAll() — exported function
//   getConfig() — exported function
//   setConfig() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   UI_INTENTS.REQUEST_LAYOUT
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { UI_INTENTS } from '/core/runtime/events/catalog/ui.events.js';
import * as Manager from '../core/manager.js';
import * as Accessibility from '../core/accessibility.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

const VERSION = '1.4.0-P18EC';
const MODULE_ID = 'overlay-layer.adapters.confirmation-factory';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: DynObj) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const CF_SVGS = {
  question: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  warning: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
};

const CONFIRMATION_PRIORITY = 8500;
const _pendingConfirmations = new Map();
const _config = { defaultTitle: 'Confirmação', defaultConfirmText: 'Confirmar', defaultCancelText: 'Cancelar', dangerConfirmText: 'Excluir', closeOnBackdrop: false, closeOnEscape: true, focusConfirm: false, focusCancel: true };
const _metrics = { shown: 0, confirmed: 0, cancelled: 0, dismissed: 0 };

function _setScrollLock(locked: boolean) {
  const eb = _getPort('eventBus');
  if (eb && eb.emit) { eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode: locked ? 'scroll-lock' : 'scroll-unlock', source: MODULE_ID, timestamp: Date.now() }); return true; }
  return false;
}

function _generateId() { return `confirmation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; }
function _getDefaultIcon(variant: DynObj) { const icons = { default: CF_SVGS.question, danger: CF_SVGS.warning, warning: CF_SVGS.warning, info: CF_SVGS.info, success: CF_SVGS.success }; return (icons as DynObj)[variant] || icons.default; }

function confirm(options: DynObj) {
  if (!options) options = {};
  return new Promise(resolve => {
    const id = options.id || _generateId();
    const variant = options.variant || 'default';
    const dialogConfig = { id, title: options.title || _config.defaultTitle, message: options.message || 'Tem certeza que deseja continuar?', confirmText: options.confirmText || (variant === 'danger' ? _config.dangerConfirmText : _config.defaultConfirmText), cancelText: options.cancelText || _config.defaultCancelText, variant, icon: options.icon || _getDefaultIcon(variant), showCancel: options.showCancel !== false, closeOnBackdrop: options.closeOnBackdrop !== undefined ? options.closeOnBackdrop : _config.closeOnBackdrop, closeOnEscape: options.closeOnEscape !== undefined ? options.closeOnEscape : _config.closeOnEscape, focusConfirm: options.focusConfirm !== undefined ? options.focusConfirm : _config.focusConfirm, focusCancel: options.focusCancel !== undefined ? options.focusCancel : _config.focusCancel, data: options.data || null };
    _pendingConfirmations.set(id, { config: dialogConfig, resolve, createdAt: Date.now() });
    const result = Manager.open({ id, type: 'alertdialog', priority: CONFIRMATION_PRIORITY, blocking: true, content: dialogConfig, config: { closable: false, escapable: dialogConfig.closeOnEscape } });
    if (result.ok) { _metrics.shown++; _setScrollLock(true); Accessibility.announceOpen('confirmation'); }
    else { _pendingConfirmations.delete(id); resolve({ confirmed: false, reason: 'open-failed' }); }
  });
}

function doConfirm(id: DynObj) { const pending = _pendingConfirmations.get(id); if (!pending) return { ok: false, reason: 'not-found' }; _pendingConfirmations.delete(id); Manager.close(id, 'confirmed'); _setScrollLock(false); Accessibility.announceClose('confirmation'); _metrics.confirmed++; pending.resolve({ confirmed: true, data: pending.config.data, duration: Date.now() - pending.createdAt }); return { ok: true }; }
function doCancel(id: DynObj) { const pending = _pendingConfirmations.get(id); if (!pending) return { ok: false, reason: 'not-found' }; _pendingConfirmations.delete(id); Manager.close(id, 'cancelled'); _setScrollLock(false); Accessibility.announceClose('confirmation'); _metrics.cancelled++; pending.resolve({ confirmed: false, reason: 'cancelled', duration: Date.now() - pending.createdAt }); return { ok: true }; }
function dismiss(id: DynObj, reason: DynObj) { if (!reason) reason = 'dismissed'; const pending = _pendingConfirmations.get(id); if (!pending) return { ok: false, reason: 'not-found' }; if (reason === 'escape' && !pending.config.closeOnEscape) return { ok: false, reason: 'escape-disabled' }; if (reason === 'backdrop' && !pending.config.closeOnBackdrop) return { ok: false, reason: 'backdrop-disabled' }; _pendingConfirmations.delete(id); Manager.close(id, reason); _setScrollLock(false); _metrics.dismissed++; pending.resolve({ confirmed: false, reason, duration: Date.now() - pending.createdAt }); return { ok: true }; }

function confirmDelete(itemName: string, options: DynObj) { if (!options) options = {}; return confirm(Object.assign({ title: 'Confirmar Exclusão', message: `Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`, variant: 'danger', confirmText: 'Excluir' }, options)); }
function confirmAction(actionName: string, options: DynObj) { if (!options) options = {}; return confirm(Object.assign({ title: 'Confirmar Ação', message: `Tem certeza que deseja ${actionName}?`, variant: 'warning' }, options)); }
function confirmSave(options: DynObj) { if (!options) options = {}; return confirm(Object.assign({ title: 'Salvar Alterações', message: 'Deseja salvar as alterações realizadas?', variant: 'info', confirmText: 'Salvar' }, options)); }
function confirmDiscard(options: DynObj) { if (!options) options = {}; return confirm(Object.assign({ title: 'Descartar Alterações', message: 'Existem alterações não salvas. Deseja descartar?', variant: 'warning', confirmText: 'Descartar' }, options)); }
function confirmLogout(options: DynObj) { if (!options) options = {}; return confirm(Object.assign({ title: 'Sair do Sistema', message: 'Tem certeza que deseja encerrar sua sessão?', variant: 'default', confirmText: 'Sair' }, options)); }
function alert(message: string, options: DynObj) { if (!options) options = {}; return confirm(Object.assign({ title: options.title || 'Aviso', message, variant: options.variant || 'info', showCancel: false, confirmText: 'OK', focusConfirm: true, focusCancel: false }, options)); }

function getPending(id: DynObj) { const pending = _pendingConfirmations.get(id); if (!pending) return null; return { id, config: pending.config, age: Date.now() - pending.createdAt }; }
function getPendingList() { const list: DynObj[] = []; _pendingConfirmations.forEach((data, id) => { list.push({ id, title: data.config.title, variant: data.config.variant, age: Date.now() - data.createdAt }); }); return list; }
function cancelAll(reason: DynObj) { if (!reason) reason = 'cancel-all'; const count = _pendingConfirmations.size; _pendingConfirmations.forEach((pending, id) => { Manager.close(id, reason); pending.resolve({ confirmed: false, reason }); }); _pendingConfirmations.clear(); _setScrollLock(false); return { ok: true, cancelled: count }; }

function getConfig() { return Object.assign({}, _config); }
function setConfig(newConfig: DynObj) { Object.assign(_config, newConfig); return { ok: true, config: Object.assign({}, _config) }; }
function getMetrics() { return Object.assign({}, _metrics, { pending: _pendingConfirmations.size }); }

function healthCheck() {
  const eb = _getPort('eventBus');
  let hasPendingTimeout = false;
  _pendingConfirmations.forEach(p => { if (Date.now() - p.createdAt > 300000) hasPendingTimeout = true; });
  const checks = { managerAvailable: !!Manager, accessibilityAvailable: !!Accessibility, noPendingTimeout: !hasPendingTimeout, eventBusAvailable: !!eb, portsInitialized: Ports.isInitialized() };
  let passed = 0; for (const k in checks) { if (checks.hasOwnProperty(k) && (checks as DynObj)[k]) passed++; }
  return { status: passed === Object.keys(checks).length ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${Object.keys(checks).length}`, checks, metrics: getMetrics(), pendingList: getPendingList(), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

function info() { return { moduleId: MODULE_ID, version: VERSION, config: getConfig(), pendingCount: _pendingConfirmations.size, metrics: getMetrics(), portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }

export { confirm, doConfirm, doCancel, dismiss, confirmDelete, confirmAction, confirmSave, confirmDiscard, confirmLogout, alert, getPending, getPendingList, cancelAll, getConfig, setConfig, getMetrics, healthCheck, info, VERSION, MODULE_ID, injectPorts, getPorts };

export default { confirm, doConfirm, doCancel, dismiss, confirmDelete, confirmAction, confirmSave, confirmDiscard, confirmLogout, alert, getPending, getPendingList, cancelAll, getConfig, setConfig, getMetrics, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
