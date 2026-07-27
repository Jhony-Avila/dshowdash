// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-admin-controller:bulk-operations
// PURPOSE: UARPS Admin - Bulk Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PERMISSIONS_EVENTS from /core/runtime/events/catalog/permissions.events.js
//   Api from ../api/client.js
//   Telemetry from ../telemetry/tracker.js
//   emit, showToast from ./ports.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   toggleBulkMode() — exported function
//   toggleBulkItem() — exported function
//   selectAllInArea() — exported function
//   clearBulk() — exported function
//   bulkGrant() — exported function
//   bulkRevoke() — exported function
//   grantAllTriggers() — exported function
//   revokeAllTriggers() — exported function
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

import { PERMISSIONS_EVENTS } from '/core/runtime/events/catalog/permissions.events.js';
import { Api } from '../api/client.js';
import { Telemetry } from '../telemetry/tracker.js';
import { emit, showToast } from './ports.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-admin-controller:bulk-operations';

interface BulkStore {
  toggleBulkMode(): void;
  isBulkMode(): boolean;
  toggleBulkItem(id: string): void;
  getTriggers(): Array<{ id: string; area?: string; [key: string]: unknown }>;
  selectAllBulk(ids: string[]): void;
  clearBulk(): void;
  getSelectedUserId(): string | number | null;
  getBulkCount(): number;
  getBulkSelection(): Set<unknown>;
  bulkGrant(userId: string | number): number;
  bulkRevoke(userId: string | number): number;
  grantAllTriggers(userId: string | number): number;
  revokeAllTriggers(userId: string | number): number;
}

interface ConfirmOptions {
  title: string;
  message: string;
  requireReason: boolean;
}

interface ConfirmResult {
  confirmed: boolean;
  reason?: string;
}

const SVGS = { warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' };

export function toggleBulkMode(store: BulkStore) { store.toggleBulkMode(); Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: 'bulk:mode:toggle', enabled: store.isBulkMode() }); }
export function toggleBulkItem(store: BulkStore, triggerId: string) { store.toggleBulkItem(triggerId); }
export function selectAllInArea(store: BulkStore, area: string) { const triggers = store.getTriggers().filter((t) => t.area === area); store.selectAllBulk(triggers.map((t) => t.id)); Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: 'bulk:select-area', area, count: triggers.length }); }
export function clearBulk(store: BulkStore) { store.clearBulk(); }

export function bulkGrant(store: BulkStore, requestConfirmation: (opts: ConfirmOptions) => Promise<ConfirmResult | false>) {
  const userId = store.getSelectedUserId();
  const count = store.getBulkCount();
  if (!userId || count === 0) return Promise.resolve();
  return requestConfirmation({ title: 'Liberar Triggers em Massa', message: `Deseja liberar ${count} triggers para este usuário?`, requireReason: false }).then((confirmed: ConfirmResult | false) => {
    if (!confirmed) return;
    Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: 'bulk:grant:start', userId, count });
    const selection = Array.from(store.getBulkSelection()) as string[];
    return Api.bulkSetTriggers(userId, selection, true).then(res => {
      if (res.success) { const granted = store.bulkGrant(userId); showToast('success', 'Permissões concedidas', `${granted} triggers liberados`); emit(PERMISSIONS_EVENTS.CHANGED, { userId, type: 'bulk-grant', count: granted }, MODULE_ID); Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: 'bulk:grant:success', userId, count: granted }); }
    });
  }).catch((error: Error) => { showToast('error', 'Erro', error.message); Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: 'bulk:grant:error', error: error.message }); });
}

export function bulkRevoke(store: BulkStore, requestConfirmation: (opts: ConfirmOptions) => Promise<ConfirmResult | false>) {
  const userId = store.getSelectedUserId();
  const count = store.getBulkCount();
  if (!userId || count === 0) return Promise.resolve();
  return requestConfirmation({ title: 'Revogar Triggers em Massa', message: `Deseja revogar ${count} triggers deste usuário?`, requireReason: true }).then((confirmed: ConfirmResult | false) => {
    if (!confirmed) return;
    Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: 'bulk:revoke:start', userId, count, reason: (confirmed as ConfirmResult).reason });
    const selection = Array.from(store.getBulkSelection()) as string[];
    return Api.bulkSetTriggers(userId, selection, false).then(res => {
      if (res.success) { const revoked = store.bulkRevoke(userId); showToast('success', 'Permissões revogadas', `${revoked} triggers removidos`); emit(PERMISSIONS_EVENTS.CHANGED, { userId, type: 'bulk-revoke', count: revoked, reason: (confirmed as ConfirmResult).reason }, MODULE_ID); Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: 'bulk:revoke:success', userId, count: revoked }); }
    });
  }).catch((error: Error) => { showToast('error', 'Erro', error.message); Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: 'bulk:revoke:error', error: error.message }); });
}

export function grantAllTriggers(store: BulkStore, area: string | null, requestConfirmation: (opts: ConfirmOptions) => Promise<ConfirmResult | false>) {
  const userId = store.getSelectedUserId();
  if (!userId) return Promise.resolve();
  const triggers = area ? store.getTriggers().filter((t) => t.area === area) : store.getTriggers();
  return requestConfirmation({ title: 'Liberar Todos os Triggers', message: `Deseja liberar ${triggers.length} triggers${area ? ` da área ${area}` : ''}?`, requireReason: false }).then((confirmed: ConfirmResult | false) => {
    if (!confirmed) return;
    Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: 'triggers:grant-all:start', userId, area, count: triggers.length });
    return Api.bulkSetTriggers(userId, triggers.map((t) => t.id), true).then(res => {
      if (res.success) { const count = store.grantAllTriggers(userId); showToast('success', 'Permissões concedidas', `${count} triggers liberados`); emit(PERMISSIONS_EVENTS.CHANGED, { userId, type: 'grant-all', count }, MODULE_ID); }
    });
  }).catch((error: Error) => { showToast('error', 'Erro', error.message); });
}

export function revokeAllTriggers(store: BulkStore, area: string | null, requestConfirmation: (opts: ConfirmOptions) => Promise<ConfirmResult | false>) {
  const userId = store.getSelectedUserId();
  if (!userId) return Promise.resolve();
  const triggers = area ? store.getTriggers().filter((t) => t.area === area) : store.getTriggers();
  return requestConfirmation({ title: `${SVGS.warning} Revogar Todos os Triggers`, message: `ATENÇÃO: Esta ação irá remover ${triggers.length} triggers${area ? ` da área ${area}` : ''}. Esta é uma operação crítica.`, requireReason: true }).then((confirmed: ConfirmResult | false) => {
    if (!confirmed) return;
    Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: 'triggers:revoke-all:start', userId, area, reason: (confirmed as ConfirmResult).reason });
    return Api.bulkSetTriggers(userId, triggers.map((t) => t.id), false).then(res => {
      if (res.success) { const count = store.revokeAllTriggers(userId); showToast('success', 'Permissões revogadas', `${count} triggers removidos`); emit(PERMISSIONS_EVENTS.CHANGED, { userId, type: 'revoke-all', count, reason: (confirmed as ConfirmResult).reason }, MODULE_ID); }
    });
  }).catch((error: Error) => { showToast('error', 'Erro', error.message); });
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { apiAvailable: typeof Api !== 'undefined', telemetryAvailable: typeof Telemetry !== 'undefined' }, p25Compliant: true, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, p25Compliant: true }; }

export default { toggleBulkMode, toggleBulkItem, selectAllInArea, clearBulk, bulkGrant, bulkRevoke, grantAllTriggers, revokeAllTriggers, healthCheck, info };
