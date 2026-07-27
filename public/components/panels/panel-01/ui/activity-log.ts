// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/activity-log
// PURPOSE: Panel-01 - Activity Log
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ACTIVITY_TYPES — exported value
//   ActivityLogManager() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/activity-log';

export const ACTIVITY_TYPES = {
  CREATE: 'create', UPDATE: 'update', DELETE: 'delete', STATUS_CHANGE: 'status_change',
  COMMENT: 'comment', ASSIGN: 'assign', UNASSIGN: 'unassign', APPROVE: 'approve', REJECT: 'reject', VIEW: 'view'
};

export function ActivityLogManager(this: any, options: Record<string, unknown> = {}) {
  options = options || {};
  this.storageKey = options.storageKey || 'p01_activity_log';
  this.maxEntries = options.maxEntries || 500;
  this.onActivity = options.onActivity || (() => {});
  this._log = [];
  this._loadLog();
}

ActivityLogManager.prototype._loadLog = function() {
  try { const saved = localStorage.getItem(this.storageKey); if (saved) this._log = JSON.parse(saved); } catch (e) { this._log = []; }
};

ActivityLogManager.prototype._saveLog = function() {
  try { localStorage.setItem(this.storageKey, JSON.stringify(this._log)); } catch (e) {}
};

ActivityLogManager.prototype.log = function(type: string, itemId: string | number, data: Record<string, unknown>, user: Record<string, unknown>) {
  const entry = { id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, type, itemId, data: data || {}, user: user || this._getCurrentUser(), timestamp: Date.now() };
  this._log.unshift(entry);
  if (this._log.length > this.maxEntries) this._log = this._log.slice(0, this.maxEntries);
  this._saveLog();
  this.onActivity(entry);
  return entry;
};

ActivityLogManager.prototype._getCurrentUser = () => {
  try { const user = JSON.parse(localStorage.getItem('user') || '{}'); return { id: user.id || 'unknown', name: user.name || user.email || 'Usuário' }; } catch (e) { return { id: 'unknown', name: 'Usuário' }; }
};

ActivityLogManager.prototype.logCreate = function(itemId: string | number, data: Record<string, unknown>, user: Record<string, unknown>) { return this.log(ACTIVITY_TYPES.CREATE, itemId, data, user); };
ActivityLogManager.prototype.logUpdate = function(itemId: string | number, changes: unknown, user: Record<string, unknown>) { return this.log(ACTIVITY_TYPES.UPDATE, itemId, { changes }, user); };
ActivityLogManager.prototype.logDelete = function(itemId: string | number, data: Record<string, unknown>, user: Record<string, unknown>) { return this.log(ACTIVITY_TYPES.DELETE, itemId, data, user); };
ActivityLogManager.prototype.logStatusChange = function(itemId: string | number, oldStatus: string, newStatus: string, user: Record<string, unknown>) { return this.log(ACTIVITY_TYPES.STATUS_CHANGE, itemId, { oldStatus, newStatus }, user); };
ActivityLogManager.prototype.logComment = function(itemId: string | number, comment: string, user: Record<string, unknown>) { return this.log(ACTIVITY_TYPES.COMMENT, itemId, { comment }, user); };
ActivityLogManager.prototype.logAssign = function(itemId: string | number, assignee: unknown, user: Record<string, unknown>) { return this.log(ACTIVITY_TYPES.ASSIGN, itemId, { assignee }, user); };

ActivityLogManager.prototype.getLog = function(filter: Record<string, unknown>) {
  let log = this._log;
  if (filter) {
    if (filter.itemId) log = log.filter((e: Record<string, unknown>) => e.itemId === filter.itemId);
    if (filter.type) log = log.filter((e: Record<string, unknown>) => e.type === filter.type);
    if (filter.userId) log = log.filter((e: Record<string, unknown>) => e.user && (e.user as Record<string, unknown>).id === filter.userId);
    if (filter.from) log = log.filter((e: Record<string, unknown>) => (e.timestamp as number) >= (filter.from as number));
    if (filter.to) log = log.filter((e: Record<string, unknown>) => (e.timestamp as number) <= (filter.to as number));
    if (filter.limit) log = log.slice(0, filter.limit as number);
  }
  return log;
};

ActivityLogManager.prototype.getItemHistory = function(itemId: string | number) { return this.getLog({ itemId }); };

ActivityLogManager.prototype.render = function(container: HTMLElement, filter: Record<string, unknown>) {
  const self = this;
  const entries = this.getLog(filter);
  if (entries.length === 0) { container.innerHTML = '<div class="p01-activity-empty">Nenhuma atividade registrada</div>'; return; }
  let html = '<div class="p01-activity-log">';
  entries.forEach((entry: Record<string, unknown>) => { html += self._renderEntry(entry); });
  html += '</div>';
  container.innerHTML = html;
};

ActivityLogManager.prototype._renderEntry = function(entry: Record<string, unknown>) {
  const icon = this._getIcon(entry.type);
  const message = this._getMessage(entry);
  const time = this._formatTime(entry.timestamp);
  return `<div class="p01-activity-entry p01-activity-entry--${entry.type}"><div class="p01-activity-icon">${icon}</div><div class="p01-activity-content"><div class="p01-activity-message">${message}</div><div class="p01-activity-meta"><span class="p01-activity-user">${entry.user ? (entry.user as Record<string, unknown>).name : 'Sistema'}</span><span class="p01-activity-time">${time}</span></div></div></div>`;
};

ActivityLogManager.prototype._getIcon = (type: string) => {
  const icons: Record<string, string> = { create: '➕', update: '✏️', delete: '🗑️', status_change: '🔄', comment: '💬', assign: '👤', unassign: '👥', approve: '✅', reject: '❌', view: '👁️' };
  return icons[type] || '📝';
};

ActivityLogManager.prototype._getMessage = function(entry: Record<string, unknown>) {
  const id = entry.itemId;
  const data = entry.data || {};
  switch (entry.type) {
    case ACTIVITY_TYPES.CREATE: return `Criou a requisição <strong>#${id}</strong>`;
    case ACTIVITY_TYPES.UPDATE: return `Atualizou a requisição <strong>#${id}</strong>`;
    case ACTIVITY_TYPES.DELETE: return `Removeu a requisição <strong>#${id}</strong>`;
    case ACTIVITY_TYPES.STATUS_CHANGE: return `Alterou status de <strong>${(data as Record<string, unknown>).oldStatus}</strong> para <strong>${(data as Record<string, unknown>).newStatus}</strong>`;
    case ACTIVITY_TYPES.COMMENT: return `Comentou: "${this._truncate((data as Record<string, unknown>).comment as string, 50)}"`;
    case ACTIVITY_TYPES.ASSIGN: return `Atribuiu a <strong>${(data as Record<string, unknown>).assignee ? ((data as Record<string, unknown>).assignee as Record<string, unknown>).name : 'usuário'}</strong>`;
    case ACTIVITY_TYPES.APPROVE: return `Aprovou a requisição <strong>#${id}</strong>`;
    case ACTIVITY_TYPES.REJECT: return `Rejeitou a requisição <strong>#${id}</strong>`;
    default: return `Ação em <strong>#${id}</strong>`;
  }
};

ActivityLogManager.prototype._formatTime = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60000) return 'agora';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min atrás`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d atrás`;
  return new Date(timestamp).toLocaleDateString('pt-BR');
};

ActivityLogManager.prototype._truncate = (str: string, len: number) => { if (!str) return ''; return str.length > len ? `${str.substring(0, len)}...` : str; };
ActivityLogManager.prototype.clear = function() { this._log = []; this._saveLog(); };
ActivityLogManager.prototype.destroy = function() { this._log = []; };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { ActivityLogManager, ACTIVITY_TYPES, info, healthCheck };
