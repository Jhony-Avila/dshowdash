// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:managers:cliente360-view
// PURPOSE: Gerenciador de view Cliente360 — alterna entre list e detail
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PANEL_EVENTS — from '/core/runtime/events/catalog/panels.events.js'
//   Cliente360 — from '../cliente360/index.js'
//   resume (as resumeScheduler) — from '../scheduler/refresh.js'
//   emitLifecycle — from '../utils/lifecycle.js'
//   Favoritos — from './favoritos.js'
//
// PROVIDES:
//   init(container, refs, moduleId, version) — inicializa instancia
//   show(refs, data, moduleId, version) — exibe view detail
//   hide(refs, moduleId, version) — volta para view list
//   destroy() — destroi instancia
//   getInstance() — getter da instancia
//   getCurrentView() / setCurrentView(view) — controle de view
//   healthCheck() / info() — observabilidade
//   VERSION, MODULE_ID — constantes
//
// RECEIVES (via init/options): container (DOM), refs, moduleId, version
// EMITS (eventos):
//   PANEL_EVENTS.VIEW_CHANGED — { view: 'detail'|'list' }
// LISTENS (eventos): nenhum
// WINDOW ACCESS: nenhum
// ═══════════════════════════════════════════════════════════════
'use strict';

import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';
import { Cliente360 } from '../cliente360/index.js';
import { pause as pauseScheduler, resume as resumeScheduler } from '../scheduler/refresh.js';
import { emitLifecycle } from '../utils/lifecycle.js';
import * as Favoritos from './favoritos.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:managers:cliente360-view';

let _instance: Record<string, unknown> | null = null;
let _currentView = 'list';
const REGIONS_TO_HIDE = ['kpis', 'filters', 'table-wrapper', 'pagination', 'charts'];

const _hideRegions = (panel: HTMLElement) => { REGIONS_TO_HIDE.forEach(region => { const el = panel ? panel.querySelector(`[data-region="${region}"]`) : null; if (el) (el as HTMLElement).style.setProperty('display', 'none'); }); };

const _showRegions = (panel: HTMLElement) => { ['kpis', 'filters', 'table-wrapper', 'pagination'].forEach(region => { const el = panel ? panel.querySelector(`[data-region="${region}"]`) : null; if (el) (el as HTMLElement).style.setProperty('display', ''); }); };

export const init = (container: HTMLElement, refs: Record<string, unknown>, moduleId: string, version: string) => { if (!container) return null; _instance = new Cliente360(container, { onBack: () => { hide(refs, moduleId, version); }, onFavorito: (id: unknown) => { Favoritos.toggle(id, moduleId, version); } }) as unknown as Record<string, unknown>; return _instance; };

export const show = (refs: unknown, data: unknown, moduleId: unknown, version: unknown) => { if (!refs || !(refs as Record<string, unknown>).cliente360 || !_instance) return; pauseScheduler(); _hideRegions((refs as Record<string, unknown>).panel as HTMLElement); (_instance as Record<string, unknown> & { show: (d: unknown) => void }).show(data); _currentView = 'detail'; const c = (data as Record<string, unknown>)?.cliente || data; emitLifecycle(moduleId as string, version as string, PANEL_EVENTS.VIEW_CHANGED, { view: 'detail', clienteId: c ? ((c as Record<string, unknown>).Id_Organizacao || (c as Record<string, unknown>).id) : null }); };

export const hide = (refs: unknown, moduleId: unknown, version: unknown) => { if (!refs || !(refs as Record<string, unknown>).cliente360) return; if (_instance) { (_instance as Record<string, unknown> & { hide: () => void }).hide(); } else if ((refs as Record<string, unknown>).cliente360) { ((refs as Record<string, unknown>).cliente360 as HTMLElement).style.display = 'none'; } _showRegions((refs as Record<string, unknown>).panel as HTMLElement); _currentView = 'list'; resumeScheduler(); emitLifecycle(moduleId as string, version as string, PANEL_EVENTS.VIEW_CHANGED, { view: 'list' }); };

export const destroy = () => { if (_instance) { (_instance as Record<string, unknown> & { destroy: () => void }).destroy(); _instance = null; } _currentView = 'list'; };

export const getInstance = () => _instance;
export const getCurrentView = () => _currentView;
export const setCurrentView = (view: string) => { _currentView = view; };

export const healthCheck = () => { const checks = { panelEventsAvailable: !!PANEL_EVENTS, favoritosAvailable: !!Favoritos }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, currentView: _currentView, instanceReady: !!_instance, p25Compliant: true, timestamp: Date.now() }; };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION, view: _currentView, instanceReady: !!_instance, p25Compliant: true });

export default { init, show, hide, destroy, getInstance, getCurrentView, setCurrentView, healthCheck, info, VERSION, MODULE_ID };
