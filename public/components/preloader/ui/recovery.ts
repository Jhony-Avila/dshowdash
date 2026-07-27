// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: boot-recovery-ui
// PURPOSE: Boot Recovery UI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   show() — exported function
//   hide() — exported function
//   onRetry() — exported function
//   onSkip() — exported function
//   onOfflineMode() — exported function
//   configure() — exported function
//   resetRetryCount() — exported function
//   getRetryCount() — exported function
//   isVisible() — exported function
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
export const VERSION = '1.5.0-P17WI';
export const MODULE_ID = 'boot-recovery-ui';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const REC_SVGS = { warning: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' };
const log = { info(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx || {})); }, debug(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx || {})); } };
const _config = { autoShowOnFailure: true, showDiagnostics: true, allowRetry: true, allowSkip: false, allowOfflineMode: true, supportEmail: 'suporte@dshowdash.com.br', maxRetries: 3, retryDelay: 2000 };
let _recoveryElement: HTMLElement | null = null;
let _retryCount = 0;
let _onRetry: ((retryCount: number) => void) | null = null;
let _onSkip: (() => void) | null = null;
let _onOffline: (() => void) | null = null;
let _abortController: AbortController | null = null;
export function show(error: unknown, options?: Record<string, any>) { if (_recoveryElement) hide(); const errorInfo = _parseError(error); const canRetry = _config.allowRetry && _retryCount < _config.maxRetries; _recoveryElement = document.createElement('div'); _recoveryElement.id = 'boot-recovery-ui'; _recoveryElement.setAttribute('role', 'alertdialog'); _recoveryElement.setAttribute('aria-labelledby', 'recovery-title'); _recoveryElement.setAttribute('aria-describedby', 'recovery-desc'); _recoveryElement.innerHTML = `<style>#boot-recovery-ui{position:fixed;top:0;left:0;right:0;bottom:0;background:linear-gradient(135deg,#0a0a0a 0%,#1a1a2e 100%);display:flex;align-items:center;justify-content:center;z-index:999999;font-family:system-ui,-apple-system,sans-serif;color:#fff;animation:fadeIn 0.3s ease-out}@keyframes fadeIn{from{opacity:0}to{opacity:1}}.recovery-container{background:#1a1a1a;border-radius:16px;padding:32px;max-width:500px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.5);border:1px solid #333}.recovery-icon{width:64px;height:64px;margin:0 auto 24px;background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:50%;display:flex;align-items:center;justify-content:center;animation:pulse 2s infinite;color:white}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}.recovery-title{font-size:24px;font-weight:600;text-align:center;margin-bottom:12px}.recovery-desc{color:#888;text-align:center;margin-bottom:24px;line-height:1.6}.recovery-actions{display:flex;flex-direction:column;gap:12px}.recovery-btn{padding:14px 24px;border-radius:8px;font-size:16px;font-weight:500;cursor:pointer;border:none;transition:all 0.2s}.recovery-btn-primary{background:linear-gradient(135deg,#3b82f6,#2563eb);color:white}.recovery-btn-secondary{background:#2a2a2a;color:#fff;border:1px solid #444}</style><div class="recovery-container"><div class="recovery-icon">${REC_SVGS.warning}</div><h1 class="recovery-title" id="recovery-title">Falha ao Iniciar</h1><p class="recovery-desc" id="recovery-desc">Ocorreu um problema ao carregar a aplicação.</p><div class="recovery-actions">${canRetry ? '<button class="recovery-btn recovery-btn-primary" id="recovery-retry">Tentar Novamente</button>' : ''}<button class="recovery-btn recovery-btn-secondary" id="recovery-reload">Recarregar Página</button></div></div>`; document.body.appendChild(_recoveryElement); _attachEventListeners(); log.info('Recovery UI shown', { error: errorInfo.message, retryCount: _retryCount }); return _recoveryElement; }
export function hide() { if (_abortController) { _abortController.abort(); _abortController = null; } if (_recoveryElement) { _recoveryElement.remove(); _recoveryElement = null; } }
function _attachEventListeners() { _abortController = new AbortController(); const opts = { signal: _abortController.signal }; const retryBtn = document.getElementById('recovery-retry'); const reloadBtn = document.getElementById('recovery-reload'); if (retryBtn) { retryBtn.addEventListener('click', () => { _retryCount++; if (_onRetry) _onRetry(_retryCount); else hide(); }, opts); } if (reloadBtn) { reloadBtn.addEventListener('click', () => { window.location.reload(); }, opts); } }
export function onRetry(callback: (retryCount: number) => void) { _onRetry = callback; }
export function onSkip(callback: () => void) { _onSkip = callback; }
export function onOfflineMode(callback: () => void) { _onOffline = callback; }
export function configure(options?: Record<string, any>) { Object.assign(_config, options || {}); }
export function resetRetryCount() { _retryCount = 0; }
export function getRetryCount() { return _retryCount; }
function _parseError(error: unknown) { if (!error) return { name: 'Unknown', message: 'An unknown error occurred' }; if (typeof error === 'string') return { name: 'Error', message: error as string }; return { name: (error as Error).name || 'Error', message: (error as Error).message || String(error) }; }
export function isVisible() { return _recoveryElement !== null; }
export function getStatus() { return { version: VERSION, moduleId: MODULE_ID, visible: isVisible(), retryCount: _retryCount, maxRetries: _config.maxRetries }; }
export function healthCheck() { const ps = Ports.snapshot(); return { status: ps._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, hasLogger: !!_getPort('logger'), portsInitialized: ps._initialized, timestamp: Date.now() }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, features: ['error-display', 'retry-mechanism', 'offline-mode', 'diagnostics', 'callbacks'], status: getStatus() }; }
export default { VERSION, MODULE_ID, show, hide, configure, onRetry, onSkip, onOfflineMode, resetRetryCount, getRetryCount, isVisible, getStatus, healthCheck, info };
