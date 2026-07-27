const VERSION = "1.0.0-MODULAR";
const MODULE_ID = "container-main:devtools-panel:helpers";
function formatStatus(status) {
  const statusClass = status?.toLowerCase() || "unknown";
  return `<span class="cm-devtools-status ${statusClass}">${status || "UNKNOWN"}</span>`;
}
function createElement(tag, className, content = "") {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content) el.innerHTML = content;
  return el;
}
function formatTimestamp(date = /* @__PURE__ */ new Date()) {
  return date.toLocaleTimeString();
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ["formatStatus", "createElement", "formatTimestamp"]
  };
}
var helpers_default = {
  VERSION,
  MODULE_ID,
  formatStatus,
  createElement,
  formatTimestamp,
  info
};
export {
  MODULE_ID,
  VERSION,
  createElement,
  helpers_default as default,
  formatStatus,
  formatTimestamp,
  info
};
