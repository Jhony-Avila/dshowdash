// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/utils/haptic
// PURPOSE: Panel-01 - Feedback Haptico
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getHapticManager() — exported function
//   haptic() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/utils/haptic';

export class HapticManager {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) {
    this._enabled = options.enabled !== false;
    this._supported = 'vibrate' in navigator;
  }

  isSupported() { return this._supported; }
  isEnabled() { return this._enabled && this._supported; }
  enable() { this._enabled = true; }
  disable() { this._enabled = false; }

  vibrate(pattern: number | number[]) {
    if (!this.isEnabled()) return false;
    try { navigator.vibrate(pattern); return true; } catch { return false; }
  }

  light() { return this.vibrate(10); }
  medium() { return this.vibrate(25); }
  heavy() { return this.vibrate(50); }

  success() { return this.vibrate([10, 50, 10]); }
  warning() { return this.vibrate([30, 30, 30]); }
  error() { return this.vibrate([50, 100, 50]); }

  click() { return this.vibrate(5); }
  select() { return this.vibrate(15); }
  notification() { return this.vibrate([20, 100, 20, 100, 20]); }

  forAction(action: string) {
    const patterns: Record<string, () => boolean> = {
      click: () => this.click(),
      select: () => this.select(),
      success: () => this.success(),
      error: () => this.error(),
      warning: () => this.warning(),
      save: () => this.success(),
      delete: () => this.heavy(),
      refresh: () => this.light(),
      toggle: () => this.click()
    };
    const fn = patterns[action];
    if (fn) fn();
  }

  stop() {
    if (this._supported) navigator.vibrate(0);
  }
}

let instance: InstanceType<typeof HapticManager> | null = null;
export function getHapticManager() { if (!instance) instance = new HapticManager(); return instance; }
export function haptic(action: string) { getHapticManager().forAction(action); }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { HapticManager, getHapticManager, haptic };
