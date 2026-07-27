// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: render-sections
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   renderSection() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { Templates } from './templates.js';

export const MODULE_ID = 'panel-permissions-admin.ui.render-sections';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export function renderSection(container: HTMLElement, { title, content, collapsible = false, expanded = true }: { title: string; content: string; collapsible?: boolean; expanded?: boolean }) {
    const html = `
        <div class="permissions-section ${collapsible ? 'collapsible' : ''} ${expanded ? 'expanded' : ''}">
            <div class="section-header">
                <h4 class="section-title">${title}</h4>
                ${collapsible ? '<button class="btn-toggle"><i class="fas fa-chevron-down"></i></button>' : ''}
            </div>
            <div class="section-content">${content}</div>
        </div>
    `;
    if (container instanceof HTMLElement) {
        container.innerHTML = html;
        if (collapsible) {
            // @ts-expect-error strict migration — TS2769
            container.querySelector('.btn-toggle')?.addEventListener('click', toggleSection);
        }
    }
    return html;
}

function toggleSection(e: MouseEvent) {
    const section = (e.target as Element).closest('.permissions-section');
    section?.classList.toggle('expanded');
}

export function renderUsers(elements: Record<string, HTMLElement | null>, store: Record<string, unknown>) {
  if (!elements || !elements.userGrid) return;
  const state = (store.getState as () => Record<string, unknown>)();
  const users = (state.users as Record<string, unknown>[]) || [];
  const selectedUser = state.selectedUser as Record<string, unknown> | null;
  const selectedId = selectedUser?.id || null;
  const html = users.map((u: Record<string, unknown>) => (Templates as unknown as Record<string, Function>).userCard(u, u.id === selectedId)).join('');
  elements.userGrid.innerHTML = html || '<div class="uarps-empty">Nenhum usuário encontrado</div>';
}

export function highlightSelectedUser(elements: Record<string, HTMLElement | null>, store: Record<string, unknown>) {
  if (!elements || !elements.userGrid) return;
  const state = (store.getState as () => Record<string, unknown>)();
  const selectedUser = state.selectedUser as Record<string, unknown> | null;
  const selectedId = selectedUser?.id || null;
  const cards = elements.userGrid.querySelectorAll('[data-user-id]');
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i] as HTMLElement;
    card.classList.toggle('uarps-user--selected', (card as HTMLElement & { dataset: DOMStringMap }).dataset.userId === String(selectedId));
  }
}

export function renderUserFocus(elements: Record<string, HTMLElement | null>, store: Record<string, unknown>) {
  if (!elements || !elements.userFocus) return;
  const state = (store.getState as () => Record<string, unknown>)();
  const user = state.selectedUser;
  const T = Templates as unknown as Record<string, Function>;
  if (!user) { elements.userFocus.innerHTML = T.userFocusEmpty(); return; }
  const perms = { triggers: state.triggers || [], regions: state.regions || [] };
  elements.userFocus.innerHTML = T.userFocus(user, perms);
}

export function renderMatrix(elements: Record<string, HTMLElement | null>, store: Record<string, unknown>) {
  if (!elements || !elements.matrix) return;
  const state = (store.getState as () => Record<string, unknown>)();
  const triggers = (state.triggers as unknown[]) || [];
  const user = state.selectedUser;
  const T = Templates as unknown as Record<string, Function>;
  if (!user || !triggers.length) {
    elements.matrix.innerHTML = T.matrixEmpty ? T.matrixEmpty() : '<div class="uarps-matrix__empty">Selecione um usuário</div>';
    return;
  }
  const regions = state.regions || [];

  elements.matrix.innerHTML = T.regionMatrix ? T.regionMatrix(triggers, regions, user) : '';
}

export function renderStats(elements: Record<string, HTMLElement | null>, store: Record<string, unknown>) {
  if (!elements || !elements.stats) return;
  const state = (store.getState as () => Record<string, unknown>)();
  const T = Templates as unknown as Record<string, Function>;
  const selectedUser = state.selectedUser as Record<string, unknown> | null;
  const data = {
    totalUsers: ((state.users as unknown[]) || []).length,
    totalTriggers: ((state.triggers as unknown[]) || []).length,
    totalRegions: ((state.regions as unknown[]) || []).length,
    selectedTriggers: 0,
    selectedRegions: 0
  };
  if (selectedUser) {
    data.selectedTriggers = ((selectedUser.triggers as unknown[]) || []).length;
    data.selectedRegions = ((selectedUser.regions as unknown[]) || []).length;
  }
  elements.stats.innerHTML = T.stats(data);
}

export function renderLoadingState(container: HTMLElement, store: Record<string, unknown>) {
  if (!container) return;
  const state = (store.getState as () => Record<string, unknown>)();
  const loading = state.loading;
  const overlay = container.querySelector('.uarps-loading-overlay');
  if (loading) {
    if (!overlay) {
      const el = document.createElement('div');
      el.className = 'uarps-loading-overlay';
      el.innerHTML = '<div class="uarps-spinner"></div>';
      container.appendChild(el);
    }
  } else if (overlay) {
    overlay.remove();
  }
}

export default { renderSection, renderUsers, highlightSelectedUser, renderUserFocus, renderMatrix, renderStats, renderLoadingState };
