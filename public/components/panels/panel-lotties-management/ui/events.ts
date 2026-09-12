// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.0.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-lotties-management/events
// PURPOSE: Interação do painel: preview (lottie-web garantida pelo módulo canônico, arquivo na origem válida),
//          seleção, atribuição/remoção, recarga do catálogo, Esc fecha o preview. Todo listener é registrado
//          com cleanup — cleanup() é obrigatório no unmount (sem vazamento em abrir/fechar/reabrir).
// IMPORTS: state from ../state/store.js · tracker from ../telemetry/tracker.js · garantirLottie from ../core/catalogo.js
// PROVIDES: setupEventHandlers(), cleanup(), healthCheck(), info(), VERSION, MODULE_ID
// ═══════════════════════════════════════════════════════════════
'use strict';
import { state } from '../state/store.js';
import { tracker } from '../telemetry/tracker.js';
import { garantirLottie } from '../core/catalogo.js';
declare const lottie: { loadAnimation: (cfg: Record<string, unknown>) => { destroy: () => void } };

export const VERSION = '10.0.0';
export const MODULE_ID = 'panel-lotties-management/events';

let _lottieInstance: { destroy: () => void } | null = null;
let _cleanups: Array<() => void> = [];
let _previewToken = 0;

function _destroyPreviewInstance() {
  if (_lottieInstance) { try { _lottieInstance.destroy(); } catch { /* instância já destruída */ } _lottieInstance = null; }
}

async function _showPreview(lottieId: string, container: HTMLElement, onRender: (() => void) | null) {
  const item = state.getState().lotties.find((l) => l.id === lottieId);
  if (!item || item.disponivel === false) return;
  const token = ++_previewToken;
  _destroyPreviewInstance();
  state.setPreview(lottieId);
  tracker.trackPreview(lottieId);
  if (onRender) onRender();
  const ok = await garantirLottie();
  if (token !== _previewToken) return; // preview trocado/fechado enquanto a lib carregava
  const alvo = container.querySelector('[data-preview-container]') as HTMLElement | null;
  if (!alvo) return; // painel desmontado
  if (!ok) { alvo.innerHTML = '<p class="preview-error" role="alert">Biblioteca lottie-web indisponível (CDN bloqueada?).</p>'; return; }
  alvo.innerHTML = '';
  try {
    _lottieInstance = lottie.loadAnimation({ container: alvo, renderer: 'svg', loop: true, autoplay: true, path: item.url });
  } catch (e) {
    alvo.innerHTML = `<p class="preview-error" role="alert">Falha ao carregar a animação: ${String((e as Error).message || e)}</p>`;
  }
}

function _closePreview() { _previewToken++; _destroyPreviewInstance(); state.clearPreview(); }

function _handleSelect(lottieId: string) {
  const current = state.getState().selectedLottie;
  state.setSelectedLottie(current === lottieId ? null : lottieId);
}
function _handleAssign(componentId: string, lottieId: string) {
  if (lottieId) { state.assignLottie(componentId, lottieId); tracker.trackAssign(componentId, lottieId); }
  else state.unassignLottie(componentId);
}

export function setupEventHandlers(container: HTMLElement, onRender: (() => void) | null, onReload: (() => void) | null = null) {
  const handleClick = (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (target?.closest('[data-close-preview]')) { _closePreview(); if (onRender) onRender(); return; }
    const actionEl = target?.closest('[data-action]') as HTMLElement | null;
    const action = actionEl?.dataset.action;
    if (!action || actionEl?.tagName === 'SELECT') return;
    const lottieId = (target?.closest('[data-lottie]') as HTMLElement | null)?.dataset.lottie;
    const componentId = (target?.closest('[data-component]') as HTMLElement | null)?.dataset.component;
    switch (action) {
      case 'preview': if (lottieId) void _showPreview(lottieId, container, onRender); break;
      case 'select': if (lottieId) { _handleSelect(lottieId); if (onRender) onRender(); } break;
      case 'unassign': if (componentId) { state.unassignLottie(componentId); if (onRender) onRender(); } break;
      case 'recarregar': if (onReload) onReload(); break;
    }
  };
  const handleChange = (e: Event) => {
    const target = e.target as HTMLSelectElement | null;
    const action = (target?.closest('[data-action]') as HTMLElement | null)?.dataset.action;
    const componentId = (target?.closest('[data-component]') as HTMLElement | null)?.dataset.component;
    if (action === 'assign' && componentId && target) { _handleAssign(componentId, target.value); if (onRender) onRender(); }
  };
  const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && state.getState().previewActive) { _closePreview(); if (onRender) onRender(); } };
  container.addEventListener('click', handleClick);
  container.addEventListener('change', handleChange);
  document.addEventListener('keydown', handleKey);
  _cleanups.push(() => container.removeEventListener('click', handleClick), () => container.removeEventListener('change', handleChange), () => document.removeEventListener('keydown', handleKey));
  return _cleanups;
}

export function cleanup() {
  _previewToken++;
  _destroyPreviewInstance();
  _cleanups.forEach((fn) => { try { fn(); } catch { /* listener já removido */ } });
  _cleanups = [];
}

export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, hasInstance: !!_lottieInstance, listeners: _cleanups.length }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, cleanupCount: _cleanups.length, hasInstance: !!_lottieInstance }; }
export default { setupEventHandlers, cleanup, healthCheck, info, VERSION, MODULE_ID };
