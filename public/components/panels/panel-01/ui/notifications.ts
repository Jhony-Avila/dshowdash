// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/notifications
// PURPOSE: Panel-01 Notifications Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   notifications — exported value
//   info() — exported function
//   healthCheck() — exported function
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

import * as Toast from './toast.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/notifications';

class NotificationsManager {
  [key: string]: any;
  constructor() {
    this._queue = [];
    this._processing = false;
    this._maxConcurrent = 3;
    this._active = 0;
  }

  success(message: string, options: Record<string, unknown> = {}) {
    return this._enqueue('success', message, options);
  }

  error(message: string, options: Record<string, unknown> = {}) {
    return this._enqueue('error', message, { duration: 6000, ...options });
  }

  warning(message: string, options: Record<string, unknown> = {}) {
    return this._enqueue('warning', message, options);
  }

  info(message: string, options: Record<string, unknown> = {}) {
    return this._enqueue('info', message, options);
  }

  loading(message = 'Carregando...') {
    return Toast.show(message, 'info', 0);
  }

  _enqueue(type: string, message: string, options: Record<string, unknown> = {}) {
    if (this._active < this._maxConcurrent) {
      return this._show(type, message, options);
    }
    
    return new Promise(resolve => {
      this._queue.push({ type, message, options, resolve });
    });
  }

  _show(type: string, message: string, options: Record<string, unknown>) {
    this._active++;
    const duration = options.duration || 4000;
    const toast = (Toast as unknown as Record<string, (msg: string, dur: unknown) => unknown>)[type](message, duration);
    
    setTimeout(() => {
      this._active--;
      this._processQueue();
    }, duration as number);
    
    return toast;
  }

  _processQueue() {
    if (this._queue.length === 0 || this._active >= this._maxConcurrent) return;
    
    const { type, message, options, resolve } = this._queue.shift();
    const result = this._show(type, message, options);
    resolve(result);
  }

  clearAll() {
    document.querySelectorAll('.p01-toast').forEach(t => t.remove());
    this._queue = [];
    this._active = 0;
  }
}

export const notifications = new NotificationsManager();

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default notifications;
