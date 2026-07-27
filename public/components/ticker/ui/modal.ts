// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.ui.modal
// PURPOSE: News Modal - Ticker Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'keydown'
// WINDOW ACCESS:
//   window.location
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '1.4.0-P17WI';
export const MODULE_ID = 'ticker.ui.modal';
const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args); };
const MODAL_STYLES = '.ticker-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);z-index:10000;display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:opacity 0.2s,visibility 0.2s}.ticker-modal-overlay--visible{opacity:1;visibility:visible}.ticker-modal{background:var(--surface-card,#1a1a2e);border-radius:12px;max-width:600px;width:90%;max-height:80vh;overflow:hidden;transform:translateY(20px) scale(0.95);transition:transform 0.2s;box-shadow:0 20px 60px rgba(0,0,0,0.5)}.ticker-modal-overlay--visible .ticker-modal{transform:translateY(0) scale(1)}.ticker-modal-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.1)}.ticker-modal-source{display:flex;align-items:center;gap:8px;font-size:12px;color:rgba(255,255,255,0.6)}.ticker-modal-source svg{width:16px;height:16px}.ticker-modal-close{background:none;border:none;color:rgba(255,255,255,0.6);cursor:pointer;padding:8px;border-radius:8px;transition:background 0.2s,color 0.2s}.ticker-modal-close:hover{background:rgba(255,255,255,0.1);color:#fff}.ticker-modal-body{padding:20px;overflow-y:auto;max-height:calc(80vh - 140px)}.ticker-modal-category{display:inline-block;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;text-transform:uppercase;margin-bottom:12px;background:var(--accent-color,#4a9eff);color:#fff}.ticker-modal-title{font-size:20px;font-weight:600;line-height:1.4;color:#fff;margin:0 0 12px 0}.ticker-modal-meta{display:flex;gap:16px;font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:16px}.ticker-modal-summary{font-size:15px;line-height:1.6;color:rgba(255,255,255,0.8)}.ticker-modal-footer{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-top:1px solid rgba(255,255,255,0.1)}.ticker-modal-link{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:var(--accent-color,#4a9eff);color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;transition:opacity 0.2s}.ticker-modal-link:hover{opacity:0.9}.ticker-modal-share{display:flex;gap:8px}.ticker-modal-share-btn{background:rgba(255,255,255,0.1);border:none;color:rgba(255,255,255,0.7);padding:8px 12px;border-radius:6px;cursor:pointer;font-size:12px;transition:background 0.2s}.ticker-modal-share-btn:hover{background:rgba(255,255,255,0.2)}';
export class NewsModal {
  [key: string]: any;
  constructor(options: { onClose?: (() => void) | null; onShare?: ((type: string, item: unknown) => void) | null } = {}) { this.onClose = options.onClose || null; this.onShare = options.onShare || null; this._overlay = null; this._modal = null; this._currentItem = null; this._isOpen = false; this._focusTrap = null; this._previousFocus = null; this._metrics = { opens: 0, closes: 0, shares: 0, linkClicks: 0 }; this._boundKeyHandler = this._onKeyDown.bind(this); this._boundClickHandler = this._onOverlayClick.bind(this); }
  init() { this._injectStyles(); this._createModal(); _log('debug', 'NewsModal initialized'); return this; }
  _injectStyles() { if (!hasDocument || document.getElementById('ticker-modal-styles')) return; const style = document.createElement('style'); style.id = 'ticker-modal-styles'; style.textContent = MODAL_STYLES; document.head.appendChild(style); }
  _createModal() { if (!hasDocument) return; this._overlay = document.createElement('div'); this._overlay.className = 'ticker-modal-overlay'; this._overlay.setAttribute('role', 'dialog'); this._overlay.setAttribute('aria-modal', 'true'); this._overlay.setAttribute('aria-hidden', 'true'); this._modal = document.createElement('div'); this._modal.className = 'ticker-modal'; this._overlay.appendChild(this._modal); document.body.appendChild(this._overlay); this._overlay.addEventListener('click', this._boundClickHandler); }
  open(item: Record<string, any>) { if (!item || this._isOpen || !hasDocument) return; this._currentItem = item; this._previousFocus = document.activeElement; this._renderContent(item); this._overlay.classList.add('ticker-modal-overlay--visible'); this._overlay.setAttribute('aria-hidden', 'false'); this._isOpen = true; this._metrics.opens++; document.addEventListener('keydown', this._boundKeyHandler); document.body.style.overflow = 'hidden'; setTimeout(() => { const closeBtn = this._modal.querySelector('.ticker-modal-close'); if (closeBtn) closeBtn.focus(); }, 100); _log('debug', 'Modal opened', { title: item.title?.substring(0, 30) }); }
  close() { if (!this._isOpen || !hasDocument) return; this._overlay.classList.remove('ticker-modal-overlay--visible'); this._overlay.setAttribute('aria-hidden', 'true'); this._isOpen = false; this._currentItem = null; this._metrics.closes++; document.removeEventListener('keydown', this._boundKeyHandler); document.body.style.overflow = ''; if (this._previousFocus) { this._previousFocus.focus(); this._previousFocus = null; } if (this.onClose) this.onClose(); _log('debug', 'Modal closed'); }
  _renderContent(item: Record<string, any>) { const category = item.category || 'geral'; const time = this._formatTime(item.published_at); const source = item.source || 'Fonte'; this._modal.innerHTML = `<div class="ticker-modal-header"><div class="ticker-modal-source"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg><span>${this._escapeHtml(source)}</span></div><button class="ticker-modal-close" aria-label="Fechar"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div><div class="ticker-modal-body"><span class="ticker-modal-category">${this._escapeHtml(category)}</span><h2 class="ticker-modal-title">${this._escapeHtml(item.title || '')}</h2><div class="ticker-modal-meta"><span>${time}</span></div>${item.summary ? `<p class="ticker-modal-summary">${this._escapeHtml(item.summary)}</p>` : ''}</div><div class="ticker-modal-footer"><a href="${item.url || '#'}" target="_blank" rel="noopener noreferrer" class="ticker-modal-link">Ler materia completa<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a><div class="ticker-modal-share"><button class="ticker-modal-share-btn" data-share="copy">Copiar link</button><button class="ticker-modal-share-btn" data-share="native">Compartilhar</button></div></div>`; this._modal.querySelector('.ticker-modal-close').addEventListener('click', () => this.close()); this._modal.querySelector('.ticker-modal-link').addEventListener('click', () => { this._metrics.linkClicks++; }); this._modal.querySelectorAll('.ticker-modal-share-btn').forEach((btn: Element) => { btn.addEventListener('click', () => this._handleShare((btn as HTMLElement).dataset.share, item)); }); }
  _handleShare(type: string | undefined, item: Record<string, any>) { this._metrics.shares++; if (type === 'copy') { const url = item.url || (hasWindow && window.location ? window.location.href : ''); navigator.clipboard?.writeText(url).then(() => { _log('debug', 'Link copied'); }); } else if (type === 'native' && navigator.share) { navigator.share({ title: item.title, url: item.url }).catch(() => {}); } if (this.onShare) this.onShare(type, item); }
  _onKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') this.close(); }
  _onOverlayClick(e: MouseEvent) { if (e.target === this._overlay) this.close(); }
  _formatTime(dateStr: string) { if (!dateStr) return ''; try { const date = new Date(dateStr); return date.toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }
  _escapeHtml(str: string) { if (!str || !hasDocument) return ''; const div = document.createElement('div'); div.textContent = str; return div.innerHTML; }
  isOpen() { return this._isOpen; }
  getCurrentItem() { return this._currentItem; }
  destroy() { this.close(); if (this._overlay && this._overlay.parentNode) this._overlay.parentNode.removeChild(this._overlay); this._overlay = null; this._modal = null; }
  healthCheck() { const logger = _getPort('logger'); const checks = { hasOverlay: !!this._overlay, hasModal: !!this._modal, loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 4 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/4`, isOpen: this._isOpen, checks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, isOpen: this._isOpen, metrics: { ...this._metrics }, portsInitialized: Ports.isInitialized() }; }
}
export function getVersion() { return VERSION; }
export default NewsModal;
