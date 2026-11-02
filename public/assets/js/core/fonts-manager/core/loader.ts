// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: fonts-manager-loader
// PURPOSE: Fonts Manager - Loader v8.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Store from ../state/store.js
//   buildGoogleFontsUrl, buildFontFaceCSS, measureTime from ../utils/helpers.js
//   normalizeFontSource from ./contracts.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   isFontLoaded() — exported function
//   waitForFont() — exported function
//   injectGoogleFontsLink() — exported function
//   injectFontFaceCSS() — exported function
//   loadGoogleFont() — exported function
//   loadFileFont() — exported function
//   loadSystemFont() — exported function
//   loadLocalFont() — exported function
//   loadSource() — exported function
//   loadAllSources() — exported function
//   cleanup() — exported function
//   getLoaderState() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import Store from '../state/store.js';
import { buildGoogleFontsUrl, buildFontFaceCSS, measureTime } from '../utils/helpers.js';
import { normalizeFontSource } from './contracts.js';

export var MODULE_ID = 'fonts-manager-loader';
export var VERSION = '8.1.0-ENTERPRISE';

var STYLE_ELEMENT_ID = 'fonts-manager-styles';
var loaderState = { loading: false, injectedLinks: [] as unknown[], injectedStyles: null as unknown | null };

export function isFontLoaded(family: unknown) {
  if (typeof document === 'undefined') return false;
  try { return document.fonts.check('16px "' + family + '"'); }
  catch (e) { return false; }
}

export async function waitForFont(family: string, timeout?: number) {
  timeout = timeout || 5000;
  if (typeof document === 'undefined') return { loaded: false, reason: 'no-document' };
  try {
    await Promise.race([document.fonts.load('16px "' + family + '"'), new Promise(function(_, reject) { setTimeout(function() { reject(new Error('timeout')); }, timeout); })]);
    return { loaded: true };
  } catch (err: any) { return { loaded: false, reason: err.message }; }
}

export function injectGoogleFontsLink(url: string) {
  if (typeof document === 'undefined') return null;
  if (loaderState.injectedLinks.indexOf(url) !== -1) return null;
  var link = document.createElement('link');
  link.id = 'gf-' + Date.now();
  link.rel = 'stylesheet';
  link.href = url;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
  loaderState.injectedLinks.push(url);
  return link;
}

export function injectFontFaceCSS(css: string) {
  if (typeof document === 'undefined' || !css) return null;
  var styleEl = document.getElementById(STYLE_ELEMENT_ID) as any;
  if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = STYLE_ELEMENT_ID; styleEl.type = 'text/css'; document.head.appendChild(styleEl); loaderState.injectedStyles = styleEl; }
  styleEl.textContent += '\n' + css;
  return styleEl;
}

export async function loadGoogleFont(source: { type: string; family: string; id?: string; weights?: string[]; fallbacks?: string[]; url?: string }) {
  var normalized = normalizeFontSource(source) as any;
  var url = buildGoogleFontsUrl([{ family: normalized.family, weights: normalized.weights }]);
  if (!url) return { ok: false, sourceId: normalized.id, error: 'Failed to build URL' };
  injectGoogleFontsLink(url);
  var result = await waitForFont(normalized.family);
  if (result.loaded) { Store.addLoadedSource(normalized.id); return { ok: true, sourceId: normalized.id, family: normalized.family }; }
  Store.addFailedSource(normalized.id, result.reason); return { ok: false, sourceId: normalized.id, error: result.reason };
}

export async function loadFileFont(source: { type: string; family: string; id?: string; weights?: string[]; fallbacks?: string[]; url?: string }) {
  var normalized = normalizeFontSource(source) as any;
  if (!normalized.url) { Store.addFailedSource(normalized.id, 'No URL provided'); return { ok: false, sourceId: normalized.id, error: 'No URL provided' }; }
  var css = buildFontFaceCSS(normalized);
  injectFontFaceCSS(css);
  var result = await waitForFont(normalized.family);
  if (result.loaded) { Store.addLoadedSource(normalized.id); return { ok: true, sourceId: normalized.id, family: normalized.family }; }
  Store.addFailedSource(normalized.id, result.reason); return { ok: false, sourceId: normalized.id, error: result.reason };
}

export async function loadSystemFont(source: { type: string; family: string; id?: string; weights?: string[]; fallbacks?: string[]; url?: string }) {
  var normalized = normalizeFontSource(source) as any;
  Store.addLoadedSource(normalized.id);
  return { ok: true, sourceId: normalized.id, family: normalized.family, type: 'system' };
}

export async function loadLocalFont(source: { type: string; family: string; id?: string; weights?: string[]; fallbacks?: string[]; url?: string }) {
  var normalized = normalizeFontSource(source) as any;
  if (isFontLoaded(normalized.family)) { Store.addLoadedSource(normalized.id); return { ok: true, sourceId: normalized.id, family: normalized.family }; }
  for (var i = 0; i < normalized.fallbacks.length; i++) {
    if (isFontLoaded(normalized.fallbacks[i])) { Store.addLoadedSource(normalized.id); return { ok: true, sourceId: normalized.id, family: normalized.fallbacks[i], usedFallback: true }; }
  }
  Store.addFailedSource(normalized.id, 'Font not available locally'); return { ok: false, sourceId: normalized.id, error: 'Font not available' };
}

export async function loadSource(source: { type: string; family: string; id?: string; weights?: string[]; fallbacks?: string[]; url?: string }) {
  var normalized = normalizeFontSource(source) as any;
  if (normalized.type === 'google') return loadGoogleFont(normalized);
  if (normalized.type === 'file') return loadFileFont(normalized);
  if (normalized.type === 'local') return loadLocalFont(normalized);
  return loadSystemFont(normalized);
}

export async function loadAllSources(sources: unknown) {
  if (!Array.isArray(sources) || sources.length === 0) return { ok: true, loaded: 0, failed: 0, results: [] as unknown[] };
  loaderState.loading = true; (Store as any).setStatus('loading'); (Store as any).setSources(sources);
  var startTime = performance.now();
  var promises = sources.map(function(s) { return loadSource(s); });
  var outcomes = await Promise.allSettled(promises);
  var results = [];
  for (var i = 0; i < outcomes.length; i++) {
    if (outcomes[i].status === 'fulfilled') results.push((outcomes[i] as any).value);
    else results.push({ ok: false, error: (outcomes[i] as any).reason ? (outcomes[i] as any).reason.message : 'Unknown error' });
  }
  var loadTime = performance.now() - startTime;
  var loaded = 0, failed = 0;
  for (var j = 0; j < results.length; j++) { if (results[j].ok) loaded++; else failed++; }
  (Store as any).setMetrics({ loadTime: loadTime, loadedCount: loaded, failedCount: failed });
  (Store as any).setStatus(failed === sources.length ? 'error' : 'ready');
  loaderState.loading = false;
  return { ok: failed < sources.length, loaded: loaded, failed: failed, loadTime: loadTime, results: results };
}

export function cleanup() {
  if (typeof document === 'undefined') return;
  for (var i = 0; i < loaderState.injectedLinks.length; i++) {
    var links = document.querySelectorAll('link[href="' + loaderState.injectedLinks[i] + '"]');
    for (var j = 0; j < links.length; j++) links[j].remove();
  }
  loaderState.injectedLinks = [];
  var styleEl = document.getElementById(STYLE_ELEMENT_ID);
  if (styleEl) { styleEl.remove(); loaderState.injectedStyles = null; }
}

export function getLoaderState() { return { loading: loaderState.loading, injectedLinksCount: loaderState.injectedLinks.length }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: loaderState.loading ? 'LOADING' : 'HEALTHY', moduleId: MODULE_ID, version: VERSION, loading: loaderState.loading }; }

export default { MODULE_ID: MODULE_ID, VERSION: VERSION, isFontLoaded: isFontLoaded, waitForFont: waitForFont, loadSource: loadSource, loadAllSources: loadAllSources, cleanup: cleanup, getLoaderState: getLoaderState, info: info, healthCheck: healthCheck };
