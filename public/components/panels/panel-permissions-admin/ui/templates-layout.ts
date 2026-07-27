// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-templates-layout
// PURPOSE: UARPS Admin - Layout Template
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Icons from ./icons.js
//   skeletonUserGrid, skeletonUserFocus, skeletonMatrix from ./templates-skeleton...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   layout() — exported function
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
import { Icons } from './icons.js';
import { skeletonUserGrid, skeletonUserFocus, skeletonMatrix } from './templates-skeletons.js';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-templates-layout';
const SORT_SVGS = {
  asc: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="18 15 12 9 6 15"/></svg>',
  desc: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="6 9 12 15 18 9"/></svg>'
};
export const layout = () => `<div class="uarps-panel" data-panel="permissions-admin"><header class="uarps-header"><div class="uarps-header__brand"><div class="uarps-header__icon">${Icons.shield}</div><div class="uarps-header__title"><h1>UARPS</h1><span class="uarps-header__subtitle">User Action & Region Permission System</span></div></div><div class="uarps-header__badges"><span class="uarps-badge uarps-badge--critical">${Icons.lock} GOVERNANÇA</span><span class="uarps-badge uarps-badge--system">${Icons.cpu} SISTEMA CRÍTICO</span></div><div class="uarps-header__actions"><button class="uarps-btn uarps-btn--ghost uarps-tooltip" data-action="undo" data-tooltip="Desfazer (Ctrl+Z)" disabled>${Icons.undo} <span>Desfazer</span></button><button class="uarps-btn uarps-btn--ghost uarps-tooltip" data-action="redo" data-tooltip="Refazer (Ctrl+Y)" disabled>${Icons.redo} <span>Refazer</span></button><button class="uarps-btn uarps-btn--ghost uarps-tooltip" data-action="sync-inventory" data-tooltip="Sincronizar triggers do DOM">${Icons.refresh} <span>Sync</span></button><button class="uarps-btn uarps-btn--ghost uarps-tooltip" data-action="refresh" data-tooltip="Recarregar dados">${Icons.reload} <span>Atualizar</span></button></div></header><section class="uarps-users"><div class="uarps-users__header"><h2>${Icons.users} Usuários</h2><span class="uarps-users__hint">Selecione um usuário para gerenciar permissões</span><div class="uarps-users__filters"><select data-action="filter-status" class="uarps-select uarps-select--sm uarps-tooltip" data-tooltip="Filtrar por status"><option value="all">Todos</option><option value="active">Ativos</option><option value="inactive">Inativos</option><option value="with-perms">Com permissões</option><option value="without-perms">Sem permissões</option></select><select data-action="sort-users" class="uarps-select uarps-select--sm uarps-tooltip" data-tooltip="Ordenar"><option value="name">Nome A-Z</option><option value="name-desc">Nome Z-A</option><option value="level-desc">Nível ${SORT_SVGS.desc}</option><option value="level">Nível ${SORT_SVGS.asc}</option></select></div></div><div class="uarps-users__grid" data-slot="user-grid">${skeletonUserGrid(8)}</div></section><main class="uarps-main"><aside class="uarps-focus" data-slot="user-focus">${skeletonUserFocus()}</aside><section class="uarps-matrix-wrapper"><div class="uarps-toolbar"><div class="uarps-search">${Icons.search}<input type="text" placeholder="Buscar triggers ou regiões..." data-action="search" class="uarps-search__input"></div><div class="uarps-filters"><select data-action="filter-type" class="uarps-select"><option value="all">Todas as áreas</option><option value="navrail">NavRail</option><option value="sidebar">Sidebar</option><option value="footer">Footer</option><option value="header">Header</option><option value="panel">Painéis</option></select></div><div class="uarps-view-toggle"><button class="uarps-btn uarps-btn--sm uarps-btn--active" data-view="matrix">Triggers</button><button class="uarps-btn uarps-btn--sm" data-view="regions">Regiões</button><button class="uarps-btn uarps-btn--sm uarps-tooltip" data-view="minimap" data-tooltip="Visão compacta">${Icons.minimap}</button></div><div class="uarps-bulk-actions" data-slot="bulk-actions" style="display:none"><span class="uarps-bulk-count">0 selecionados</span><button class="uarps-btn uarps-btn--sm uarps-btn--success" data-action="bulk-grant">${Icons.check} Liberar</button><button class="uarps-btn uarps-btn--sm uarps-btn--danger" data-action="bulk-revoke">${Icons.x} Revogar</button><button class="uarps-btn uarps-btn--sm uarps-btn--ghost" data-action="bulk-clear">Limpar</button></div></div><div class="uarps-matrix" data-slot="permission-matrix">${skeletonMatrix(3, 5)}</div></section></main><footer class="uarps-footer"><div class="uarps-stats" data-slot="stats"></div><div class="uarps-cache-indicator" data-slot="cache"></div></footer></div><div class="uarps-modal" data-modal="confirm" style="display:none"><div class="uarps-modal__backdrop" data-action="modal-close"></div><div class="uarps-modal__content"><div class="uarps-modal__header"><h3 data-slot="modal-title">${Icons.alertTriangle} Confirmar Ação</h3><button class="uarps-modal__close" data-action="modal-close">${Icons.x}</button></div><div class="uarps-modal__body" data-slot="modal-body"><p>Tem certeza?</p></div><div class="uarps-modal__footer"><div class="uarps-modal__reason"><label>Motivo (obrigatório):</label><input type="text" data-input="reason" placeholder="Digite o motivo..." class="uarps-input"></div><div class="uarps-modal__actions"><button class="uarps-btn uarps-btn--ghost" data-action="modal-cancel">Cancelar</button><button class="uarps-btn uarps-btn--danger" data-action="modal-confirm" disabled>Confirmar</button></div></div></div></div>`;
export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { layoutReady: true } });
