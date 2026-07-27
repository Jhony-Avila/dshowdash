const VERSION = "8.1.0-DI-STRICT";
const MODULE_ID = "container-tab-manager-templates";
function createTabBarHTML() {
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
function createTabElementHTML(tab, options = {}) {
  const { closableTabs = true, draggableTabs = true } = options;
  const iconHTML = tab.icon ? `<span class="dsd-tab__icon">${tab.icon}</span>` : "";
  const badgeHTML = tab.badge ? `<span class="dsd-tab__badge">${tab.badge}</span>` : "";
  const closeHTML = closableTabs && tab.closable !== false ? `
    <button type="button" class="dsd-tab__close" aria-label="Fechar aba" title="Fechar">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  ` : "";
  return `${iconHTML}<span class="dsd-tab__title">${tab.title}</span>${badgeHTML}${closeHTML}`;
}
function createTabPanelHTML(tab) {
  if (!tab.content) return "";
  if (typeof tab.content === "string") return tab.content;
  return "";
}
function createRenameInputHTML(value) {
  return `<input type="text" class="dsd-tab__input" value="${value}">`;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { templatesReady: true } };
}
var templates_default = { createTabBarHTML, createTabElementHTML, createTabPanelHTML, createRenameInputHTML, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createRenameInputHTML,
  createTabBarHTML,
  createTabElementHTML,
  createTabPanelHTML,
  templates_default as default,
  healthCheck,
  info
};
