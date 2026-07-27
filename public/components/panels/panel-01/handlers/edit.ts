// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:handlers:edit
// PURPOSE: Panel-01 - Edit Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   apiClient from ../services/api.js
//   store from ../state/store.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   applyView() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

import { apiClient } from '../services/api.js';
import { store } from '../state/store.js';
import * as Toast from '../ui/toast.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01:handlers:edit';

export async function saveInlineEdit(ctx: Record<string, unknown>, data: { field: string; newValue: unknown; rowId: string | number }) {
  try {
    const updateData: Record<string, unknown> = {};
    updateData[data.field] = data.newValue;
    await apiClient.updateRequisicao(data.rowId, updateData);
    Toast.success('Salvo!');
    if (ctx.haptic) (ctx.haptic as Record<string, () => void>).success();
  } catch (error) {
    Toast.error('Erro ao salvar');
    if (ctx.haptic) (ctx.haptic as Record<string, () => void>).error();
  }
}

export async function saveBulkEdit(ctx: Record<string, unknown>, data: { id: string | number; changes: Record<string, unknown> }) {
  try {
    await apiClient.updateRequisicao(data.id, data.changes);
    return true;
  } catch (error) {
    throw error;
  }
}

export function applyView(ctx: Record<string, unknown>, config: { filters?: Record<string, unknown>; sort?: { field: string; order: string }; density?: string }) {
  if (config.filters) {
    Object.entries(config.filters).forEach(entry => { store.setFilter(entry[0], entry[1]); });
  }
  if (config.sort) store.setSort(config.sort.field, config.sort.order);
  if (config.density) (ctx.setDensity as (d: string) => void)(config.density);
  (ctx.loadRequisicoes as () => void)();
  Toast.success('View aplicada');
}

export async function duplicateItem(ctx: Record<string, unknown>, id: string | number) {
  if (!ctx.duplicateManager) return;
  const state = store.getState();
  const item = state.requisicoes.find((r: Record<string, unknown>) => String(r.id || r.Id_Requisicao) === String(id));
  if (item) {
    try {
      await (ctx.duplicateManager as Record<string, (...args: unknown[]) => Promise<void>>).execute(item, apiClient);
      if (ctx.haptic) (ctx.haptic as Record<string, () => void>).success();
    } catch (error) {
      Toast.error((error as Error).message);
      if (ctx.haptic) (ctx.haptic as Record<string, () => void>).error();
    }
  }
}

export function healthCheck() {
  const checks = { apiClientAvailable: !!apiClient, storeAvailable: !!store };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, p25Compliant: true, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, p25Compliant: true }; }

export default { saveInlineEdit, saveBulkEdit, applyView, duplicateItem, healthCheck, info, VERSION, MODULE_ID };
