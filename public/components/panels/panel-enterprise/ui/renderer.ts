// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-enterprise/ui/renderer
// PURPOSE: Panel Enterprise - Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   FEATURES, ICONS from ../core/constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderHeader() — exported function
//   renderFeatureGrid() — exported function
//   renderFeatureCard() — exported function
//   renderUpgradeCard() — exported function
//   renderSkeleton() — exported function
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

import { FEATURES, ICONS } from '../core/constants.js';

interface Feature {
  id: string;
  label: string;
  icon: string;
  status?: string;
}

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-enterprise/ui/renderer';

export function renderHeader() {
  return `<div class="enterprise-header"><div class="enterprise-icon">${ICONS.building}</div><div class="enterprise-title"><h2>Enterprise Features</h2><p>Funcionalidades avançadas para sua empresa</p></div></div>`;
}

export function renderFeatureGrid(features: Feature[], activeFeatures: string[]) {
  const featureList: Feature[] = features || (Object.values(FEATURES) as Feature[]);
  return `<div class="enterprise-features">${featureList.map((f: Feature) => renderFeatureCard(f, activeFeatures?.includes(f.id))).join('')}</div>`;
}

export function renderFeatureCard(feature: Feature, isActive: boolean) {
  const statusClass = isActive ? 'active' : feature.status || 'coming-soon';
  return `<div class="feature-card feature-card--${statusClass}" data-feature-id="${feature.id}"><div class="feature-icon">${getFeatureIcon(feature.icon)}</div><div class="feature-content"><span class="feature-label">${escapeHtml(feature.label)}</span><span class="feature-status">${getStatusLabel(statusClass)}</span></div>${isActive ? '' : `<div class="feature-lock">${ICONS.lock}</div>`}</div>`;
}

export function renderUpgradeCard() {
  return `<div class="upgrade-card"><div class="upgrade-icon">${ICONS.star}</div><div class="upgrade-content"><h3>Upgrade para Enterprise</h3><p>Desbloqueie todas as funcionalidades avançadas</p></div><button class="upgrade-btn" data-action="upgrade">Saiba Mais</button></div>`;
}

export function renderSkeleton() {
  return '<div class="enterprise-skeleton">' +
    '<div class="skeleton-header"></div>' +
    '<div class="skeleton-grid">' +
      '<div class="skeleton-card"></div><div class="skeleton-card"></div>' +
      '<div class="skeleton-card"></div><div class="skeleton-card"></div>' +
    '</div>' +
  '</div>';
}

function getFeatureIcon(iconName: string) {
  const icons = {
    'bar-chart': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
    'file-text': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    'code': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    'palette': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12.5" r="0.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>',
    'users': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    'key': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',
    'shield': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    'headphones': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>'
  };
  return (icons as Record<string, string>)[iconName] || '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = { active: 'Ativo', 'coming-soon': 'Em breve', locked: 'Bloqueado', beta: 'Beta' };
  return labels[status] || status;
}

function escapeHtml(text: string) { if (!text) return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { renderHeader, renderFeatureGrid, renderFeatureCard, renderUpgradeCard, renderSkeleton };
