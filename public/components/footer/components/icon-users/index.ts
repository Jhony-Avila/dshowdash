// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer/components/icon-users
// PURPOSE: Footer Icon Users - Enterprise v1.0.0
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   IconUsers — exported class
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
export const MODULE_ID = 'footer/components/icon-users';
export const VERSION = '1.0.0-ENTERPRISE';

export class IconUsers {
  [key: string]: any;
  constructor(container: HTMLElement|null, options = {}) { this.container = container; this.element = null; this.mounted = false; this._metrics = { mountCount: 0, lastMountAt: null }; }
  async mount() { if (this.mounted) return; this.render(); this.mounted = true; this._metrics.mountCount++; this._metrics.lastMountAt = Date.now(); }
  render() { this.element = document.createElement('button'); this.element.className = 'icon-users-component dsd-footer__icon-btn'; this.element.title = 'Usuários'; this.element.setAttribute('data-uarps-trigger', 'trigger:footer:users'); this.element.setAttribute('aria-label', 'Usuários'); this.element.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`; this.container.appendChild(this.element); }
  async unmount() { if (!this.mounted) return; this.element?.remove(); this.mounted = false; }
  healthCheck() { return { status: 'healthy', mounted: this.mounted, version: VERSION, moduleId: MODULE_ID }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, mounted: this.mounted, metrics: this._metrics }; }
}
export default IconUsers;
