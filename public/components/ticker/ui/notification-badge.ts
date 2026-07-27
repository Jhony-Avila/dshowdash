// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.ui.notification-badge
// PURPOSE: Notification Badge - Ticker Enterprise
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
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '1.2.0-P17WI';
export const MODULE_ID = 'ticker.ui.notification-badge';
const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args); };
const BADGE_STYLES = `.ticker-badge { position: absolute; top: -4px; right: -4px; min-width: 18px; height: 18px; padding: 0 5px; background: #ef4444; color: #fff; font-size: 11px; font-weight: 600; border-radius: 9px; display: flex; align-items: center; justify-content: center; opacity: 0; transform: scale(0.5); transition: opacity 0.2s, transform 0.2s; pointer-events: none; z-index: 10; } .ticker-badge--visible { opacity: 1; transform: scale(1); } .ticker-badge--pulse { animation: ticker-badge-pulse 1s ease-in-out infinite; } @keyframes ticker-badge-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } } .ticker-badge-container { position: relative; display: inline-flex; }`;
export class NotificationBadge {
  [key: string]: any;
  constructor(options: { maxCount?: number; pulseOnUpdate?: boolean; storageKey?: string } = {}) { this.maxCount = options.maxCount || 99; this.pulseOnUpdate = options.pulseOnUpdate ?? true; this.storageKey = options.storageKey || 'ticker_last_seen'; this._badge = null; this._container = null; this._count = 0; this._lastSeenIds = new Set(); this._metrics = { updates: 0, clears: 0, totalNewItems: 0 }; }
  init(container: unknown) { this._injectStyles(); this._container = container; this._loadLastSeen(); _log('debug', 'NotificationBadge initialized'); return this; }
  _injectStyles() { if (!hasDocument || document.getElementById('ticker-badge-styles')) return; const style = document.createElement('style'); style.id = 'ticker-badge-styles'; style.textContent = BADGE_STYLES; document.head.appendChild(style); }
  // @ts-expect-error strict migration — TS18047
  attachTo(element: HTMLElement | null) { if (!element || !hasDocument) return null; const wrapper = document.createElement('div'); wrapper.className = 'ticker-badge-container'; element.parentNode.insertBefore(wrapper, element); wrapper.appendChild(element); this._badge = document.createElement('span'); this._badge.className = 'ticker-badge'; this._badge.setAttribute('aria-live', 'polite'); this._badge.setAttribute('role', 'status'); wrapper.appendChild(this._badge); this._container = wrapper; return wrapper; }
  update(items: unknown[]) { if (!Array.isArray(items)) return 0; const newItems = items.filter((item: any) => { const id = item.id || this._generateId(item); return !this._lastSeenIds.has(id); }); this._count = newItems.length; this._metrics.updates++; this._metrics.totalNewItems += newItems.length; if (this._badge) { if (this._count > 0) { const displayCount = this._count > this.maxCount ? `${this.maxCount}+` : this._count; this._badge.textContent = displayCount; this._badge.classList.add('ticker-badge--visible'); if (this.pulseOnUpdate) { this._badge.classList.add('ticker-badge--pulse'); setTimeout(() => this._badge?.classList.remove('ticker-badge--pulse'), 3000); } this._badge.setAttribute('aria-label', `${this._count} nova(s) noticia(s)`); } else { this._badge.classList.remove('ticker-badge--visible', 'ticker-badge--pulse'); } } _log('debug', `Badge updated: ${this._count} new items`); return this._count; }
  markAllSeen(items: unknown[]) { if (!Array.isArray(items)) return; items.forEach((item: any) => { const id = item.id || this._generateId(item); this._lastSeenIds.add(id); }); this._count = 0; if (this._badge) { this._badge.classList.remove('ticker-badge--visible', 'ticker-badge--pulse'); } this._saveLastSeen(); this._metrics.clears++; _log('debug', 'All items marked as seen'); }
  clear() { this._count = 0; if (this._badge) { this._badge.classList.remove('ticker-badge--visible', 'ticker-badge--pulse'); } _log('debug', 'Badge cleared'); }
  _generateId(item: Record<string, any>) { const title = item.title || ''; const source = item.source || ''; return `${source}-${title.substring(0, 50)}`.toLowerCase().replace(/\s+/g, '-'); }
  _loadLastSeen() { try { const stored = localStorage.getItem(this.storageKey); if (stored) { const parsed = JSON.parse(stored); this._lastSeenIds = new Set(parsed.ids || []); } } catch (e: any) { _log('warn', 'Failed to load last seen', { error: e.message }); } }
  _saveLastSeen() { try { const ids = [...this._lastSeenIds].slice(-500); localStorage.setItem(this.storageKey, JSON.stringify({ ids, timestamp: Date.now() })); } catch (e: any) { _log('warn', 'Failed to save last seen', { error: e.message }); } }
  getCount() { return this._count; }
  destroy() { if (this._badge && this._badge.parentNode) { this._badge.parentNode.removeChild(this._badge); } this._badge = null; this._container = null; }
  healthCheck() { const logger = _getPort('logger'); const checks = { hasBadge: !!this._badge, hasStorage: typeof localStorage !== 'undefined', loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 4 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/4`, count: this._count, seenCount: this._lastSeenIds.size, checks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, count: this._count, seenCount: this._lastSeenIds.size, metrics: { ...this._metrics }, portsInitialized: Ports.isInitialized() }; }
}
export function getVersion() { return VERSION; }
export default NotificationBadge;
