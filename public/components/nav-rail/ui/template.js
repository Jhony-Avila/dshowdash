import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.1.0-ES6";
const MODULE_ID = "navrail/ui/template";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const NavRailTemplate = {
  renderItemSlot(item) {
    return `<div class="nav-rail__item-host" data-host-id="${item.id}" data-group="${item.group}" data-order="${item.order || 0}"></div>`;
  },
  renderGroup(group, items) {
    const self = this;
    const groupItems = items.filter((item) => item.group === group.id && !item.hidden).sort((a, b) => (a.order || 0) - (b.order || 0));
    if (groupItems.length === 0) return "";
    const slots = groupItems.map((item) => self.renderItemSlot(item)).join("");
    return `<div class="nav-rail__group" data-group-id="${group.id}">${slots}</div>`;
  },
  render(opts) {
    const groups = opts.groups || [];
    const items = opts.items || [];
    const mode = opts.mode || "desktop";
    const mobileItems = opts.mobileItems || [];
    if (mode === "mobile") {
      return this.renderMobile(items, mobileItems);
    }
    return this.renderDesktop(groups, items);
  },
  renderDesktop(groups, items) {
    const self = this;
    const sortedGroups = groups.slice().sort((a, b) => a.order - b.order);
    const mainGroups = sortedGroups.filter((g) => g.id !== "system");
    const systemGroup = sortedGroups.find((g) => g.id === "system");
    const mainContent = mainGroups.map((group) => self.renderGroup(group, items)).join("");
    const footerContent = systemGroup ? `<div class="nav-rail__footer">${this.renderGroup(systemGroup, items)}</div>` : "";
    return `<nav class="nav-rail nav-rail--desktop" role="navigation" aria-label="Navega\xE7\xE3o principal" data-uarps-region="region:app:navrail"><div class="nav-rail__main">${mainContent}</div>${footerContent}</nav>`;
  },
  renderMobile(items, mobileItemIds) {
    const self = this;
    const mobileItems = mobileItemIds.map((id) => items.find((item) => item.id === id)).filter(Boolean);
    const slots = mobileItems.map((item) => self.renderItemSlot(item)).join("");
    return `<nav class="nav-rail nav-rail--mobile" role="navigation" aria-label="Navega\xE7\xE3o mobile" data-uarps-region="region:app:navrail"><div class="nav-rail__mobile-items">${slots}</div></nav>`;
  },
  getHosts(root) {
    if (!root) return [];
    return Array.from(root.querySelectorAll("[data-host-id]"));
  },
  getHost(root, itemId) {
    if (!root) return null;
    return root.querySelector(`[data-host-id="${itemId}"]`);
  },
  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      portsInitialized: Ports.isInitialized(),
      capabilities: ["renderItemSlot", "renderGroup", "render", "renderDesktop", "renderMobile", "getHosts", "getHost"]
    };
  },
  healthCheck() {
    const checks = {
      renderItemSlotWorks: typeof this.renderItemSlot === "function",
      renderGroupWorks: typeof this.renderGroup === "function",
      renderWorks: typeof this.render === "function",
      portsInitialized: Ports.isInitialized()
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
      status: passed === total ? "HEALTHY" : "DEGRADED",
      score: `${passed}/${total}`,
      checks,
      version: VERSION,
      moduleId: MODULE_ID
    };
  }
};
var template_default = NavRailTemplate;
export {
  MODULE_ID,
  NavRailTemplate,
  VERSION,
  template_default as default,
  getPorts,
  injectPorts
};
