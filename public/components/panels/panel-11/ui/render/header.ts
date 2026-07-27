// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-ui-render-header
// PURPOSE: Panel-11 Render Header
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   HEALTH_STATUS, ICONS from ../../core/constants.js
//   calculateHealthStatus from ../helpers.js
//
// PROVIDES:
//   renderHeader() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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

import { HEALTH_STATUS, ICONS } from '../../core/constants.js';
import { calculateHealthStatus } from '../helpers.js';

export function renderHeader(data: Record<string, unknown>, state: Record<string, unknown>) {
  const { autoRefreshEnabled, countdownValue, exportMenuOpen } = state;
  const healthStatus = calculateHealthStatus(data);
  const health = HEALTH_STATUS[healthStatus];
  const now = new Date();
  const lastUpdate = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return `
    <header class="p11-header">
      <div class="p11-identity">
        <div class="p11-identity-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20V10M18 20V4M6 20v-4"/>
          </svg>
        </div>
        <h2 class="p11-title">Resumo Geral</h2>
      </div>

      <div class="p11-health-summary" data-status-badges>
        <span class="p11-health-item p11-health-item--${healthStatus === 'healthy' ? 'ok' : healthStatus}" data-tooltip="Status do sistema">
          <span class="p11-health-dot"></span>
          <span>${health.label}</span>
        </span>
      </div>

      <div class="p11-actions">
        <div class="p11-auto-refresh" data-tooltip="Auto-refresh">
          <button class="p11-auto-toggle ${autoRefreshEnabled ? 'active' : ''}" data-action="toggle-auto-refresh" type="button" aria-label="Toggle auto-refresh"></button>
          <span class="p11-countdown ${autoRefreshEnabled ? 'active' : ''}" data-countdown>${countdownValue}</span>
        </div>
        
        <div class="p11-actions-cluster">
          <button class="p11-action-btn p11-action-btn--refresh" data-action="refresh" data-tooltip="Atualizar" type="button">
            ${ICONS.refresh}
          </button>
          <button class="p11-action-btn p11-action-btn--export" data-action="export-toggle" data-tooltip="Exportar" type="button">
            ${ICONS.download}
          </button>
        </div>
        
        <span class="p11-timestamp" data-last-update data-tooltip="Última atualização">
          ${ICONS.clock}
          <span>${lastUpdate}</span>
        </span>
      </div>
      
      <div class="p11-dropdown" data-dropdown="export" style="display:${exportMenuOpen ? 'block' : 'none'};position:absolute;top:50px;right:16px;">
        <div class="p11-dropdown-item" data-export="csv">${ICONS.download} Exportar CSV</div>
        <div class="p11-dropdown-item" data-export="json">${ICONS.download} Exportar JSON</div>
      </div>
    </header>
  `;
}

export default { renderHeader };

export const MODULE_ID = 'panels-ui-render-header';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { headerReady: true } }; }
