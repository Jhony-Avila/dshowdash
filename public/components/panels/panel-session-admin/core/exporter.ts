// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P25-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-session-admin-core-exporter
// PURPOSE: Panel Session Admin - Export Functions
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   showToast from ./helpers.js
//   getFilteredWithInline from ./filters.js
//   tracker from ../telemetry/tracker.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   exportCSV() — exported function
//   exportJSON() — exported function
//   printSessions() — exported function
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

import * as Exporter from '../utils/exporter.js';
import tracker from '../telemetry/tracker.js';
import { showToast } from './helpers.js';
import { getFilteredWithInline } from './filters.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels-panel-session-admin-core-exporter';

export function exportCSV() {
  const sessions = getFilteredWithInline();

  const result = Exporter.exportToCSV(sessions);
  if (result.ok) {
    showToast(`Exportado ${result.count} sessão(ões)`);
    // @ts-expect-error strict migration — TS2345
    tracker.exportCSV(result.count);
  } else {
    showToast('Erro ao exportar', 'error');
  }
  return result;
}

export function exportJSON() {
  const sessions = getFilteredWithInline();

  const result = Exporter.exportToJSON(sessions);
  if (result.ok) {
    showToast(`Exportado ${result.count} sessão(ões)`);
    // @ts-expect-error strict migration — TS2345
    tracker.exportJSON(result.count);
  } else {
    showToast('Erro ao exportar', 'error');
  }
  return result;
}

export async function copyToClipboard() {
  const sessions = getFilteredWithInline();
  const result = await Exporter.copyToClipboard(sessions, 'text');

  if ((result as Record<string, unknown>).ok) {
    showToast('Copiado!');
    tracker.exportClipboard((result as Record<string, unknown>).count as number);
  } else {
    showToast('Erro ao copiar', 'error');
  }
  return result;
}

export function printSessions() {
  const sessions = getFilteredWithInline();
  const result = Exporter.print(sessions, 'Relatório de Sessões');
  if (result.ok) {
    // @ts-expect-error strict migration — TS2345
    tracker.exportPrint(result.count);
  } else if (result.error === 'POPUP_BLOCKED') {
    showToast('Popup bloqueado', 'warning');
  }
  return result;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, p25Compliant: true }; }

export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { exporterReady: true }, p25Compliant: true }; }

export default { exportCSV, exportJSON, copyToClipboard, printSessions, info, healthCheck };
