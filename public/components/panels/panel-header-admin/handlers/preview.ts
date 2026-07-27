// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-header-admin-handlers-preview
// PURPOSE: Panel Header Admin - Live Preview Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   state from ../state/store.js
//
// PROVIDES:
//   renderPreviewPanel() — exported function
//   initPreview() — exported function
//   updatePreview() — exported function
//   togglePreviewExpand() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { state } from '../state/store.js';

export const MODULE_ID = 'panel-header-admin-handlers-preview';
export const VERSION = '9.3.0-P2-ENTERPRISE';
let previewContainer: HTMLElement | null = null;
const isPreviewOpen = false;

export function renderPreviewPanel(container: HTMLElement) {
  return '<div class="pha-preview-section"><div class="pha-preview-header"><h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>Preview ao Vivo</h3><div class="pha-preview-controls"><button class="pha-btn pha-btn--sm" data-action="preview-refresh" title="Atualizar preview"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg></button><button class="pha-btn pha-btn--sm pha-btn--secondary" data-action="preview-toggle" title="Expandir/Colapsar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg></button></div></div><div class="pha-preview-frame" id="header-preview-frame"><div class="pha-preview-loading">Carregando preview...</div></div></div>';
}

export function initPreview(container: HTMLElement) { previewContainer = container.querySelector('#header-preview-frame'); if (previewContainer) updatePreview(); }

export function updatePreview() {
  if (!previewContainer) return;
  const currentState = state.getState();
  const components = currentState.components || [];
  const groups = currentState.groups || [];
  const activeComponents = components.filter(c => c.is_active === 1);
  const leftComponents = getComponentsByPosition(activeComponents, groups, 'left');
  const centerComponents = getComponentsByPosition(activeComponents, groups, 'center');
  const rightComponents = getComponentsByPosition(activeComponents, groups, 'right');
  previewContainer.innerHTML = `<div class="pha-preview-header-mock"><div class="pha-preview-section-left">${renderPreviewComponents(leftComponents)}</div><div class="pha-preview-section-center">${renderPreviewComponents(centerComponents)}</div><div class="pha-preview-section-right">${renderPreviewComponents(rightComponents)}</div></div><div class="pha-preview-info"><span>${activeComponents.length} componentes ativos</span><span>•</span><span>Left: ${leftComponents.length}</span><span>•</span><span>Center: ${centerComponents.length}</span><span>•</span><span>Right: ${rightComponents.length}</span></div>`;
}

function getComponentsByPosition(components: Record<string, unknown>[], groups: Record<string, unknown>[], position: string) {
  const positionGroups = groups.filter((g: Record<string, unknown>) => g.position === position).map((g: Record<string, unknown>) => g.group_key);
  return components.filter((c: Record<string, unknown>) => positionGroups.indexOf(c.group_key) !== -1).sort((a: Record<string, unknown>, b: Record<string, unknown>) => ((a.order_index as number) || 0) - ((b.order_index as number) || 0));
}

function renderPreviewComponents(components: Record<string, unknown>[]) {
  if (!components.length) return '<span class="pha-preview-empty">—</span>';
  return components.map((c: Record<string, unknown>) => `<div class="pha-preview-item" title="${c.label} (${c.component_key})"><span class="pha-preview-item-icon">${getIconSvg(c.icon_name as string)}</span><span class="pha-preview-item-label">${c.label}</span></div>`).join('');
}

function getIconSvg(iconName: string) {
  const icons = {
    activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    'dollar-sign': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
    cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
    zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    'external-link': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    server: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
    wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>'
  };
  return (icons as Record<string, string>)[iconName] || icons.info;
}

export function togglePreviewExpand(container: HTMLElement) { const section = container.querySelector('.pha-preview-section'); if (section) (section as HTMLElement).classList.toggle('pha-preview-section--expanded'); }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { previewReady: true } }; }
