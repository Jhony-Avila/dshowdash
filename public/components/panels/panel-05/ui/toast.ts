// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-STRICT-MODE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:toast
// PURPOSE: Panel-05 Toast System - Enterprise Premium AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   toastManager — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Toast — via strict-mode compliant fallback
//   window.Logger — via strict-mode compliant fallback
// ───────────────────────────────────────────────────────────────
// @changelog v8.2.0-STRICT-MODE - NR-FULL: Migração para strict mode
//            - Adicionado import de isStrict, recordViolation
//            - _getToast() e _getLogger() resolvem via windowAdapter > fallback
//            - Em strict mode, não usa window.* fallback
// @changelog v8.1.0-ENTERPRISE-AAA - Versão anterior
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:toast';

function _getToast() {
  if (window.Core?.windowAdapter?.get) {
    const wt = window.Core.windowAdapter.get('Toast');
    if (wt) return wt;
  }
  if (window.Toast) {
    recordViolation('WINDOW_TOAST_FALLBACK', { module: MODULE_ID });
    return window.Toast;
  }
  return null;
}

function _getLogger() {
  if (window.Core?.windowAdapter?.get) {
    const wl = window.Core.windowAdapter.get('Logger');
    if (wl) return wl;
  }
  return null;
}

class ToastManager {
  [key: string]: any;
  constructor() {
    this._container = null;
    this._ready = false;
  }

  init(parentContainer = document.body) {
    this._ready = true;
    return this;
  }

  destroy() {
    this._ready = false;
  }

  success(message: unknown, options: Record<string, unknown> = {}) {
    return this._show('success', message, options);
  }

  error(message: unknown, options: Record<string, unknown> = {}) {
    return this._show('error', message, options);
  }

  warning(message: unknown, options: Record<string, unknown> = {}) {
    return this._show('warning', message, options);
  }

  info(message: unknown, options: Record<string, unknown> = {}) {
    return this._show('info', message, options);
  }

  _show(type: string, message: unknown, options: Record<string, unknown> = {}) {
    const { title, duration, action, actionLabel = 'Ação', persist = false } = options;

    const toast = _getToast();
    if (toast?.show) {
      const toastOptions = {
        type,
        message,
        title: title || undefined,
        duration: persist ? 0 : duration,
        actions: action ? [{ label: actionLabel, primary: true, onClick: action }] : []
      };
      return toast.show(toastOptions);
    }

    const logger = _getLogger();
    logger?.warn?.('[panel-05:toast] Toast Service not available');
    return null;
  }

  dismiss(id: unknown) {
    const toast = _getToast();
    if (toast?.dismiss) {
      return toast.dismiss(id);
    }
  }

  dismissAll() {
    const toast = _getToast();
    if (toast?.dismissAll) {
      return toast.dismissAll();
    }
  }

  getInfo() {
    const toast = _getToast();
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      activeToasts: toast?.getVisible?.()?.length || 0
    };
  }

  healthCheck() {
    const toast = _getToast();
    return {
      status: toast ? 'HEALTHY' : 'NOT_INITIALIZED',
      moduleId: MODULE_ID,
      version: VERSION,
      timestamp: Date.now()
    };
  }
}

export const toastManager = new ToastManager();
export default toastManager;
