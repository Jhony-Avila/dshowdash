import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.3.0-P17WI";
const MODULE_ID = "login-modal-fingerprint";
const STORAGE_KEY = "dshow_device_fingerprint";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...rest) {
  const logger = _getPort("logger");
  if (!logger) return;
  const args = rest;
  if (level === "error") {
    if (logger.error) logger.error(...["[fingerprint]"].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(...["[fingerprint]"].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(...["[fingerprint]"].concat(args));
};
function DeviceFingerprint(config) {
  if (!config) config = {};
  this.config = config;
  this.enabled = config.fingerprint ? config.fingerprint.enabled !== false : true;
  this._fingerprint = null;
  this._components = {};
  this._metrics = { generates: 0, retrieves: 0, errors: 0 };
  _initPorts();
}
DeviceFingerprint.prototype.generate = function() {
  const self = this;
  self._metrics.generates++;
  if (!self.enabled) return Promise.resolve({ fingerprint: null, components: {} });
  return self._collectComponents().then((components) => {
    self._components = components;
    return self._hashComponents(components).then((fingerprint) => {
      self._fingerprint = fingerprint;
      self._persist(fingerprint, components);
      _log("info", "Fingerprint gerado", { hash: `${fingerprint.substring(0, 16)}...` });
      return { fingerprint, components };
    });
  }).catch((error) => {
    self._metrics.errors++;
    _log("error", "Erro ao gerar fingerprint", error);
    return { fingerprint: null, components: {}, error: error.message };
  });
};
DeviceFingerprint.prototype._collectComponents = function() {
  const self = this;
  return self._getAudioFingerprint().then((audio) => {
    const components = {};
    components.canvas = self._getCanvasFingerprint();
    components.webgl = self._getWebGLFingerprint();
    components.timezone = { offset: (/* @__PURE__ */ new Date()).getTimezoneOffset(), name: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown" };
    components.screen = { width: screen.width, height: screen.height, colorDepth: screen.colorDepth, pixelRatio: (typeof window !== "undefined" ? window.devicePixelRatio : 1) || 1 };
    components.navigator = { userAgent: navigator.userAgent, language: navigator.language, languages: navigator.languages ? navigator.languages.join(",") : navigator.language, platform: navigator.platform, hardwareConcurrency: navigator.hardwareConcurrency || 0, maxTouchPoints: navigator.maxTouchPoints || 0, cookieEnabled: navigator.cookieEnabled, doNotTrack: navigator.doNotTrack };
    components.plugins = self._getPlugins();
    components.fonts = self._detectFonts();
    components.audio = audio;
    components.storage = { localStorage: self._testStorage("localStorage"), sessionStorage: self._testStorage("sessionStorage"), indexedDB: typeof indexedDB !== "undefined" };
    components.webrtc = { available: typeof RTCPeerConnection !== "undefined" };
    return components;
  });
};
DeviceFingerprint.prototype._getCanvasFingerprint = function() {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { hash: null, available: false };
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("DshowDash:)", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("Canvas FP", 4, 35);
    const dataUrl = canvas.toDataURL();
    return { hash: this._simpleHash(dataUrl), available: true };
  } catch (e) {
    return { hash: null, available: false, error: e.message };
  }
};
DeviceFingerprint.prototype._getWebGLFingerprint = () => {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return { available: false };
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    return { available: true, vendor: gl.getParameter(gl.VENDOR), renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "unknown", version: gl.getParameter(gl.VERSION), shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) };
  } catch (e) {
    return { available: false, error: e.message };
  }
};
DeviceFingerprint.prototype._getPlugins = () => {
  try {
    if (!navigator.plugins || navigator.plugins.length === 0) return { count: 0, list: [] };
    const plugins = Array.from(navigator.plugins).slice(0, 10).map((p) => p.name);
    return { count: navigator.plugins.length, list: plugins };
  } catch (e) {
    return { count: 0, list: [], error: e.message };
  }
};
DeviceFingerprint.prototype._detectFonts = () => {
  const testFonts = ["Arial", "Helvetica", "Times New Roman", "Courier", "Verdana", "Georgia", "Comic Sans MS", "Impact", "Trebuchet MS"];
  const detected = [];
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return { detected: [], count: 0 };
    const testString = "mmmmmmmmmmlli";
    const baseFont = "monospace";
    ctx.font = `72px ${baseFont}`;
    const baseWidth = ctx.measureText(testString).width;
    testFonts.forEach((font) => {
      ctx.font = `72px "${font}", ${baseFont}`;
      if (ctx.measureText(testString).width !== baseWidth) detected.push(font);
    });
    return { detected, count: detected.length };
  } catch (e) {
    return { detected: [], count: 0, error: e.message };
  }
};
DeviceFingerprint.prototype._getAudioFingerprint = () => {
  const AudioCtx = typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext : null;
  if (!AudioCtx) return Promise.resolve({ available: false });
  try {
    const ctx = new AudioCtx();
    const fingerprint = { sampleRate: ctx.sampleRate, available: true };
    ctx.close();
    return Promise.resolve(fingerprint);
  } catch (e) {
    return Promise.resolve({ available: false, error: e.message });
  }
};
DeviceFingerprint.prototype._testStorage = (type) => {
  try {
    if (typeof window === "undefined") return false;
    const storage = window[type];
    const testKey = "__fp_test__";
    storage.setItem(testKey, "test");
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};
DeviceFingerprint.prototype._simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};
DeviceFingerprint.prototype._hashComponents = function(components) {
  const self = this;
  const str = JSON.stringify(components);
  const crypto = typeof window !== "undefined" ? window.crypto : null;
  if (crypto && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      return crypto.subtle.digest("SHA-256", data).then((hashBuffer) => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      }).catch(() => `fp-${self._simpleHash(str)}`);
    } catch (e) {
      return Promise.resolve(`fp-${self._simpleHash(str)}`);
    }
  }
  return Promise.resolve(`fp-${self._simpleHash(str)}`);
};
DeviceFingerprint.prototype._persist = (fingerprint, components) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fingerprint, timestamp: Date.now(), version: VERSION }));
  } catch (e) {
    _log("warn", "Erro ao persistir fingerprint", e);
  }
};
DeviceFingerprint.prototype.get = function() {
  this._metrics.retrieves++;
  if (this._fingerprint) return this._fingerprint;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (Date.now() - data.timestamp < 864e5) {
        this._fingerprint = data.fingerprint;
        return data.fingerprint;
      }
    }
  } catch (e) {
    _log("warn", "Erro ao recuperar fingerprint", e);
  }
  return null;
};
DeviceFingerprint.prototype.getComponents = function() {
  return Object.assign({}, this._components);
};
DeviceFingerprint.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, enabled: this.enabled, hasFingerprint: !!this._fingerprint, portsInitialized: Ports.isInitialized(), componentsCollected: Object.keys(this._components).length, metrics: Object.assign({}, this._metrics), timestamp: Date.now() };
};
DeviceFingerprint.prototype.healthCheck = function() {
  const logger = _getPort("logger");
  const checks = { enabled: this.enabled, canGenerateCanvas: !!document.createElement("canvas").getContext, hasStorage: this._testStorage("localStorage"), loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 5 ? "HEALTHY" : "DEGRADED", score: `${passed}/5`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};
var fingerprint_default = DeviceFingerprint;
export {
  DeviceFingerprint,
  MODULE_ID,
  VERSION,
  fingerprint_default as default,
  getPorts,
  injectPorts
};
