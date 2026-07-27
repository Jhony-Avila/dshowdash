const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/user-assignments";
const SVGS = { check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="20 6 9 17 4 12"/></svg>' };
function UserAssignmentsManager(options = {}) {
  this.users = options.users || [];
  this.onAssign = options.onAssign || (() => {
  });
  this.onUnassign = options.onUnassign || (() => {
  });
  this.onChange = options.onChange || (() => {
  });
  this._assignments = /* @__PURE__ */ new Map();
  this._modal = null;
}
UserAssignmentsManager.prototype.setUsers = function(users) {
  this.users = users;
};
UserAssignmentsManager.prototype.setAssignments = function(data) {
  const self = this;
  this._assignments.clear();
  data.forEach((item) => {
    const id = item.id || item.Id_Requisicao;
    if (item.assignee || item.responsavel) {
      self._assignments.set(String(id), item.assignee || item.responsavel);
    }
  });
};
UserAssignmentsManager.prototype.assign = function(itemId, user) {
  this._assignments.set(String(itemId), user);
  this.onAssign(itemId, user);
  this.onChange(itemId, user, "assign");
};
UserAssignmentsManager.prototype.unassign = function(itemId) {
  const user = this._assignments.get(String(itemId));
  this._assignments.delete(String(itemId));
  this.onUnassign(itemId, user);
  this.onChange(itemId, null, "unassign");
};
UserAssignmentsManager.prototype.getAssignment = function(itemId) {
  return this._assignments.get(String(itemId)) || null;
};
UserAssignmentsManager.prototype.isAssigned = function(itemId) {
  return this._assignments.has(String(itemId));
};
UserAssignmentsManager.prototype.getAssignedTo = function(userId) {
  const items = [];
  this._assignments.forEach((user, itemId) => {
    if (user?.id === userId) items.push(itemId);
  });
  return items;
};
UserAssignmentsManager.prototype.openModal = function(itemId, currentAssignee) {
  const self = this;
  this._modal = document.createElement("div");
  this._modal.className = "p01-modal-overlay";
  this._modal.innerHTML = this._renderModal(itemId, currentAssignee);
  document.body.appendChild(this._modal);
  this._bindEvents(itemId);
  setTimeout(() => self._modal.classList.add("open"), 10);
};
UserAssignmentsManager.prototype._renderModal = function(itemId, currentAssignee) {
  const self = this;
  const usersHtml = this.users.map((user) => {
    const isSelected = currentAssignee?.id === user.id;
    const selectedClass = isSelected ? " p01-user-selected" : "";
    const avatar = user.avatar || self._getInitials(user.name);
    return `<div class="p01-user-item${selectedClass}" data-user-id="${user.id}"><div class="p01-user-avatar">${user.avatar ? `<img src="${user.avatar}">` : avatar}</div><div class="p01-user-info"><span class="p01-user-name">${user.name}</span><span class="p01-user-email">${user.email || ""}</span></div>${isSelected ? `<span class="p01-user-check">${SVGS.check}</span>` : ""}</div>`;
  }).join("");
  return `<div class="p01-modal p01-modal--sm"><div class="p01-modal-header"><h2>Atribuir Respons\xE1vel</h2><button class="p01-modal-close" data-action="close">&times;</button></div><div class="p01-modal-body"><div class="p01-assign-search"><input type="text" class="p01-input" data-input="search" placeholder="Buscar usu\xE1rio..."></div><div class="p01-assign-current">${currentAssignee ? `<div class="p01-assign-current-user"><span>Atribu\xEDdo a: <strong>${currentAssignee.name}</strong></span><button class="p01-btn p01-btn--secondary p01-btn--sm" data-action="unassign">Remover</button></div>` : '<span class="p01-assign-none">Nenhum respons\xE1vel atribu\xEDdo</span>'}</div><div class="p01-users-list">${usersHtml}</div></div><div class="p01-modal-footer"><button class="p01-btn p01-btn--secondary" data-action="close">Cancelar</button></div></div>`;
};
UserAssignmentsManager.prototype._bindEvents = function(itemId) {
  const self = this;
  this._modal.querySelector('[data-input="search"]').addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    self._modal.querySelectorAll(".p01-user-item").forEach((item) => {
      const name = item.querySelector(".p01-user-name").textContent?.toLowerCase() || "";
      const email = item.querySelector(".p01-user-email").textContent?.toLowerCase() || "";
      const visible = name.indexOf(query) !== -1 || email.indexOf(query) !== -1;
      item.style.display = visible ? "" : "none";
    });
  });
  this._modal.querySelectorAll(".p01-user-item").forEach((item) => {
    item.addEventListener("click", () => {
      const userId = item.dataset.userId;
      const user = self.users.find((u) => u.id === userId);
      if (user) {
        self.assign(itemId, user);
        self.closeModal();
      }
    });
  });
  const unassignBtn = this._modal.querySelector('[data-action="unassign"]');
  if (unassignBtn) unassignBtn.addEventListener("click", () => {
    self.unassign(itemId);
    self.closeModal();
  });
  this._modal.querySelectorAll('[data-action="close"]').forEach((btn) => btn.addEventListener("click", () => self.closeModal()));
  this._modal.addEventListener("click", (e) => {
    if (e.target.classList.contains("p01-modal-overlay")) self.closeModal();
  });
};
UserAssignmentsManager.prototype._getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
};
UserAssignmentsManager.prototype.renderBadge = function(itemId) {
  const user = this.getAssignment(itemId);
  if (!user) return "";
  const initials = this._getInitials(user.name);
  return `<span class="p01-assign-badge" title="${user.name}">${user.avatar ? `<img src="${user.avatar}">` : initials}</span>`;
};
UserAssignmentsManager.prototype.closeModal = function() {
  const self = this;
  if (this._modal) {
    this._modal.classList.remove("open");
    setTimeout(() => {
      if (self._modal?.parentNode) self._modal.parentNode.removeChild(self._modal);
      self._modal = null;
    }, 200);
  }
};
UserAssignmentsManager.prototype.getStats = function() {
  const stats = { total: this._assignments.size, byUser: {} };
  this._assignments.forEach((user) => {
    if (user) {
      const id = user.id;
      if (!stats.byUser[id]) stats.byUser[id] = { user, count: 0 };
      stats.byUser[id].count++;
    }
  });
  return stats;
};
UserAssignmentsManager.prototype.destroy = function() {
  this.closeModal();
  this._assignments.clear();
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var user_assignments_default = { UserAssignmentsManager, info, healthCheck };
export {
  MODULE_ID,
  UserAssignmentsManager,
  VERSION,
  user_assignments_default as default,
  healthCheck,
  info
};
