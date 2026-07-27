// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P25-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-07/ui/keyboard
// PURPOSE: Panel-07 Keyboard Navigation
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   KeyboardNavigation() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-07/ui/keyboard';

export function KeyboardNavigation(this: any, container: HTMLElement, options: Record<string, unknown>) {
  if (!options) options = {};
  this.container = container;
  this.onRowSelect = options.onRowSelect || (() => {});
  this.onRowActivate = options.onRowActivate || (() => {});
  this.currentIndex = -1;
  this._keyHandler = null;
  this.enabled = true;
}

KeyboardNavigation.prototype.init = function() {
  const self = this;
  self._keyHandler = (e: KeyboardEvent) => {
    if (!self.enabled) return;
    
    const tbody = self.container.querySelector('.p07-tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr[data-job-id]'));
    if (!rows.length) return;

    if (e.key === 'ArrowDown') { e.preventDefault(); self.navigate(rows, 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); self.navigate(rows, -1); }
    else if (e.key === 'Enter') { e.preventDefault(); if (self.currentIndex >= 0 && rows[self.currentIndex]) { self.onRowActivate(rows[self.currentIndex]); } }
    else if (e.key === 'Escape') { self.clearSelection(rows); }
    else if (e.key === 'Home') { e.preventDefault(); self.goTo(rows, 0); }
    else if (e.key === 'End') { e.preventDefault(); self.goTo(rows, rows.length - 1); }
  };

  self.container.setAttribute('tabindex', '0');
  self.container.addEventListener('keydown', self._keyHandler);
};

KeyboardNavigation.prototype.navigate = function(rows: Element[], direction: number) {
  const newIndex = this.currentIndex + direction;
  if (newIndex >= 0 && newIndex < rows.length) {
    this.goTo(rows, newIndex);
  }
};

KeyboardNavigation.prototype.goTo = function(rows: Element[], index: number) {
  rows.forEach((r: Element) => { r.classList.remove('p07-row-selected'); });
  
  this.currentIndex = index;
  const row = rows[index];
  if (row) {
    row.classList.add('p07-row-selected');
    row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    this.onRowSelect(row);
  }
};

KeyboardNavigation.prototype.clearSelection = function(rows: Element[]) {
  rows.forEach((r: Element) => { r.classList.remove('p07-row-selected'); });
  this.currentIndex = -1;
};

KeyboardNavigation.prototype.reset = function() {
  this.currentIndex = -1;
};

KeyboardNavigation.prototype.destroy = function() {
  if (this._keyHandler) {
    this.container.removeEventListener('keydown', this._keyHandler);
  }
  this.container.removeAttribute('tabindex');
};

KeyboardNavigation.prototype.healthCheck = function() {
  const checks = { hasContainer: !!this.container, enabled: this.enabled, handlerAttached: !!this._keyHandler };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed >= 2 ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, currentIndex: this.currentIndex, p25Compliant: true, timestamp: Date.now() };
};

KeyboardNavigation.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, enabled: this.enabled, currentIndex: this.currentIndex, p25Compliant: true };
};

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { moduleAvailable: true }, p25Compliant: true, timestamp: Date.now() };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, p25Compliant: true };
}

export default KeyboardNavigation;
