// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer/components/icon-link
// PURPOSE: Footer Icon Link - Enterprise v1.0.0
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   IconLink — exported class
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
export const MODULE_ID = 'footer/components/icon-link';
export const VERSION = '1.0.0-ENTERPRISE';

export class IconLink {
  [key: string]: any;
  constructor(container: HTMLElement|null, options = {}) { this.container = container; this.element = null; this.mounted = false; this._metrics = { mountCount: 0, lastMountAt: null }; }
  async mount() { if (this.mounted) return; this.render(); this.mounted = true; this._metrics.mountCount++; this._metrics.lastMountAt = Date.now(); }
  render() { this.element = document.createElement('button'); this.element.className = 'icon-link-component dsd-footer__icon-btn'; this.element.title = 'Integrações'; this.element.setAttribute('data-uarps-trigger', 'trigger:footer:link'); this.element.setAttribute('aria-label', 'Integrações'); this.element.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>`; this.container.appendChild(this.element); }
  async unmount() { if (!this.mounted) return; this.element?.remove(); this.mounted = false; }
  healthCheck() { return { status: 'healthy', mounted: this.mounted, version: VERSION, moduleId: MODULE_ID }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, mounted: this.mounted, metrics: this._metrics }; }
}
export default IconLink;
