// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-avatar-preview
// PURPOSE: Login Modal - Avatar Preview
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   AvatarPreview() — exported function
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

const VERSION = '1.3.0-P17WI';
const MODULE_ID = 'login-modal-avatar-preview';
const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236366f1"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"%3E%3C/path%3E%3C/svg%3E';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string) { const logger = _getPort('logger'); if (!logger) return; const args = Array.prototype.slice.call(arguments, 1); if (level === 'error') { if (logger.error) logger.error(...['[avatar-preview]'].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn(...['[avatar-preview]'].concat(args)); return; } if (_debugEnabled() && logger.debug) logger.debug(...['[avatar-preview]'].concat(args)); };

export function AvatarPreview(this: any, config: Record<string, any>) { if (!config) config = {}; const av = config.avatar || {}; this.config = config; this.enabled = av.enabled !== false; this.endpoint = av.endpoint || '/api/users/avatar.php'; this.debounceMs = av.debounce || 500; this.timeout = av.timeout || 3000; this.showInitials = av.showInitials !== false; this._container = null; this._input = null; this._debounceTimer = null; this._abortController = null; this._cache = new Map(); this._currentUsername = ''; this._mounted = false; this._metrics = { lookups: 0, hits: 0, misses: 0, errors: 0, cacheHits: 0 }; _initPorts(); }

AvatarPreview.prototype.getHTML = () => `<div class="lm-avatar-preview" data-avatar-container aria-hidden="true"><div class="lm-avatar-image-wrapper"><img src="${DEFAULT_AVATAR}" alt="" class="lm-avatar-image" data-avatar-image loading="lazy"><div class="lm-avatar-initials" data-avatar-initials></div><div class="lm-avatar-loading" data-avatar-loading hidden><div class="lm-avatar-spinner"></div></div></div><span class="lm-avatar-name" data-avatar-name></span></div>`;

AvatarPreview.prototype.getCSS = () => '.lm-avatar-preview{display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0;opacity:0;transform:translateY(-10px);transition:all 0.3s ease;pointer-events:none}.lm-avatar-preview.lm-avatar-visible{opacity:1;transform:translateY(0);pointer-events:auto}.lm-avatar-image-wrapper{position:relative;width:40px;height:40px;border-radius:50%;overflow:hidden;background:rgba(99,102,241,0.2);border:2px solid rgba(139,92,246,0.5);flex-shrink:0}.lm-avatar-image{width:100%;height:100%;object-fit:cover;transition:opacity 0.3s ease}.lm-avatar-image.lm-avatar-hidden{opacity:0}.lm-avatar-initials{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:600;color:#a78bfa;text-transform:uppercase;background:linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.3))}.lm-avatar-initials:empty{display:none}.lm-avatar-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,0.8)}.lm-avatar-spinner{width:20px;height:20px;border:2px solid rgba(139,92,246,0.3);border-top-color:#a78bfa;border-radius:50%;animation:lm-avatar-spin 0.8s linear infinite}@keyframes lm-avatar-spin{to{transform:rotate(360deg)}}.lm-avatar-name{font-size:0.875rem;color:rgba(255,255,255,0.8);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px}.lm-avatar-preview.lm-avatar-error .lm-avatar-image-wrapper{border-color:rgba(239,68,68,0.5)}';


// @ts-expect-error TS migration - TS2554
AvatarPreview.prototype.mount = function(usernameInput: HTMLInputElement, insertTarget: HTMLElement | null) { const self = this; if (!self.enabled || !usernameInput) return false; self._input = usernameInput; if (!document.querySelector('style[data-avatar-css]')) { const style = document.createElement('style'); style.setAttribute('data-avatar-css', 'true'); style.textContent = self.getCSS(); document.head.appendChild(style); } const target = insertTarget || usernameInput.closest('.lm-floating-group'); if (target) { target.insertAdjacentHTML('beforeend', self.getHTML()); self._container = target.querySelector('[data-avatar-container]'); } self._handleInput = (e: Event) => { self._onInput(e); }; self._input.addEventListener('input', self._handleInput); self._input.addEventListener('blur', self._handleInput); self._mounted = true; _log('info', 'Avatar preview montado'); return true; };

AvatarPreview.prototype._onInput = function(event: Event) { const self = this; const username = (event.target as HTMLInputElement).value.trim(); if (self._debounceTimer) clearTimeout(self._debounceTimer); if (!username || username.length < 3) { self.hide(); return; } self._debounceTimer = setTimeout(() => { self.lookup(username); }, self.debounceMs); };


// @ts-expect-error TS migration - TS2554
AvatarPreview.prototype.lookup = function(username: string) { const self = this; if (!username || username === self._currentUsername) return Promise.resolve(); self._currentUsername = username; self._metrics.lookups++; if (self._cache.has(username)) { self._metrics.cacheHits++; self._showResult(self._cache.get(username)); return Promise.resolve(); } self._showLoading(); if (self._abortController) self._abortController.abort(); self._abortController = new AbortController(); return fetch(`${self.endpoint}?username=${encodeURIComponent(username)}`, { method: 'GET', signal: self._abortController.signal, headers: { 'Accept': 'application/json' } }).then(response => { if (!response.ok) { self._metrics.misses++; const result = { found: false, username, initials: self._getInitials(username) }; self._cache.set(username, result); self._showResult(result); return; } return response.json().then(data => { self._metrics.hits++; const result = { found: true, username, avatarUrl: data.avatar_url || data.avatarUrl || null, displayName: data.display_name || data.displayName || data.name || username, initials: self._getInitials(data.display_name || data.name || username) }; self._cache.set(username, result); self._showResult(result); }); }).catch(error => { if (error.name === 'AbortError') return; self._metrics.errors++; _log('warn', 'Erro ao buscar avatar', error); self._showResult({ found: false, username, initials: self._getInitials(username), error: true }); }); };

AvatarPreview.prototype._getInitials = (name: string) => { if (!name) return '?'; const parts = name.split(/[\s@._-]+/).filter(p => p.length > 0); if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase(); return name.substring(0, 2).toUpperCase(); };

AvatarPreview.prototype._showLoading = function() { if (!this._container) return; const loading = this._container.querySelector('[data-avatar-loading]'); if (loading) loading.hidden = false; this._container.classList.add('lm-avatar-visible'); };


// @ts-expect-error TS migration - TS2554
AvatarPreview.prototype._showResult = function(result: Record<string, any>) { if (!this._container) return; const image = this._container.querySelector('[data-avatar-image]'); const initials = this._container.querySelector('[data-avatar-initials]'); const name = this._container.querySelector('[data-avatar-name]'); const loading = this._container.querySelector('[data-avatar-loading]'); if (loading) loading.hidden = true; this._container.classList.remove('lm-avatar-error'); if (result.error) this._container.classList.add('lm-avatar-error'); if (result.avatarUrl && image) { image.src = result.avatarUrl; image.classList.remove('lm-avatar-hidden'); if (initials) initials.textContent = ''; } else { if (image) { image.src = DEFAULT_AVATAR; image.classList.add('lm-avatar-hidden'); } if (initials && this.showInitials) initials.textContent = result.initials || ''; } if (name) name.textContent = result.displayName || result.username || ''; this._container.classList.add('lm-avatar-visible'); _log('info', 'Avatar exibido', { username: result.username, found: result.found }); };

AvatarPreview.prototype.hide = function() { this._currentUsername = ''; if (this._container) this._container.classList.remove('lm-avatar-visible'); };
AvatarPreview.prototype.clearCache = function() { this._cache.clear(); };

AvatarPreview.prototype.unmount = function() { if (this._input && this._handleInput) { this._input.removeEventListener('input', this._handleInput); this._input.removeEventListener('blur', this._handleInput); } if (this._debounceTimer) clearTimeout(this._debounceTimer); if (this._abortController) this._abortController.abort(); if (this._container) this._container.remove(); this._mounted = false; };

AvatarPreview.prototype.info = function() { return { moduleId: MODULE_ID, version: VERSION, enabled: this.enabled, mounted: this._mounted, cacheSize: this._cache.size, portsInitialized: Ports.isInitialized(), metrics: Object.assign({}, this._metrics), timestamp: Date.now() }; };

AvatarPreview.prototype.healthCheck = function() { const logger = _getPort('logger'); const checks = { enabled: this.enabled, mounted: this._mounted, hasInput: !!this._input, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 5 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/5`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; };

export { VERSION, MODULE_ID };
export default AvatarPreview;
