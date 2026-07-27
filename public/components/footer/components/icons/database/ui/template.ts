// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-icon-database-template
// PURPOSE: database Icon - Template
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

const MODULE_ID = 'footer-icon-database-template';
const VERSION = '1.1.0-ENTERPRISE';

const SVG_PATH = 'M12 2C6.48 2 2 4.02 2 6.5v11C2 19.98 6.48 22 12 22s10-2.02 10-4.5v-11C22 4.02 17.52 2 12 2zM2 11.5c0 2.48 4.48 4.5 10 4.5s10-2.02 10-4.5M2 6.5c0 2.48 4.48 4.5 10 4.5s10-2.02 10-4.5';

let _metrics = { renders: 0 };

export const Template = {
  render(props: Record<string, unknown> = {}) {
    _metrics.renders++;
    const size = (CONTRACTS.SIZES as Record<string,unknown>)[props.size as string] || CONTRACTS.SIZES.md;
    const variant = props.variant || 'primary';
    const decorative = props.decorative ?? false;
    const ariaLabel = props.ariaLabel || 'database';
    const title = props.title || '';
    const clickable = props.clickable ?? false;
    const state = props.state || 'default';

    const classes = ['dsd-icon', 'dsd-icon--database', `dsd-icon--${variant}`, `dsd-icon--size-${props.size || 'md'}`, `dsd-icon--state-${state}`, clickable ? 'dsd-icon--clickable' : ''].filter(Boolean).join(' ');
    const ariaAttrs = decorative ? 'aria-hidden="true" role="presentation"' : `aria-label="${ariaLabel}" role="img"`;
    const titleTag = title ? `<title>${title}</title>` : '';

    return `<span class="${classes}" data-icon-id="database"><svg class="dsd-icon__svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${ariaAttrs}>${titleTag}<path d="${SVG_PATH}"/></svg></span>`;
  },
  getSvgPath() { return SVG_PATH; }
};

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, svgPath: SVG_PATH, metrics: getMetrics() }; }
export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { templateReady: true, hasSvgPath: !!SVG_PATH }, metrics: getMetrics() };
}

export { MODULE_ID, VERSION };
export default { ...Template, getMetrics, info, healthCheck, MODULE_ID, VERSION };
