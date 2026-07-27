// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-ENTERPRISE-UARPS)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-button-cpu-template
// PURPOSE: Footer Button - Template
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getIcon from ../../_shared/icons.js
//
// PROVIDES:
//   createTemplate() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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

import { getIcon } from '../../_shared/icons.js';

const MODULE_ID = 'footer-button-cpu-template';
const VERSION = '1.2.0-ENTERPRISE-UARPS';

let _metrics = { renders: 0 };

export function createTemplate(config: { id?: string; label?: string; icon?: string; kind?: string } = {}) {
  _metrics.renders++;
  const { id = 'cpu', label = 'CPU', icon = 'cpu', kind = 'decorative' } = config;
  
  const iconSvg = getIcon(icon);
  const uarpsTrigger = `trigger:footer:${id}`;
  const btnClass = kind === 'control' 
    ? `dsd-footer__control-btn footer-btn footer-btn--${id}`
    : `dsd-footer__icon-btn footer-btn footer-btn--${id}`;
  
  if (kind === 'control') {
    return `<button type="button" class="${btnClass}" aria-label="${label}" data-button-id="${id}" data-uarps-trigger="${uarpsTrigger}" data-icon="${icon}" tabindex="0" title="${label}">${iconSvg}<span>${label}</span></button>`;
  }
  
  return `<button type="button" class="${btnClass}" aria-label="${label}" data-button-id="${id}" data-uarps-trigger="${uarpsTrigger}" data-icon="${icon}" tabindex="0" title="${label}">${iconSvg}</button>`;
}

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }
export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { templateReady: true }, metrics: getMetrics() };
}

export { MODULE_ID, VERSION };
export default { createTemplate, getMetrics, info, healthCheck, VERSION, MODULE_ID };
