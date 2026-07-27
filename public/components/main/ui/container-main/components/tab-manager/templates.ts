// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-DI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-tab-manager-templates
// PURPOSE: Tab Manager - Templates
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createTabBarHTML() — exported function
//   createTabElementHTML() — exported function
//   createTabPanelHTML() — exported function
//   createRenameInputHTML() — exported function
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

export const VERSION = '8.1.0-DI-STRICT';
export const MODULE_ID = 'container-tab-manager-templates';

export function createTabBarHTML() {
  return `
    <div class="dsd-tab-bar__tabs" data-slot="tabs"></div>
    <div class="dsd-tab-bar__actions">
      <button type="button" class="dsd-tab-bar__add" aria-label="Nova aba" title="Nova aba">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  `;
}

export function createTabElementHTML(tab: Record<string, unknown>, options: Record<string, unknown> = {}) {
  const { closableTabs = true, draggableTabs = true } = options;
  const iconHTML = (tab as Record<string, unknown>).icon ? `<span class="dsd-tab__icon">${(tab as Record<string, unknown>).icon}</span>` : '';
  const badgeHTML = (tab as Record<string, unknown>).badge ? `<span class="dsd-tab__badge">${(tab as Record<string, unknown>).badge}</span>` : '';
  const closeHTML = closableTabs && (tab as Record<string, unknown>).closable !== false ? `
    <button type="button" class="dsd-tab__close" aria-label="Fechar aba" title="Fechar">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  ` : '';
  return `${iconHTML}<span class="dsd-tab__title">${(tab as Record<string, unknown>).title}</span>${badgeHTML}${closeHTML}`;
}

export function createTabPanelHTML(tab: Record<string, unknown>) {
  if (!(tab as Record<string, unknown>).content) return '';
  if (typeof (tab as Record<string, unknown>).content === 'string') return (tab as Record<string, unknown>).content;
  return '';
}

export function createRenameInputHTML(value: string) {
  return `<input type="text" class="dsd-tab__input" value="${value}">`;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { templatesReady: true } };
}

export default { createTabBarHTML, createTabElementHTML, createTabPanelHTML, createRenameInputHTML, info, healthCheck, VERSION, MODULE_ID };
