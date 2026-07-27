// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-themes
// PURPOSE: Preloader Themes
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   THEMES — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   setTheme() — exported function
//   getTheme() — exported function
//   getThemeById() — exported function
//   getAllThemes() — exported function
//   getThemeIds() — exported function
//   registerTheme() — exported function
//   unregisterTheme() — exported function
//   getThemeCSS() — exported function
//   injectThemeCSS() — exported function
//   detectSystemTheme() — exported function
//   useSystemTheme() — exported function
//   subscribe() — exported function
//   getStatus() — exported function
//   healthCheck() — exported function
//   info() — exported function
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
import { createCorePorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '1.2.0-P17WI';
export const MODULE_ID = 'preloader-themes';
const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
function _log(level: string, msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (!logger) return; ctx = ctx || {}; ctx.component = MODULE_ID; if (level === 'warn') { if (logger.warn) logger.warn(msg, ctx); return; } if (level === 'info') { if (logger.info) logger.info(msg, ctx); return; } if (logger.debug) logger.debug(msg, ctx); }
export const THEMES: Record<string, Record<string, any>> = { dark: { id: 'dark', name: 'Dark Theme', colors: { background: '#0a0a0a', backgroundGradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)', surface: '#1a1a1a', text: '#ffffff', textMuted: '#a0a0a0', primary: '#3b82f6', progress: '#3b82f6', progressTrack: '#2a2a2a', success: '#10b981', warning: '#f59e0b', error: '#ef4444', overlay: 'rgba(0, 0, 0, 0.9)' }, effects: { blur: '20px', shadow: '0 4px 30px rgba(0, 0, 0, 0.5)', glow: '0 0 20px rgba(59, 130, 246, 0.3)' } }, light: { id: 'light', name: 'Light Theme', colors: { background: '#ffffff', backgroundGradient: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)', surface: '#f5f5f5', text: '#1a1a1a', textMuted: '#666666', primary: '#2563eb', progress: '#2563eb', progressTrack: '#e5e5e5', success: '#059669', warning: '#d97706', error: '#dc2626', overlay: 'rgba(255, 255, 255, 0.95)' }, effects: { blur: '20px', shadow: '0 4px 30px rgba(0, 0, 0, 0.1)', glow: '0 0 20px rgba(37, 99, 235, 0.2)' } }, corporate: { id: 'corporate', name: 'Corporate Theme', colors: { background: '#1e3a5f', backgroundGradient: 'linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%)', surface: '#2a4a6f', text: '#ffffff', textMuted: '#a0c4e8', primary: '#00a8e8', progress: '#00a8e8', progressTrack: '#3a5a7f', success: '#00c896', warning: '#ffc107', error: '#ff5252', overlay: 'rgba(30, 58, 95, 0.95)' }, effects: { blur: '15px', shadow: '0 4px 30px rgba(0, 0, 0, 0.3)', glow: '0 0 25px rgba(0, 168, 232, 0.4)' } }, minimal: { id: 'minimal', name: 'Minimal Theme', colors: { background: '#fafafa', backgroundGradient: 'none', surface: '#ffffff', text: '#333333', textMuted: '#888888', primary: '#333333', progress: '#333333', progressTrack: '#e0e0e0', success: '#4caf50', warning: '#ff9800', error: '#f44336', overlay: 'rgba(250, 250, 250, 0.98)' }, effects: { blur: '0', shadow: 'none', glow: 'none' } }, neon: { id: 'neon', name: 'Neon Theme', colors: { background: '#0d0221', backgroundGradient: 'linear-gradient(135deg, #0d0221 0%, #150734 50%, #0d0221 100%)', surface: '#1a0a3e', text: '#ffffff', textMuted: '#b794f6', primary: '#00ffff', progress: '#00ffff', progressTrack: '#2d1b69', success: '#39ff14', warning: '#ffff00', error: '#ff00ff', overlay: 'rgba(13, 2, 33, 0.95)' }, effects: { blur: '25px', shadow: '0 0 40px rgba(0, 255, 255, 0.3)', glow: '0 0 30px rgba(0, 255, 255, 0.5), 0 0 60px rgba(0, 255, 255, 0.3)' } }, nature: { id: 'nature', name: 'Nature Theme', colors: { background: '#1a2f1a', backgroundGradient: 'linear-gradient(135deg, #1a2f1a 0%, #0d1f0d 100%)', surface: '#2a4a2a', text: '#e8f5e9', textMuted: '#a5d6a7', primary: '#4caf50', progress: '#66bb6a', progressTrack: '#2e5a2e', success: '#81c784', warning: '#ffb74d', error: '#e57373', overlay: 'rgba(26, 47, 26, 0.95)' }, effects: { blur: '15px', shadow: '0 4px 30px rgba(0, 0, 0, 0.3)', glow: '0 0 20px rgba(102, 187, 106, 0.3)' } }, ocean: { id: 'ocean', name: 'Ocean Theme', colors: { background: '#0a1628', backgroundGradient: 'linear-gradient(180deg, #0a1628 0%, #1a3a5c 50%, #0a1628 100%)', surface: '#1a3a5c', text: '#e0f7fa', textMuted: '#80deea', primary: '#00bcd4', progress: '#00bcd4', progressTrack: '#1a3a5c', success: '#00e676', warning: '#ffd54f', error: '#ff5252', overlay: 'rgba(10, 22, 40, 0.95)' }, effects: { blur: '20px', shadow: '0 4px 40px rgba(0, 188, 212, 0.2)', glow: '0 0 30px rgba(0, 188, 212, 0.4)' } }, sunset: { id: 'sunset', name: 'Sunset Theme', colors: { background: '#1a0a0a', backgroundGradient: 'linear-gradient(135deg, #1a0a0a 0%, #3d1a1a 50%, #1a0a0a 100%)', surface: '#3d1a1a', text: '#fff3e0', textMuted: '#ffcc80', primary: '#ff7043', progress: '#ff7043', progressTrack: '#4a2020', success: '#aed581', warning: '#ffb74d', error: '#ef5350', overlay: 'rgba(26, 10, 10, 0.95)' }, effects: { blur: '20px', shadow: '0 4px 40px rgba(255, 112, 67, 0.2)', glow: '0 0 25px rgba(255, 112, 67, 0.4)' } } };
let _currentTheme = THEMES.dark;
const _customThemes = new Map();
const _subscribers = new Set();
function _camelToKebab(str: string) { return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(); }
function _applyTheme(theme: Record<string, any>) { if (!hasDocument) return; const root = document.documentElement; Object.keys(theme.colors).forEach(key => { root.style.setProperty(`--preloader-${_camelToKebab(key)}`, theme.colors[key]); }); Object.keys(theme.effects).forEach(key => { root.style.setProperty(`--preloader-effect-${_camelToKebab(key)}`, theme.effects[key]); }); const preloaderRoot = document.querySelector('[data-preloader-root]'); if (preloaderRoot) { preloaderRoot.setAttribute('data-theme', theme.id); } }

// @ts-expect-error strict migration — TS2345
function _notifySubscribers(theme: Record<string, any>) { _subscribers.forEach((callback: (theme: Record<string, any>) => void) => { try { callback(theme); } catch (e: any) { _log('warn', 'Subscriber error', { error: e.message }); } }); }
export function setTheme(themeId: string) { const theme = THEMES[themeId] || _customThemes.get(themeId); if (!theme) { _log('warn', 'Theme not found', { themeId }); return false; } _currentTheme = theme; _applyTheme(theme); _notifySubscribers(theme); _log('info', 'Theme applied', { themeId: theme.id }); return true; }
export function getTheme() { return _currentTheme; }
export function getThemeById(themeId: string) { return THEMES[themeId] || _customThemes.get(themeId) || null; }
export function getAllThemes() { return Object.values(THEMES).concat(Array.from(_customThemes.values())); }
export function getThemeIds() { return Object.keys(THEMES).concat(Array.from(_customThemes.keys())); }
export function registerTheme(themeId: string, config: Record<string, any>) { if (THEMES[themeId]) { _log('warn', 'Cannot override built-in theme', { themeId }); return false; } const theme = { id: themeId, name: config.name || themeId, colors: Object.assign({}, THEMES.dark.colors, config.colors), effects: Object.assign({}, THEMES.dark.effects, config.effects) }; _customThemes.set(themeId, theme); _log('info', 'Custom theme registered', { themeId }); return true; }
export function unregisterTheme(themeId: string) { if (THEMES[themeId]) { _log('warn', 'Cannot unregister built-in theme', { themeId }); return false; } return _customThemes.delete(themeId); }
export function getThemeCSS(theme = _currentTheme) {
  const css = [':root, [data-preloader-root] {'];Object.keys(theme.colors).forEach(key => { css.push(`  --preloader-${_camelToKebab(key)}: ${theme.colors[key]};`); });Object.keys(theme.effects).forEach(key => { css.push(`  --preloader-effect-${_camelToKebab(key)}: ${theme.effects[key]};`); });css.push('}');return css.join('\n');
}
export function injectThemeCSS(theme?: Record<string, any>) { if (!hasDocument) return; theme = theme || _currentTheme; const existingStyle = document.getElementById('preloader-theme-css'); if (existingStyle) { existingStyle.remove(); } const style = document.createElement('style'); style.id = 'preloader-theme-css'; style.textContent = getThemeCSS(theme); document.head.appendChild(style); }
export function detectSystemTheme() { if (!hasWindow) return 'dark'; const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; return prefersDark ? 'dark' : 'light'; }
export function useSystemTheme() { const systemTheme = detectSystemTheme(); setTheme(systemTheme); if (hasWindow && window.matchMedia) { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => { setTheme(e.matches ? 'dark' : 'light'); }); } }
export function subscribe(callback: (theme: Record<string, any>) => void) { _subscribers.add(callback); return () => { _subscribers.delete(callback); }; }
export function getStatus() { return { version: VERSION, moduleId: MODULE_ID, currentTheme: _currentTheme.id, builtInThemes: Object.keys(THEMES).length, customThemes: _customThemes.size, subscribers: _subscribers.size }; }
export function healthCheck() { const ps = Ports.snapshot(); return { status: ps._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { themesLoaded: Object.keys(THEMES).length > 0, currentThemeValid: !!_currentTheme, hasLogger: !!_getPort('logger'), portsInitialized: ps._initialized }, timestamp: Date.now() }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, features: ['8-built-in-themes', 'custom-themes', 'css-variables', 'system-detection', 'subscribers'], themes: getThemeIds(), status: getStatus() }; }
export default { VERSION, MODULE_ID, THEMES, setTheme, getTheme, getThemeById, getAllThemes, getThemeIds, registerTheme, unregisterTheme, getThemeCSS, injectThemeCSS, detectSystemTheme, useSystemTheme, subscribe, getStatus, healthCheck, info, injectPorts, getPorts };
