// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.gestures.pull-refresh
// PURPOSE: Pull to Refresh - Ticker Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'touchend'
//   'touchmove'
//   'touchstart'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '1.3.0-P17WI';
export const MODULE_ID = 'ticker.gestures.pull-refresh';
const hasWindow = typeof window !== 'undefined';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
function _log(level: string, ...args: unknown[]) { const logger = _getPort('logger'); if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args); }
function isTouchDevice() { if (!hasWindow) return false; return 'ontouchstart' in window || navigator.maxTouchPoints > 0; }
export class PullToRefresh {
  [key: string]: any;
  constructor(options: { threshold?: number; resistance?: number; onRefresh?: (() => void) | null } = {}) { this.threshold = options.threshold || 60; this.resistance = options.resistance || 2.5; this.onRefresh = options.onRefresh || null; this._container = null; this._indicator = null; this._startY = 0; this._currentY = 0; this._pulling = false; this._refreshing = false; this._enabled = true; this._isTouchDevice = isTouchDevice(); this._metrics = { pulls: 0, refreshes: 0, cancels: 0 }; this._boundTouchStart = this._onTouchStart.bind(this); this._boundTouchMove = this._onTouchMove.bind(this); this._boundTouchEnd = this._onTouchEnd.bind(this); }
  init(container: unknown) { if (!container) return this; this._container = container; if (this._isTouchDevice) { this._createIndicator(); this._attachEvents(); _log('debug', 'PullToRefresh initialized (touch device)'); } else { _log('debug', 'PullToRefresh skipped (non-touch device)'); } return this; }
  _createIndicator() { this._indicator = document.createElement('div'); this._indicator.className = 'ticker-pull-indicator'; this._indicator.setAttribute('aria-hidden', 'true'); this._indicator.innerHTML = `<svg class="ticker-pull-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span class="ticker-pull-text">Puxe para atualizar</span>`; this._container.style.position = 'relative'; this._container.appendChild(this._indicator); }
  _attachEvents() { this._container.addEventListener('touchstart', this._boundTouchStart, { passive: true }); this._container.addEventListener('touchmove', this._boundTouchMove, { passive: false }); this._container.addEventListener('touchend', this._boundTouchEnd, { passive: true }); }
  _onTouchStart(e: TouchEvent) { if (!this._enabled || this._refreshing) return; if (this._container.scrollLeft > 0) return; this._startY = e.touches[0].clientY; this._pulling = true; this._metrics.pulls++; }
  _onTouchMove(e: TouchEvent) { if (!this._pulling || this._refreshing || !this._indicator) return; this._currentY = e.touches[0].clientY; const deltaY = (this._currentY - this._startY) / this.resistance; if (deltaY > 0) { e.preventDefault(); if (!this._indicator.classList.contains('ticker-pull-indicator--active')) { this._indicator.classList.add('ticker-pull-indicator--active'); } const progress = Math.min(deltaY / this.threshold, 1); this._updateIndicator(deltaY, progress); } }
  _onTouchEnd() { if (!this._pulling) return; const deltaY = (this._currentY - this._startY) / this.resistance; if (deltaY >= this.threshold && !this._refreshing) { this._triggerRefresh(); } else { this._resetIndicator(); this._metrics.cancels++; } this._pulling = false; this._startY = 0; this._currentY = 0; }
  _updateIndicator(deltaY: number, progress: number) { if (!this._indicator) return; this._indicator.style.transform = `translateX(-50%) translateY(${Math.min(deltaY, this.threshold)}px)`; const text = this._indicator.querySelector('.ticker-pull-text'); if (text) { text.textContent = progress >= 1 ? 'Solte para atualizar' : 'Puxe para atualizar'; } }
  _resetIndicator() { if (!this._indicator) return; this._indicator.style.transform = ''; this._indicator.classList.remove('ticker-pull-indicator--active', 'ticker-pull-indicator--visible', 'ticker-pull-indicator--refreshing'); }
  async _triggerRefresh() { this._refreshing = true; this._metrics.refreshes++; if (this._indicator) { this._indicator.classList.add('ticker-pull-indicator--active', 'ticker-pull-indicator--visible', 'ticker-pull-indicator--refreshing'); const text = this._indicator.querySelector('.ticker-pull-text'); if (text) text.textContent = 'Atualizando...'; } _log('debug', 'Refresh triggered'); try { if (this.onRefresh) await this.onRefresh(); } catch (e: any) { _log('warn', 'Refresh failed', { error: e.message }); } finally { setTimeout(() => { this._resetIndicator(); this._refreshing = false; }, 500); } }
  enable() { this._enabled = true; }
  disable() { this._enabled = false; }
  isRefreshing() { return this._refreshing; }
  isTouchDevice() { return this._isTouchDevice; }
  destroy() { if (this._container) { this._container.removeEventListener('touchstart', this._boundTouchStart); this._container.removeEventListener('touchmove', this._boundTouchMove); this._container.removeEventListener('touchend', this._boundTouchEnd); } if (this._indicator && this._indicator.parentNode) { this._indicator.parentNode.removeChild(this._indicator); } this._container = null; this._indicator = null; }
  healthCheck() { const checks = { hasContainer: !!this._container, hasIndicator: !!this._indicator || !this._isTouchDevice, enabled: this._enabled, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 4 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/4`, refreshing: this._refreshing, isTouchDevice: this._isTouchDevice, checks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, enabled: this._enabled, refreshing: this._refreshing, isTouchDevice: this._isTouchDevice, threshold: this.threshold, metrics: { ...this._metrics }, portsInitialized: Ports.isInitialized() }; }
}
export function getVersion() { return VERSION; }
export default PullToRefresh;
