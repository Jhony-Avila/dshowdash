// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-12.handlers.crud
// PURPOSE: Panel 12 - CRUD Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PANEL_EVENTS from /core/runtime/events/catalog/panels.events.js
//   pausePollingTemporarily, handleSessionExpired, PANEL_ID from ../core/lifecycl...
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   info() — exported function
//   healthCheck() — exported function
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
import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';
import * as api from '../services/api.js';
import * as http from '../services/http.js';
import * as table from '../ui/table.js';
import * as toast from '../ui/toast.js';
import * as panelHeader from '../ui/header.js';
import * as logger from '../utils/logger.js';
import { pausePollingTemporarily, handleSessionExpired, PANEL_ID } from '../core/lifecycle.js';

declare const store: Record<string, any>;

export const MODULE_ID = 'panel-12.handlers.crud';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const SVGS = { loader: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;animation:p12-spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>' };

export async function handleToggleJob(container: HTMLElement, button: HTMLButtonElement, row: HTMLElement, jobId: string, isActive: boolean) {
  row.setAttribute('data-busy', 'true'); row.setAttribute('aria-busy', 'true'); button.disabled = true;
  const timer = logger.startTimer('crud.toggle');
  const crudController = new AbortController();
  const result: Record<string, any> = await api.toggleJob(jobId, isActive, crudController.signal);
  timer.end({ success: result.success });
  if (http.isSessionExpired(result)) { (logger as any).warn('crud.toggle.sessionExpired', { jobId, status: result.status }); handleSessionExpired(container); _getPort('telemetry')?.track(PANEL_EVENTS.ERROR, { panelId: 'panel-12', action: 'toggle', phase: 'session-expired', jobId, status: result.status }); return; }
  if (!result.success) { (logger as any).error('crud.toggle.failed', { jobId, error: result.error }); button.disabled = false; row.removeAttribute('data-busy'); row.removeAttribute('aria-busy'); toast.show('Erro ao alterar status do job', 'error'); _getPort('telemetry')?.track(PANEL_EVENTS.ERROR, { panelId: 'panel-12', action: 'toggle', phase: 'failed', jobId, error: result.error }); return; }
  store.updateJob(jobId, { is_active: isActive }); button.disabled = false; row.removeAttribute('data-busy'); row.removeAttribute('aria-busy');
  button.textContent = isActive ? 'Desativar' : 'Ativar'; button.classList.toggle('p12-btn-success', isActive); button.classList.toggle('p12-btn-warning', !isActive);
  toast.show(`Job ${isActive ? 'ativado' : 'desativado'} com sucesso`, 'success'); pausePollingTemporarily(300);
  (logger as any).info('crud.toggle.success', { jobId, newState: isActive ? 'active' : 'inactive' }); _getPort('telemetry')?.track(PANEL_EVENTS.UPDATED, { panelId: 'panel-12', action: 'toggle', jobId, newState: isActive ? 'active' : 'inactive' });
}

export async function handleDeleteJob(container: HTMLElement, button: HTMLButtonElement, row: HTMLElement, jobId: string, jobName: string) {
  row.setAttribute('data-busy', 'true'); row.setAttribute('aria-busy', 'true'); button.disabled = true;
  button.innerHTML = `<span aria-hidden="true">${SVGS.loader}</span> Excluindo...`;
  const timer = logger.startTimer('crud.delete');
  const jobsLengthBefore = store.getJobs().length;
  const crudController = new AbortController();
  const result: Record<string, any> = await api.deleteJob(jobId, crudController.signal);
  timer.end({ success: result.success });
  if (http.isSessionExpired(result)) { (logger as any).warn('crud.delete.sessionExpired', { jobId, status: result.status }); handleSessionExpired(container); _getPort('telemetry')?.track(PANEL_EVENTS.ERROR, { panelId: 'panel-12', action: 'delete', phase: 'session-expired', jobId, status: result.status }); return; }
  if (!result.success) { (logger as any).error('crud.delete.failed', { jobId, jobName, error: result.error }); button.textContent = 'Excluir'; button.disabled = false; row.removeAttribute('data-busy'); row.removeAttribute('aria-busy'); toast.show('Erro ao excluir job', 'error'); _getPort('telemetry')?.track(PANEL_EVENTS.ERROR, { panelId: 'panel-12', action: 'delete', phase: 'failed', jobId, error: result.error }); return; }
  store.deleteJob(jobId);
  (logger as any).info('crud.delete.success', { jobId, jobName, jobsLengthBefore, jobsLengthAfter: store.getJobs().length });
  row.style.opacity = '0'; row.style.transform = 'translateX(-20px)'; row.style.transition = 'all 0.3s ease';
  setTimeout(() => { row.remove(); const hasFilters = store.getSearchTerm() || store.getFilters().status !== '' || store.getFilters().type !== ''; const filtered = store.getFilteredAndSorted(); panelHeader.updateFilterCounts(container); if (filtered.length === 0) (table as any).renderEmpty(container, hasFilters, PANEL_ID); }, 300);
  toast.show(`Job "${jobName}" excluído com sucesso`, 'success'); pausePollingTemporarily(300); _getPort('telemetry')?.track(PANEL_EVENTS.UPDATED, { panelId: 'panel-12', action: 'delete', jobId });
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { crudReady: true, portsInitialized: Ports.isInitialized() } }; }
