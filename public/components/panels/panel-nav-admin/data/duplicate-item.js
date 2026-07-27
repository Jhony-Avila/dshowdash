import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.1.0-MIGRATION-PHASE2";
const MODULE_ID = "panel-nav-admin.data.duplicate-item";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = "[DuplicateItem]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const EXCLUDED_FIELDS = /* @__PURE__ */ new Set([
  "sourceId",
  "dbId",
  "createdAt",
  "updatedAt"
]);
function prepareDuplicate(item, existingItems = []) {
  if (!item) return null;
  const existingIds = new Set((existingItems || []).map((i) => i.id));
  let baseId = item.id + "-copy";
  let newId = baseId;
  let suffix = 1;
  while (existingIds.has(newId)) {
    newId = baseId + "-" + suffix;
    suffix++;
  }
  const duplicate = {};
  for (const [key, value] of Object.entries(item)) {
    if (EXCLUDED_FIELDS.has(key)) continue;
    duplicate[key] = value;
  }
  duplicate.id = newId;
  duplicate.label = (item.label || "") + " (c\xF3pia)";
  duplicate.order = (item.order || 0) + 1;
  duplicate.isActive = false;
  duplicate.createdAt = null;
  duplicate.updatedAt = null;
  duplicate._duplicatedFrom = item.id;
  duplicate._duplicatedAt = (/* @__PURE__ */ new Date()).toISOString();
  _log("debug", "Prepared duplicate:", item.id, "\u2192", newId);
  return duplicate;
}
async function executeDuplicate(item, navAdapter, existingItems = []) {
  const duplicate = prepareDuplicate(item, existingItems);
  if (!duplicate) {
    return { success: false, error: "Item inv\xE1lido para duplica\xE7\xE3o" };
  }
  try {
    const result = await navAdapter.createItem(duplicate);
    if (result.success) {
      _log("info", "Duplicated:", item.id, "\u2192", duplicate.id);
      return { success: true, duplicate };
    }
    return { success: false, error: result.error || "Falha ao criar item duplicado" };
  } catch (error) {
    _log("error", "Duplicate failed:", error.message);
    return { success: false, error: error.message };
  }
}
async function duplicateItems(items, navAdapter, existingItems = [], onProgress) {
  let success = 0;
  let failed = 0;
  const duplicates = [];
  const allExisting = [...existingItems || []];
  for (let i = 0; i < items.length; i++) {
    const result = await executeDuplicate(items[i], navAdapter, allExisting);
    if (result.success) {
      success++;
      duplicates.push(result.duplicate);
      allExisting.push(result.duplicate);
    } else {
      failed++;
    }
    if (onProgress) onProgress(i + 1, items.length);
  }
  return { success, failed, duplicates };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION };
}
var duplicate_item_default = { prepareDuplicate, executeDuplicate, duplicateItems, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  duplicate_item_default as default,
  duplicateItems,
  executeDuplicate,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  prepareDuplicate
};
