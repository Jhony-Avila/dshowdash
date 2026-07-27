// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-status-indicator
// PURPOSE: Container Status Indicator (LED) Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   STATUS — exported value
//   createStatusIndicator() — exported function
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

import { createLogger } from '../utils/logger.js';

export const VERSION = '8.2.0-ENTERPRISE';
export const MODULE_ID = 'container-status-indicator';

const logger = createLogger('StatusIndicator');

export const STATUS = { READY: 'ready', LOADING: 'loading', ERROR: 'error', INACTIVE: 'inactive', SUCCESS: 'success', WARNING: 'warning' };

export function createStatusIndicator(container: HTMLElement, options: Record<string, unknown> = {}) {
  let _initialized = false;
  let _statusEl: HTMLElement | null = null;
  let _currentStatus = STATUS.READY;
  let _pulseTimeout: ReturnType<typeof setTimeout> | null = null;
  let _flashInterval: ReturnType<typeof setInterval> | null = null;

  const indicator = {
    init() {
      if (_initialized) return this;
      _statusEl = container.querySelector('.dsd-container__status');
      _initialized = true;
      return this;
    },
    setStatus(status: string) {
      if (!_statusEl) return this;
      if (!Object.values(STATUS).includes(status)) { logger.warn(`Invalid status: ${status}`); return this; }
      _currentStatus = status;
      _statusEl.className = 'dsd-container__status';
      _statusEl.classList.add(`dsd-container__status--${status}`);
      container.setAttribute('data-state', status);
      _statusEl.setAttribute('aria-label', `Status: ${status}`);
      return this;
    },
    getStatus() { return _currentStatus; },
    isInitialized() { return _initialized; },
    pulse(duration = 2000) {
      if (!_statusEl) return this;
      _statusEl.style.animation = 'statusPulse 1s ease-in-out infinite';
      if (duration > 0) {
        if (_pulseTimeout) clearTimeout(_pulseTimeout);
        _pulseTimeout = setTimeout(() => { if (_statusEl) _statusEl.style.animation = ''; _pulseTimeout = null; }, duration);
      }
      return this;
    },
    flash(color = 'success', times = 3) {
      if (!_statusEl) return this;
      if (_flashInterval) clearInterval(_flashInterval);
      let count = 0;
      const originalStatus = _currentStatus;
      _flashInterval = setInterval(() => {
        // @ts-expect-error strict migration — TS2769
        if (count >= times * 2) { clearInterval(_flashInterval); _flashInterval = null; indicator.setStatus(originalStatus); return; }
        if (count % 2 === 0) indicator.setStatus(color); else indicator.setStatus(originalStatus);
        count++;
      }, 200);
      return this;
    },
    destroy() {
      if (_pulseTimeout) { clearTimeout(_pulseTimeout); _pulseTimeout = null; }
      if (_flashInterval) { clearInterval(_flashInterval); _flashInterval = null; }
      _statusEl = null;
      _initialized = false;
    },
    healthCheck() { return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, currentStatus: _currentStatus, domOnly: true }; }
  };
  return indicator;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, domOnly: true }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, domOnly: true }; }

export default { createStatusIndicator, STATUS, info, healthCheck, VERSION, MODULE_ID };
