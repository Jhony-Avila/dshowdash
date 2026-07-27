// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin:renderer:tabs
// PURPOSE: Panel Nav Admin Tabs Renderer - AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   switchTab() — exported function
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
export const MODULE_ID = 'panel-nav-admin:renderer:tabs';

interface TabRefs {
  tabs?: HTMLElement | null;
  tabContents?: Record<string, HTMLElement | null>;
  [key: string]: unknown;
}

export function switchTab(refs: TabRefs, tabId: string) {
  if (!tabId) return;
  // v9.4.0-TABS-FIX: suporta refs.tabs ausente — busca direto no DOM
  var tabsEl = refs?.tabs || document.querySelector('.pna-tabs');
  if (tabsEl) {
    tabsEl.querySelectorAll('[data-tab]').forEach((btn: Element) => {
      btn.classList.toggle('pna-tab-active', (btn as HTMLElement).dataset.tab === tabId);
    });
  }
  // tabContents via refs ou DOM
  if (refs?.tabContents) {
    Object.entries(refs.tabContents).forEach(([key, content]: [string, HTMLElement | null]) => {
      if (content) content.classList.toggle('pna-tab-content-active', key === tabId);
    });
  } else {
    // Fallback: buscar direto no DOM
    document.querySelectorAll('.pna-tab-content[data-tab-content]').forEach((el: Element) => {
      const key = (el as HTMLElement).dataset.tabContent;
      el.classList.toggle('pna-tab-content-active', key === tabId);
      (el as HTMLElement).style.display = key === tabId ? '' : 'none';
    });
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }

export default { switchTab, info, healthCheck, VERSION, MODULE_ID };
