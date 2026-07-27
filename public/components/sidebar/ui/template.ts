// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.9.0-ICON-REGISTRY)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-template
// PURPOSE: Sidebar V2 - Template
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   registryGet, registryListNs from /components/icon-registry/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getIconSvg() — exported function
//   createTemplate() — exported function
//   createTemplateElement() — exported function
//   createItemTemplate() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   ICONS — exported value
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

import { get as registryGet, listNamespaces as registryListNs } from '/components/icon-registry/index.js';

export const VERSION = '5.9.0-ICON-REGISTRY';
export const MODULE_ID = 'sidebar-template';

let _metrics = { templatesCreated: 0, itemsCreated: 0, iconLookups: 0 };

function _buildItemTrigger(itemId: string) {
  return `trigger:navigation:item-${itemId}`;
}

function _buildSectionTrigger(sectionId: string) {
  return `trigger:navigation:section-${sectionId}`;
}

const ICONS = { dashboard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>', grid: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>', users: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', team: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', people: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', 'users-cog': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><circle cx="19" cy="11" r="2"/><path d="M19 8v1"/><path d="M19 13v1"/><path d="M16.5 9.5l.7.7"/><path d="M20.8 13.8l.7.7"/><path d="M16.5 12.5l.7-.7"/><path d="M20.8 8.2l.7-.7"/><path d="M16 11h1"/><path d="M21 11h1"/></svg>', shield: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', 'shield-check': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>', key: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>', lock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>', clipboard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>', 'clipboard-list': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="16" y2="18"/></svg>', settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>', cog: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>', money: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', chart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>', box: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>', package: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>', document: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>', file: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', nav: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>', menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>', globe: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>', server: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>', automation: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>', cart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>', supplier: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>', ads: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>', instagram: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>', drive: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>', pipeline: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>', calculator: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="12" y2="18.01"/><line x1="16" y1="18" x2="16" y2="18.01"/></svg>', folder: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>', home: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>', default: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>' };

export function getIconSvg(iconName: string) {
  _metrics.iconLookups++;
  // 1. Lookup local (retrocompatibilidade)
  if ((ICONS as DynObj)[iconName]) return (ICONS as DynObj)[iconName];
  // 2. Lookup no registry (namespace:name)
  if (iconName.includes(':')) {
    const registrySvg = _getFromRegistry(iconName);
    if (registrySvg) return registrySvg;
  }
  // 3. Fallback: tentar cada namespace
  const registrySvg = _resolveFromRegistry(iconName);
  if (registrySvg) return registrySvg;
  // 4. Default
  return ICONS.default;
}

function _getFromRegistry(fullName: string): string | null {
  try { return registryGet(fullName); } catch { return null; }
}

function _resolveFromRegistry(shortName: string): string | null {
  try {
    const nsList = registryListNs();
    for (const ns of nsList) {
      const svg = registryGet(ns + ':' + shortName);
      if (svg) return svg;
    }
  } catch { /* registry not loaded */ }
  return null;
}

function _createElement(tag: string, options: { className?: string; id?: string; attributes?: Record<string, string>; textContent?: string } = {}) {
  // @ts-expect-error strict migration — TS18048
  const el = document.createElement(tag);if (options.className) el.className = options.className;if (options.id) el.id = options.id;if (options.attributes) { Object.keys(options.attributes).forEach(k => { el.setAttribute(k, options.attributes[k]); }); }if (options.textContent) el.textContent = options.textContent;return el;
}

export function createTemplate(options = {}) {
  _metrics.templatesCreated++;return '<aside class="dsd-sidebar" id="sidebar" role="navigation" aria-label="Menu principal"><div class="dsd-sidebar__header dsd-sidebar__header--with-search"><div class="dsd-sidebar__search" role="search"><div class="dsd-sidebar__search-wrapper"><span class="dsd-sidebar__search-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></span><input type="text" class="dsd-sidebar__search-input" placeholder="Buscar..." aria-label="Buscar página"/><span class="dsd-sidebar__search-clear" role="button" aria-label="Limpar busca" tabindex="0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span></div></div><button class="dsd-sidebar__toggle" type="button" aria-label="Recolher menu" aria-expanded="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button></div><nav class="dsd-sidebar__nav"><div class="dsd-sidebar__nav-content" data-slot="nav-items"></div></nav><div class="dsd-sidebar__keyboard-hints sr-only">Use setas para navegar. Enter para selecionar. Ctrl+B para alternar sidebar.</div><div class="dsd-sidebar__announce sr-only" role="status" aria-live="polite" aria-atomic="true"></div></aside>';
}

export function createTemplateElement(options = {}) {
  _metrics.templatesCreated++;const aside = _createElement('aside', { className: 'dsd-sidebar', id: 'sidebar', attributes: { 'role': 'navigation', 'aria-label': 'Menu principal' } });const header = _createElement('div', { className: 'dsd-sidebar__header dsd-sidebar__header--with-search' });const search = _createElement('div', { className: 'dsd-sidebar__search', attributes: { 'role': 'search' } });const searchWrapper = _createElement('div', { className: 'dsd-sidebar__search-wrapper' });const searchIcon = _createElement('span', { className: 'dsd-sidebar__search-icon' });searchIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>';const searchInput = _createElement('input', { className: 'dsd-sidebar__search-input', attributes: { 'type': 'text', 'placeholder': 'Buscar...', 'aria-label': 'Buscar página' } });const searchClear = _createElement('span', { className: 'dsd-sidebar__search-clear', attributes: { 'role': 'button', 'aria-label': 'Limpar busca', 'tabindex': '0' } });searchClear.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';searchWrapper.appendChild(searchIcon);searchWrapper.appendChild(searchInput);searchWrapper.appendChild(searchClear);search.appendChild(searchWrapper);const toggle = _createElement('button', { className: 'dsd-sidebar__toggle', attributes: { 'type': 'button', 'aria-label': 'Recolher menu', 'aria-expanded': 'true' } });toggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>';header.appendChild(search);header.appendChild(toggle);const nav = _createElement('nav', { className: 'dsd-sidebar__nav' });const navContent = _createElement('div', { className: 'dsd-sidebar__nav-content', attributes: { 'data-slot': 'nav-items' } });nav.appendChild(navContent);const hints = _createElement('div', { className: 'dsd-sidebar__keyboard-hints sr-only', textContent: 'Use setas para navegar. Enter para selecionar. Ctrl+B para alternar sidebar.' });const announce = _createElement('div', { className: 'dsd-sidebar__announce sr-only', attributes: { 'role': 'status', 'aria-live': 'polite', 'aria-atomic': 'true' } });aside.appendChild(header);aside.appendChild(nav);aside.appendChild(hints);aside.appendChild(announce);return aside;
}

export function createItemTemplate(item: DynObj, isActive = false, badge : DynObj = null) {
  _metrics.itemsCreated++;
  const activeClass = isActive ? 'dsd-sidebar__item--active' : '';
  const disabledClass = item.disabled ? 'dsd-sidebar__item--disabled' : '';
  const ariaCurrent = isActive ? 'aria-current="page"' : '';
  const tabIndex = item.disabled ? 'tabindex="-1"' : 'tabindex="0"';
  const title = item.title || item.label || item.id;
  const uarpsTrigger = _buildItemTrigger(item.id);
  const badgeHtml = badge ? `<span class="dsd-sidebar__badge dsd-sidebar__badge--${badge.type || 'info'}${badge.pulse ? ' dsd-sidebar__badge--pulse' : ''}" ${badge.pulse ? 'data-pulse="true"' : ''} aria-label="${badge.value} ${badge.type === 'alert' ? 'alertas' : 'notificações'}">${badge.value}</span>` : '';
  return `<li class="dsd-sidebar__item ${activeClass} ${disabledClass}" data-item-id="${item.id}" data-tooltip="${title}" data-uarps-trigger="${uarpsTrigger}"><a href="${item.route || '#'}" class="dsd-sidebar__link" ${ariaCurrent} ${tabIndex} ${item.disabled ? 'aria-disabled="true"' : ''}><span class="dsd-sidebar__item-icon" data-icon="${item.icon || 'default'}">${getIconSvg(item.icon)}</span><span class="dsd-sidebar__item-text">${title}</span>${badgeHtml}</a></li>`;
}

export { ICONS };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export function getMetrics() { return Object.assign({}, _metrics, { iconsCount: Object.keys(ICONS).length }); }

export function info() { 
  return { 
    moduleId: MODULE_ID, 
    version: VERSION, 
    iconsCount: Object.keys(ICONS).length, 
    triggerPattern: 'trigger:navigation:item-{id}',
    phase: 'P1 - Shadow Mode (3-segment compliant)',
    metrics: getMetrics() 
  }; 
}

export function healthCheck() { 
  return { 
    status: 'HEALTHY', 
    version: VERSION, 
    moduleId: MODULE_ID, 
    checks: { 
      iconsLoaded: Object.keys(ICONS).length > 0, 
      hasDefaultIcon: !!ICONS.default,
      unifiedTriggersActive: true,
      threeSegmentCompliant: true
    }, 
    triggerPattern: 'trigger:navigation:item-{id}',
    metrics: getMetrics() 
  }; 
}

export default { VERSION, MODULE_ID, createTemplate, createTemplateElement, createItemTemplate, getIconSvg, ICONS, info, getMetrics, healthCheck };
