// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-lotties-management.core.lifecycle
// PURPOSE: Panel Lotties Management - Lifecycle
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   AUTH_EVENTS, AUTH_INTENTS from /core/runtime/events/catalog/auth.events.js
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   PANEL_ID — exported value
//   PANEL_NAME — exported value
//   LOTTIES_BASE_PATH — exported value
//   AVAILABLE_LOTTIES — exported value
//   ASSIGNABLE_COMPONENTS — exported value
//   metrics — exported value
//   loadCSS() — exported function
//   isAuthenticated() — exported function
//   ensureAuth() — exported function
//   checkPanelAccess() — exported function
//   buildHealthCheck() — exported function
//   ... and 1 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   AUTH_INTENTS.LOGIN
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { AUTH_EVENTS, AUTH_INTENTS } from '/core/runtime/events/catalog/auth.events.js';
import { createPanelPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-lotties-management.core.lifecycle';
const PANEL_ID = 'panel-lotties-management';
const PANEL_NAME = 'Gerenciamento de Lotties';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const LOTTIES_BASE_PATH = '/components/animacoes/';

const AVAILABLE_LOTTIES = Object.freeze({
  'cards': { file: 'Lottie_Cards.json', name: 'Cards Animation', description: 'Animacao de cartoes para footer/brand' },
  'graph-growth': { file: 'Lottie_Graph_Growth.json', name: 'Graph Growth', description: 'Grafico com crescimento animado' },
  'loading': { file: 'TAVPl45E1F.json', name: 'Loading Spinner', description: 'Spinner de carregamento circular' },
  'loader': { file: 'Loader.json', name: 'Loader', description: 'Loader generico para preload' },
  'loading-cube': { file: 'Loading_Cube.json', name: 'Loading Cube', description: 'Cubo 3D animado para loading' }
});

const ASSIGNABLE_COMPONENTS = Object.freeze([
  { id: 'footer-brand', name: 'Footer Brand', slot: '[data-lottie="cards"]', current: 'cards' },
  { id: 'preloader', name: 'Preloader', slot: '#preloader-animation', current: null },
  { id: 'panel-loading', name: 'Panel Loading', slot: '.panel-loading-animation', current: null },
  { id: 'login-modal', name: 'Login Modal', slot: '.login-animation', current: null },
  { id: 'data-loading', name: 'Data Loading', slot: '.data-loading-animation', current: null }
]);

const metrics: { mountCount: number; unmountCount: number; previewCount: number; assignCount: number; lastActivity: number | null } = { mountCount: 0, unmountCount: 0, previewCount: 0, assignCount: 0, lastActivity: null };
let _cssLoaded = false;

function loadCSS() {
  if (_cssLoaded) return;
  const cssPath = `/components/panels/${PANEL_ID}/styles/index.css`;
  if (document.querySelector(`link[href*="${PANEL_ID}/styles"]`)) { _cssLoaded = true; return; }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssPath;
  link.setAttribute('data-panel', PANEL_ID);
  document.head.appendChild(link);
  _cssLoaded = true;
}

function isAuthenticated() {
  _initPorts();
  const authManager = _getPort('auth');
  if (authManager && authManager.isAuthenticated) return authManager.isAuthenticated();
  return !!localStorage.getItem('auth_token');
}

function ensureAuth(action: string) {
  _initPorts();
  if (!isAuthenticated()) {
    const eventBus = _getPort('eventBus');
    if (eventBus && eventBus.emit) {
      eventBus.emit(AUTH_INTENTS.LOGIN, { reason: `panel-${action}`, source: MODULE_ID });
    }
    return false;
  }
  return true;
}

function checkPanelAccess() {
  _initPorts();
  const permissions = _getPort('permissions');
  if (permissions && permissions.canAccess) return permissions.canAccess(PANEL_ID);
  return true;
}

function buildHealthCheck(isInitialized: boolean, container: HTMLElement | null) {
  const checks = { initialized: isInitialized, hasContainer: !!container, cssLoaded: _cssLoaded, lottiesAvailable: Object.keys(AVAILABLE_LOTTIES).length > 0, portsInitialized: Ports.isInitialized() };
  const values = Object.values(checks);
  const score = values.filter(Boolean).length;
  return { status: score === 5 ? 'HEALTHY' : score >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: `${score}/5`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

function buildInfo(isInitialized: boolean, container: HTMLElement | null, state: { getState?: () => unknown } | null, health: Record<string, unknown>) {
  return { moduleId: MODULE_ID, version: VERSION, panelId: PANEL_ID, panelName: PANEL_NAME, initialized: isInitialized, hasContainer: !!container, lottiesCount: Object.keys(AVAILABLE_LOTTIES).length, componentsCount: ASSIGNABLE_COMPONENTS.length, state: state && state.getState ? state.getState() : {}, health, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}

export { VERSION, MODULE_ID, PANEL_ID, PANEL_NAME, LOTTIES_BASE_PATH, AVAILABLE_LOTTIES, ASSIGNABLE_COMPONENTS, metrics, loadCSS, isAuthenticated, ensureAuth, checkPanelAccess, buildHealthCheck, buildInfo };
export default { VERSION, MODULE_ID, PANEL_ID, PANEL_NAME, LOTTIES_BASE_PATH, AVAILABLE_LOTTIES, ASSIGNABLE_COMPONENTS, metrics, loadCSS, isAuthenticated, ensureAuth, checkPanelAccess, buildHealthCheck, buildInfo, injectPorts, getPorts };
