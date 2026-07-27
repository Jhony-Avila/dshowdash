// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-icon-box-template
// PURPOSE: box Icon - Template
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONTRACTS from ../core/contracts.js
//
// PROVIDES:
//   Template — exported value
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
import { CONTRACTS } from '../core/contracts.js';
const MODULE_ID = 'footer-icon-box-template';
const VERSION = '1.1.0-ENTERPRISE';
let _metrics = { renders: 0 };
export const Template = {
  render(props: Record<string, unknown> = {}) {
    _metrics.renders++;
    const size = (CONTRACTS.SIZES as Record<string,unknown>)[props.size as string] || CONTRACTS.SIZES.md;
    const variant = props.variant || 'primary';
    const decorative = props.decorative ?? false;
    const ariaLabel = props.ariaLabel || 'box';
    const title = props.title || '';
    const clickable = props.clickable ?? false;
    const state = props.state || 'default';
    const classes = ['dsd-icon', 'dsd-icon--box', `dsd-icon--${variant}`, `dsd-icon--size-${props.size || 'md'}`, `dsd-icon--state-${state}`, clickable ? 'dsd-icon--clickable' : ''].filter(Boolean).join(' ');
    const ariaAttrs = decorative ? 'aria-hidden="true" role="presentation"' : `aria-label="${ariaLabel}" role="img"`;
    const titleTag = title ? `<title>${title}</title>` : '';
    return `<span class="${classes}" data-icon-id="box"><svg class="dsd-icon__svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${ariaAttrs}>${titleTag}<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></span>`;
  },
  getSvgPath() { return 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'; }
};
export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { templateReady: true }, metrics: getMetrics() }; }
export { MODULE_ID, VERSION };
export default { ...Template, getMetrics, info, healthCheck, MODULE_ID, VERSION };
