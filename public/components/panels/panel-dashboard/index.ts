// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.6.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-dashboard
// PURPOSE: panel-dashboard/index.js - Painel de Teste (Dashboard)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   LIFECYCLE_EVENTS from /core/runtime/events/catalog/lifecycle.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   mount() — exported function
//   unmount() — exported function
//   destroy() — exported function
//   dispose() — exported function
//   getStatus() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   getVersion() — exported function
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
import { LIFECYCLE_EVENTS } from '/core/runtime/events/catalog/lifecycle.events.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-dashboard';

const SVGS = { target: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>', check: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>', zap: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>', barChart: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>' };

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const _isAuthenticated = () => { const auth = _getPort('auth'); return auth?.isAuthenticated?.() ?? false; };
const _isDocumentVisible = () => typeof document !== 'undefined' && !document.hidden;
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _debug = () => { const cfg = _getPort('config'); return cfg?.app?.debug; };
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; if (!_debug() && level === 'debug') return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn.apply(logger, ['[Dashboard]', ...args]); };

let abortController: AbortController | null = null;
let _mountedAt: number | null = null;

export const mount = (root: HTMLElement, props = {}, scope: Record<string, any> = {}) => { if (!_isAuthenticated()) { return { success: false, moduleId: MODULE_ID, error: "not-authenticated" }; } try {
  _initPorts(); _log('debug', 'Montando painel', { props, scope });
  abortController = new AbortController();
  _mountedAt = Date.now();
  const propsStr = JSON.stringify(props, null, 2);
  root.innerHTML = `<div style="padding: 2rem; background: rgba(255,255,255,0.03); border-radius: 8px;"><h2 style="color: rgba(255,255,255,0.9); margin: 0 0 1rem 0; display: flex; align-items: center; gap: 8px;">${SVGS.target} Dashboard - Painel de Teste</h2><p style="color: rgba(255,255,255,0.7); margin: 0 0 1rem 0;">O componente Main está funcionando corretamente!</p><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;"><div style="padding: 1rem; background: rgba(59,130,246,0.1); border-radius: 6px;"><div style="color: rgba(59,130,246,1); font-size: 2rem; font-weight: bold;">${SVGS.check}</div><div style="color: rgba(255,255,255,0.9); margin-top: 0.5rem;">Sistema OK</div></div><div style="padding: 1rem; background: rgba(34,197,94,0.1); border-radius: 6px;"><div style="color: rgba(34,197,94,1); font-size: 2rem; font-weight: bold;">${SVGS.zap}</div><div style="color: rgba(255,255,255,0.9); margin-top: 0.5rem;">Main Ativo</div></div><div style="padding: 1rem; background: rgba(245,158,11,0.1); border-radius: 6px;"><div style="color: rgba(245,158,11,1); font-size: 2rem; font-weight: bold;">${SVGS.barChart}</div><div style="color: rgba(255,255,255,0.9); margin-top: 0.5rem;">Pronto p/ Uso</div></div></div><div style="margin-top: 2rem; padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 6px; border-left: 3px solid rgba(59,130,246,1);"><strong style="color: rgba(255,255,255,0.9);">Parâmetros recebidos:</strong><pre style="color: rgba(255,255,255,0.6); margin: 0.5rem 0 0 0; font-size: 0.85rem;">${propsStr}</pre></div></div>`;
  scope.telemetry?.track?.(LIFECYCLE_EVENTS.MOUNTED, { props, source: MODULE_ID });
  return Promise.resolve(true);
// @ts-expect-error strict migration — TS2339
} catch(err) { _log('error', 'Mount failed', err?.message); }
};
export const unmount = () => { _log('debug', 'Desmontando painel'); if (abortController) { abortController.abort(); abortController = null; }
 _mountedAt = null; };
export const dispose = () => { _log('debug', 'Limpeza final'); unmount(); };
export const getStatus = () => ({ mounted: !!abortController, version: VERSION, moduleId: MODULE_ID, p22Compliant: true });

export const healthCheck = () => {
  const portsSnapshot = Ports.snapshot();
  const checks = { instanceExists: true, abortControllerActive: !!abortController && !abortController.signal.aborted, portsInitialized: portsSnapshot._initialized };
  const score = Object.values(checks).filter(Boolean).length;
  const maxScore = Object.keys(checks).length;
  return { status: score === maxScore ? 'HEALTHY' : 'DEGRADED', score, maxScore, scoreDisplay: `${score}/${maxScore}`, checks, version: VERSION, moduleId: MODULE_ID, p22Compliant: true, isDocumentVisible: _isDocumentVisible(), timestamp: Date.now() };
};

export const info = () => {
  const portsSnapshot = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    mounted: !!abortController,
    uptime: _mountedAt ? Date.now() - _mountedAt : 0,
    portsInitialized: portsSnapshot._initialized,
    healthCheck: healthCheck(),
    p22Compliant: true,
    timestamp: Date.now()
  };
};

export const getVersion = () => VERSION;

export const destroy = () => unmount();
export default { mount, unmount, destroy, dispose, getStatus, healthCheck, info, getVersion, injectPorts, getPorts };
