// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-10-template
// PURPOSE: Panel-10 - UI Template
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PAINEL_ID from ../core/constants.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   renderPanelStructure() — exported function
//   updateStatus() — exported function
//   updateTimestamp() — exported function
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

import { PAINEL_ID } from '../core/constants.js';

export const MODULE_ID = 'panel-10-template';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export function renderPanelStructure(container: HTMLElement) { container.innerHTML = `<div class="${PAINEL_ID}-wrapper" role="region" aria-label="Server Health Dashboard"><header class="${PAINEL_ID}-header"><div class="${PAINEL_ID}-header-title"><svg class="${PAINEL_ID}-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg><span class="${PAINEL_ID}-title">Saúde do Servidor</span></div><div class="${PAINEL_ID}-header-info"><span class="${PAINEL_ID}-status" data-status aria-live="polite">Carregando...</span><span class="${PAINEL_ID}-last-update" data-last-update>---</span></div></header><main id="${PAINEL_ID}-content" class="${PAINEL_ID}-content" aria-busy="true"></main></div>`; }

export function updateStatus(container: HTMLElement, status: string) { const el = container?.querySelector('[data-status]'); if (el) el.textContent = status; }

export function updateTimestamp(container: HTMLElement, timestamp: number | string) { const el = container?.querySelector('[data-last-update]'); if (!el || !timestamp) return; const time = new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); el.textContent = `Atualizado: ${time}`; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { templateReady: true } }; }

export default { renderPanelStructure, updateStatus, updateTimestamp, MODULE_ID, VERSION, info, healthCheck };
