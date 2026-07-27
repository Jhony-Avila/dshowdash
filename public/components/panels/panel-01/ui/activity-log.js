const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/activity-log";
const ACTIVITY_TYPES = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  STATUS_CHANGE: "status_change",
  COMMENT: "comment",
  ASSIGN: "assign",
  UNASSIGN: "unassign",
  APPROVE: "approve",
  REJECT: "reject",
  VIEW: "view"
};
function ActivityLogManager(options = {}) {
  options = options || {};
  this.storageKey = options.storageKey || "p01_activity_log";
  this.maxEntries = options.maxEntries || 500;
  this.onActivity = options.onActivity || (() => {
  });
  this._log = [];
  this._loadLog();
}
ActivityLogManager.prototype._loadLog = function() {
  try {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) this._log = JSON.parse(saved);
  } catch (e) {
    this._log = [];
  }
};
ActivityLogManager.prototype._saveLog = function() {
  try {
    localStorage.setItem(this.storageKey, JSON.stringify(this._log));
  } catch (e) {
  }
};
ActivityLogManager.prototype.log = function(type, itemId, data, user) {
  const entry = { id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, type, itemId, data: data || {}, user: user || this._getCurrentUser(), timestamp: Date.now() };
  this._log.unshift(entry);
  if (this._log.length > this.maxEntries) this._log = this._log.slice(0, this.maxEntries);
  this._saveLog();
  this.onActivity(entry);
  return entry;
};
ActivityLogManager.prototype._getCurrentUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return { id: user.id || "unknown", name: user.name || user.email || "Usu\xE1rio" };
  } catch (e) {
    return { id: "unknown", name: "Usu\xE1rio" };
  }
};
ActivityLogManager.prototype.logCreate = function(itemId, data, user) {
  return this.log(ACTIVITY_TYPES.CREATE, itemId, data, user);
};
ActivityLogManager.prototype.logUpdate = function(itemId, changes, user) {
  return this.log(ACTIVITY_TYPES.UPDATE, itemId, { changes }, user);
};
ActivityLogManager.prototype.logDelete = function(itemId, data, user) {
  return this.log(ACTIVITY_TYPES.DELETE, itemId, data, user);
};
ActivityLogManager.prototype.logStatusChange = function(itemId, oldStatus, newStatus, user) {
  return this.log(ACTIVITY_TYPES.STATUS_CHANGE, itemId, { oldStatus, newStatus }, user);
};
ActivityLogManager.prototype.logComment = function(itemId, comment, user) {
  return this.log(ACTIVITY_TYPES.COMMENT, itemId, { comment }, user);
};
ActivityLogManager.prototype.logAssign = function(itemId, assignee, user) {
  return this.log(ACTIVITY_TYPES.ASSIGN, itemId, { assignee }, user);
};
ActivityLogManager.prototype.getLog = function(filter) {
  let log = this._log;
  if (filter) {
    if (filter.itemId) log = log.filter((e) => e.itemId === filter.itemId);
    if (filter.type) log = log.filter((e) => e.type === filter.type);
    if (filter.userId) log = log.filter((e) => e.user && e.user.id === filter.userId);
    if (filter.from) log = log.filter((e) => e.timestamp >= filter.from);
    if (filter.to) log = log.filter((e) => e.timestamp <= filter.to);
    if (filter.limit) log = log.slice(0, filter.limit);
  }
  return log;
};
ActivityLogManager.prototype.getItemHistory = function(itemId) {
  return this.getLog({ itemId });
};
ActivityLogManager.prototype.render = function(container, filter) {
  const self = this;
  const entries = this.getLog(filter);
  if (entries.length === 0) {
    container.innerHTML = '<div class="p01-activity-empty">Nenhuma atividade registrada</div>';
    return;
  }
  let html = '<div class="p01-activity-log">';
  entries.forEach((entry) => {
    html += self._renderEntry(entry);
  });
  html += "</div>";
  container.innerHTML = html;
};
ActivityLogManager.prototype._renderEntry = function(entry) {
  const icon = this._getIcon(entry.type);
  const message = this._getMessage(entry);
  const time = this._formatTime(entry.timestamp);
  return `<div class="p01-activity-entry p01-activity-entry--${entry.type}"><div class="p01-activity-icon">${icon}</div><div class="p01-activity-content"><div class="p01-activity-message">${message}</div><div class="p01-activity-meta"><span class="p01-activity-user">${entry.user ? entry.user.name : "Sistema"}</span><span class="p01-activity-time">${time}</span></div></div></div>`;
};
ActivityLogManager.prototype._getIcon = (type) => {
  const icons = { create: "\u2795", update: "\u270F\uFE0F", delete: "\u{1F5D1}\uFE0F", status_change: "\u{1F504}", comment: "\u{1F4AC}", assign: "\u{1F464}", unassign: "\u{1F465}", approve: "\u2705", reject: "\u274C", view: "\u{1F441}\uFE0F" };
  return icons[type] || "\u{1F4DD}";
};
ActivityLogManager.prototype._getMessage = function(entry) {
  const id = entry.itemId;
  const data = entry.data || {};
  switch (entry.type) {
    case ACTIVITY_TYPES.CREATE:
      return `Criou a requisi\xE7\xE3o <strong>#${id}</strong>`;
    case ACTIVITY_TYPES.UPDATE:
      return `Atualizou a requisi\xE7\xE3o <strong>#${id}</strong>`;
    case ACTIVITY_TYPES.DELETE:
      return `Removeu a requisi\xE7\xE3o <strong>#${id}</strong>`;
    case ACTIVITY_TYPES.STATUS_CHANGE:
      return `Alterou status de <strong>${data.oldStatus}</strong> para <strong>${data.newStatus}</strong>`;
    case ACTIVITY_TYPES.COMMENT:
      return `Comentou: "${this._truncate(data.comment, 50)}"`;
    case ACTIVITY_TYPES.ASSIGN:
      return `Atribuiu a <strong>${data.assignee ? data.assignee.name : "usu\xE1rio"}</strong>`;
    case ACTIVITY_TYPES.APPROVE:
      return `Aprovou a requisi\xE7\xE3o <strong>#${id}</strong>`;
    case ACTIVITY_TYPES.REJECT:
      return `Rejeitou a requisi\xE7\xE3o <strong>#${id}</strong>`;
    default:
      return `A\xE7\xE3o em <strong>#${id}</strong>`;
  }
};
ActivityLogManager.prototype._formatTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 6e4) return "agora";
  if (diff < 36e5) return `${Math.floor(diff / 6e4)} min atr\xE1s`;
  if (diff < 864e5) return `${Math.floor(diff / 36e5)}h atr\xE1s`;
  if (diff < 6048e5) return `${Math.floor(diff / 864e5)}d atr\xE1s`;
  return new Date(timestamp).toLocaleDateString("pt-BR");
};
ActivityLogManager.prototype._truncate = (str, len) => {
  if (!str) return "";
  return str.length > len ? `${str.substring(0, len)}...` : str;
};
ActivityLogManager.prototype.clear = function() {
  this._log = [];
  this._saveLog();
};
ActivityLogManager.prototype.destroy = function() {
  this._log = [];
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var activity_log_default = { ActivityLogManager, ACTIVITY_TYPES, info, healthCheck };
export {
  ACTIVITY_TYPES,
  ActivityLogManager,
  MODULE_ID,
  VERSION,
  activity_log_default as default,
  healthCheck,
  info
};
