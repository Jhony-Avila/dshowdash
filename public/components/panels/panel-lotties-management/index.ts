// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-lotties-management
// PURPOSE: Painel de gerenciamento de Lotties — atribuição a componentes
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts — from '/core/runtime/ports-profiles.js'
//   PANEL_EVENTS — from '/core/runtime/events/catalog/panels.events.js'
//   state — from './state/store.js'
//   ui — from './ui/renderer.js'
//   setupEventHandlers — from './ui/events.js'
//   tracker — from './telemetry/tracker.js'
//   MODULE_ID, PANEL_ID, PANEL_NAME, AVAILABLE_LOTTIES,
//     ASSIGNABLE_COMPONENTS, metrics, loadCSS, isAuthenticated,
//     checkPanelAccess, buildHealthCheck, buildInfo — from './core/lifecycle.js'
//
// PROVIDES:
//   mount(element) — monta painel no container
//   unmount() — desmonta painel
//   injectPorts(p) / getPorts() — ports API
//   healthCheck() / info() — observabilidade
//   id, capabilities — metadados do painel
//
// RECEIVES (via init/options): element (DOM container)
// EMITS (eventos):
//   PANEL_EVENTS.READY — quando montado com sucesso
// LISTENS (eventos): nenhum
// WINDOW ACCESS: localStorage (lotties-assignments)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';
import { state } from './state/store.js';
import { ui } from './ui/renderer.js';
import { setupEventHandlers, cleanup as cleanupEvents } from './ui/events.js';
import { carregarCatalogo } from './core/catalogo.js';

// @ts-expect-error TS migration - TS2724
import { tracker } from './telemetry/tracker.js';
import { MODULE_ID as CONST_MODULE_ID, PANEL_ID, PANEL_NAME, ASSIGNABLE_COMPONENTS, metrics, loadCSS, isAuthenticated, checkPanelAccess, buildHealthCheck, buildInfo } from './core/lifecycle.js';

const VERSION = '10.0.0';
const MODULE_ID = CONST_MODULE_ID;

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const _isDocumentVisible = () => typeof document !== 'undefined' && !document.hidden;

export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const id = PANEL_ID;
const capabilities = { type: 'panel', reorderable: true, critical: false };

const PanelLottiesManagement = (() => {
  'use strict';
  let isInitialized = false;
  let container: HTMLElement | null = null;
  let unsubscribeState: (() => void) | null = null;
  let unsubscribePersist: (() => void) | null = null;
  let loadToken = 0; // invalida cargas pendentes em unmount/recarga
  let observer: MutationObserver | null = null; // o shell (bundle congelado) NÃO chama unmount() ao trocar de painel: só esvazia
  // o contentEl (panel-lifecycle-controller.unmount → contentEl.innerHTML = ''). O painel detecta a remoção do próprio DOM e
  // se desmonta sozinho — sem isso, listeners/assinaturas ficariam vivos até o próximo mount (vazamento).
  const observarDesmontagem = () => {
    if (observer || typeof MutationObserver === 'undefined') return;
    observer = new MutationObserver(() => {
      const root = container ? container.querySelector('.lotties-panel') : null;
      if (isInitialized && (!container || !container.isConnected || !root)) unmount();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };
  const render = () => {
    if (!container) return;
    ui.render(container, state.getState() as Parameters<typeof ui.render>[1]);
  };
  const subscribeToState = () => {
    unsubscribeState = state.subscribe(() => { render(); });
    unsubscribePersist = state.subscribe((s: { assignments: Record<string, string> }) => {
      try { localStorage.setItem('lotties-assignments', JSON.stringify(s.assignments)); } catch (e) { /* storage indisponível */ }
    });
  };
  /** Carrega o catálogo da fonte canônica e leva o estado a pronto/vazio/erro (nunca lança). */
  const carregar = async () => {
    const token = ++loadToken;
    state.setCatalogo('carregando');
    try {
      const cat = await carregarCatalogo();
      if (token !== loadToken || !isInitialized) return;
      state.setLotties(cat.itens);
      state.setCatalogo(cat.itens.length ? 'pronto' : 'vazio', cat.origem);
      tracker.trackCatalog(cat.itens.length ? 'pronto' : 'vazio', { itens: cat.itens.length, origem: cat.origem, versao: cat.versao });
    } catch (e) {
      if (token !== loadToken || !isInitialized) return;
      const msg = (e as Error)?.message || String(e);
      state.setCatalogo('erro', null, msg);
      tracker.trackCatalog('erro', { erro: msg });
    }
  };
  const mount = async (element: HTMLElement) => {
    if (!element) throw new Error('panel-lotties-management: mount exige o elemento de conteúdo');
    _initPorts();
    tracker.trackInit('start');
    if (!isAuthenticated()) {
      element.innerHTML = '<div class="panel-error" style="padding:2rem;text-align:center;color:#F59E0B;">Faça login para acessar este painel</div>';
      return false;
    }
    if (!checkPanelAccess()) {
      element.innerHTML = '<div class="panel-error" style="padding:2rem;text-align:center;color:#EF4444;">Sem permissão para acessar este painel</div>';
      return false;
    }
    if (isInitialized) unmount();
    container = element;
    container.setAttribute('data-panel', PANEL_ID);
    loadCSS();
    ui.renderSkeleton(container);
    state.reset();
    state.setComponents(ASSIGNABLE_COMPONENTS.map((comp) => ({ ...comp })));
    try {
      const saved = localStorage.getItem('lotties-assignments');
      if (saved) state.setAssignments(JSON.parse(saved));
    } catch (e) { /* storage indisponível ou inválido: segue sem atribuições salvas */ }
    subscribeToState();
    setupEventHandlers(container, render, () => { void carregar(); });
    isInitialized = true;
    observarDesmontagem();
    metrics.mountCount++;
    metrics.lastActivity = Date.now();
    tracker.trackMount();
    const eventBus = _getPort('eventBus');
    eventBus?.emit?.(PANEL_EVENTS.READY, { panelId: PANEL_ID, version: VERSION, timestamp: Date.now(), source: MODULE_ID });
    await carregar();
    tracker.trackInit('complete');
    return true;
  };
  const unmount = () => {
    loadToken++;
    if (observer) { observer.disconnect(); observer = null; }
    cleanupEvents();
    if (unsubscribeState) { unsubscribeState(); unsubscribeState = null; }
    if (unsubscribePersist) { unsubscribePersist(); unsubscribePersist = null; }
    if (container) { container.innerHTML = ''; container.removeAttribute('data-panel'); container = null; }
    state.reset();
    isInitialized = false;
    metrics.unmountCount++;
    tracker.trackUnmount();
  };
  const lottiesCount = () => (state.getState().lotties || []).length;
  const healthCheck = () => buildHealthCheck(isInitialized, container, lottiesCount());
  const info = () => buildInfo(isInitialized, container, state, healthCheck(), lottiesCount());
  const getStatus = () => ({
    version: VERSION,
    moduleId: MODULE_ID,
    panelId: PANEL_ID,
    panelName: PANEL_NAME,
    initialized: isInitialized,
    authenticated: isAuthenticated(),
    hasPermission: checkPanelAccess(),
    portsInitialized: Ports.isInitialized(),
    catalogo: state.getState().catalogo,
    metrics: { ...metrics }
  });
  const getVersion = () => VERSION;
  return {
    mount,
    unmount,
    healthCheck,
    info,
    getStatus,
    getVersion,
    reload: carregar,
    isInitialized: () => isInitialized,
    getPanelId: () => PANEL_ID,
    getPanelName: () => PANEL_NAME
  };
})();

if (typeof window !== 'undefined' && !isStrict()) {
  (window as any).PanelLottiesManagement = PanelLottiesManagement;
}

const { mount, unmount, healthCheck: _rawHealthCheck, info, getStatus, getVersion } = PanelLottiesManagement;
const healthCheck = () => { const hc = _rawHealthCheck(); (hc as any).isDocumentVisible = _isDocumentVisible(); return hc; };
const destroy = () => unmount();

export { VERSION, MODULE_ID, id, capabilities, mount, unmount, destroy, healthCheck, info, getStatus, getVersion };
export default PanelLottiesManagement;
