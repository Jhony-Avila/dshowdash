// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail/ui/template
// PURPOSE: NavRail Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   NavRailTemplate — exported value
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   (none)
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '5.1.0-ES6';
export const MODULE_ID = 'navrail/ui/template';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

interface NavRailItem {
  id: string;
  group: string;
  order?: number;
  hidden?: boolean;
  [key: string]: unknown;
}

interface NavRailGroup {
  id: string;
  order: number;
  [key: string]: unknown;
}

interface NavRailRenderOptions {
  groups?: NavRailGroup[];
  items?: NavRailItem[];
  mode?: 'desktop' | 'mobile';
  mobileItems?: string[];
}

export const NavRailTemplate = {
  renderItemSlot(item: NavRailItem): string {
    return `<div class="nav-rail__item-host" data-host-id="${item.id}" data-group="${item.group}" data-order="${item.order || 0}"></div>`;
  },

  renderGroup(group: NavRailGroup, items: NavRailItem[]): string {
    const self = this;
    const groupItems = items
      .filter((item: NavRailItem) => item.group === group.id && !item.hidden)
      .sort((a: NavRailItem, b: NavRailItem) => (a.order || 0) - (b.order || 0));
    if (groupItems.length === 0) return '';
    const slots = groupItems.map((item: NavRailItem) => self.renderItemSlot(item)).join('');
    return `<div class="nav-rail__group" data-group-id="${group.id}">${slots}</div>`;
  },

  render(opts: NavRailRenderOptions): string {
    const groups = opts.groups || [];
    const items = opts.items || [];
    const mode = opts.mode || 'desktop';
    const mobileItems = opts.mobileItems || [];
    if (mode === 'mobile') {
      return this.renderMobile(items, mobileItems);
    }
    return this.renderDesktop(groups, items);
  },

  renderDesktop(groups: NavRailGroup[], items: NavRailItem[]): string {
    const self = this;
    const sortedGroups = groups.slice().sort((a: NavRailGroup, b: NavRailGroup) => a.order - b.order);
    const mainGroups = sortedGroups.filter((g: NavRailGroup) => g.id !== 'system');
    const systemGroup = sortedGroups.find((g: NavRailGroup) => g.id === 'system');
    const mainContent = mainGroups.map((group: NavRailGroup) => self.renderGroup(group, items)).join('');
    const footerContent = systemGroup ? `<div class="nav-rail__footer">${this.renderGroup(systemGroup, items)}</div>` : '';
    return `<nav class="nav-rail nav-rail--desktop" role="navigation" aria-label="Navegação principal" data-uarps-region="region:app:navrail"><div class="nav-rail__main">${mainContent}</div>${footerContent}</nav>`;
  },

  renderMobile(items: NavRailItem[], mobileItemIds: string[]): string {
    const self = this;
    const mobileItems = mobileItemIds
      .map((id: string) => items.find((item: NavRailItem) => item.id === id))
      .filter(Boolean) as NavRailItem[];
    const slots = mobileItems.map((item: NavRailItem) => self.renderItemSlot(item)).join('');
    return `<nav class="nav-rail nav-rail--mobile" role="navigation" aria-label="Navegação mobile" data-uarps-region="region:app:navrail"><div class="nav-rail__mobile-items">${slots}</div></nav>`;
  },

  getHosts(root: HTMLElement | null): Element[] {
    if (!root) return [];
    return Array.from(root.querySelectorAll('[data-host-id]'));
  },

  getHost(root: HTMLElement | null, itemId: string): Element | null {
    if (!root) return null;
    return root.querySelector(`[data-host-id="${itemId}"]`);
  },

  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      portsInitialized: Ports.isInitialized(),
      capabilities: ['renderItemSlot', 'renderGroup', 'render', 'renderDesktop', 'renderMobile', 'getHosts', 'getHost']
    };
  },

  healthCheck() {
    const checks = {
      renderItemSlotWorks: typeof this.renderItemSlot === 'function',
      renderGroupWorks: typeof this.renderGroup === 'function',
      renderWorks: typeof this.render === 'function',
      portsInitialized: Ports.isInitialized()
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
      status: passed === total ? 'HEALTHY' : 'DEGRADED',
      score: `${passed}/${total}`,
      checks,
      version: VERSION,
      moduleId: MODULE_ID
    };
  }
};

export default NavRailTemplate;
