// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.ui.lazy-images
// PURPOSE: Lazy Image Loading - Ticker Enterprise
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
export const MODULE_ID = 'ticker.ui.lazy-images';
const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args); };
export class LazyImageLoader {
  [key: string]: any;
  constructor(options: { rootMargin?: string; threshold?: number; placeholderSrc?: string } = {}) { this.rootMargin = options.rootMargin || '50px'; this.threshold = options.threshold || 0.1; this.placeholderSrc = options.placeholderSrc || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect fill="%23333" width="40" height="40"/%3E%3C/svg%3E'; this._observer = null; this._loadedImages = new Set(); this._pendingImages = new Set(); this._metrics = { observed: 0, loaded: 0, errors: 0, cached: 0 }; }
  init() { if (typeof IntersectionObserver === 'undefined') { _log('warn', 'IntersectionObserver not supported, loading all images immediately'); return this; } this._observer = new IntersectionObserver(this._onIntersection.bind(this), { rootMargin: this.rootMargin, threshold: this.threshold }); _log('debug', 'LazyImageLoader initialized'); return this; }
  observe(element: HTMLElement) { if (!element || !this._observer) return; const src = element.dataset.src || element.dataset.lazySrc; if (!src) return; if (this._loadedImages.has(src)) { this._applyImage(element, src); this._metrics.cached++; return; } (element as HTMLImageElement).src = this.placeholderSrc; element.classList.add('ticker-lazy-image', 'ticker-lazy-image--pending'); this._observer.observe(element); this._pendingImages.add(element); this._metrics.observed++; }
  observeAll(container: unknown, selector: string = '[data-lazy-src], [data-src]') { if (!container) return; const elements = (container as HTMLElement).querySelectorAll(selector); elements.forEach((el: Element) => this.observe(el as HTMLElement)); _log('debug', `Observing ${elements.length} images`); }
  _onIntersection(entries: IntersectionObserverEntry[]) { entries.forEach((entry: IntersectionObserverEntry) => { if (entry.isIntersecting) { this._loadImage(entry.target as HTMLElement); this._observer.unobserve(entry.target); this._pendingImages.delete(entry.target); } }); }
  _loadImage(element: HTMLElement) { const src = element.dataset.src || element.dataset.lazySrc; if (!src) return; element.classList.remove('ticker-lazy-image--pending'); element.classList.add('ticker-lazy-image--loading'); const img = new Image(); img.onload = () => { this._applyImage(element, src); element.classList.remove('ticker-lazy-image--loading'); element.classList.add('ticker-lazy-image--loaded'); this._loadedImages.add(src); this._metrics.loaded++; _log('debug', `Image loaded: ${src.substring(0, 50)}...`); }; img.onerror = () => { element.classList.remove('ticker-lazy-image--loading'); element.classList.add('ticker-lazy-image--error'); this._metrics.errors++; _log('warn', `Image failed: ${src.substring(0, 50)}...`); }; img.src = src; }
  _applyImage(element: HTMLElement, src: string) { if (element.tagName === 'IMG') { (element as HTMLImageElement).src = src; } else { element.style.backgroundImage = `url(${src})`; } }
  unobserve(element: HTMLElement) { if (this._observer && element) { this._observer.unobserve(element); this._pendingImages.delete(element); } }
  preload(urls: string[]) { if (!Array.isArray(urls)) return; urls.forEach((url: string) => { if (this._loadedImages.has(url)) return; const img = new Image(); img.onload = () => { this._loadedImages.add(url); this._metrics.loaded++; }; img.onerror = () => { this._metrics.errors++; }; img.src = url; }); _log('debug', `Preloading ${urls.length} images`); }
  clearCache() { this._loadedImages.clear(); _log('debug', 'Image cache cleared'); }
  destroy() { if (this._observer) { this._observer.disconnect(); this._observer = null; } this._pendingImages.clear(); this._loadedImages.clear(); }
  healthCheck() { const logger = _getPort('logger'); const checks = { observerActive: !!this._observer, hasCapacity: this._pendingImages.size < 100, loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; const loadRate = this._metrics.observed > 0 ? this._metrics.loaded / this._metrics.observed : 1; return { status: passed === 4 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/4`, loadRate: `${(loadRate * 100).toFixed(1)}%`, pendingCount: this._pendingImages.size, cachedCount: this._loadedImages.size, checks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, pendingCount: this._pendingImages.size, cachedCount: this._loadedImages.size, metrics: { ...this._metrics }, portsInitialized: Ports.isInitialized() }; }
}
export function getVersion() { return VERSION; }
export default LazyImageLoader;
