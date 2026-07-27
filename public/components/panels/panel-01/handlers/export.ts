// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01.handlers.export
// PURPOSE: Panel-01 - Export Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   apiClient from ../services/api.js
//   store from ../state/store.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   exportCSV() — exported function
//   print() — exported function
//   printSingle() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.open
//   window.print
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { apiClient } from '../services/api.js';
import { store } from '../state/store.js';
import * as Toast from '../ui/toast.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01.handlers.export';

const hasWindow = typeof window !== 'undefined';
const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger') as Record<string, ((...a: unknown[]) => void) | undefined> | null; if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') logger.error?.(prefix, ...args); else if (level === 'debug') logger.debug?.(prefix, ...args); else logger.info?.(prefix, ...args); };

export function exportCSV(ctx: Record<string, unknown>) { const state = store.getState(); const url = apiClient.getExportUrl(state.filters); if (hasWindow) window.open(url, '_blank'); if (ctx.telemetry) (ctx.telemetry as Record<string, (...a: unknown[]) => void>).trackInteraction('export'); Toast.success('Exportacao iniciada'); }

export async function exportPDF(ctx: Record<string, unknown>) { if (!ctx.pdfExporter) return; const state = store.getState(); const columns = [{ id: 'id', label: 'ID', width: 20 }, { id: 'descricao', label: 'Descricao', width: 80 }, { id: 'fornecedor', label: 'Fornecedor', width: 50 }, { id: 'total', label: 'Valor', width: 30 }, { id: 'data_requisicao', label: 'Data', width: 25 }]; await (ctx.pdfExporter as Record<string, (...a: unknown[]) => Promise<void>>).exportTable(state.requisicoes, columns, 'requisicoes.pdf'); Toast.success('PDF exportado'); if (ctx.haptic) (ctx.haptic as Record<string, () => void>).success(); }

export async function exportSinglePDF(ctx: Record<string, unknown>, id: string | number) { if (!ctx.pdfExporter) return; const state = store.getState(); const item = state.requisicoes.find((r: Record<string, unknown>) => String(r.id || r.Id_Requisicao) === String(id)); if (item) { await (ctx.pdfExporter as Record<string, (...a: unknown[]) => Promise<void>>).exportSingle(item, `requisicao_${id}.pdf`); Toast.success('PDF exportado'); } }

export function print(ctx: Record<string, unknown>) { if (hasWindow) window.print(); if (ctx.telemetry) (ctx.telemetry as Record<string, (...a: unknown[]) => void>).trackInteraction('print'); }
export function printSingle(ctx: Record<string, unknown>, id: string | number) { _log('debug', 'Print single', JSON.stringify({ id })); }

export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }

export default { exportCSV, exportPDF, exportSinglePDF, print, printSingle, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
