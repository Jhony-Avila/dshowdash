// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.7.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-video
// PURPOSE: Video Loading - Preloader System
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   TELEMETRY_INTENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   carregarVideo() — exported function
//   getVersion() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   TELEMETRY_INTENTS.TRACK
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.__dev
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { TELEMETRY_INTENTS } from '/core/runtime/events/catalog/telemetry.events.js';
export const VERSION = '4.7.0-P18EC';
export const MODULE_ID = 'preloader-video';
const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';
const VIDEO_FALLBACK_CLASS = 'video-fallback';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _debugEnabled = () => { const cfg = _getPort('config'); return hasWindow && cfg?.app?.debug === true; };
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; if (level === 'error') { logger.error?.(`[${MODULE_ID}]`, ...args); return; } if (level === 'warn') { logger.warn?.(`[${MODULE_ID}]`, ...args); return; } if (_debugEnabled()) logger.debug?.(`[${MODULE_ID}]`, ...args); };
const _metrics = { loadAttempts: 0, successCount: 0, errorCount: 0, timeoutCount: 0, fallbackApplied: 0, lastLoadAt: null as number | null, lastResult: null as string | null };

// @ts-expect-error TS migration - TS2339
export function carregarVideo(timeout = null) { _metrics.loadAttempts++; _metrics.lastLoadAt = Date.now(); if (!hasWindow || !hasDocument) { _metrics.lastResult = 'no_document'; return Promise.resolve({ loaded: false, reason: 'no_document' }); } const CFG = _getPort('config') || {}; const finalTimeout = timeout ?? CFG.timeouts?.preloaderVideoMs ?? 5000; return new Promise((resolve) => { const video = document.getElementById('loading-video'); const screen = document.getElementById('loading-screen'); if (!video) { aplicarFallback(screen, video); emitTelemetry('video:not_found'); _metrics.errorCount++; _metrics.lastResult = 'element_not_found'; resolve({ loaded: false, reason: 'element_not_found' }); return; } let resolved = false; const cleanup = () => { if (resolved) return; resolved = true; video.removeEventListener('canplaythrough', onCanPlay); video.removeEventListener('error', onError); }; const onCanPlay = () => { cleanup(); clearTimeout(timer); _log('info', '✅ Carregado!'); removerFallback(screen, video); _metrics.successCount++; _metrics.lastResult = 'canplaythrough'; resolve({ loaded: true, reason: 'canplaythrough' }); }; const onError = () => { cleanup(); clearTimeout(timer); _log('info', 'Erro ao carregar - usando fallback'); aplicarFallback(screen, video); emitTelemetry('video:error'); _metrics.errorCount++; _metrics.lastResult = 'error'; resolve({ loaded: false, reason: 'error' }); }; const onTimeout = () => { cleanup(); _log('info', 'Timeout - usando fallback'); aplicarFallback(screen, video); emitTelemetry('video:timeout'); _metrics.timeoutCount++; _metrics.lastResult = 'timeout'; resolve({ loaded: false, reason: 'timeout' }); }; const timer = setTimeout(onTimeout, finalTimeout); video.addEventListener('canplaythrough', onCanPlay, { once: true }); video.addEventListener('error', onError, { once: true }); if (video.readyState >= 3) { clearTimeout(timer); cleanup(); _log('info', '✅ Já carregado!'); removerFallback(screen, video); _metrics.successCount++; _metrics.lastResult = 'already_loaded'; resolve({ loaded: true, reason: 'already_loaded' }); } }); }
function aplicarFallback(screen: HTMLElement | null, video: HTMLVideoElement | null) { _metrics.fallbackApplied++; if (screen) screen.classList.add(VIDEO_FALLBACK_CLASS); if (video) video.style.display = 'none'; }
function removerFallback(screen: HTMLElement | null, video: HTMLVideoElement | null) { if (screen) screen.classList.remove(VIDEO_FALLBACK_CLASS); if (video) video.style.display = ''; }
function emitTelemetry(eventName: string) { if (!hasWindow) return; try { const eb = _getPort('eventBus'); if (eb?.emit) { eb.emit(TELEMETRY_INTENTS.TRACK, { category: 'preloader', action: eventName, moduleId: MODULE_ID, timestamp: Date.now() }); } } catch (e) { } }
export function getVersion() { return VERSION; }
export function getMetrics() { return { ..._metrics }; }
export function resetMetrics() { const mr = _metrics as Record<string, number | string | null>; Object.keys(mr).forEach(k => { if (typeof mr[k] === 'number') mr[k] = 0; else mr[k] = null; }); }
export function healthCheck() { const ps = Ports.snapshot(); const videoElement = hasDocument ? document.getElementById('loading-video') : null; const screenElement = hasDocument ? document.getElementById('loading-screen') : null; const checks = { hasDocument, hasWindow, videoElementExists: !!videoElement, screenElementExists: !!screenElement, noRecentErrors: _metrics.errorCount === 0 || (_metrics.successCount / (_metrics.successCount + _metrics.errorCount)) > 0.5, portsInitialized: ps._initialized, p18IntentsAvailable: true }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, metrics: { ..._metrics }, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, metrics: getMetrics(), healthCheck: healthCheck(), usingP18Intents: true }; }
if (hasWindow) { window.__dev = window.__dev || {}; window.__dev.preloaderVideo = { getVersion, getMetrics, resetMetrics, healthCheck, info, carregarVideo }; }
