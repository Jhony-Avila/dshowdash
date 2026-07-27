// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accessibility-manager.core.engine
// PURPOSE: Core accessibility engine for managing a11y settings
// ───────────────────────────────────────────────────────────────
// @contract GET_SETTINGS - getSettings() returns current a11y settings
// @contract UPDATE_SETTINGS - updateSettings(newSettings) updates settings
// @contract DETECT_PREFERENCES - detectPreferences() detects system a11y preferences
// @contract ENABLE - enable(flag) enables an accessibility flag
// @contract DISABLE - disable(flag) disables an accessibility flag
// @contract TOGGLE - toggle(flag) toggles an accessibility flag
// @contract GET - get(flag) gets value of an accessibility flag
// @contract SET_FONT_SCALE - setFontScale(scale) sets font scale
// @contract SET_COLOR_BLIND_MODE - setColorBlindMode(mode) sets color blind mode
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: None
// PROVIDES: getSettings, updateSettings, detectPreferences, enable, disable, toggle,
//           get, setFontScale, setColorBlindMode, healthCheck, info, getVersion, VERSION, MODULE_ID
// @changelog v2.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.1.0-ENTERPRISE: ES6 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accessibility-manager.core.engine';

let _settings = {
  highContrast: false,
  reducedMotion: false,
  largeText: false,
  screenReaderOptimized: false,
  keyboardNavigation: false,
  focusIndicators: false,
  fontScale: 1,
  colorBlindMode: 'none'
};

export function getSettings() {
  return { ..._settings };
}

export function updateSettings(newSettings: Record<string, unknown>) {
  Object.assign(_settings, newSettings);
  return true;
}

export function detectPreferences() {
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  const highContrast = window.matchMedia?.('(prefers-contrast: high)')?.matches ?? false;
  return { reducedMotion, highContrast };
}

export function enable(flag: string) {
  if (flag in _settings && typeof (_settings as Record<string, unknown>)[flag] === 'boolean') {
    (_settings as Record<string, unknown>)[flag] = true;
    return true;
  }
  return false;
}

export function disable(flag: string) {
  if (flag in _settings && typeof (_settings as Record<string, unknown>)[flag] === 'boolean') {
    (_settings as Record<string, unknown>)[flag] = false;
    return true;
  }
  return false;
}

export function toggle(flag: string) {
  if (flag in _settings && typeof (_settings as Record<string, unknown>)[flag] === 'boolean') {
    (_settings as Record<string, unknown>)[flag] = !(_settings as Record<string, unknown>)[flag];
    return (_settings as Record<string, unknown>)[flag];
  }
  return null;
}

export function get(flag: string) {
  return (_settings as Record<string, unknown>)[flag];
}

export function setFontScale(scale: number) {
  if (typeof scale === 'number' && scale >= 0.5 && scale <= 3) {
    _settings.fontScale = scale;
    return true;
  }
  return false;
}

export function setColorBlindMode(mode: string) {
  const validModes = ['none', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];
  if (validModes.includes(mode)) {
    _settings.colorBlindMode = mode;
    return true;
  }
  return false;
}

export function getVersion() {
  return VERSION;
}

export function healthCheck() {
  const checks = {
    hasSettings: !!_settings,
    validFontScale: _settings.fontScale >= 0.5 && _settings.fontScale <= 3,
    validColorBlindMode: ['none', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'].includes(_settings.colorBlindMode)
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    settings: getSettings(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    settings: getSettings(),
    detectedPreferences: detectPreferences(),
    timestamp: Date.now()
  };
}

export default {
  getSettings,
  updateSettings,
  detectPreferences,
  enable,
  disable,
  toggle,
  get,
  setFontScale,
  setColorBlindMode,
  healthCheck,
  info,
  getVersion,
  VERSION,
  MODULE_ID
};
