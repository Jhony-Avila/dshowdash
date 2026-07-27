// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/mentions
// PURPOSE: Panel-01 - Mentions (
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   MentionsManager() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'blur'
//   'input'
//   'keydown'
//   'mousedown'
//   'mouseenter'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/mentions';

export function MentionsManager(this: any, options: Record<string, unknown> = {}) {
  options = options || {};
  this.users = options.users || [];
  this.onMention = options.onMention || (() => {});
  this.triggerChar = options.triggerChar || '@';
  this.minChars = options.minChars || 1;
  this._input = null;
  this._dropdown = null;
  this._visible = false;
  this._selectedIndex = 0;
  this._filteredUsers = [];
  this._mentionStart = -1;
}

MentionsManager.prototype.attach = function(inputElement: HTMLInputElement) {
  this._input = inputElement;
  this._createDropdown();
  this._bindEvents();
};

MentionsManager.prototype.setUsers = function(users: unknown[]) { this.users = users; };

MentionsManager.prototype._createDropdown = function() {
  this._dropdown = document.createElement('div');
  this._dropdown.className = 'p01-mentions-dropdown';
  this._dropdown.style.display = 'none';
  if (this._input && this._input.parentNode) {
    this._input.parentNode.style.position = 'relative';
    this._input.parentNode.appendChild(this._dropdown);
  }
};

MentionsManager.prototype._bindEvents = function() {
  if (!this._input) return;
  const self = this;
  this._handlers = {
    input: (e: Event) => { self._onInput(e); },
    keydown: (e: KeyboardEvent) => { self._onKeydown(e); },
    blur: () => { self._blurTimeout = setTimeout(() => { self._hide(); }, 150); }
  };
  this._input.addEventListener('input', this._handlers.input);
  this._input.addEventListener('keydown', this._handlers.keydown);
  this._input.addEventListener('blur', this._handlers.blur);
};

MentionsManager.prototype._onInput = function() {
  const value = this._input.value;
  const cursorPos = this._input.selectionStart;
  const textBeforeCursor = value.substring(0, cursorPos);
  const lastAtIndex = textBeforeCursor.lastIndexOf(this.triggerChar);
  if (lastAtIndex === -1) { this._hide(); return; }
  if (lastAtIndex > 0 && textBeforeCursor[lastAtIndex - 1] !== ' ' && textBeforeCursor[lastAtIndex - 1] !== '\n') { this._hide(); return; }
  const query = textBeforeCursor.substring(lastAtIndex + 1);
  if (query.indexOf(' ') !== -1) { this._hide(); return; }
  if (query.length < this.minChars) { this._hide(); return; }
  this._mentionStart = lastAtIndex;
  this._filterUsers(query);
  if (this._filteredUsers.length > 0) { this._show(); } else { this._hide(); }
};

MentionsManager.prototype._onKeydown = function(e: KeyboardEvent) {
  if (!this._visible) return;
  switch (e.key) {
    case 'ArrowDown': e.preventDefault(); this._selectedIndex = Math.min(this._selectedIndex + 1, this._filteredUsers.length - 1); this._updateSelection(); break;
    case 'ArrowUp': e.preventDefault(); this._selectedIndex = Math.max(this._selectedIndex - 1, 0); this._updateSelection(); break;
    case 'Enter': case 'Tab': if (this._filteredUsers.length > 0) { e.preventDefault(); this._selectUser(this._filteredUsers[this._selectedIndex]); } break;
    case 'Escape': this._hide(); break;
  }
};

MentionsManager.prototype._filterUsers = function(query: string) {
  const q = query.toLowerCase();
  this._filteredUsers = this.users.filter((user: Record<string, unknown>) => {
    const name = ((user.name || '') as string).toLowerCase();
    const email = ((user.email || '') as string).toLowerCase();
    const username = ((user.username || '') as string).toLowerCase();
    return name.indexOf(q) !== -1 || email.indexOf(q) !== -1 || username.indexOf(q) !== -1;
  }).slice(0, 8);
  this._selectedIndex = 0;
};

MentionsManager.prototype._render = function() {
  const self = this;
  if (this._filteredUsers.length === 0) { this._dropdown.innerHTML = '<div class="p01-mentions-empty">Nenhum usuário encontrado</div>'; return; }
  const html = this._filteredUsers.map((user: Record<string, unknown>, index: number) => {
    const selectedClass = index === self._selectedIndex ? ' selected' : '';
    const initials = self._getInitials(user.name);
    return `<div class="p01-mention-item${selectedClass}" data-index="${index}"><div class="p01-mention-avatar">${user.avatar ? `<img src="${user.avatar}">` : initials}</div><div class="p01-mention-info"><span class="p01-mention-name">${user.name}</span><span class="p01-mention-username">@${user.username || user.email || user.id}</span></div></div>`;
  }).join('');
  this._dropdown.innerHTML = html;
  this._bindItemEvents();
};

MentionsManager.prototype._bindItemEvents = function() {
  const self = this;
  this._dropdown.querySelectorAll('.p01-mention-item').forEach((item: Element) => {
    item.addEventListener('mousedown', (e: Event) => { e.preventDefault(); const index = parseInt((item as HTMLElement).dataset.index as string); self._selectUser(self._filteredUsers[index]); });
    item.addEventListener('mouseenter', () => { self._selectedIndex = parseInt((item as HTMLElement).dataset.index as string); self._updateSelection(); });
  });
};

MentionsManager.prototype._updateSelection = function() {
  const self = this;
  this._dropdown.querySelectorAll('.p01-mention-item').forEach((item: Element, index: number) => { item.classList.toggle('selected', index === self._selectedIndex); });
};

MentionsManager.prototype._selectUser = function(user: Record<string, unknown>) {
  if (!user || !this._input) return;
  const value = this._input.value;
  const cursorPos = this._input.selectionStart;
  const mention = this.triggerChar + (user.username || (user.name as string).replace(/\s+/g, ''));
  const before = value.substring(0, this._mentionStart);
  const after = value.substring(cursorPos);
  this._input.value = `${before + mention} ${after}`;
  const newCursorPos = before.length + mention.length + 1;
  this._input.setSelectionRange(newCursorPos, newCursorPos);
  this._input.focus();
  this._hide();
  this.onMention(user, mention);
};

MentionsManager.prototype._getInitials = (name: string) => { if (!name) return '?'; return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2); };
MentionsManager.prototype._show = function() { this._render(); this._dropdown.style.display = 'block'; this._visible = true; };
MentionsManager.prototype._hide = function() { if (this._dropdown) this._dropdown.style.display = 'none'; this._visible = false; this._mentionStart = -1; };
MentionsManager.prototype.extractMentions = function(text: string) { const regex = new RegExp(`${this.triggerChar}([\\w.-]+)`, 'g'); const mentions = []; let match; while ((match = regex.exec(text)) !== null) { mentions.push(match[1]); } return mentions; };
MentionsManager.prototype.highlightMentions = function(text: string) { const self = this; return text.replace(new RegExp(`${this.triggerChar}([\\w.-]+)`, 'g'), (match: string, username: string) => { const user = self.users.find((u: Record<string, unknown>) => u.username === username || (u.name as string)?.replace(/\s+/g, '') === username); if (user) { return `<span class="p01-mention" data-user-id="${user.id}">${match}</span>`; } return match; }); };
MentionsManager.prototype.destroy = function() { if (this._blurTimeout) { clearTimeout(this._blurTimeout); this._blurTimeout = null; } if (this._input && this._handlers) { this._input.removeEventListener('input', this._handlers.input); this._input.removeEventListener('keydown', this._handlers.keydown); this._input.removeEventListener('blur', this._handlers.blur); this._handlers = null; } if (this._dropdown && this._dropdown.parentNode) { this._dropdown.parentNode.removeChild(this._dropdown); } this._dropdown = null; this._input = null; this._visible = false; };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { MentionsManager, info, healthCheck };
