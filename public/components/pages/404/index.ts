// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: pages.404.index
// PURPOSE: Page 404 - Enterprise Premium AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   mount() — exported function
//   unmount() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
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
import { escapeHtml } from '/core/utils/html-sanitizer.js';

const MODULE_ID = 'pages.404.index';
const VERSION = '1.3.0-P17WI';

const hasWindow = typeof window !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: unknown) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const ICONS = { alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>', home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>', back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>', route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>', clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', nav: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>', monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' };

function getTimestamp() { return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }

function getTemplate() {
  const currentPath = (hasWindow && window.location) ? window.location.pathname : '/unknown';
  const timestamp = getTimestamp();
  return `<style>.p404{min-height:100%;display:flex;align-items:center;justify-content:center;padding:24px;font-family:var(--font-family,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif)}.p404__card{max-width:520px;width:100%;background:rgba(15,23,42,0.6);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08);border-radius:16px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5),0 0 40px rgba(99,102,241,0.1);padding:48px;text-align:center}.p404__badges{display:flex;justify-content:center;gap:8px;margin-bottom:32px;flex-wrap:wrap}.p404__badge{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;font-size:0.6875rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-radius:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08)}.p404__badge svg{width:12px;height:12px}.p404__badge--error{color:#ef4444;background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.2)}.p404__badge--routing{color:#f59e0b;background:rgba(245,158,11,0.1);border-color:rgba(245,158,11,0.2)}.p404__badge--client{color:rgba(255,255,255,0.7)}.p404__code{font-size:6rem;font-weight:800;line-height:1;letter-spacing:-3px;background:linear-gradient(135deg,rgba(255,255,255,0.95) 0%,rgba(255,255,255,0.7) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:16px}.p404__title{font-size:1.5rem;font-weight:600;color:rgba(255,255,255,0.95);margin-bottom:12px}.p404__description{font-size:0.9375rem;color:rgba(255,255,255,0.7);line-height:1.6;margin-bottom:32px;max-width:400px;margin-left:auto;margin-right:auto}.p404__actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:32px}.p404__btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;font-size:0.875rem;font-weight:500;font-family:inherit;border-radius:8px;cursor:pointer;transition:all 0.2s ease;text-decoration:none}.p404__btn svg{width:18px;height:18px}.p404__btn--primary{background:#6366f1;color:white;border:none;box-shadow:0 4px 14px rgba(99,102,241,0.4)}.p404__btn--primary:hover{background:#818cf8;transform:translateY(-2px);box-shadow:0 6px 20px rgba(99,102,241,0.5)}.p404__btn--secondary{background:transparent;color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.08)}.p404__btn--secondary:hover{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.95);border-color:rgba(99,102,241,0.3)}.p404__meta{padding-top:24px;border-top:1px solid rgba(255,255,255,0.08)}.p404__meta-row{display:flex;justify-content:center;gap:24px;flex-wrap:wrap}.p404__meta-item{display:flex;align-items:center;gap:8px;font-size:0.75rem;color:rgba(255,255,255,0.45)}.p404__meta-item svg{width:14px;height:14px;opacity:0.6}.p404__meta-value{font-family:"SF Mono",Monaco,monospace;color:#a78bfa;background:rgba(167,139,250,0.1);padding:2px 8px;border-radius:4px;font-size:0.6875rem}@media(max-width:600px){.p404__card{padding:32px 24px}.p404__code{font-size:4rem}.p404__actions{flex-direction:column}.p404__btn{width:100%;justify-content:center}.p404__meta-row{flex-direction:column;gap:12px}}</style><div class="p404"><article class="p404__card"><div class="p404__badges"><span class="p404__badge p404__badge--error">${ICONS.alert}Erro</span><span class="p404__badge p404__badge--routing">${ICONS.nav}Navegação</span><span class="p404__badge p404__badge--client">${ICONS.monitor}Client-side</span></div><div class="p404__code">404</div><h1 class="p404__title">Página não encontrada</h1><p class="p404__description">A rota solicitada não existe ou foi movida. Isso pode ocorrer por um link desatualizado ou digitação incorreta na URL.</p><div class="p404__actions"><a href="/" class="p404__btn p404__btn--primary">${ICONS.home}<span>Ir para o Dashboard</span></a><button class="p404__btn p404__btn--secondary" data-action="back">${ICONS.back}<span>Voltar</span></button></div><footer class="p404__meta"><div class="p404__meta-row"><div class="p404__meta-item">${ICONS.route}<span>Rota:</span><span class="p404__meta-value">${escapeHtml(currentPath)}</span></div><div class="p404__meta-item">${ICONS.clock}<span>Timestamp:</span><span class="p404__meta-value">${timestamp}</span></div></div></footer></article></div>`;
}

function attachEvents(container: HTMLElement) {
  const backBtn = container.querySelector('[data-action="back"]');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (window.history.length > 1) { window.history.back(); } else { window.location.href = '/'; }
    });
  }
}

function mount(container: HTMLElement | null) {
  if (!container) return Promise.resolve(false);
  container.innerHTML = getTemplate();
  attachEvents(container);
  try { const path = (hasWindow && window.location) ? window.location.pathname : '/'; const t = _getPort('telemetry'); if (t && t.track) t.track('page-404:mounted', { path }); } catch (e) {}
  return Promise.resolve(true);
}

function unmount(container: HTMLElement | null) { if (container) container.innerHTML = ''; }
function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }

export { mount, unmount, info, healthCheck, MODULE_ID, VERSION, injectPorts, getPorts };
export default { mount, unmount, info, healthCheck, MODULE_ID, VERSION, injectPorts, getPorts };
