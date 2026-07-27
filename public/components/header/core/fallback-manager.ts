// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.4.0-P1-UARPS)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/fallback-manager
// PURPOSE: Manages fallback UI display with priority, debounce, auto-hide and accessibility
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   escapeHtml from ../utils/html-helpers.js
// PROVIDES:
//   FallbackManager (class) — manages fallback overlay show/hide with priority system
//   injectPorts(p) — inject port dependencies
//   getPorts() — return ports snapshot
//   getVersion() — return module version
//   VERSION — module version constant
//   MODULE_ID — module identifier constant
// WINDOW ACCESS:
//   document.activeElement — save/restore focus for accessibility
//   document.body — check element containment for focus restore
// ═══════════════════════════════════════════════════════════════

// Header - Fallback Manager (Enterprise)
// @version 3.4.0-P1-UARPS
// @changelog v3.4.0-P1-UARPS - Added data-uarps-trigger for close button
// @changelog P17WI - Migração para PortsFactory/PortsProfiles
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { escapeHtml } from '../utils/html-helpers.js';

export const VERSION = '3.4.0-P1-UARPS';
export const MODULE_ID = 'header/core/fallback-manager';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => _getPort('config')?.app?.debug || false;
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { logger.error?.(prefix, ...args); return; } if (level === 'warn') { logger.warn?.(prefix, ...args); return; } if (level === 'info') { logger.info?.(prefix, ...args); return; } if (_debugEnabled()) logger.debug?.(prefix, ...args); };

const FALLBACK_PRIORITY = Object.freeze({ api: 1, generic: 1, network: 2, timeout: 3 });

function getFallbackTemplate(type: string, message: string) { const icons = { network: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>`, api: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`, timeout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`, generic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>` }; const severityMap = { network: 'warning', api: 'error', timeout: 'info', generic: 'error' }; const icon = (icons as Record<string,unknown>)[type as string] || icons.generic; const severity = (severityMap as Record<string,unknown>)[type as string] || 'error'; const roleType = severity === 'error' ? 'alert' : 'status'; const liveType = severity === 'error' ? 'assertive' : 'polite'; return `<div class="header-fallback header-fallback-${type}" role="${roleType}" aria-live="${liveType}" aria-atomic="true" tabindex="-1" data-fallback-type="${type}"><div class="header-fallback-content"><div class="header-fallback-icon">${icon}</div><div class="header-fallback-message">${escapeHtml(message)}</div><button class="header-fallback-close" aria-label="Fechar mensagem: ${escapeHtml(message)}" type="button" data-uarps-trigger="trigger:header:fallback-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div></div>`; }

export class FallbackManager {
  [key: string]: any;
  constructor(header: Record<string,unknown>) { this.header = header; this._debug = false; this._metrics = { showCount: 0, hideCount: 0, replacedCount: 0, lastShowAt: null }; this.state = { element: null, timerId: null, previousFocus: null, currentType: null, isTransitioning: false, closeHandler: null, debounceTimer: null, isActive: false }; _initPorts(); }

  show(type = 'generic', message = 'Erro ao carregar dados', options = {}) { if (!this.header.lifecycle || !this.header.lifecycle.isReady()) return; if (this.state.isActive) return; if (this.state.debounceTimer) clearTimeout(this.state.debounceTimer); const debounceMs = this.header.config?.fallback?.debounce || 300; this.state.debounceTimer = setTimeout(() => { this._showImmediate(type, message, options); this.state.debounceTimer = null; }, debounceMs); }

  // @ts-expect-error strict migration — TS18046
  _showImmediate(type: string, message: string, options: Record<string,unknown>) { if (this.state.isTransitioning) return; const newPriority = (FALLBACK_PRIORITY as Record<string,unknown>)[type as string] || 99; const currentPriority = this.state.currentType ? (FALLBACK_PRIORITY as Record<string,unknown>)[this.state.currentType as string] : 99; if (this.state.element && newPriority > currentPriority) { _log('info', `Fallback ignorado (${type} < ${this.state.currentType})`); return; } if (this.state.element && this.state.currentType !== type) { this._metrics.replacedCount++; this.header.telemetry?.track('fallback:replaced', { oldType: this.state.currentType, newType: type, instanceId: this.header.instanceId }); } this.hide(); const { autoHide = this.header.config?.fallback?.autoHide || true, duration = this.header.config?.fallback?.autoHideDuration || 8000 } = options; this.state.previousFocus = document.activeElement; this.state.currentType = type; this.state.isTransitioning = true; this.state.isActive = true; this._metrics.showCount++; this._metrics.lastShowAt = Date.now(); const template = getFallbackTemplate(type, message); this.header.elements.container.insertAdjacentHTML('beforeend', template); this.state.element = this.header.elements.container.querySelector('.header-fallback'); if (!this.state.element) { _log('error', 'Falha ao criar fallback'); this.state.isTransitioning = false; this.state.isActive = false; return; } const closeBtn = this.state.element.querySelector('.header-fallback-close'); if (closeBtn) { this.state.closeHandler = () => this.hide(); closeBtn.addEventListener('click', this.state.closeHandler, { signal: this.header.abortControllers.fallback?.signal, once: true }); } requestAnimationFrame(() => { if (!this.state.element) return; this.state.element.classList.add('header-fallback-visible'); this.state.isTransitioning = false; requestAnimationFrame(() => { if (closeBtn && this.state.element) closeBtn.focus(); }); }); if (autoHide && duration > 0) { this.state.timerId = setTimeout(() => { this.hide(); }, duration); } this.header.telemetry?.track('fallback:show', { type, message: message.substring(0, 100), autoHide, duration, priority: newPriority, instanceId: this.header.instanceId }); this.header.announceManager?.announce(message); _log('warn', `Fallback: ${type}`); }

  hide() { if (!this.state.element || !this.state.element.isConnected) { this._resetState(); return; } if (this.state.debounceTimer) { clearTimeout(this.state.debounceTimer); this.state.debounceTimer = null; } if (this.state.timerId) { clearTimeout(this.state.timerId); this.state.timerId = null; } this.state.isTransitioning = true; this._metrics.hideCount++; if (this.state.element) { this.state.element.removeAttribute('role'); this.state.element.removeAttribute('aria-live'); this.state.element.removeAttribute('aria-atomic'); this.state.element.classList.remove('header-fallback-visible'); this.state.element.classList.add('header-fallback-hiding'); } setTimeout(() => { if (this.state.element && this.state.element.isConnected) this.state.element.remove(); if (this.state.previousFocus && document.body.contains(this.state.previousFocus)) this.state.previousFocus.focus(); this._resetState(); }, 300); this.header.telemetry?.track('fallback:hide', { instanceId: this.header.instanceId }); _log('info', 'Fallback escondido'); }

  _resetState() { this.state.element = null; this.state.currentType = null; this.state.closeHandler = null; this.state.isTransitioning = false; this.state.isActive = false; this.state.previousFocus = null; }

  healthCheck() { const checks = { notTransitioning: !this.state.isTransitioning, noOrphanElements: !this.state.element || this.state.element.isConnected, headerAvailable: !!this.header, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([,v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; }

  info() { return { version: VERSION, moduleId: MODULE_ID, isActive: this.state.isActive, currentType: this.state.currentType, metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { this._debug = !!enabled; }
  resetMetrics() { this._metrics = { showCount: 0, hideCount: 0, replacedCount: 0, lastShowAt: null }; }
  destroy() {
    if (this.state) {
      if (this.state.debounceTimer) { clearTimeout(this.state.debounceTimer); this.state.debounceTimer = null; }
      if (this.state.timerId) { clearTimeout(this.state.timerId); this.state.timerId = null; }
      if (this.state.element && this.state.element.isConnected) { this.state.element.remove(); }
      if (this.state.previousFocus && document.body.contains(this.state.previousFocus)) { this.state.previousFocus.focus(); }
    }
    this.state = null;
    this.header = null;
  }
}

export function getVersion() { return VERSION; }
export default FallbackManager;
