// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-audit-trail.ui.template-ui
// PURPOSE: Panel Audit Trail - Template UI Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   CSS_PREFIX from ./template-constants.js
//   escapeHtml from ./template-utils.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   updateTimestamp() — exported function
//   updateRefreshBtn() — exported function
//   updateHealthSummary() — exported function
//   updateCountdown() — exported function
//   setAutoRefreshState() — exported function
//   setDensity() — exported function
//   updateBulkActions() — exported function
//   toggleExportMenu() — exported function
//   toggleFullscreen() — exported function
//   showToast() — exported function
//   buildDetailModal() — exported function
//   ... and 2 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { CSS_PREFIX } from './template-constants.js';
import { escapeHtml } from './template-utils.js';
import * as ModalAdapter from '/components/overlay-layer/adapters/modal-adapter.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-audit-trail.ui.template-ui';

const hasWindow = typeof window !== 'undefined';
const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; const fn = (logger as Record<string, unknown>)[level] || (logger as Record<string, unknown>).info; if (typeof fn === 'function') (fn as (...a: unknown[]) => void)(`[${MODULE_ID}]`, ...args); };

export function updateTimestamp(container: Element | null | undefined, timestamp: number | string | null | undefined) { const el = container?.querySelector('[data-last-update] span'); if (el && timestamp) el.textContent = new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
export function updateRefreshBtn(container: Element | null | undefined, loading: boolean) { const btn = container?.querySelector('[data-action="refresh"]') as HTMLButtonElement | null; if (btn) { btn.classList.toggle(`${CSS_PREFIX}-action-btn--loading`, loading); btn.disabled = loading; } }
export function updateHealthSummary(container: Element | null | undefined, stats: Record<string, number | null | undefined>) { if (!container || !stats) return; ['error', 'warning', 'info', 'security'].forEach(k => { const el = container.querySelector(`[data-count="${k}"]`); if (el) el.textContent = String(stats[k] || 0); }); }
export function updateCountdown(container: Element | null | undefined, seconds: number | string) { const el = container?.querySelector('[data-countdown]'); if (el) el.textContent = String(seconds); }
export function setAutoRefreshState(container: Element | null | undefined, active: boolean) { const toggle = container?.querySelector('[data-action="toggle-auto-refresh"]'); const countdown = container?.querySelector('[data-countdown]'); const status = container?.querySelector('[data-auto-refresh-status]'); toggle?.classList.toggle('active', active); countdown?.classList.toggle('active', active); if (status) status.textContent = active ? 'Auto-refresh: 30s' : 'Auto-refresh: OFF'; }
export function setDensity(container: Element | null | undefined, density: string) { const table = container?.querySelector(`.${CSS_PREFIX}-table`) as HTMLElement | null; const btns = container?.querySelectorAll('[data-density]'); if (table) table.dataset.density = density; btns?.forEach(btn => btn.classList.toggle('active', (btn as HTMLElement).dataset.density === density)); }
export function updateBulkActions(container: Element | null | undefined, count: number) { const bar = container?.querySelector('[data-bulk-actions]'); const countEl = container?.querySelector('[data-selected-count]'); if (bar) bar.classList.toggle('visible', count > 0); if (countEl) countEl.textContent = String(count); }
export function toggleExportMenu(container: Element | null | undefined) { const menu = container?.querySelector('[data-export-menu]'); const btn = container?.querySelector('[data-action="toggle-export-menu"]'); if (menu) { const isOpen = menu.classList.toggle('open'); btn?.classList.toggle('active', isOpen); } }
export function toggleFullscreen(container: Element | null | undefined) { container?.classList.toggle('fullscreen'); const isFs = container?.classList.contains('fullscreen'); const btn = container?.querySelector('[data-action="fullscreen"]'); if (btn) btn.innerHTML = isFs ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>'; return isFs; }

export function showToast(container: Element | null | undefined, message: string, type = 'info') { const toast = _getPort('toast') as { show?: (msg: string, t: string) => void } | null; if (toast?.show) return toast.show(message, type); _log('warn', 'Toast Service not available'); return null; }

export async function showDetailModal(log: Record<string, unknown>) { const jsonContent = JSON.stringify(log, null, 2); const bodyHTML = `<pre style="background: rgba(0,0,0,0.4);padding: 1rem;border-radius: 0.5rem;overflow: auto;max-height: 400px;font-size: 0.75rem;font-family: var(--pat-font-mono, monospace);color: rgba(255,255,255,0.9);border: 1px solid rgba(255,255,255,0.1);">${escapeHtml(jsonContent)}</pre><div style="display:flex;justify-content:flex-end;margin-top:1rem;"><button onclick="this.closest('[data-overlay-id]')?.remove()" style="padding: 0.5rem 1rem;background: linear-gradient(135deg, #8B5CF6, #7C3AED);color: white;border: none;border-radius: 0.5rem;cursor: pointer;font-weight: 500;">Fechar</button></div>`; try { await ModalAdapter.open('pat-detail-modal', bodyHTML, { title: 'Detalhes do Evento', scope: 'panel-audit-trail' }); } catch (e) { _log('warn', 'Modal open failed:', e); } }

export function buildDetailModal(log: Record<string, unknown>) { return ''; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }
export function healthCheck() { const toast = _getPort('toast'); const logger = _getPort('logger'); return { status: toast ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { templateUiReady: true, toastAvailable: !!toast, modalAdapterAvailable: !!ModalAdapter, loggerReady: !!logger }, timestamp: Date.now() }; }

export default { VERSION, MODULE_ID, updateTimestamp, updateRefreshBtn, updateHealthSummary, updateCountdown, setAutoRefreshState, setDensity, updateBulkActions, toggleExportMenu, toggleFullscreen, showToast, showDetailModal, buildDetailModal, info, healthCheck };
