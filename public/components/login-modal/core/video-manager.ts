// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.0.1-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-video-manager
// PURPOSE: Login Modal - Video Manager (Lazy Load + Pure FSM)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   VideoManager() — exported function
//   VIDEO_STATES — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
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

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '6.0.1-P18EC';
const MODULE_ID = 'login-modal-video-manager';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level?: any, ...rest: any[]) { const logger = _getPort('logger'); if (!logger) return; const args = rest.length ? rest : Array.prototype.slice.call(arguments, 1); if (level === 'error') { if (logger.error) logger.error(...['[login-video-manager]'].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn(...['[login-video-manager]'].concat(args)); return; } if (_debugEnabled() && logger.debug) logger.debug(...['[login-video-manager]'].concat(args)); };

const VIDEO_STATES = { IDLE: 'IDLE', PENDING: 'PENDING', LOADING: 'LOADING', LOADED: 'LOADED', PLAYING: 'PLAYING', PAUSED: 'PAUSED', ERROR: 'ERROR', DESTROYED: 'DESTROYED' };

export function VideoManager(this: any, video: HTMLVideoElement | null, config: Record<string, any>) {
  if (!config) config = {};
  const vid = config.video || {};
  this.video = video; this.config = config; this.logger = config.logger || null; this.state = VIDEO_STATES.IDLE; this.playPromise = null; this.retryCount = 0;
  this.maxRetries = vid.maxRetries || 3; this.liteMode = vid.liteMode || false; this.cleanupOnClose = vid.cleanupOnClose !== false; this.listeners = new Map();
  this.lazyLoad = vid.lazyLoad !== false; this.preloadOnMount = vid.preloadOnMount || false;
  this._videoSrc = vid.src || '/assets/videos/video_background_site_web.mp4'; this._srcLoaded = false; this._intersectionObserver = null;
  this._metrics = { mounts: 0, loads: 0, plays: 0, pauses: 0, errors: 0, retries: 0, cleanups: 0, lazyLoads: 0 };
  _log('info', 'VideoManager inicializado', { liteMode: this.liteMode, lazyLoad: this.lazyLoad, state: this.state });
}

VideoManager.prototype.mount = function() { this._metrics.mounts++; if (!this.video) { this._setState(VIDEO_STATES.ERROR, { reason: 'no_video_element' }); this._emit('video:error:missing_element'); return false; } if (this.liteMode) { _log('info', 'Lite mode ativo - vídeo desabilitado'); this._emit('video:lite_mode'); return false; } this.video.muted = true; this.video.playsInline = true; this.video.loop = true; if (this.lazyLoad && !this.preloadOnMount) { this._setState(VIDEO_STATES.PENDING); this._setupIntersectionObserver(); _log('info', 'Video em modo lazy - aguardando trigger'); return true; } this._loadVideoSrc(); _log('info', 'Video montado com preload'); return true; };
VideoManager.prototype.triggerLazyLoad = function() { if (!this.lazyLoad || this._srcLoaded || this.state === VIDEO_STATES.DESTROYED) return; this._metrics.lazyLoads++; _log('info', 'Lazy load triggered'); this._loadVideoSrc(); this.play(); };
VideoManager.prototype._loadVideoSrc = function() { if (this._srcLoaded || !this.video) return; const existingSources = this.video.querySelectorAll('source'); existingSources.forEach((s: Element) => { s.remove(); }); const source = document.createElement('source'); source.src = this._videoSrc; source.type = 'video/mp4'; this.video.appendChild(source); this.video.src = this._videoSrc; this._srcLoaded = true; this.load(); };
VideoManager.prototype._setupIntersectionObserver = function() { const self = this; if (!self.video || typeof IntersectionObserver === 'undefined') return; self._intersectionObserver = new IntersectionObserver((entries: IntersectionObserverEntry[]) => { entries.forEach((entry: IntersectionObserverEntry) => { if (entry.isIntersecting && !self._srcLoaded) { self.triggerLazyLoad(); if (self._intersectionObserver) self._intersectionObserver.disconnect(); } }); }, { threshold: 0.1 }); self._intersectionObserver.observe(self.video); };
VideoManager.prototype.load = function() { this._metrics.loads++; if (this.state === VIDEO_STATES.LOADED || this.state === VIDEO_STATES.LOADING) return; if (!this.video || this.state === VIDEO_STATES.DESTROYED) { this._setState(VIDEO_STATES.ERROR, { reason: 'no_video_element' }); this._emit('video:error:missing_element'); return; } try { this._setState(VIDEO_STATES.LOADING); this.video.load(); this._setState(VIDEO_STATES.LOADED); this._emit('loaded'); } catch (error: any) { this._metrics.errors++; this._setState(VIDEO_STATES.ERROR, { error: error.message }); this._emit('video:error:network', { error }); } };

VideoManager.prototype.play = function() {
  const self = this; self._metrics.plays++;
  if (!self.video || self.liteMode || self.state === VIDEO_STATES.DESTROYED) return Promise.resolve();
  if (self.lazyLoad && !self._srcLoaded) self._loadVideoSrc();
  if (self.state === VIDEO_STATES.PLAYING) { _log('info', 'Já está reproduzindo'); return Promise.resolve(); }
  if (self.state === VIDEO_STATES.ERROR) { _log('info', 'Estado inválido para play', { state: self.state }); return Promise.resolve(); }
  if (self.state === VIDEO_STATES.IDLE || self.state === VIDEO_STATES.PENDING) self.load();
  function doPlay() { if (!self.video || self.state === VIDEO_STATES.DESTROYED) { _log('info', 'Video removido antes de play'); return Promise.resolve(); } self.playPromise = self.video.play(); return self.playPromise.then(() => { self._setState(VIDEO_STATES.PLAYING); self._emit('playing'); self.retryCount = 0; self.playPromise = null; }).catch((error: any) => { _log('info', 'Erro ao reproduzir', error); if (error.name === 'NotAllowedError') self._emit('video:error:autoplay', { error, retryCount: self.retryCount }); if (error.name === 'NotAllowedError' && self.retryCount < self.maxRetries) { self._metrics.retries++; self.retryCount++; if (self.video) self.video.muted = true; return new Promise(resolve => { setTimeout(() => { if (self.state !== VIDEO_STATES.DESTROYED) resolve(self.play()); else resolve(undefined); }, 500); }); } self._metrics.errors++; self._setState(VIDEO_STATES.ERROR, { error: error.message }); self._emit('video:error:playback', { error }); self.playPromise = null; }); }
  if (self.state === VIDEO_STATES.LOADING) { return self._waitForState(VIDEO_STATES.LOADED, 5000).then(doPlay).catch(() => doPlay()); }
  const prevPromise = self.playPromise ? self.playPromise.catch(() => {}) : Promise.resolve();
  return prevPromise.then(doPlay);
};

VideoManager.prototype.pause = function() { const self = this; self._metrics.pauses++; if (!self.video || self.state === VIDEO_STATES.DESTROYED) return Promise.resolve(); if (self.state !== VIDEO_STATES.PLAYING) return Promise.resolve(); const prevPromise = self.playPromise ? self.playPromise.catch(() => {}) : Promise.resolve(); return prevPromise.then(() => { if (!self.video || self.state === VIDEO_STATES.DESTROYED) return; self.video.pause(); self._setState(VIDEO_STATES.PAUSED); self._emit('paused'); self.playPromise = null; }).catch((error: any) => { self._metrics.errors++; _log('error', 'Erro ao pausar', error); self.playPromise = null; }); };
VideoManager.prototype.cleanup = function() { const self = this; self._metrics.cleanups++; if (!self.video || self.state === VIDEO_STATES.DESTROYED) return Promise.resolve(); const prevPromise = self.playPromise ? self.playPromise.catch(() => {}) : Promise.resolve(); return prevPromise.then(() => { if (!self.video || self.state === VIDEO_STATES.DESTROYED) return; self.video.pause(); self.video.removeAttribute('src'); const sources = self.video.querySelectorAll('source'); sources.forEach((source: Element) => { source.remove(); }); self.video.load(); self._srcLoaded = false; self._setState(VIDEO_STATES.IDLE); self._emit('cleaned'); }).catch((error: any) => { self._metrics.errors++; _log('error', 'Erro no cleanup', error); }); };
VideoManager.prototype.unmount = function() { const self = this; if (self.state === VIDEO_STATES.DESTROYED) return Promise.resolve(); if (self._intersectionObserver) { self._intersectionObserver.disconnect(); self._intersectionObserver = null; } const cleanPromise = self.cleanupOnClose ? self.cleanup() : self.pause(); return cleanPromise.then(() => { self._setState(VIDEO_STATES.DESTROYED); self.listeners.clear(); self.playPromise = null; }); };
VideoManager.prototype.recreate = function() { if (this.state !== VIDEO_STATES.DESTROYED) { _log('info', 'recreate() só pode ser chamado no estado DESTROYED'); return false; } this._setState(VIDEO_STATES.IDLE); this.retryCount = 0; this.playPromise = null; this._srcLoaded = false; this.listeners.clear(); return this.mount(); };

VideoManager.prototype.on = function(event: string, callback: (data: Record<string, any>) => void) { if (!this.listeners.has(event)) this.listeners.set(event, new Set()); this.listeners.get(event).add(callback); const self = this; return () => { self.off(event, callback); }; };
VideoManager.prototype.off = function(event: string, callback: (data: Record<string, any>) => void) { const listeners = this.listeners.get(event); if (listeners) listeners.delete(callback); };
VideoManager.prototype._emit = function(event: string, data: Record<string, unknown>) { if (!data) data = {}; const listeners = this.listeners.get(event); const self = this; if (listeners) listeners.forEach((callback: (data: Record<string, any>) => void) => { try { callback(Object.assign({ event, state: self.state }, data)); } catch (e) { _log('error', 'Erro em listener', e); } }); };
VideoManager.prototype._setState = function(newState: string, context: Record<string, unknown>) { if (!context) context = {}; const oldState = this.state; this.state = newState; _log('info', `Estado: ${oldState} -> ${newState}`, context); this._emit('state:change', { from: oldState, to: newState, context }); };
VideoManager.prototype._waitForState = function(targetState: string, timeout: number) { const self = this; if (!timeout) timeout = 5000; return new Promise((resolve, reject) => { if (self.state === targetState) { resolve(undefined); return; } const timer = setTimeout(() => { unsubscribe(); reject(new Error(`Timeout aguardando estado ${targetState}`)); }, timeout); const unsubscribe = self.on('state:change', (data: Record<string, any>) => { if (data.to === targetState) { clearTimeout(timer); unsubscribe(); resolve(undefined); } }); }); };

VideoManager.prototype.getStatus = function() { return { state: this.state, liteMode: this.liteMode, lazyLoad: this.lazyLoad, srcLoaded: this._srcLoaded, retryCount: this.retryCount, hasVideo: !!this.video }; };
VideoManager.prototype.info = function() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), metrics: Object.assign({}, this._metrics), state: this.state, config: { liteMode: this.liteMode, lazyLoad: this.lazyLoad, maxRetries: this.maxRetries, cleanupOnClose: this.cleanupOnClose }, srcLoaded: this._srcLoaded, hasVideo: !!this.video, timestamp: Date.now() }; };
VideoManager.prototype.healthCheck = function() { const logger = _getPort('logger'); const checks = { notDestroyed: this.state !== VIDEO_STATES.DESTROYED, notInError: this.state !== VIDEO_STATES.ERROR, lowErrorRate: this._metrics.plays === 0 || (this._metrics.errors / this._metrics.plays) < 0.3, hasVideoElement: !!this.video || this.liteMode, loggerAvailable: !!logger }; let passed = 0; if (checks.notDestroyed) passed++; if (checks.notInError) passed++; if (checks.lowErrorRate) passed++; if (checks.hasVideoElement) passed++; if (checks.loggerAvailable) passed++; const status = passed === 5 ? 'HEALTHY' : (passed >= 3 ? 'DEGRADED' : 'UNHEALTHY'); return { status, score: `${passed}/5`, healthy: passed >= 3, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; };

export { VIDEO_STATES, VERSION, MODULE_ID };
export default VideoManager;
