import { SPRITES } from "../../sprites.js";
const VERSION = "5.1.0-ENTERPRISE";
const MODULE_ID = "footer/components/status-devices/utils/formatters";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
const DEVICE_SPRITES = {
  webcamOn: SPRITES["device-webcam-on"] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
  webcamOff: SPRITES["device-webcam-off"] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3m4 0h6a2 2 0 0 1 2 2v6m0 4v2a2 2 0 0 1-2 2"/><path d="M23 7l-5.24 3.75"/></svg>',
  micOn: SPRITES["device-mic-on"] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>',
  micOff: SPRITES["device-mic-off"] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>'
};
class Formatters {
  static formatDeviceStatus(active) {
    return active ? "Ativo" : "Inativo";
  }
  static getWebcamIcon(active) {
    return active ? DEVICE_SPRITES.webcamOn : DEVICE_SPRITES.webcamOff;
  }
  static getMicIcon(active) {
    return active ? DEVICE_SPRITES.micOn : DEVICE_SPRITES.micOff;
  }
  static healthCheck() {
    const checks = { ready: true, spritesLoaded: !!SPRITES };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  static info() {
    return { version: VERSION, moduleId: MODULE_ID, healthCheck: this.healthCheck() };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [..._logBuffer];
  }
}
function getVersion() {
  return VERSION;
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getLogs() {
  return [..._logBuffer];
}
var formatters_default = Formatters;
export {
  Formatters,
  MODULE_ID,
  VERSION,
  formatters_default as default,
  getLogs,
  getVersion,
  setDebug
};
