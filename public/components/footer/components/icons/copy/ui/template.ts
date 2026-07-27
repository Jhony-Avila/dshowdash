// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-icon-copy-template
// PURPOSE: copy Icon - Template
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
const MODULE_ID = 'footer-icon-copy-template';
const VERSION = '1.1.0-ENTERPRISE';
let _metrics = { renders: 0 };
export const Template = {
  render(props: Record<string, unknown> = {}) {
    _metrics.renders++;
    const size = (CONTRACTS.SIZES as Record<string,unknown>)[props.size as string] || CONTRACTS.SIZES.md;
    const variant = props.variant || 'primary';
    const decorative = props.decorative ?? false;
    const ariaLabel = props.ariaLabel || 'copy';
    const title = props.title || '';
    const clickable = props.clickable ?? false;
    const state = props.state || 'default';
    const classes = ['dsd-icon', 'dsd-icon--copy', `dsd-icon--${variant}`, `dsd-icon--size-${props.size || 'md'}`, `dsd-icon--state-${state}`, clickable ? 'dsd-icon--clickable' : ''].filter(Boolean).join(' ');
    const ariaAttrs = decorative ? 'aria-hidden="true" role="presentation"' : `aria-label="${ariaLabel}" role="img"`;
    const titleTag = title ? `<title>${title}</title>` : '';
    return `<span class="${classes}" data-icon-id="copy"><svg class="dsd-icon__svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${ariaAttrs}>${titleTag}<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>`;
  },
  getSvgPath() { return 'rect x="9" y="9" width="13" height="13" rx="2" ry="2"'; }
};
export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { templateReady: true }, metrics: getMetrics() }; }
export { MODULE_ID, VERSION };
export default { ...Template, getMetrics, info, healthCheck, MODULE_ID, VERSION };
