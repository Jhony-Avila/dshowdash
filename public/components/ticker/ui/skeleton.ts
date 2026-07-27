// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.ui.skeleton
// PURPOSE: Skeleton Loading - Ticker Enterprise
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
export const MODULE_ID = 'ticker.ui.skeleton';
const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args); };
const SKELETON_STYLES = `.ticker-skeleton { display: flex; gap: 16px; padding: 8px 16px; overflow: hidden; } .ticker-skeleton-item { display: flex; align-items: center; gap: 8px; flex-shrink: 0; } .ticker-skeleton-icon { width: 16px; height: 16px; border-radius: 4px; background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%); background-size: 200% 100%; animation: ticker-skeleton-shimmer 1.5s infinite; } .ticker-skeleton-text { height: 12px; border-radius: 4px; background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%); background-size: 200% 100%; animation: ticker-skeleton-shimmer 1.5s infinite; } .ticker-skeleton-text--short { width: 60px; } .ticker-skeleton-text--medium { width: 120px; } .ticker-skeleton-text--long { width: 200px; } .ticker-skeleton-text--xl { width: 280px; } .ticker-skeleton-tag { width: 40px; height: 16px; border-radius: 8px; background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%); background-size: 200% 100%; animation: ticker-skeleton-shimmer 1.5s infinite; } @keyframes ticker-skeleton-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } } .ticker-skeleton--paused .ticker-skeleton-icon, .ticker-skeleton--paused .ticker-skeleton-text, .ticker-skeleton--paused .ticker-skeleton-tag { animation-play-state: paused; }`;
export class SkeletonLoader {
  [key: string]: any;
  constructor(options: { container?: HTMLElement | null; itemCount?: number; showTags?: boolean } = {}) { this.container = options.container || null; this.itemCount = options.itemCount || 5; this.showTags = options.showTags ?? true; this._element = null; this._styleElement = null; this._visible = false; this._metrics = { shows: 0, hides: 0, totalVisibleTime: 0 }; this._showTime = null; }
  init(container: unknown) { this.container = container || this.container; this._injectStyles(); _log('debug', 'SkeletonLoader initialized'); return this; }
  _injectStyles() { if (!hasDocument || document.getElementById('ticker-skeleton-styles')) return; this._styleElement = document.createElement('style'); this._styleElement.id = 'ticker-skeleton-styles'; this._styleElement.textContent = SKELETON_STYLES; document.head.appendChild(this._styleElement); }
  show() { if (this._visible || !this.container || !hasDocument) return; this._element = this._createSkeleton(); this.container.innerHTML = ''; this.container.appendChild(this._element); this._visible = true; this._showTime = Date.now(); this._metrics.shows++; _log('debug', 'Skeleton shown'); }
  hide() { if (!this._visible) return; if (this._element && this._element.parentNode) { this._element.parentNode.removeChild(this._element); } this._element = null; this._visible = false; if (this._showTime) { this._metrics.totalVisibleTime += Date.now() - this._showTime; this._showTime = null; } this._metrics.hides++; _log('debug', 'Skeleton hidden'); }
  // @ts-expect-error strict migration — TS2345
  _createSkeleton() { if (!hasDocument) return null; const wrapper = document.createElement('div'); wrapper.className = 'ticker-skeleton'; wrapper.setAttribute('role', 'status'); wrapper.setAttribute('aria-label', 'Carregando...'); for (let i = 0; i < this.itemCount; i++) { wrapper.appendChild(this._createSkeletonItem(i)); } return wrapper; }
  _createSkeletonItem(index: number) { if (!hasDocument) return null; const item = document.createElement('div'); item.className = 'ticker-skeleton-item'; const icon = document.createElement('div'); icon.className = 'ticker-skeleton-icon'; icon.style.animationDelay = `${index * 0.1}s`; item.appendChild(icon); const time = document.createElement('div'); time.className = 'ticker-skeleton-text ticker-skeleton-text--short'; time.style.animationDelay = `${index * 0.1 + 0.05}s`; item.appendChild(time); const sizes = ['long', 'xl', 'medium', 'long', 'xl']; const text = document.createElement('div'); text.className = `ticker-skeleton-text ticker-skeleton-text--${sizes[index % sizes.length]}`; text.style.animationDelay = `${index * 0.1 + 0.1}s`; item.appendChild(text); if (this.showTags) { const tag = document.createElement('div'); tag.className = 'ticker-skeleton-tag'; tag.style.animationDelay = `${index * 0.1 + 0.15}s`; item.appendChild(tag); } return item; }
  pause() { if (this._element) this._element.classList.add('ticker-skeleton--paused'); }
  resume() { if (this._element) this._element.classList.remove('ticker-skeleton--paused'); }
  isVisible() { return this._visible; }
  destroy() { this.hide(); if (this._styleElement && this._styleElement.parentNode) { this._styleElement.parentNode.removeChild(this._styleElement); } this._styleElement = null; this.container = null; }
  healthCheck() { const logger = _getPort('logger'); const checks = { hasContainer: !!this.container, stylesInjected: !!document.getElementById('ticker-skeleton-styles'), loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 4 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/4`, visible: this._visible, checks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, visible: this._visible, itemCount: this.itemCount, metrics: { ...this._metrics }, portsInitialized: Ports.isInitialized() }; }
}
export function getVersion() { return VERSION; }
export default SkeletonLoader;
