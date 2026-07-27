// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-orchestrator-manager-renderer
// PURPOSE: Panel Orchestrator Manager - UI Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   simulator from ./simulator.js
//   ICONS from ../../../_shared/icons.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   ui — exported value
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

import { simulator } from './simulator.js';
import { ICONS } from '../../../_shared/icons.js';

export const MODULE_ID = 'panel-orchestrator-manager-renderer';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const TABS = [
  { id: 'triggers', label: 'Triggers', icon: 'zap' },
  { id: 'rules', label: 'Rules', icon: 'table' },
  { id: 'flags', label: 'Flags', icon: 'flag' },
  { id: 'metrics', label: 'Metrics', icon: 'trendingUp' },
  { id: 'timeline', label: 'Timeline', icon: 'barChart' },
  { id: 'audit', label: 'Auditoria', icon: 'scroll' }
];

const COMPONENTS = ['all', 'header', 'sidebar', 'navrail', 'footer', 'keyboard'];
const ACTION_TYPES = ['navigate', 'panel', 'external', 'action', 'noop'];
const REGIONS = ['main', 'side', 'modal', 'overlay', 'drawer', 'toast'];
const SCOPE_TYPES = ['global', 'trigger', 'intent', 'panel', 'route'];
const ENVIRONMENTS = ['all', 'production', 'staging', 'development'];

type PomState = Record<string, unknown>;
type PomItem = Record<string, unknown>;

function getTabIcon(iconName: string) { return (ICONS as Record<string, string>)[iconName] || ICONS.warning; }

export const ui = {
  renderMain(state: PomState) {
    const isFullHeight = state.selectedTab === 'timeline' || state.selectedTab === 'metrics';
    const hideToolbar = isFullHeight || state.selectedTab === 'audit';
    let tabsHtml = '';
    for (const tab of TABS) {
      tabsHtml += `<button class="pom-tab ${state.selectedTab === tab.id ? 'pom-tab--active' : ''}" data-tab="${tab.id}"><span class="pom-tab__icon">${getTabIcon(tab.icon)}</span><span class="pom-tab__label">${tab.label}</span>${this._getTabCount(tab.id, state)}</button>`;
    }
    let componentOptions = '';
    for (const c of COMPONENTS) {
      componentOptions += `<option value="${c}" ${state.filterComponent === c ? 'selected' : ''}>${c === 'all' ? 'Todos' : c}</option>`;
    }
    // @ts-expect-error strict migration — TS2345
    return `<div class="pom-panel" data-panel="orchestrator-manager"><header class="pom-header"><div class="pom-header__title"><span class="pom-header__icon">${ICONS.sliders}</span><h1>UI Orchestrator Manager</h1></div><div class="pom-header__actions"><button class="pom-btn pom-btn--accent" data-action="open-simulator" title="Simular Intent"><span class="pom-btn-icon">${ICONS.target}</span> Simulate</button><button class="pom-btn pom-btn--secondary" data-action="refresh" title="Atualizar"><span class="pom-btn-icon">${ICONS.refresh}</span></button><button class="pom-btn pom-btn--primary" data-action="sync-all" title="Sincronizar"><span class="pom-btn-icon">${ICONS.link}</span> Sync</button></div></header><div class="pom-stats" data-stats-bar>${this.renderStatsBar(state.stats)}</div><nav class="pom-tabs">${tabsHtml}</nav><div class="pom-toolbar" ${hideToolbar ? 'style="display:none;"' : ''}><div class="pom-search"><input type="text" class="pom-search__input" placeholder="Buscar..." value="${state.searchTerm || ''}" data-action="search"></div>${state.selectedTab === 'triggers' ? `<div class="pom-filter"><select class="pom-filter__select" data-action="filter-component">${componentOptions}</select></div>` : ''}<button class="pom-btn pom-btn--success" data-action="add-new">+ Novo</button></div><div class="pom-content ${isFullHeight ? 'pom-content--fullheight' : ''}" data-tab-content="${state.selectedTab}">${state.isLoading ? this.renderLoading() : this.renderTabContent(state)}</div><div class="pom-modal-overlay" data-modal="overlay" style="display:none;"><div class="pom-modal" data-modal="container"></div></div><div class="pom-toast-container" data-toast-container></div></div>`;
  },

  _getTabCount(tabId: string, state: PomState) {
    let count = 0;
    if (tabId === 'triggers') count = Array.isArray(state['triggers']) ? (state['triggers'] as unknown[]).length : 0;
    else if (tabId === 'rules') count = Array.isArray(state['rules']) ? (state['rules'] as unknown[]).length : 0;
    else if (tabId === 'flags') count = Array.isArray(state['flags']) ? (state['flags'] as unknown[]).length : 0;
    else return '';
    return count ? `<span class="pom-tab__count">${count}</span>` : '';
  },

  renderStatsBar(stats: Record<string, unknown> | null | undefined) {
    if (!stats) return '';
    let breakdownHtml = '';
    if (stats['triggers_by_component'] && typeof stats['triggers_by_component'] === 'object') {
      const tbc = stats['triggers_by_component'] as Record<string, unknown>;
      for (const comp in tbc) {
        if (Object.prototype.hasOwnProperty.call(tbc, comp)) {
          breakdownHtml += `<span class="pom-stats__chip pom-stats__chip--${comp}">${comp}: ${tbc[comp]}</span>`;
        }
      }
    }
    return `<div class="pom-stats__item"><span class="pom-stats__value">${stats.total_triggers || 0}</span><span class="pom-stats__label">Triggers</span></div><div class="pom-stats__item"><span class="pom-stats__value">${stats.total_rules || 0}</span><span class="pom-stats__label">Rules</span></div><div class="pom-stats__item"><span class="pom-stats__value">${stats.total_flags || 0}</span><span class="pom-stats__label">Flags</span></div><div class="pom-stats__divider"></div><div class="pom-stats__breakdown">${breakdownHtml}</div>`;
  },

  renderLoading() { return '<div class="pom-loading"><div class="pom-loading__spinner"></div><span>Carregando...</span></div>'; },

  renderTabContent(state: PomState) {
    if (state.selectedTab === 'triggers') return this.renderTriggers(state);
    if (state.selectedTab === 'rules') return this.renderRules(state);
    if (state.selectedTab === 'flags') return this.renderFlags(state);
    if (state.selectedTab === 'metrics') return this.renderMetrics(state);
    if (state.selectedTab === 'timeline') return this.renderTimeline(state);
    if (state.selectedTab === 'audit') return this.renderAudit(state);
    return '<p>Tab nao encontrada</p>';
  },

  renderTriggers(state: PomState) {
    // @ts-expect-error strict migration — TS2345
    const items = this._filterItems(state.triggers || [], state);
    if (!items.length) return this.renderEmpty('triggers');
    let rows = '';
    for (const t of items) {
      rows += `<tr data-id="${t.id}"><td><code>${t.trigger_key}</code></td><td><code>${t.intent_id}</code></td><td><span class="pom-badge pom-badge--${t.component}">${t.component}</span></td><td>${t.label || '-'}</td><td><span class="pom-status ${t.is_active ? 'pom-status--active' : 'pom-status--inactive'}">${t.is_active ? 'Ativo' : 'Inativo'}</span></td><td class="pom-actions"><button class="pom-btn pom-btn--sm pom-btn--accent" data-action="simulate-trigger" data-trigger="${t.trigger_key}" data-intent="${t.intent_id}" title="Simular"><span class="pom-btn-icon">${ICONS.target}</span></button><button class="pom-btn pom-btn--sm" data-action="edit" data-type="trigger" data-id="${t.id}" title="Editar"><span class="pom-btn-icon">${ICONS.edit}</span></button><button class="pom-btn pom-btn--sm pom-btn--toggle" data-action="toggle" data-type="trigger" data-id="${t.id}" title="Toggle"><span class="pom-btn-icon">${t.is_active ? ICONS.bellOff : ICONS.bell}</span></button><button class="pom-btn pom-btn--sm pom-btn--danger" data-action="delete" data-type="trigger" data-id="${t.id}" title="Excluir"><span class="pom-btn-icon">${ICONS.trash}</span></button></td></tr>`;
    }
    return `<table class="pom-table"><thead><tr><th>Trigger Key</th><th>Intent</th><th>Component</th><th>Label</th><th>Status</th><th>Acoes</th></tr></thead><tbody>${rows}</tbody></table>`;
  },

  renderRules(state: PomState) {
    // @ts-expect-error strict migration — TS2345
    const items = this._filterItems(state.rules || [], state);
    if (!items.length) return this.renderEmpty('rules', 'Clique em "Novo" para criar uma rule');
    let rows = '';
    for (const r of items) {
      rows += `<tr data-id="${r.id}"><td><code>${r.rule_key}</code></td><td><code>${r.intent_id}</code></td><td><span class="pom-badge pom-badge--action">${r.action_type}</span></td><td><code>${r.target}</code></td><td><span class="pom-badge">${r.region || 'main'}</span></td><td>${r.priority}</td><td><span class="pom-status ${r.is_active ? 'pom-status--active' : 'pom-status--inactive'}">${r.is_active ? 'Ativo' : 'Inativo'}</span></td><td class="pom-actions"><button class="pom-btn pom-btn--sm" data-action="edit" data-type="rule" data-id="${r.id}" title="Editar"><span class="pom-btn-icon">${ICONS.edit}</span></button><button class="pom-btn pom-btn--sm pom-btn--toggle" data-action="toggle" data-type="rule" data-id="${r.id}" title="Toggle"><span class="pom-btn-icon">${r.is_active ? ICONS.bellOff : ICONS.bell}</span></button><button class="pom-btn pom-btn--sm pom-btn--danger" data-action="delete" data-type="rule" data-id="${r.id}" title="Excluir"><span class="pom-btn-icon">${ICONS.trash}</span></button></td></tr>`;
    }
    return `<table class="pom-table"><thead><tr><th>Rule Key</th><th>Intent</th><th>Action</th><th>Target</th><th>Region</th><th>Priority</th><th>Status</th><th>Acoes</th></tr></thead><tbody>${rows}</tbody></table>`;
  },

  renderFlags(state: PomState) {
    const items = (Array.isArray(state['flags']) ? state['flags'] : []) as PomItem[];
    if (!items.length) return this.renderEmpty('flags', 'Clique em "Novo" para criar uma flag');
    let rows = '';
    for (const f of items) {
      rows += `<tr data-id="${f.id}"><td><code>${f.flag_key}</code></td><td><span class="pom-badge">${f.scope_type}</span></td><td>${f.scope_value || '-'}</td><td><span class="pom-badge pom-badge--env-${f.environment}">${f.environment}</span></td><td><span class="pom-status ${f.is_enabled ? 'pom-status--active' : 'pom-status--inactive'}">${f.is_enabled ? 'ON' : 'OFF'}</span></td><td class="pom-actions"><button class="pom-btn pom-btn--sm" data-action="edit" data-type="flag" data-id="${f.id}" title="Editar"><span class="pom-btn-icon">${ICONS.edit}</span></button><button class="pom-btn pom-btn--sm pom-btn--toggle" data-action="toggle" data-type="flag" data-id="${f.id}" title="Toggle"><span class="pom-btn-icon">${f.is_enabled ? ICONS.bellOff : ICONS.bell}</span></button><button class="pom-btn pom-btn--sm pom-btn--danger" data-action="delete" data-type="flag" data-id="${f.id}" title="Excluir"><span class="pom-btn-icon">${ICONS.trash}</span></button></td></tr>`;
    }
    return `<table class="pom-table"><thead><tr><th>Flag Key</th><th>Scope</th><th>Scope Value</th><th>Environment</th><th>Status</th><th>Acoes</th></tr></thead><tbody>${rows}</tbody></table>`;
  },

  renderMetrics(_state: PomState) { return '<div class="pom-metrics-container" data-metrics-mount><div class="pom-timeline-loading"><div class="pom-loading__spinner"></div><span>Carregando Metrics...</span></div></div>'; },
  renderTimeline(_state: PomState) { return '<div class="pom-timeline-container" data-timeline-mount><div class="pom-timeline-loading"><div class="pom-loading__spinner"></div><span>Carregando Timeline...</span></div></div>'; },

  renderAudit(state: PomState) {
    const items = (Array.isArray(state['audit']) ? state['audit'] : []) as PomItem[];
    if (!items.length) return `<div class="pom-audit-placeholder"><p><span class="pom-icon">${ICONS.scroll}</span> Log de auditoria</p><button class="pom-btn" data-action="load-audit">Carregar Auditoria</button></div>`;
    let rows = '';
    for (const a of items) {
      rows += `<tr><td>${new Date(a['created_at'] as string | number).toLocaleString('pt-BR')}</td><td><span class="pom-badge">${a['action']}</span></td><td>${a['entity_type']}</td><td>${a['entity_id']}</td><td><code>${a['ip_address'] || '-'}</code></td></tr>`;
    }
    return `<table class="pom-table"><thead><tr><th>Data</th><th>Acao</th><th>Tipo</th><th>ID</th><th>IP</th></tr></thead><tbody>${rows}</tbody></table>`;
  },

  renderEmpty(type: string, hint?: string) { return `<div class="pom-empty"><span class="pom-empty__icon">${ICONS.inboxEmpty}</span><p>Nenhum ${type} encontrado</p>${hint ? `<small>${hint}</small>` : ''}</div>`; },

  renderTriggerModal(item?: PomItem) {
    const isEdit = !!item;
    let componentOptions = '';
    const comps = ['header', 'sidebar', 'navrail', 'footer', 'keyboard'];
    for (const c of comps) {
      componentOptions += `<option value="${c}" ${item?.component === c ? 'selected' : ''}>${c}</option>`;
    }
    return `<div class="pom-modal__header"><h2>${isEdit ? 'Editar' : 'Novo'} Trigger</h2><button class="pom-modal__close" data-action="close-modal">&times;</button></div><form class="pom-form" data-form="trigger"><input type="hidden" name="id" value="${item?.id || ''}"><div class="pom-form__row"><div class="pom-form__group"><label>Trigger Key *</label><input type="text" name="trigger_key" value="${item?.trigger_key || ''}" placeholder="header:btn-example" required ${isEdit ? 'readonly' : ''}></div><div class="pom-form__group"><label>Intent ID *</label><input type="text" name="intent_id" value="${item?.intent_id || ''}" placeholder="header.example" required></div></div><div class="pom-form__row"><div class="pom-form__group"><label>Component *</label><select name="component" required>${componentOptions}</select></div><div class="pom-form__group"><label>Label</label><input type="text" name="label" value="${item?.label || ''}" placeholder="Label exibido"></div></div><div class="pom-form__group pom-form__group--inline"><label><input type="checkbox" name="is_active" ${!item || item.is_active !== 0 ? 'checked' : ''}> Ativo</label><label><input type="checkbox" name="is_visible" ${!item || item.is_visible !== 0 ? 'checked' : ''}> Visivel</label></div><div class="pom-form__actions"><button type="button" class="pom-btn pom-btn--secondary" data-action="close-modal">Cancelar</button><button type="submit" class="pom-btn pom-btn--primary">${isEdit ? 'Salvar' : 'Criar'}</button></div></form>`;
  },

  renderRuleModal(item?: PomItem) {
    const isEdit = !!item;
    let actionOptions = '';
    for (const a of ACTION_TYPES) {
      actionOptions += `<option value="${a}" ${item?.action_type === a ? 'selected' : ''}>${a}</option>`;
    }
    let regionOptions = '';
    for (const r of REGIONS) {
      regionOptions += `<option value="${r}" ${item?.region === r ? 'selected' : ''}>${r}</option>`;
    }
    return `<div class="pom-modal__header"><h2>${isEdit ? 'Editar' : 'Nova'} Rule</h2><button class="pom-modal__close" data-action="close-modal">&times;</button></div><form class="pom-form" data-form="rule"><input type="hidden" name="id" value="${item?.id || ''}"><div class="pom-form__row"><div class="pom-form__group"><label>Rule Key *</label><input type="text" name="rule_key" value="${item?.rule_key || ''}" placeholder="nav-home" required ${isEdit ? 'readonly' : ''}></div><div class="pom-form__group"><label>Intent ID *</label><input type="text" name="intent_id" value="${item?.intent_id || ''}" placeholder="nav.home" required></div></div><div class="pom-form__row"><div class="pom-form__group"><label>Action Type *</label><select name="action_type" required>${actionOptions}</select></div><div class="pom-form__group"><label>Target *</label><input type="text" name="target" value="${item?.target || ''}" placeholder="home, panel-id, url..." required></div></div><div class="pom-form__row"><div class="pom-form__group"><label>Region</label><select name="region">${regionOptions}</select></div><div class="pom-form__group"><label>Priority</label><input type="number" name="priority" value="${item?.priority || 50}" min="0" max="100"></div></div><div class="pom-form__group pom-form__group--inline"><label><input type="checkbox" name="is_active" ${!item || item.is_active !== 0 ? 'checked' : ''}> Ativa</label></div><div class="pom-form__actions"><button type="button" class="pom-btn pom-btn--secondary" data-action="close-modal">Cancelar</button><button type="submit" class="pom-btn pom-btn--primary">${isEdit ? 'Salvar' : 'Criar'}</button></div></form>`;
  },

  renderFlagModal(item?: PomItem) {
    const isEdit = !!item;
    let scopeOptions = '';
    for (const s of SCOPE_TYPES) {
      scopeOptions += `<option value="${s}" ${item?.scope_type === s ? 'selected' : ''}>${s}</option>`;
    }
    let envOptions = '';
    for (const e of ENVIRONMENTS) {
      envOptions += `<option value="${e}" ${item?.environment === e ? 'selected' : ''}>${e}</option>`;
    }
    return `<div class="pom-modal__header"><h2>${isEdit ? 'Editar' : 'Nova'} Flag</h2><button class="pom-modal__close" data-action="close-modal">&times;</button></div><form class="pom-form" data-form="flag"><input type="hidden" name="id" value="${item?.id || ''}"><div class="pom-form__row"><div class="pom-form__group"><label>Flag Key *</label><input type="text" name="flag_key" value="${item?.flag_key || ''}" placeholder="ui.feature.name" required ${isEdit ? 'readonly' : ''}></div><div class="pom-form__group"><label>Scope Type *</label><select name="scope_type" required>${scopeOptions}</select></div></div><div class="pom-form__row"><div class="pom-form__group"><label>Scope Value</label><input type="text" name="scope_value" value="${item?.scope_value || ''}" placeholder="panel-id, route/*..."></div><div class="pom-form__group"><label>Environment</label><select name="environment">${envOptions}</select></div></div><div class="pom-form__group pom-form__group--inline"><label><input type="checkbox" name="is_enabled" ${!item || item.is_enabled !== 0 ? 'checked' : ''}> Habilitada</label></div><div class="pom-form__actions"><button type="button" class="pom-btn pom-btn--secondary" data-action="close-modal">Cancelar</button><button type="submit" class="pom-btn pom-btn--primary">${isEdit ? 'Salvar' : 'Criar'}</button></div></form>`;
  },

  renderSimulatorModal(triggers: PomItem[], lastResult: PomItem | null) { return simulator.renderSimulatorModal(triggers, lastResult); },
  renderSimulatorResult(result: PomItem) { return simulator.renderResult(result); },
  renderSimulatorExecuted(result: PomItem) { return simulator.renderExecutionResult(result); },

  _filterItems(items: PomItem[], state: PomState) {
    let filtered = items.slice();
    const searchTerm = typeof state['searchTerm'] === 'string' ? state['searchTerm'] : '';
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = items.filter((item: PomItem) => {
        const key = (String(item['trigger_key'] || item['rule_key'] || item['flag_key'] || '')).toLowerCase();
        const intent = (String(item['intent_id'] || '')).toLowerCase();
        const labelTarget = (String(item['label'] || item['target'] || '')).toLowerCase();
        return key.includes(term) || intent.includes(term) || labelTarget.includes(term);
      });
    }
    const filterComponent = typeof state['filterComponent'] === 'string' ? state['filterComponent'] : '';
    if (filterComponent && filterComponent !== 'all') {
      filtered = filtered.filter((item: PomItem) => item['component'] === filterComponent);
    }
    return filtered;
  }
};

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default ui;
