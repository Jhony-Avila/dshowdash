// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.kernel.ui.kernel-governance-panel.renderer
// PURPOSE: Render Functions - geração de HTML do painel
// ───────────────────────────────────────────────────────────────
// IMPORTS: VERSION, ICONS, state, getGovernance, fetchData, helpers, attachEvents
// PROVIDES: render()
// @changelog v2.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION, ICONS } from './constants.js';
import { state, getGovernance } from './state.js';
import { fetchData } from './data.js';
import { getModeClass, getHealthClass, getCategoryClass, formatNumber, formatTime } from './helpers.js';
import { attachEvents } from './events.js';

export const MODULE_ID = 'core.kernel.ui.kernel-governance-panel.renderer';

function _renderStatusCards(data: Record<string, unknown>) {
  const ctx = (data.context || {}) as Record<string, unknown>;
  const health = (data.health || {}) as Record<string, Record<string, unknown>>;
  const defs = (data.definitions || {}) as Record<string, unknown>;

  const mode = (ctx.mode || 'UNKNOWN') as string;
  const phase = (ctx.phase || 'unknown') as string;
  const healthScore = health.global ? (health.global.score as number) : 0;
  const healthStatus = health.global ? (health.global.status as string) : 'UNKNOWN';
  const totalFeatures = defs.totalFeatures || 0;
  const registered = defs.registered ? 'Yes' : 'No';

  return `<div class="kgp__status-row"><div class="kgp__status-card ${getModeClass(mode)}"><div class="kgp__status-label">Mode</div><div class="kgp__status-value">${mode}</div><div class="kgp__status-sub">Phase: ${phase}</div></div><div class="kgp__status-card ${getHealthClass(healthScore)}"><div class="kgp__status-label">Health</div><div class="kgp__status-value">${healthScore}%</div><div class="kgp__status-sub">${healthStatus}</div></div><div class="kgp__status-card"><div class="kgp__status-label">Features</div><div class="kgp__status-value">${totalFeatures}</div><div class="kgp__status-sub">Registered: ${registered}</div></div></div>`;
}

function _renderCategoryHealth(data: Record<string, unknown>) {
  const health = (data.health || {}) as Record<string, Record<string, unknown>>;
  const byCategory = (health.byCategory || {}) as Record<string, Record<string, unknown>>;
  const categories = Object.keys(byCategory);

  if (categories.length === 0) {
    return '<div class="kgp__empty">No health data yet</div>';
  }

  let html = '<div class="kgp__categories">';

  categories.forEach(cat => {
    const catHealth = byCategory[cat];
    const score = catHealth.score || 0;
    const status = (catHealth.status || 'UNKNOWN') as string;
    const cssClass = getCategoryClass(status);

    html += `<div class="kgp__category ${cssClass}" data-category="${cat}"><div class="kgp__category-name">${cat.toUpperCase()}</div><div class="kgp__category-score">${score}%</div><div class="kgp__category-indicator"></div></div>`;
  });

  html += '</div>';
  return html;
}

function _renderFeaturesList(data: Record<string, unknown>) {
  const manifest = (data.manifest || {}) as Record<string, unknown>;
  const features = (manifest.features || {}) as Record<string, Record<string, unknown>>;
  let featureIds = Object.keys(features);
  const filter = state.filter;

  if (filter && filter !== 'all') {
    featureIds = featureIds.filter(id => {
      const f = features[id];
      return f.category === filter;
    });
  }

  if (featureIds.length === 0) {
    return '<div class="kgp__empty">No features registered</div>';
  }

  const categories: string[] = [];
  Object.keys(features).forEach(id => {
    const cat = features[id].category as string | undefined;
    if (cat && categories.indexOf(cat) === -1) {
      categories.push(cat);
    }
  });

  let html = '<div class="kgp__features-filter">' +
    '<select class="kgp__filter-select" data-action="filter">' +
      '<option value="all">All Categories</option>';

  categories.sort().forEach(cat => {
    const selected = filter === cat ? ' selected' : '';
    html += `<option value="${cat}"${selected}>${cat.toUpperCase()}</option>`;
  });

  html += '</select></div>';

  html += '<div class="kgp__features-list">';

  featureIds.sort().forEach(id => {
    const f = features[id];
    const enabled = f.enabled !== false;
    const critical = f.critical === true;
    const experimental = f.experimental === true;
    const deprecated = f.deprecated === true;
    const canDisable = f.canDisable !== false;

    let featureClass = 'kgp__feature';
    featureClass += enabled ? ' kgp__feature--enabled' : ' kgp__feature--disabled';
    if (critical) featureClass += ' kgp__feature--critical';

    let toggleClass = 'kgp__feature-toggle';
    toggleClass += enabled ? ' kgp__feature-toggle--on' : '';
    if (!canDisable) toggleClass += ' kgp__feature-toggle--disabled';

    html += `<div class="${featureClass}" data-feature="${id}"><div class="kgp__feature-indicator"></div><div class="kgp__feature-name">${id}</div><div class="kgp__feature-category">${f.category || 'N/A'}</div><div class="kgp__feature-badges">`;

    if (critical) html += '<span class="kgp__badge kgp__badge--critical">crit</span>';
    if (experimental) html += '<span class="kgp__badge kgp__badge--experimental">exp</span>';
    if (deprecated) html += '<span class="kgp__badge kgp__badge--deprecated">dep</span>';

    html += `</div><div class="${toggleClass}" data-action="toggle" data-feature="${id}" data-enabled="${enabled}" data-can-disable="${canDisable}"></div></div>`;
  });

  html += '</div>';
  return html;
}

function _renderTelemetry(data: Record<string, unknown>) {
  const telemetry = (data.telemetry || {}) as Record<string, unknown>;
  const metrics = (telemetry.metrics || {}) as Record<string, number>;

  const emitted = metrics.emitted || 0;
  const buffered = metrics.buffered || 0;
  const errors = metrics.errors || 0;
  const flushed = metrics.flushed || 0;

  return `<div class="kgp__telemetry"><div class="kgp__telemetry-stat"><div class="kgp__telemetry-value">${formatNumber(emitted)}</div><div class="kgp__telemetry-label">Emitted</div></div><div class="kgp__telemetry-stat"><div class="kgp__telemetry-value">${formatNumber(buffered)}</div><div class="kgp__telemetry-label">Buffered</div></div><div class="kgp__telemetry-stat"><div class="kgp__telemetry-value">${formatNumber(flushed)}</div><div class="kgp__telemetry-label">Flushed</div></div><div class="kgp__telemetry-stat"><div class="kgp__telemetry-value">${errors}</div><div class="kgp__telemetry-label">Errors</div></div></div>`;
}

export function render() {
  if (!state.container) return;

  const data = fetchData();
  const Governance = getGovernance();
  const governanceAvailable = !!Governance;

  let html = `<div class="kgp__header"><div class="kgp__title">${ICONS.kernel} KERNEL GOVERNANCE</div><div class="kgp__controls"><button class="kgp__btn" data-action="refresh" title="Refresh">${ICONS.refresh}</button><button class="kgp__btn" data-action="export" title="Export JSON">${ICONS.export}</button><button class="kgp__btn" data-action="minimize" title="Minimize">${ICONS.minimize}</button><button class="kgp__btn kgp__btn--close" data-action="close" title="Close">${ICONS.close}</button></div></div>`;

  html += '<div class="kgp__body">';

  if (!governanceAvailable) {
    html += '<div class="kgp__empty" style="padding: 40px; text-align: center;">' +
      '<div style="margin-bottom: 10px; color: #f59e0b;">&#9888;&#65039; Governance not loaded</div>' +
      '<div style="font-size: 11px; color: #9aa3b2;">Core Enterprise module may still be loading.<br>Click refresh to retry.</div>' +
    '</div>';
  } else {
    html += _renderStatusCards(data);

    html += `<div class="kgp__section"><div class="kgp__section-header"><div class="kgp__section-title">Health by Category</div></div><div class="kgp__section-content">${_renderCategoryHealth(data)}</div></div>`;

    html += `<div class="kgp__section"><div class="kgp__section-header"><div class="kgp__section-title">Features</div></div><div class="kgp__section-content">${_renderFeaturesList(data)}</div></div>`;

    html += `<div class="kgp__section"><div class="kgp__section-header"><div class="kgp__section-title">Telemetry</div></div><div class="kgp__section-content">${_renderTelemetry(data)}</div></div>`;
  }

  html += '</div>';

  html += `<div class="kgp__footer"><div class="kgp__footer-left"><span class="kgp__version">v${VERSION}</span><span class="kgp__updated">Updated: ${formatTime(state.lastUpdate)}</span></div><div class="kgp__footer-right"><span>Ctrl+Shift+G to toggle</span></div></div>`;

  state.container.innerHTML = html;
  attachEvents();
}
