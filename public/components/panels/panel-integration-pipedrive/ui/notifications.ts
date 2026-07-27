// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-integration-pipedrive/ui/notifications
// PURPOSE: Integration Pipedrive - Notifications (Autocontido AAA)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   show() — exported function
//   success() — exported function
//   error() — exported function
//   warning() — exported function
//   info() — exported function
//   destroy() — exported function
//   healthCheck() — exported function
//   getInfo() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/panel-integration-pipedrive/ui/notifications';

let _container: HTMLElement | null = null;
let _wrapper: HTMLElement | null = null;

function _ensureWrapper() {
  if (!_wrapper) {
    _wrapper = document.createElement('div');
    _wrapper.className = 'panel-notifications-wrapper';
    _wrapper.setAttribute('data-notifications-owner', MODULE_ID);
    const panel = document.querySelector('[data-panel="panel-integration-pipedrive"]') || document.querySelector('.panel-integration-pipedrive');
    (panel || document.documentElement).appendChild(_wrapper);
  }
  return _wrapper;
}

function _ensureContainer() {
  if (!_container) {
    _container = document.createElement('div');
    _container.className = 'notifications-container';
    _container.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;pointer-events:none;';
    _ensureWrapper().appendChild(_container);
  }
  return _container;
}

export function show(message: string, type = 'info', duration = 3000) {
  const container = _ensureContainer();
  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.textContent = message;
  notification.style.cssText = 'padding:0.75rem 1rem;border-radius:0.5rem;background:#333;color:#fff;font-size:0.875rem;animation:slideIn 0.3s ease;pointer-events:auto;';
  container.appendChild(notification);
  if (duration > 0) { setTimeout(() => { notification.remove(); }, duration); }
  return notification;
}

export function success(message: string, duration?: number) { return show(message, 'success', duration); }
export function error(message: string, duration?: number) { return show(message, 'error', duration); }
export function warning(message: string, duration?: number) { return show(message, 'warning', duration); }
export function info(message: string, duration?: number) { return show(message, 'info', duration); }
export function destroy() { if (_wrapper) { _wrapper.remove(); _wrapper = null; _container = null; } }

export function healthCheck() { return { status: 'healthy', version: VERSION, moduleId: MODULE_ID, noBodyAppend: true }; }
export function getInfo() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() }; }

export default { show, success, error, warning, info, destroy, healthCheck, getInfo, VERSION, MODULE_ID };
