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
import { setupEventHandlers } from './ui/events.js';

// @ts-expect-error TS migration - TS2724
import { tracker } from './telemetry/tracker.js';
import { MODULE_ID as CONST_MODULE_ID, PANEL_ID, PANEL_NAME, AVAILABLE_LOTTIES, ASSIGNABLE_COMPONENTS, metrics, loadCSS, isAuthenticated, checkPanelAccess, buildHealthCheck, buildInfo } from './core/lifecycle.js';

declare const cleanupEvents: () => void;
const VERSION = '9.3.0-P2-ENTERPRISE';
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

  const render = () => {
    if (!container) return;
    ui.render(container, state.getState());
  };

  const subscribeToState = () => {
    unsubscribeState = state.subscribe(() => { render(); });
  };

  const mount = (element: HTMLElement) => {
    _initPorts();
    tracker.trackInit('start');
    if (!isAuthenticated()) {
      element.innerHTML = '<div class="panel-error" style="padding:2rem;text-align:center;color:#F59E0B;">Faça login para acessar este painel</div>';
      return Promise.resolve(false);
    }
    if (!checkPanelAccess()) {
      element.innerHTML = '<div class="panel-error" style="padding:2rem;text-align:center;color:#EF4444;">Sem permissão para acessar este painel</div>';
      return Promise.resolve(false);
    }
    if (isInitialized) unmount();
    container = element;
    container.setAttribute('data-panel', PANEL_ID);
    loadCSS();
    ui.renderSkeleton(container);
    const _lotties = AVAILABLE_LOTTIES as Record<string, { file: string; name: string; description: string }>;
    const lottiesArr = Object.keys(AVAILABLE_LOTTIES).map((key) => ({ id: key, ..._lotties[key] }));
    state.setLotties(lottiesArr);
    const componentsArr = ASSIGNABLE_COMPONENTS.map((comp) => ({ ...comp }));
    state.setComponents(componentsArr);
    try {
      const saved = localStorage.getItem('lotties-assignments');
      if (saved) state.setAssignments(JSON.parse(saved));
    } catch (e) {}
    subscribeToState();
    setupEventHandlers(container, render);
    render();
    state.subscribe((s: { assignments: Record<string, string> }) => {
      try { localStorage.setItem('lotties-assignments', JSON.stringify(s.assignments)); } catch (e) {}
    });
    isInitialized = true;
    metrics.mountCount++;
    metrics.lastActivity = Date.now();
    tracker.trackMount();
    const eventBus = _getPort('eventBus');
    eventBus?.emit?.(PANEL_EVENTS.READY, { panelId: PANEL_ID, version: VERSION, timestamp: Date.now(), source: MODULE_ID });
    tracker.trackInit('complete');
    return Promise.resolve(true);
  };

  const unmount = () => {
    cleanupEvents();
    if (unsubscribeState) { unsubscribeState(); unsubscribeState = null; }
    if (container) { container.innerHTML = ''; container = null; }
    state.reset();
    isInitialized = false;
    metrics.unmountCount++;
    tracker.trackUnmount();
  };

  const healthCheck = () => buildHealthCheck(isInitialized, container);
  const info = () => buildInfo(isInitialized, container, state, healthCheck());

  const getStatus = () => ({
    version: VERSION,
    moduleId: MODULE_ID,
    panelId: PANEL_ID,
    panelName: PANEL_NAME,
    initialized: isInitialized,
    authenticated: isAuthenticated(),
    hasPermission: checkPanelAccess(),
    portsInitialized: Ports.isInitialized(),
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
