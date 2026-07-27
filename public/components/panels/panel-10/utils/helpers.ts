// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-10-helpers
// PURPOSE: Panel-10 - Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PAINEL_ID, THRESHOLDS from ../core/constants.js
//   PANEL_EVENTS from /core/runtime/events/catalog/panels.events.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   ERROR_MESSAGES — exported value
//   getErrorMessage() — exported function
//   createThresholdChecker() — exported function
//   loadCSS() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).AssetLoader
// ═══════════════════════════════════════════════════════════════
'use strict';

import { PAINEL_ID, THRESHOLDS } from '../core/constants.js';
import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';

export const MODULE_ID = 'panel-10-helpers';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Autenticação necessária',
  REQUEST_ABORTED: 'Requisição cancelada',
  REQUEST_TIMEOUT: 'Tempo esgotado',
  NETWORK_ERROR: 'Erro de rede',
  HTTP_500: 'Erro interno do servidor',
  HTTP_404: 'Endpoint não encontrado',
  CIRCUIT_BREAKER_OPEN: 'Serviço temporariamente indisponível'
};

export function getErrorMessage(errorCode: string) {
  return ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES] || 'Erro ao carregar dados';
}

export function createThresholdChecker(emit: (event: string, data: Record<string, unknown>) => void) {
  return (data: Record<string, unknown>) => {
    const d = data as { data?: { local?: Record<string, number> }; local?: Record<string, number> };
    const local = d?.data?.local || d?.local;
    if (!local) return;

    if (local.cpu_percent >= THRESHOLDS.CPU_CRITICAL) {
      emit(PANEL_EVENTS.METRIC_CPU_CRITICAL, { value: local.cpu_percent });
    } else if (local.cpu_percent >= THRESHOLDS.CPU_WARNING) {
      emit(PANEL_EVENTS.METRIC_CPU_WARNING, { value: local.cpu_percent });
    }

    if (local.ram_percent >= THRESHOLDS.RAM_CRITICAL) {
      emit(PANEL_EVENTS.METRIC_RAM_CRITICAL, { value: local.ram_percent });
    } else if (local.ram_percent >= THRESHOLDS.RAM_WARNING) {
      emit(PANEL_EVENTS.METRIC_RAM_WARNING, { value: local.ram_percent });
    }

    if (local.disk_percent >= THRESHOLDS.DISK_CRITICAL) {
      emit(PANEL_EVENTS.METRIC_DISK_CRITICAL, { value: local.disk_percent });
    } else if (local.disk_percent >= THRESHOLDS.DISK_WARNING) {
      emit(PANEL_EVENTS.METRIC_DISK_WARNING, { value: local.disk_percent });
    }
  };
}

export function loadCSS(cssPath: string) {
  if (document.querySelector(`link[href*="${PAINEL_ID}/styles/index.css"]`)) return;

  if ((window as any).AssetLoader?.loadCSS) {
    (window as any).AssetLoader.loadCSS(cssPath);
  } else {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssPath;
    link.setAttribute('data-panel', PAINEL_ID);
    document.head.appendChild(link);
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { helpersReady: true } }; }

export default { getErrorMessage, createThresholdChecker, loadCSS, MODULE_ID, VERSION, ERROR_MESSAGES, info, healthCheck };
