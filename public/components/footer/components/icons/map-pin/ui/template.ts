// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-icon-map-pin-template
// PURPOSE: map-pin Icon - Template
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

const MODULE_ID = 'footer-icon-map-pin-template';
const VERSION = '1.1.0-ENTERPRISE';

const SVG_PATH = 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z';

let _metrics = { renders: 0 };

export const Template = {
  render(props: Record<string, unknown> = {}) {
    _metrics.renders++;
    const size = (CONTRACTS.SIZES as Record<string,unknown>)[props.size as string] || CONTRACTS.SIZES.md;
    const variant = props.variant || 'primary';
    const decorative = props.decorative ?? false;
    const ariaLabel = props.ariaLabel || 'map-pin';
    const title = props.title || '';
    const clickable = props.clickable ?? false;
    const state = props.state || 'default';

    const classes = ['dsd-icon', 'dsd-icon--map-pin', `dsd-icon--${variant}`, `dsd-icon--size-${props.size || 'md'}`, `dsd-icon--state-${state}`, clickable ? 'dsd-icon--clickable' : ''].filter(Boolean).join(' ');
    const ariaAttrs = decorative ? 'aria-hidden="true" role="presentation"' : `aria-label="${ariaLabel}" role="img"`;
    const titleTag = title ? `<title>${title}</title>` : '';

    return `<span class="${classes}" data-icon-id="map-pin"><svg class="dsd-icon__svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${ariaAttrs}>${titleTag}<path d="${SVG_PATH}"/></svg></span>`;
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
