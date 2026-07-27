import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { escapeHtml } from "../../security/escape-html.js";
const VERSION = "10.5.0-MIGRATION-PHASE9";
const MODULE_ID = "panel-nav-admin.ui.views.comparison-view";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[ComparisonView]";
  if (level === "error") logger.error?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const CSS = {
  container: "pna-comparison-container",
  header: "pna-comparison-header",
  table: "pna-comparison-table",
  rowAdded: "pna-comparison-added",
  rowRemoved: "pna-comparison-removed",
  rowModified: "pna-comparison-modified",
  rowUnchanged: "pna-comparison-unchanged",
  cellChanged: "pna-comparison-cell-changed",
  legend: "pna-comparison-legend",
  stats: "pna-comparison-stats"
};
function diffItems(currentItems, previousItems, options = {}) {
  const idField = options.idField || "id";
  const compareFields = options.compareFields;
  const prevMap = /* @__PURE__ */ new Map();
  for (const item of previousItems || []) {
    if (item[idField]) prevMap.set(item[idField], item);
  }
  const currMap = /* @__PURE__ */ new Map();
  for (const item of currentItems || []) {
    if (item[idField]) currMap.set(item[idField], item);
  }
  const added = [];
  const removed = [];
  const modified = [];
  const unchanged = [];
  for (const [id, currItem] of currMap) {
    if (!prevMap.has(id)) {
      added.push({ item: currItem, type: "added" });
    } else {
      const prevItem = prevMap.get(id);
      const changes = _getChanges(currItem, prevItem, compareFields);
      if (changes.length > 0) {
        modified.push({ item: currItem, previous: prevItem, changes, type: "modified" });
      } else {
        unchanged.push({ item: currItem, type: "unchanged" });
      }
    }
  }
  for (const [id, prevItem] of prevMap) {
    if (!currMap.has(id)) {
      removed.push({ item: prevItem, type: "removed" });
    }
  }
  return {
    added,
    removed,
    modified,
    unchanged,
    summary: {
      totalCurrent: currentItems?.length || 0,
      totalPrevious: previousItems?.length || 0,
      addedCount: added.length,
      removedCount: removed.length,
      modifiedCount: modified.length,
      unchangedCount: unchanged.length
    }
  };
}
function _getChanges(current, previous, fields) {
  const allFields = fields || [.../* @__PURE__ */ new Set([...Object.keys(current), ...Object.keys(previous)])];
  const changes = [];
  for (const field of allFields) {
    if (field === "updatedAt" || field === "createdAt") continue;
    const curVal = current[field];
    const prevVal = previous[field];
    if (JSON.stringify(curVal) !== JSON.stringify(prevVal)) {
      changes.push({ field, current: curVal, previous: prevVal });
    }
  }
  return changes;
}
function ComparisonView(container, options = {}) {
  const displayFields = options.displayFields || ["label", "href", "icon", "section", "context", "minLevel", "isActive", "order"];
  let _currentDiff = null;
  function render(currentItems, previousItems, diffOptions = {}) {
    if (!container) return;
    const diff = diffItems(currentItems, previousItems, diffOptions);
    _currentDiff = diff;
    const { added, removed, modified, unchanged, summary } = diff;
    container.innerHTML = `
      <div class="${CSS.container}">
        <div class="${CSS.header}">
          <h3>Compara\xE7\xE3o de Configura\xE7\xE3o</h3>
          <div class="${CSS.stats}">
            <span style="color:var(--color-success, #4caf50)">+${summary.addedCount} adicionados</span>
            <span style="color:var(--color-error, #f44336)">-${summary.removedCount} removidos</span>
            <span style="color:var(--color-warning, #ff9800)">${summary.modifiedCount} modificados</span>
            <span style="opacity:0.6">${summary.unchangedCount} inalterados</span>
          </div>
        </div>
        <div class="${CSS.legend}">
          <span class="${CSS.rowAdded}">Adicionado</span>
          <span class="${CSS.rowRemoved}">Removido</span>
          <span class="${CSS.rowModified}">Modificado</span>
        </div>
        <table class="${CSS.table}">
          <thead>
            <tr>
              <th>Status</th>
              ${displayFields.map((f) => `<th>${escapeHtml(f)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${added.map(({ item }) => _renderRow(item, "added", displayFields)).join("")}
            ${modified.map(({ item, changes }) => _renderModifiedRow(item, changes, displayFields)).join("")}
            ${removed.map(({ item }) => _renderRow(item, "removed", displayFields)).join("")}
          </tbody>
        </table>
      </div>
    `;
    _log("info", `Comparison rendered: +${summary.addedCount} -${summary.removedCount} ~${summary.modifiedCount}`);
  }
  function _renderRow(item, type, fields) {
    const cssClass = type === "added" ? CSS.rowAdded : CSS.rowRemoved;
    const label = type === "added" ? "+" : "-";
    return `
      <tr class="${cssClass}">
        <td>${label}</td>
        ${fields.map((f) => `<td>${escapeHtml(String(item[f] ?? ""))}</td>`).join("")}
      </tr>
    `;
  }
  function _renderModifiedRow(item, changes, fields) {
    const changedFields = new Set(changes.map((c) => c.field));
    return `
      <tr class="${CSS.rowModified}">
        <td>~</td>
        ${fields.map((f) => {
      const changed = changedFields.has(f);
      const cls = changed ? CSS.cellChanged : "";
      const val = escapeHtml(String(item[f] ?? ""));
      const prevChange = changes.find((c) => c.field === f);
      const title = prevChange ? `Anterior: ${String(prevChange.previous ?? "")}` : "";
      return `<td class="${cls}" title="${escapeHtml(title)}">${val}</td>`;
    }).join("")}
      </tr>
    `;
  }
  function getDiff() {
    return _currentDiff;
  }
  function clear() {
    if (container) container.innerHTML = "";
    _currentDiff = null;
  }
  return { render, getDiff, clear };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var comparison_view_default = { ComparisonView, diffItems, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  ComparisonView,
  MODULE_ID,
  VERSION,
  comparison_view_default as default,
  diffItems,
  healthCheck,
  info,
  injectPorts
};
