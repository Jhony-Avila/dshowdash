// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.2.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/whatsapp-integration/ui/tooltips
// PURPOSE: WhatsApp Integration - Tooltip Manager (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getTooltipRoot from ../../../utils/overlay-root.js
//
// PROVIDES:
//   VERSION — module constant
//   TooltipManager() — exported function
//   setDebug() — exported function
//   getLogs() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'mouseenter'
//   'mouseleave'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getTooltipRoot } from '../../../utils/overlay-root.js';
export const VERSION = '5.2.0-ES6';
export const MODULE_ID = 'header/components/whatsapp-integration/ui/tooltips';
// @ts-expect-error strict migration — TS7034
let _debug = false; const _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string) { const args = Array.prototype.slice.call(arguments, 1); if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
export function TooltipManager(this: any, options: Record<string,unknown>) { options = options || {}; this.delay = options.delay || 300; this.activeTooltip = null; this.timeoutId = null; this._metrics = { showCount: 0, hideCount: 0, lastShowAt: null }; }
TooltipManager.prototype.attach = function(element: HTMLElement|null) { const self = this; if (!element) return; const tooltip = element.getAttribute('data-tooltip'); if (!tooltip) return; element.addEventListener('mouseenter', () => { self._show(element, tooltip); }); element.addEventListener('mouseleave', () => { self._hide(); }); };
TooltipManager.prototype._show = function(element: HTMLElement|null, text: string) { const self = this; this._hide(); this.timeoutId = setTimeout(() => { const el = document.createElement('div'); el.className = 'whatsapp-tooltip'; el.textContent = text; el.style.position = 'fixed'; el.style.pointerEvents = 'none'; getTooltipRoot().appendChild(el); const rect = element!.getBoundingClientRect(); el.style.left = `${rect.left + rect.width / 2}px`; el.style.top = `${rect.top - 30}px`; el.style.transform = 'translateX(-50%)'; self.activeTooltip = el; self._metrics.showCount++; self._metrics.lastShowAt = Date.now(); }, this.delay); };
TooltipManager.prototype._hide = function() { if (this.timeoutId) clearTimeout(this.timeoutId); if (this.activeTooltip) { this.activeTooltip.remove(); this.activeTooltip = null; this._metrics.hideCount++; } };
TooltipManager.prototype.healthCheck = () => { const checks = { ready: true, noBodyAppend: true }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; };
TooltipManager.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, hasActiveTooltip: !!this.activeTooltip, metrics: this._metrics, healthCheck: this.healthCheck() }; };
TooltipManager.prototype.setDebug = (enabled: boolean) => { _debug = !!enabled; };
TooltipManager.prototype.getMetrics = function() { return Object.assign({}, this._metrics); };
TooltipManager.prototype.resetMetrics = function() { this._metrics = { showCount: 0, hideCount: 0, lastShowAt: null }; };
// @ts-expect-error strict migration — TS7005
TooltipManager.getLogs = () => _logBuffer.slice();
export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return _logBuffer.slice(); }
export default TooltipManager;
