// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-image-optimizer
// PURPOSE: Login Modal - Image Optimizer (WebP/AVIF Support)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   ImageOptimizer() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '1.3.0-P17WI';
const MODULE_ID = 'login-modal-image-optimizer';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string) { const logger = _getPort('logger'); if (!logger) return; const args = Array.prototype.slice.call(arguments, 1); if (level === 'error') { if (logger.error) logger.error(...['[image-optimizer]'].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn(...['[image-optimizer]'].concat(args)); return; } if (_debugEnabled() && logger.debug) logger.debug(...['[image-optimizer]'].concat(args)); };

export function ImageOptimizer(this: any, config: Record<string, any>) { if (!config) config = {}; const img = config.images || {}; this.config = config; this.enabled = img.optimize !== false; this.logoPath = img.logoPath || '/assets/images/logo'; this.fallbackFormat = img.fallback || 'png'; this._supportedFormats = null; this._metrics = { checks: 0, avifUsed: 0, webpUsed: 0, fallbackUsed: 0 }; _initPorts(); }


// @ts-expect-error TS migration - TS2554
ImageOptimizer.prototype.init = function() { const self = this; if (!self.enabled) return Promise.resolve(); return self._detectFormats().then((formats: Record<string, boolean>) => { self._supportedFormats = formats; _log('info', 'Formatos suportados:', formats); }); };

ImageOptimizer.prototype._detectFormats = function() { const self = this; const formats = { avif: false, webp: false }; return self._testFormat('data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgABpAQ0AIyFAAAAAAUWdOIX0BAAAIC3g==').then((avif: boolean) => { formats.avif = avif; return self._testFormat('data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=='); }).then((webp: boolean) => { formats.webp = webp; return formats; }); };

ImageOptimizer.prototype._testFormat = (dataUrl: string) => new Promise(resolve => { const img = new Image(); img.onload = () => { resolve(img.width > 0 && img.height > 0); }; img.onerror = () => { resolve(false); }; img.src = dataUrl; });

ImageOptimizer.prototype.getBestFormat = function() { this._metrics.checks++; if (!this._supportedFormats) { this._metrics.fallbackUsed++; return this.fallbackFormat; } if (this._supportedFormats.avif) { this._metrics.avifUsed++; return 'avif'; } if (this._supportedFormats.webp) { this._metrics.webpUsed++; return 'webp'; } this._metrics.fallbackUsed++; return this.fallbackFormat; };

ImageOptimizer.prototype.getLogoUrl = function() { return `${this.logoPath}.${this.getBestFormat()}`; };

ImageOptimizer.prototype.getPictureHTML = function(alt: string, className: string) { if (!alt) alt = 'Logo'; if (!className) className = 'lm-logo'; return `<picture class="${className}-picture"><source srcset="${this.logoPath}.avif" type="image/avif"><source srcset="${this.logoPath}.webp" type="image/webp"><img src="${this.logoPath}.${this.fallbackFormat}" alt="${alt}" class="${className}" loading="lazy" decoding="async" width="120" height="40"></picture>`; };


// @ts-expect-error TS migration - TS2554
ImageOptimizer.prototype.preloadLogo = function() { if (typeof document === 'undefined') return; const format = this.getBestFormat(); const url = `${this.logoPath}.${format}`; const mimeTypes = { avif: 'image/avif', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg' }; if (document.querySelector(`link[rel="preload"][href="${url}"]`)) return; const link = document.createElement('link'); link.rel = 'preload'; link.as = 'image'; link.href = url; link.type = mimeTypes[format] || 'image/png'; document.head.appendChild(link); _log('info', 'Logo preloaded:', url); };

ImageOptimizer.prototype.getSupport = function() { return Object.assign({}, this._supportedFormats); };
ImageOptimizer.prototype.info = function() { return { moduleId: MODULE_ID, version: VERSION, enabled: this.enabled, supportedFormats: this._supportedFormats, bestFormat: this._supportedFormats ? this.getBestFormat() : null, portsInitialized: Ports.isInitialized(), metrics: Object.assign({}, this._metrics), timestamp: Date.now() }; };

ImageOptimizer.prototype.healthCheck = function() { const logger = _getPort('logger'); const checks = { enabled: this.enabled, formatsDetected: !!this._supportedFormats, hasModernFormat: this._supportedFormats ? (this._supportedFormats.avif || this._supportedFormats.webp) : false, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 5 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/5`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; };

export { VERSION, MODULE_ID };
export default ImageOptimizer;
