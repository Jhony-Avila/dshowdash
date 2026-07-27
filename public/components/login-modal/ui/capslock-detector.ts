// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.5.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-ui-capslock-detector
// PURPOSE: Login Modal - Caps Lock Detector
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   info() — exported function
//   healthCheck() — exported function
//   CapsLockDetector — exported class
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

const VERSION = '5.5.0-ENTERPRISE';
const MODULE_ID = 'login-modal-ui-capslock-detector';
const isBrowser = typeof document !== 'undefined';

export class CapsLockDetector {
  [key: string]: any;
  constructor(passwordInput: HTMLInputElement, warningElement: HTMLElement | null, config: Record<string, unknown> = {}) {
    this.passwordInput = passwordInput;
    this.warningElement = warningElement;
    this.config = config;
    this.telemetry = config.telemetry || null;
    this.logger = config.logger || console;
    this._mounted = false;
    this._capsLockOn = false;
    this._metrics = { detections: 0, shows: 0, hides: 0 };
    this._handleKeyDown = this._onKeyDown.bind(this);
    this._handleKeyUp = this._onKeyUp.bind(this);
    this._handleBlur = this._onBlur.bind(this);
  }

  mount() {
    if (!isBrowser || !this.passwordInput || this._mounted) return;
    this.passwordInput.addEventListener('keydown', this._handleKeyDown);
    this.passwordInput.addEventListener('keyup', this._handleKeyUp);
    this.passwordInput.addEventListener('blur', this._handleBlur);
    this._mounted = true;
    this._track('capslock:mounted');
  }

  unmount() {
    if (!this._mounted) return;
    this.passwordInput?.removeEventListener('keydown', this._handleKeyDown);
    this.passwordInput?.removeEventListener('keyup', this._handleKeyUp);
    this.passwordInput?.removeEventListener('blur', this._handleBlur);
    this._mounted = false;
    this.hide();
    this._track('capslock:unmounted');
  }

  _onKeyDown(event: KeyboardEvent) {
    this._detectCapsLock(event);
  }

  _onKeyUp(event: KeyboardEvent) {
    this._detectCapsLock(event);
  }

  _onBlur() {
    this.hide();
  }

  _detectCapsLock(event: KeyboardEvent) {
    if (typeof event.getModifierState !== 'function') return;
    const capsLockOn = event.getModifierState('CapsLock');
    this._metrics.detections++;
    if (capsLockOn !== this._capsLockOn) {
      this._capsLockOn = capsLockOn;
      if (capsLockOn) { this.show(); } 
      else { this.hide(); }
    }
  }

  show() {
    if (!this.warningElement) return;
    this._metrics.shows++;
    this.warningElement.removeAttribute('hidden');
    this._track('capslock:shown');
  }

  hide() {
    if (!this.warningElement) return;
    this._metrics.hides++;
    this.warningElement.setAttribute('hidden', '');
    this._track('capslock:hidden');
  }

  isCapsLockOn() { return this._capsLockOn; }
  isMounted() { return this._mounted; }

  _track(event: string, detail: Record<string, unknown> = {}) {
    if (this.telemetry && typeof this.telemetry === 'function') {
      this.telemetry(event, { ...detail, timestamp: Date.now(), source: MODULE_ID });
    }
  }

  info() {
    return { moduleId: MODULE_ID, version: VERSION, mounted: this._mounted, capsLockOn: this._capsLockOn, metrics: { ...this._metrics }, timestamp: Date.now() };
  }

  healthCheck() {
    const checks = { hasPasswordInput: !!this.passwordInput, hasWarningElement: !!this.warningElement, isMounted: this._mounted };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'), score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }
export function healthCheck() { const checks = { moduleLoaded: true, classAvailable: typeof CapsLockDetector === 'function' }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }

export { VERSION, MODULE_ID };
export default CapsLockDetector;
