import { UPDATE_TYPES } from "./constants.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.update-notifier.version";
function compareVersions(v1, v2) {
  if (!v1 || !v2) return 0;
  const parts1 = v1.replace(/^v/, "").split(".").map(Number);
  const parts2 = v2.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}
function getUpdateType(currentVer, newVer) {
  if (!currentVer || !newVer) return UPDATE_TYPES.PATCH;
  const current = currentVer.replace(/^v/, "").split(".").map(Number);
  const latest = newVer.replace(/^v/, "").split(".").map(Number);
  if (latest[0] > current[0]) return UPDATE_TYPES.MAJOR;
  if (latest[1] > current[1]) return UPDATE_TYPES.MINOR;
  return UPDATE_TYPES.PATCH;
}
function getCurrentVersion() {
  const metaVersion = document.querySelector('meta[name="app-version"]')?.content;
  if (metaVersion) return metaVersion;
  if (window.__APP_VERSION__) return window.__APP_VERSION__;
  if (window.DSD_VERSION) return window.DSD_VERSION;
  const bodyVersion = document.body.dataset.version;
  if (bodyVersion) return bodyVersion;
  return null;
}
export {
  MODULE_ID,
  VERSION,
  compareVersions,
  getCurrentVersion,
  getUpdateType
};
