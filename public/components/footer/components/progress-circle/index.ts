// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-P0-SPEC)
// ═══════════════════════════════════════════════════════════════
// MODULE: progress-circle
// PURPOSE: ProgressCircle - Enterprise Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   ProgressCircle() — exported function
//   createProgressCircle() — exported function
//   DEFAULT_THRESHOLDS — exported value
//   DEFAULT_CONFIG — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   UI_EVENTS.ACTION
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';

const MODULE_ID = 'progress-circle';
const VERSION = '1.4.0-P0-SPEC';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const DEFAULT_THRESHOLDS = Object.freeze({ HEALTHY: { max: 60, color: '#22c55e' }, WARNING: { max: 85, color: '#f59e0b' }, CRITICAL: { max: 100, color: '#ef4444' } });
const DEFAULT_CONFIG = Object.freeze({ size: 30, strokeWidth: 3, thresholds: DEFAULT_THRESHOLDS });

const _metrics = { mountCount: 0, unmountCount: 0, valueUpdates: 0, clicks: 0 };

function ProgressCircle(this: any, config: Record<string,unknown>) {
  config = config || {};
  this._config = Object.assign({}, DEFAULT_CONFIG, config);
  this._container = null;
  this._element = null;
  this._progressBar = null;
  this._valueEl = null;
  this._value = 0;
  this._mounted = false;
  this._styleInjected = false;
  this._clickHandler = null;
}

ProgressCircle.prototype.mount = function(container: HTMLElement|null, initialValue: unknown) {
  if (this._mounted) return this;
  if (!container) return this;
  if (initialValue === undefined) initialValue = 0;
  this._container = container;
  _initPorts();
  this._injectStyles();
  this._render();
  this.setValue(initialValue);
  this._mounted = true;
  _metrics.mountCount++;
  return this;
};

ProgressCircle.prototype._injectStyles = function() {
  const styleId = `${MODULE_ID}-styles`;
  if (document.getElementById(styleId)) { this._styleInjected = true; return; }
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = '.pc-container{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px 8px;gap:0;border-radius:6px;background:transparent;transition:background .15s ease;cursor:pointer}.pc-container:hover{background:rgba(139,92,246,.08)}.pc-circle{position:relative;display:flex;align-items:center;justify-content:center}.pc-circle svg{display:block;transform:rotate(-90deg)}.pc-circle .pc-bg{fill:none;stroke:rgba(148,163,184,.15)}.pc-circle .pc-bar{fill:none;stroke-linecap:round;transition:stroke-dashoffset .6s ease,stroke .3s ease}.pc-value{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:9px;font-weight:600;font-variant-numeric:tabular-nums;transition:color .3s ease}';
  document.head.appendChild(style);
  this._styleInjected = true;
};

ProgressCircle.prototype._render = function() {
  const self = this;
  const size = this._config.size;
  const strokeWidth = this._config.strokeWidth;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const label = this._config.label || '';
  this._element = document.createElement('div');
  this._element.className = 'pc-container';
  this._element.title = label;
  this._element.dataset.component = MODULE_ID;
  this._element.dataset.label = label;
  this._element.innerHTML = `<div class="pc-circle" style="width:${size}px;height:${size}px;"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle class="pc-bg" cx="${center}" cy="${center}" r="${radius}" stroke-width="${strokeWidth}"/><circle class="pc-bar" cx="${center}" cy="${center}" r="${radius}" stroke-width="${strokeWidth}" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"/></svg><span class="pc-value">--%</span></div>`;
  this._progressBar = this._element.querySelector('.pc-bar');
  this._valueEl = this._element.querySelector('.pc-value');
  this._container.appendChild(this._element);
  this._clickHandler = () => {
    _metrics.clicks++;
    const eventBus = _getPort('eventBus');
    if (eventBus && eventBus.emit) {
      const actionId = `footer:${(self._config.label || 'progress').toLowerCase().replace(/\s/g, '-')}`;
      eventBus.emit(UI_EVENTS.ACTION, { actionId, source: MODULE_ID, timestamp: Date.now(), kind: 'navigation', meta: { label: self._config.label, value: self._value } });
    }
  };
  this._element.addEventListener('click', this._clickHandler);
};

ProgressCircle.prototype._getColor = function(value: unknown) {
  const thresholds = this._config.thresholds;
  // @ts-expect-error strict migration — TS18046
  if (value <= thresholds.HEALTHY.max) return thresholds.HEALTHY.color;
  // @ts-expect-error strict migration — TS18046
  if (value <= thresholds.WARNING.max) return thresholds.WARNING.color;
  return thresholds.CRITICAL.color;
};

ProgressCircle.prototype.setValue = function(value: unknown) {
  if (!this._mounted) return this;
  _metrics.valueUpdates++;
  const size = this._config.size;
  const strokeWidth = this._config.strokeWidth;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // @ts-expect-error TS migration - TS2345
  const clampedValue = Math.max(0, Math.min(100, value));
  const offset = circumference - (clampedValue / 100) * circumference;
  const color = this._getColor(clampedValue);
  this._value = clampedValue;
  if (this._progressBar) { this._progressBar.style.strokeDashoffset = offset; this._progressBar.style.stroke = color; }
  if (this._valueEl) { this._valueEl.textContent = `${Math.round(clampedValue)}%`; this._valueEl.style.color = color; }
  return this;
};

ProgressCircle.prototype.getValue = function() { return this._value; };

ProgressCircle.prototype.unmount = function() {
  if (!this._mounted) return;
  _metrics.unmountCount++;
  if (this._element && this._clickHandler) this._element.removeEventListener('click', this._clickHandler);
  if (this._element && this._element.parentNode) this._element.parentNode.removeChild(this._element);
  this._element = null;
  this._progressBar = null;
  this._valueEl = null;
  this._container = null;
  this._mounted = false;
  this._clickHandler = null;
};

ProgressCircle.prototype.getMetrics = () => Object.assign({}, _metrics);

ProgressCircle.prototype.info = function() {
  const portsSnapshot = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    mounted: this._mounted,
    value: this._value,
    label: this._config.label || null,
    config: { size: this._config.size, strokeWidth: this._config.strokeWidth },
    metrics: this.getMetrics(),
    portsInitialized: portsSnapshot._initialized,
    timestamp: Date.now()
  };
};

ProgressCircle.prototype.healthCheck = function() {
  const portsSnapshot = Ports.snapshot();
  const checks = {
    mounted: this._mounted,
    hasElement: !!this._element,
    hasProgressBar: !!this._progressBar,
    hasValueEl: !!this._valueEl,
    styleInjected: this._styleInjected,
    portsInitialized: portsSnapshot._initialized
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) { if ((checks as Record<string,unknown>)[keys[i]]) passed++; }
  const total = keys.length;
  let status = 'HEALTHY';
  if (!this._mounted) status = 'UNMOUNTED';
  else if (passed < total) status = 'DEGRADED';
  return {
    status,
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    metrics: _metrics,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
};

function createProgressCircle(config: Record<string,unknown>) { return (new (ProgressCircle as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(config)); }

export { ProgressCircle, createProgressCircle, DEFAULT_THRESHOLDS, DEFAULT_CONFIG, MODULE_ID, VERSION };
export default ProgressCircle;
