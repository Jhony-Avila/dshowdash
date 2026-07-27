const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-nav-admin:renderer:tabs";
function switchTab(refs, tabId) {
  if (!tabId) return;
  var tabsEl = refs?.tabs || document.querySelector(".pna-tabs");
  if (tabsEl) {
    tabsEl.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.classList.toggle("pna-tab-active", btn.dataset.tab === tabId);
    });
  }
  if (refs?.tabContents) {
    Object.entries(refs.tabContents).forEach(([key, content]) => {
      if (content) content.classList.toggle("pna-tab-content-active", key === tabId);
    });
  } else {
    document.querySelectorAll(".pna-tab-content[data-tab-content]").forEach((el) => {
      const key = el.dataset.tabContent;
      el.classList.toggle("pna-tab-content-active", key === tabId);
      el.style.display = key === tabId ? "" : "none";
    });
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
var tabs_default = { switchTab, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  tabs_default as default,
  healthCheck,
  info,
  switchTab
};
