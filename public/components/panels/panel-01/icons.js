import { IconRegistry } from "/components/icon-registry/index.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/icons";
function getIcon(name, size = 16) {
  const namespaces = ["extended", "ui", "system", "charts", "business"];
  for (const ns of namespaces) {
    const svg = IconRegistry.get(`${ns}:${name}`);
    if (svg) return svg.replace(/width="24"/g, `width="${size}"`).replace(/height="24"/g, `height="${size}"`);
  }
  return "";
}
const NAME_MAP = {
  "document": "file-document",
  "folderOpen": "folder-open",
  "cloudUpload": "cloud-upload",
  "hdd": "hard-drive",
  "checkCircle": "check-circle",
  "alertCircle": "alert-circle",
  "alertTriangle": "alert-triangle",
  "recent": "clock",
  "checkSquare": "check-square",
  "sortAsc": "sort-asc",
  "sortDesc": "sort-desc",
  "pieChart": "pie",
  "barChart": "bar",
  "zoomIn": "zoom-in",
  "zoomOut": "zoom-out",
  "fileInfo": "file-info"
};
const ICONS = new Proxy({}, {
  get(target, prop) {
    if (prop === "then") return void 0;
    const key = typeof prop === "string" ? prop : String(prop);
    return getIcon(NAME_MAP[key] || key, 16);
  },
  has() {
    return true;
  }
});
function getFileIcon(type) {
  const map = { "image": "image", "video": "video", "audio": "audio", "document": "file-document", "other": "archive" };
  return getIcon(map[type] || "file", 16);
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, source: "IconRegistry" };
}
var icons_default = ICONS;
export {
  ICONS,
  MODULE_ID,
  VERSION,
  icons_default as default,
  getFileIcon,
  healthCheck,
  info
};
