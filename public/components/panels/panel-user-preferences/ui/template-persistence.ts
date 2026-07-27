// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences-ui-template-persistence
// PURPOSE: Panel User Preferences - Persistence Template
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION as CONSTANTS_VERSION, ICONS from ../core/constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderPersistenceSection() — exported function
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

import { VERSION as CONSTANTS_VERSION, ICONS } from '../core/constants.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-preferences-ui-template-persistence';

interface LayoutItem {
  layout_key: string;
  is_active?: boolean;
  is_default?: boolean;
}

interface LayoutsData {
  items?: LayoutItem[];
}

interface ViewItem {
  id: string | number;
  view_label: string;
  is_default?: boolean;
  is_shared?: boolean;
  is_owner?: boolean;
}

const _s = (str: string | null | undefined) => !str ? '' : String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const renderPersistenceSection = (layouts: LayoutsData | LayoutItem[], savedViews: ViewItem[]) => {
  const layoutItems: LayoutItem[] = Array.isArray(layouts) ? layouts : (layouts?.items ?? []);
  const viewItems = savedViews || [];
  return `<section class="pup-section" aria-labelledby="persistence-title"><div class="pup-sec-hdr"><div class="pup-sec-left"><div class="pup-sec-icon blue">${ICONS.database}</div><h2 id="persistence-title" class="pup-sec-title">Dados Persistentes</h2></div></div><div class="pup-persist-grid">${renderLayoutsCard(layoutItems)}${renderViewsCard(viewItems)}${renderBackupCard()}</div></section>`;
};

const renderLayoutsCard = (layouts: LayoutItem[]) => {
  const count = layouts.length;
  let content = '';
  if (count === 0) {
    content = `<div class="pup-empty"><div class="pup-empty-icon">${ICONS.layout}</div><h4 class="pup-empty-title">Nenhum Layout</h4><p class="pup-empty-text">Salve o layout atual para acessar rapidamente</p></div>`;
  } else {
    content = layouts.slice(0, 5).map((l: LayoutItem, i: number) => `<div class="pup-item ${l.is_active ? 'pup-slide-in' : ''}" data-layout-key="${_s(l.layout_key)}" draggable="true" style="animation-delay:${i * 50}ms"><div class="pup-item-grip" aria-hidden="true">${ICONS.gripVertical}</div><div class="pup-item-icon">${ICONS.layout}</div><div class="pup-item-info"><span class="pup-item-name">${_s(l.layout_key)}</span><div class="pup-item-meta">${l.is_default ? `<span class="pup-item-badge default">${ICONS.star} Padrão</span>` : ''}${l.is_active ? '<span class="pup-item-badge active">Ativo</span>' : ''}</div></div><div class="pup-item-actions"><button type="button" class="pup-item-btn" data-action="apply-layout" aria-label="Aplicar ${_s(l.layout_key)}">${ICONS.check}</button><button type="button" class="pup-item-btn danger" data-action="delete-layout" aria-label="Excluir ${_s(l.layout_key)}">${ICONS.trash}</button></div></div>`).join('');
  }
  return `<div class="pup-persist-card"><div class="pup-persist-hdr"><span class="pup-persist-title">${ICONS.layout} Layouts</span><span class="pup-persist-count">${count}</span></div><div class="pup-persist-body">${content}<div class="pup-input-row"><input type="text" class="pup-input" placeholder="Nome do layout" data-input="new-layout-name" aria-label="Nome do novo layout"><button type="button" class="pup-btn primary" data-action="save-current-layout">${ICONS.plus}</button></div></div></div>`;
};

const renderViewsCard = (views: ViewItem[]) => {
  const count = views.length;
  let content = '';
  if (count === 0) {
    content = `<div class="pup-empty"><div class="pup-empty-icon">${ICONS.eye}</div><h4 class="pup-empty-title">Nenhuma View</h4><p class="pup-empty-text">Views salvam filtros e configurações</p></div>`;
  } else {
    content = views.slice(0, 5).map((v: ViewItem, i: number) => `<div class="pup-item" data-view-id="${v.id}" style="animation-delay:${i * 50}ms"><div class="pup-item-icon">${ICONS.eye}</div><div class="pup-item-info"><span class="pup-item-name">${_s(v.view_label)}</span><div class="pup-item-meta">${v.is_default ? `<span class="pup-item-badge default">${ICONS.star} Padrão</span>` : ''}${v.is_shared ? '<span class="pup-item-badge recent">Compartilhada</span>' : ''}</div></div><div class="pup-item-actions"><button type="button" class="pup-item-btn" data-action="apply-view" aria-label="Aplicar ${_s(v.view_label)}">${ICONS.check}</button>${v.is_owner !== false ? `<button type="button" class="pup-item-btn danger" data-action="delete-view" aria-label="Excluir ${_s(v.view_label)}">${ICONS.trash}</button>` : ''}</div></div>`).join('');
  }
  return `<div class="pup-persist-card"><div class="pup-persist-hdr"><span class="pup-persist-title">${ICONS.eye} Views</span><span class="pup-persist-count">${count}</span></div><div class="pup-persist-body">${content}</div></div>`;
};

const renderBackupCard = () => {
  const now = new Date();
  const lastBackup = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  return `<div class="pup-persist-card"><div class="pup-persist-hdr"><span class="pup-persist-title">${ICONS.download} Backup</span></div><div class="pup-persist-body"><div class="pup-backup-header"><div class="pup-backup-ring"><svg viewBox="0 0 36 36" width="32" height="32"><circle class="pup-backup-ring-bg" cx="18" cy="18" r="13"/><circle class="pup-backup-ring-progress" cx="18" cy="18" r="13"/></svg><span class="pup-backup-ring-text">75%</span></div><div class="pup-backup-info"><h4 class="pup-backup-title">Dados Sincronizados</h4><p class="pup-backup-meta">Último backup: ${lastBackup}</p></div></div><div class="pup-backup-actions"><button type="button" class="pup-btn secondary" data-action="export">${ICONS.download} Exportar</button><button type="button" class="pup-btn ghost" data-action="import">${ICONS.upload} Importar</button><input type="file" accept=".json" data-input="import-file" style="display:none"></div><p class="pup-backup-version">${ICONS.hash} Versão ${CONSTANTS_VERSION}</p></div></div>`;
};

export const info = () => ({ moduleId: MODULE_ID, version: VERSION, p25Compliant: true });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { templatePersistenceReady: true }, p25Compliant: true });

export default { renderPersistenceSection, info, healthCheck };
