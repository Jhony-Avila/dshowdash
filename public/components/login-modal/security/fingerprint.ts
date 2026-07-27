// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-fingerprint
// PURPOSE: Login Modal - Advanced Device Fingerprint
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   DeviceFingerprint() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   localStorage
//   sessionStorage
//   window.AudioContext
//   window.webkitAudioContext
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '1.3.0-P17WI';
const MODULE_ID = 'login-modal-fingerprint';
const STORAGE_KEY = 'dshow_device_fingerprint';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };

const _log = function(level?: any, ...rest: any[]) { const logger = _getPort('logger'); if (!logger) return; const args = rest; if (level === 'error') { if (logger.error) logger.error(...['[fingerprint]'].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn(...['[fingerprint]'].concat(args)); return; } if (_debugEnabled() && logger.debug) logger.debug(...['[fingerprint]'].concat(args)); };

export function DeviceFingerprint(this: any, config: Record<string, any>) { if (!config) config = {}; this.config = config; this.enabled = config.fingerprint ? (config.fingerprint.enabled !== false) : true; this._fingerprint = null; this._components = {}; this._metrics = { generates: 0, retrieves: 0, errors: 0 }; _initPorts(); }

DeviceFingerprint.prototype.generate = function() {
  const self = this;
  self._metrics.generates++;
  if (!self.enabled) return Promise.resolve({ fingerprint: null as string | null, components: {} });
  return self._collectComponents().then((components: Record<string, unknown>) => { self._components = components; return self._hashComponents(components).then((fingerprint: string) => { self._fingerprint = fingerprint; self._persist(fingerprint, components); _log('info', 'Fingerprint gerado', { hash: `${fingerprint.substring(0, 16)}...` }); return { fingerprint, components }; }); }).catch((error: any) => { self._metrics.errors++; _log('error', 'Erro ao gerar fingerprint', error); return { fingerprint: null as string | null, components: {}, error: error.message }; });
};

DeviceFingerprint.prototype._collectComponents = function() {
  const self = this;
  return self._getAudioFingerprint().then((audio: Record<string, unknown>) => {
    const components: Record<string, unknown> = {};
    components.canvas = self._getCanvasFingerprint();
    components.webgl = self._getWebGLFingerprint();
    components.timezone = { offset: new Date().getTimezoneOffset(), name: (Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown') };
    components.screen = { width: screen.width, height: screen.height, colorDepth: screen.colorDepth, pixelRatio: (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1 };
    components.navigator = { userAgent: navigator.userAgent, language: navigator.language, languages: (navigator.languages ? navigator.languages.join(',') : navigator.language), platform: navigator.platform, hardwareConcurrency: navigator.hardwareConcurrency || 0, maxTouchPoints: navigator.maxTouchPoints || 0, cookieEnabled: navigator.cookieEnabled, doNotTrack: navigator.doNotTrack };
    components.plugins = self._getPlugins();
    components.fonts = self._detectFonts();
    components.audio = audio;
    components.storage = { localStorage: self._testStorage('localStorage'), sessionStorage: self._testStorage('sessionStorage'), indexedDB: typeof indexedDB !== 'undefined' };
    components.webrtc = { available: typeof RTCPeerConnection !== 'undefined' };
    return components;
  });
};

DeviceFingerprint.prototype._getCanvasFingerprint = function() { try { const canvas = document.createElement('canvas'); canvas.width = 200; canvas.height = 50; const ctx = canvas.getContext('2d'); if (!ctx) return { hash: null as string | null, available: false }; ctx.textBaseline = 'top'; ctx.font = '14px Arial'; ctx.fillStyle = '#f60'; ctx.fillRect(125, 1, 62, 20); ctx.fillStyle = '#069'; ctx.fillText('DshowDash:)', 2, 15); ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'; ctx.fillText('Canvas FP', 4, 35); const dataUrl = canvas.toDataURL(); return { hash: this._simpleHash(dataUrl), available: true }; } catch (e: any) { return { hash: null as string | null, available: false, error: e.message }; } };

DeviceFingerprint.prototype._getWebGLFingerprint = () => { try { const canvas = document.createElement('canvas'); const gl: any = canvas.getContext('webgl') || canvas.getContext('experimental-webgl'); if (!gl) return { available: false }; const debugInfo = gl.getExtension('WEBGL_debug_renderer_info'); return { available: true, vendor: gl.getParameter(gl.VENDOR), renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown', version: gl.getParameter(gl.VERSION), shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) }; } catch (e: any) { return { available: false, error: e.message }; } };

DeviceFingerprint.prototype._getPlugins = () => { try { if (!navigator.plugins || navigator.plugins.length === 0) return { count: 0, list: [] as string[] }; const plugins = Array.from(navigator.plugins).slice(0, 10).map(p => p.name); return { count: navigator.plugins.length, list: plugins }; } catch (e: any) { return { count: 0, list: [] as string[], error: e.message }; } };

DeviceFingerprint.prototype._detectFonts = () => { const testFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier', 'Verdana', 'Georgia', 'Comic Sans MS', 'Impact', 'Trebuchet MS']; const detected: string[] = []; try { const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); if (!ctx) return { detected: [] as string[], count: 0 }; const testString = 'mmmmmmmmmmlli'; const baseFont = 'monospace'; ctx.font = `72px ${baseFont}`; const baseWidth = ctx.measureText(testString).width; testFonts.forEach(font => { ctx.font = `72px "${font}", ${baseFont}`; if (ctx.measureText(testString).width !== baseWidth) detected.push(font); }); return { detected, count: detected.length }; } catch (e: any) { return { detected: [] as string[], count: 0, error: e.message }; } };

DeviceFingerprint.prototype._getAudioFingerprint = () => { const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext || (window as any).webkitAudioContext) : null; if (!AudioCtx) return Promise.resolve({ available: false }); try { const ctx = new AudioCtx(); const fingerprint = { sampleRate: ctx.sampleRate, available: true }; ctx.close(); return Promise.resolve(fingerprint); } catch (e: any) { return Promise.resolve({ available: false, error: e.message }); } };

DeviceFingerprint.prototype._testStorage = (type: string) => { try { if (typeof window === 'undefined') return false; const storage = (window as any)[type]; const testKey = '__fp_test__'; storage.setItem(testKey, 'test'); storage.removeItem(testKey); return true; } catch (e: any) { return false; } };

DeviceFingerprint.prototype._simpleHash = (str: string) => { let hash = 0; for (let i = 0; i < str.length; i++) { const char = str.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash = hash & hash; } return Math.abs(hash).toString(36); };

DeviceFingerprint.prototype._hashComponents = function(components: Record<string, unknown>) { const self = this; const str = JSON.stringify(components); const crypto = typeof window !== 'undefined' ? window.crypto : null; if (crypto && crypto.subtle) { try { const encoder = new TextEncoder(); const data = encoder.encode(str); return crypto.subtle.digest('SHA-256', data).then((hashBuffer: ArrayBuffer) => { const hashArray = Array.from(new Uint8Array(hashBuffer)); return hashArray.map((b: number) => b.toString(16).padStart(2, '0')).join(''); }).catch(() => `fp-${self._simpleHash(str)}`); } catch (e: any) { return Promise.resolve(`fp-${self._simpleHash(str)}`); } } return Promise.resolve(`fp-${self._simpleHash(str)}`); };

DeviceFingerprint.prototype._persist = (fingerprint: string, components: Record<string, unknown>) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ fingerprint, timestamp: Date.now(), version: VERSION })); } catch (e: any) { _log('warn', 'Erro ao persistir fingerprint', e); } };

DeviceFingerprint.prototype.get = function() { this._metrics.retrieves++; if (this._fingerprint) return this._fingerprint; try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) { const data = JSON.parse(stored); if (Date.now() - data.timestamp < 86400000) { this._fingerprint = data.fingerprint; return data.fingerprint; } } } catch (e: any) { _log('warn', 'Erro ao recuperar fingerprint', e); } return null; };

DeviceFingerprint.prototype.getComponents = function() { return Object.assign({}, this._components); };
DeviceFingerprint.prototype.info = function() { return { moduleId: MODULE_ID, version: VERSION, enabled: this.enabled, hasFingerprint: !!this._fingerprint, portsInitialized: Ports.isInitialized(), componentsCollected: Object.keys(this._components).length, metrics: Object.assign({}, this._metrics), timestamp: Date.now() }; };
DeviceFingerprint.prototype.healthCheck = function() { const logger = _getPort('logger'); const checks = { enabled: this.enabled, canGenerateCanvas: !!document.createElement('canvas').getContext, hasStorage: this._testStorage('localStorage'), loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 5 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/5`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; };

export { VERSION, MODULE_ID };
export default DeviceFingerprint;
