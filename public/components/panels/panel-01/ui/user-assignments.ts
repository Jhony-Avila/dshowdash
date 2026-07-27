// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/user-assignments
// PURPOSE: Panel-01 - User Assignments
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   UserAssignmentsManager() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'input'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/user-assignments';

const SVGS = { check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="20 6 9 17 4 12"/></svg>' };

export function UserAssignmentsManager(this: any, options: Record<string, unknown> = {}) {
  this.users = (options.users as unknown[]) || [];
  this.onAssign = (options.onAssign as (...args: unknown[]) => unknown) || (() => {});
  this.onUnassign = (options.onUnassign as (...args: unknown[]) => unknown) || (() => {});
  this.onChange = (options.onChange as (...args: unknown[]) => unknown) || (() => {});
  this._assignments = new Map();
  this._modal = null;
}

UserAssignmentsManager.prototype.setUsers = function(users: unknown[]) { this.users = users; };

UserAssignmentsManager.prototype.setAssignments = function(data: Record<string, unknown>[]) {
  const self = this;
  this._assignments.clear();
  data.forEach((item: Record<string, unknown>) => {
    const id = item.id || item.Id_Requisicao;
    if (item.assignee || item.responsavel) {
      self._assignments.set(String(id), item.assignee || item.responsavel);
    }
  });
};

UserAssignmentsManager.prototype.assign = function(itemId: string | number, user: Record<string, unknown>) {
  this._assignments.set(String(itemId), user);
  this.onAssign(itemId, user);
  this.onChange(itemId, user, 'assign');
};

UserAssignmentsManager.prototype.unassign = function(itemId: string | number) {
  const user = this._assignments.get(String(itemId));
  this._assignments.delete(String(itemId));
  this.onUnassign(itemId, user);
  this.onChange(itemId, null, 'unassign');
};

UserAssignmentsManager.prototype.getAssignment = function(itemId: string | number) {
  return this._assignments.get(String(itemId)) || null;
};

UserAssignmentsManager.prototype.isAssigned = function(itemId: string | number) {
  return this._assignments.has(String(itemId));
};

UserAssignmentsManager.prototype.getAssignedTo = function(userId: string) {
  const items: string[] = [];
  this._assignments.forEach((user: Record<string, unknown>, itemId: string) => {
    if (user?.id === userId) items.push(itemId);
  });
  return items;
};

UserAssignmentsManager.prototype.openModal = function(itemId: string | number, currentAssignee: Record<string, unknown> | null) {
  const self = this;
  this._modal = document.createElement('div');
  this._modal.className = 'p01-modal-overlay';
  this._modal.innerHTML = this._renderModal(itemId, currentAssignee);
  document.body.appendChild(this._modal);
  this._bindEvents(itemId);
  setTimeout(() => self._modal.classList.add('open'), 10);
};

UserAssignmentsManager.prototype._renderModal = function(itemId: string | number, currentAssignee: Record<string, unknown> | null) {
  const self = this;
  const usersHtml = this.users.map((user: Record<string, unknown>) => {
    const isSelected = currentAssignee?.id === user.id;
    const selectedClass = isSelected ? ' p01-user-selected' : '';
    const avatar = user.avatar || self._getInitials(user.name as string);
    return `<div class="p01-user-item${selectedClass}" data-user-id="${user.id}"><div class="p01-user-avatar">${user.avatar ? `<img src="${user.avatar}">` : avatar}</div><div class="p01-user-info"><span class="p01-user-name">${user.name}</span><span class="p01-user-email">${user.email || ''}</span></div>${isSelected ? `<span class="p01-user-check">${SVGS.check}</span>` : ''}</div>`;
  }).join('');
  return `<div class="p01-modal p01-modal--sm"><div class="p01-modal-header"><h2>Atribuir Responsável</h2><button class="p01-modal-close" data-action="close">&times;</button></div><div class="p01-modal-body"><div class="p01-assign-search"><input type="text" class="p01-input" data-input="search" placeholder="Buscar usuário..."></div><div class="p01-assign-current">${currentAssignee ? `<div class="p01-assign-current-user"><span>Atribuído a: <strong>${currentAssignee.name}</strong></span><button class="p01-btn p01-btn--secondary p01-btn--sm" data-action="unassign">Remover</button></div>` : '<span class="p01-assign-none">Nenhum responsável atribuído</span>'}</div><div class="p01-users-list">${usersHtml}</div></div><div class="p01-modal-footer"><button class="p01-btn p01-btn--secondary" data-action="close">Cancelar</button></div></div>`;
  void itemId;
};

UserAssignmentsManager.prototype._bindEvents = function(itemId: string | number) {
  const self = this;
  this._modal.querySelector('[data-input="search"]').addEventListener('input', (e: Event) => {
    const query = (e.target as HTMLInputElement).value.toLowerCase();
    self._modal.querySelectorAll('.p01-user-item').forEach((item: Element) => {
      const name = (item.querySelector('.p01-user-name') as HTMLElement).textContent?.toLowerCase() || '';
      const email = (item.querySelector('.p01-user-email') as HTMLElement).textContent?.toLowerCase() || '';
      const visible = name.indexOf(query) !== -1 || email.indexOf(query) !== -1;
      (item as HTMLElement).style.display = visible ? '' : 'none';
    });
  });
  this._modal.querySelectorAll('.p01-user-item').forEach((item: Element) => {
    item.addEventListener('click', () => {
      const userId = (item as HTMLElement).dataset.userId;
      const user = self.users.find((u: Record<string, unknown>) => u.id === userId);
      if (user) { self.assign(itemId, user); self.closeModal(); }
    });
  });
  const unassignBtn = this._modal.querySelector('[data-action="unassign"]');
  if (unassignBtn) unassignBtn.addEventListener('click', () => { self.unassign(itemId); self.closeModal(); });
  this._modal.querySelectorAll('[data-action="close"]').forEach((btn: Element) => btn.addEventListener('click', () => self.closeModal()));
  this._modal.addEventListener('click', (e: MouseEvent) => { if ((e.target as Element).classList.contains('p01-modal-overlay')) self.closeModal(); });
};

UserAssignmentsManager.prototype._getInitials = (name: string) => {
  if (!name) return '?';
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
};

UserAssignmentsManager.prototype.renderBadge = function(itemId: string | number) {
  const user = this.getAssignment(itemId) as Record<string, unknown> | null;
  if (!user) return '';
  const initials = this._getInitials(user.name as string);
  return `<span class="p01-assign-badge" title="${user.name}">${user.avatar ? `<img src="${user.avatar}">` : initials}</span>`;
};

UserAssignmentsManager.prototype.closeModal = function() {
  const self = this;
  if (this._modal) {
    this._modal.classList.remove('open');
    setTimeout(() => { if (self._modal?.parentNode) self._modal.parentNode.removeChild(self._modal); self._modal = null; }, 200);
  }
};

UserAssignmentsManager.prototype.getStats = function() {
  const stats: { total: number; byUser: Record<string, unknown> } = { total: this._assignments.size, byUser: {} };
  this._assignments.forEach((user: Record<string, unknown>) => {
    if (user) {
      const id = user.id as string;
      if (!stats.byUser[id]) stats.byUser[id] = { user, count: 0 };
      (stats.byUser[id] as { count: number }).count++;
    }
  });
  return stats;
};

UserAssignmentsManager.prototype.destroy = function() { this.closeModal(); this._assignments.clear(); };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { UserAssignmentsManager, info, healthCheck };
