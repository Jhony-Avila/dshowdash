// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.5.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-error-display
// PURPOSE: Login Modal - Error Display Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   ErrorDisplay() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

const MODULE_ID = 'login-modal-error-display';
const VERSION = '5.5.0-ENTERPRISE';
const TIMER_KEYS = { AUTO_HIDE: 'error-auto-hide', COUNTDOWN: 'error-countdown' };

export function ErrorDisplay(this: any, errorElement: HTMLElement | null, ariaManager: any, timersManager: any, config: Record<string, any>) { config = config || {}; this.errorElement = errorElement; this.ariaManager = ariaManager; this.timersManager = timersManager; this.autoHideEnabled = config.autoHide !== false; this.autoHideDelay = config.autoHideDelay || 5000; this.telemetry = config.telemetry || null; this.currentCountdownKey = null; this.errorCounts = new Map(); this.lastAriaMessage = ''; this.lastAriaUpdate = 0; this.ariaDebounceMs = 2000; this._mounted = false; }

ErrorDisplay.prototype.mount = function() { this._mounted = true; };

ErrorDisplay.prototype.show = function(options: Record<string, any>) { const self = this; options = options || {}; const message = options.message; const code = options.code || null; const countdownMs = options.countdownMs || null; const focusTarget = options.focusTarget || null; const autoHide = options.autoHide !== undefined ? options.autoHide : this.autoHideEnabled; if (!this.errorElement || !message) return; this._clearAllTimers(); this.errorElement.textContent = message; this.errorElement.classList.add('show'); if (code) { this.errorElement.setAttribute('data-error-code', code); } this._updateAria(message); this._trackError(code); if (countdownMs && countdownMs > 0) { this._startCountdown(countdownMs, focusTarget, message); } else if (autoHide) { this.timersManager && this.timersManager.set(TIMER_KEYS.AUTO_HIDE, () => { self.hide(focusTarget); }, this.autoHideDelay); } };

ErrorDisplay.prototype.showWithCountdown = function(baseMessage: string, seconds: number, onFinish: (() => void) | null) { const countdownMs = seconds > 1000 ? seconds : seconds * 1000; this.show({ message: baseMessage, countdownMs, focusTarget: onFinish }); };

ErrorDisplay.prototype._startCountdown = function(totalMs: number, focusTarget: (() => void) | HTMLElement | null, baseMessage: string) { const self = this; let remainingSeconds = Math.ceil(totalMs / 1000); const countdownKey = `${TIMER_KEYS.COUNTDOWN}-${Date.now()}`; this.currentCountdownKey = countdownKey; const updateCountdown = () => { if (remainingSeconds <= 0) { self.hide(focusTarget); return; } const minutes = Math.floor(remainingSeconds / 60); const secs = remainingSeconds % 60; const timeStr = `${minutes}:${String(secs).padStart(2, '0')}`; const message = `${baseMessage} ${timeStr}`; self.errorElement.textContent = message; self.errorElement.classList.add('show'); const isSignificantChange = remainingSeconds % 10 === 0 || remainingSeconds <= 5; if (isSignificantChange) { self._updateAria(message, true); } remainingSeconds--; self.timersManager && self.timersManager.set(countdownKey, updateCountdown, 1000); }; updateCountdown(); };

ErrorDisplay.prototype._updateAria = function(message: string, forceUpdate: boolean) { const now = Date.now(); const timeSinceLastUpdate = now - this.lastAriaUpdate; const shouldUpdate = forceUpdate || this.lastAriaMessage !== message || timeSinceLastUpdate > this.ariaDebounceMs; if (shouldUpdate && this.ariaManager && this.ariaManager.setErrorAlert) { this.ariaManager.setErrorAlert(this.errorElement, message); this.lastAriaMessage = message; this.lastAriaUpdate = now; } };

ErrorDisplay.prototype.hide = function(focusTarget: (() => void) | HTMLElement | null) { if (!this.errorElement) return; this.errorElement.classList.remove('show'); this.errorElement.removeAttribute('data-error-code'); if (this.ariaManager && this.ariaManager.clearErrorAlert) { this.ariaManager.clearErrorAlert(this.errorElement); } this._clearAllTimers(); this.lastAriaMessage = ''; this.lastAriaUpdate = 0; if (focusTarget) { if (typeof focusTarget === 'function') { focusTarget(); } else if (focusTarget instanceof HTMLElement) { focusTarget.focus(); } } };

ErrorDisplay.prototype.clear = function() { this.hide(); };

ErrorDisplay.prototype.unmount = function() { this._clearAllTimers(); this._mounted = false; };

ErrorDisplay.prototype._clearAllTimers = function() { if (this.timersManager && this.timersManager.clear) { this.timersManager.clear(TIMER_KEYS.AUTO_HIDE); if (this.currentCountdownKey) { this.timersManager.clear(this.currentCountdownKey); this.currentCountdownKey = null; } } };

ErrorDisplay.prototype._trackError = function(code: string | null) { if (!code) return; const count = (this.errorCounts.get(code) || 0) + 1; this.errorCounts.set(code, count); if (this.telemetry && typeof this.telemetry === 'function') { this.telemetry('error:shown', { code, count, timestamp: Date.now() }); } };

ErrorDisplay.prototype.getErrorStats = function() { return Object.fromEntries(this.errorCounts); };

ErrorDisplay.prototype.resetStats = function() { this.errorCounts.clear(); };

ErrorDisplay.prototype.info = function() { return { moduleId: MODULE_ID, version: VERSION, mounted: this._mounted, hasErrorElement: !!this.errorElement, hasAriaManager: !!this.ariaManager, hasTimersManager: !!this.timersManager, autoHideEnabled: this.autoHideEnabled, autoHideDelay: this.autoHideDelay, errorStats: this.getErrorStats(), timestamp: Date.now() }; };

ErrorDisplay.prototype.healthCheck = function() { const checks = { hasErrorElement: !!this.errorElement, hasAriaManager: !!this.ariaManager, hasTimersManager: !!this.timersManager, isMounted: this._mounted }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 4 ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'), score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; };

export function info() { return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }

export function healthCheck() { const checks = { moduleLoaded: true, classAvailable: typeof ErrorDisplay === 'function' }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }

export { VERSION, MODULE_ID };
export default ErrorDisplay;
