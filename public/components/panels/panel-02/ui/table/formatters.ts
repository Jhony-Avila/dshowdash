// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-02/ui/table/formatters
// PURPOSE: Panel-02 Table Formatters
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TYPE_ICONS from ./constants.js
//
// PROVIDES:
//   getTypeIcon() — exported function
//   getTypeClass() — exported function
//   getStatusFromHealth() — exported function
//   getRateClass() — exported function
//   getRowClass() — exported function
//   inferHealthStatus() — exported function
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

import { TYPE_ICONS } from './constants.js';

export function getTypeIcon(type: string) {
  return (TYPE_ICONS as Record<string, string>)[type] || TYPE_ICONS['API'];
}

export function getTypeClass(type: string) {
  const map: Record<string, string> = { 'PYTHON': 'type-python', 'SHELL': 'type-shell', 'PHP': 'type-php', 'API': 'type-api', 'CRON': 'type-shell' };
  return map[type] || 'type-api';
}

export function getStatusFromHealth(healthStatus: string, isRunning: boolean) {
  if (isRunning) return { className: 'status-running', text: 'Rodando' };
  const statusMap: Record<string, { className: string; text: string }> = {
    'healthy': { className: 'status-active', text: 'Saudavel' },
    'warning': { className: 'status-warning', text: 'Atencao' },
    'critical': { className: 'status-error', text: 'Critico' },
    'inactive': { className: 'status-inactive', text: 'Inativo' }
  };
  return statusMap[healthStatus] || statusMap['inactive'];
}

export function getRateClass(rate: number, sla: Record<string, Record<string, number>> | null | undefined) {
  const threshold = sla?.success_rate?.threshold || 95;
  if (rate >= threshold) return 'high';
  if (rate >= 80) return 'medium';
  return 'low';
}

export function getRowClass(healthStatus: string) {
  const classMap: Record<string, string> = { 'critical': 'row-error', 'warning': 'row-warning', 'inactive': 'row-inactive', 'healthy': '' };
  return classMap[healthStatus] || '';
}

export function inferHealthStatus(job: Record<string, unknown>) {
  const isActive = job.is_active == 1;
  const errors = parseInt(String(job.error_count || 0));
  const successRate = parseFloat(String(job.success_rate || 100));
  if (!isActive) return 'inactive';
  if (errors > 5 || successRate < 80) return 'critical';
  if (errors > 0 || successRate < 95) return 'warning';
  return 'healthy';
}

export default { getTypeIcon, getTypeClass, getStatusFromHealth, getRateClass, getRowClass, inferHealthStatus };

export const MODULE_ID = 'panel-02/ui/table/formatters';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { formattersReady: true } }; }
