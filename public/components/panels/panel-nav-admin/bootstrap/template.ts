// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin/bootstrap/template
// PURPOSE: Panel Nav Admin - Bootstrap Template
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getShellHTML() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-nav-admin/bootstrap/template';

const SVG_DEFS = `<svg style="display:none"><defs><symbol id="icon-menu" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></symbol><symbol id="icon-plus" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></symbol><symbol id="icon-edit" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></symbol><symbol id="icon-trash" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></symbol><symbol id="icon-save" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></symbol><symbol id="icon-refresh" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></symbol><symbol id="icon-x" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></symbol><symbol id="icon-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></symbol><symbol id="icon-alert" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></symbol><symbol id="icon-folder" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></symbol><symbol id="icon-grip" viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></symbol></defs></svg>`;

export const getShellHTML = () => `${SVG_DEFS}<div class="nav-admin-panel" data-component="panel-nav-admin" data-version="${VERSION}"><header class="nav-admin-header"><div class="nav-admin-title"><svg class="nav-admin-icon" width="20" height="20"><use href="#icon-menu"/></svg><h2>Gerenciador de Navegação</h2><span class="nav-admin-version">${VERSION}</span></div><div class="nav-admin-actions"><button class="nav-admin-btn nav-admin-btn--icon" data-action="refresh" title="Atualizar"><svg width="16" height="16"><use href="#icon-refresh"/></svg></button><button class="nav-admin-btn nav-admin-btn--primary" data-action="add-item"><svg width="16" height="16"><use href="#icon-plus"/></svg><span>Novo Item</span></button></div></header><div class="nav-admin-toolbar"><div class="nav-admin-filter"><select class="nav-admin-select" data-filter="section"><option value="all">Todas as Seções</option></select></div><div class="nav-admin-search"><input type="text" class="nav-admin-input" placeholder="Buscar itens..." data-filter="search"></div></div><div class="nav-admin-content"><div class="nav-admin-list" data-region="items-list"></div><div class="nav-admin-empty" data-region="empty-state" style="display:none"><svg width="48" height="48"><use href="#icon-folder"/></svg><p>Nenhum item encontrado</p></div></div><div class="nav-admin-loading" data-region="loading" style="display:none"><div class="nav-admin-spinner"></div><span>Carregando...</span></div></div>`;

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { templateReady: true } });
export default { getShellHTML, info, healthCheck, VERSION, MODULE_ID };
