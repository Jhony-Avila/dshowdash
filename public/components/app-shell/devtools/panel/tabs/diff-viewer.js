import { icon, sanitizeAttr, formatDate, getAppShell, makeSectionHtml } from "../helpers.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.devtools.panel.tabs.diff-viewer";
let _diffLeftId = null;
let _diffRightId = null;
function setDiffLeft(id) {
  _diffLeftId = id;
}
function setDiffRight(id) {
  _diffRightId = id;
}
function getDiffLeft() {
  return _diffLeftId;
}
function getDiffRight() {
  return _diffRightId;
}
function clearDiff() {
  _diffLeftId = null;
  _diffRightId = null;
}
function _deepDiff(left, right, path) {
  let results = [];
  if (!path) path = "";
  if (left === right) return results;
  if (left === null || left === void 0 || right === null || right === void 0 || typeof left !== typeof right) {
    results.push({ path: path || "(root)", type: "modified", left, right });
    return results;
  }
  if (typeof left !== "object") {
    if (left !== right) results.push({ path: path || "(root)", type: "modified", left, right });
    return results;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    if (JSON.stringify(left) !== JSON.stringify(right)) {
      results.push({ path: path || "(root)", type: "modified", left, right });
    }
    return results;
  }
  const allKeys = {};
  Object.keys(left).forEach((k) => {
    allKeys[k] = true;
  });
  Object.keys(right).forEach((k) => {
    allKeys[k] = true;
  });
  Object.keys(allKeys).forEach((key) => {
    const childPath = path ? `${path}.${key}` : key;
    if (!(key in left)) {
      results.push({ path: childPath, type: "added", left: void 0, right: right[key] });
    } else if (!(key in right)) {
      results.push({ path: childPath, type: "removed", left: left[key], right: void 0 });
    } else {
      const sub = _deepDiff(left[key], right[key], childPath);
      results = results.concat(sub);
    }
  });
  return results;
}
function _formatValue(val) {
  if (val === void 0) return "<em>undefined</em>";
  if (val === null) return "<em>null</em>";
  if (typeof val === "object") {
    const str = JSON.stringify(val);
    return str.length > 80 ? `${sanitizeAttr(str.substring(0, 77))}...` : sanitizeAttr(str);
  }
  return sanitizeAttr(String(val));
}
function renderDiffViewer() {
  const shell = getAppShell();
  if (!shell || !shell.stateSnapshots) return '<div class="dsd-ui-empty">StateSnapshots not available</div>';
  let snapshots = [];
  try {
    snapshots = shell.stateSnapshots.getAll();
  } catch (e) {
    return '<div class="dsd-ui-empty">Error loading snapshots</div>';
  }
  if (snapshots.length < 2) return '<div class="dsd-ui-empty">Need at least 2 snapshots to compare. Capture snapshots in the Snapshots tab.</div>';
  const selectHtml = snapshots.slice(-10).reverse().map((s) => `<option value="${sanitizeAttr(s.id)}">${sanitizeAttr(s.label)} (${formatDate(s.timestamp)})</option>`).join("");
  const selectorHtml = `<div class="dsd-ui-diff-selector"><div class="dsd-ui-diff-selector__col"><label>Left (older)</label><select id="diff-select-left" class="dsd-ui-select">${selectHtml}</select></div><div class="dsd-ui-diff-selector__arrow">${icon("arrowRight", 20)}</div><div class="dsd-ui-diff-selector__col"><label>Right (newer)</label><select id="diff-select-right" class="dsd-ui-select">${selectHtml}</select></div><button class="dsd-ui-btn" id="btn-run-diff">${icon("search", 14)} Compare</button></div>`;
  let diffResultHtml = "";
  if (_diffLeftId && _diffRightId) {
    const left = snapshots.find((s) => s.id === _diffLeftId);
    const right = snapshots.find((s) => s.id === _diffRightId);
    if (left && right) {
      let diffs = _deepDiff(left.state || left, right.state || right, "");
      diffs = diffs.filter((d) => d.path !== "id" && d.path !== "timestamp" && d.path !== "label");
      if (diffs.length === 0) {
        diffResultHtml = `<div class="dsd-ui-empty">${icon("checkCircle", 16)} Snapshots are identical (no differences found)</div>`;
      } else {
        const added = diffs.filter((d) => d.type === "added").length;
        const removed = diffs.filter((d) => d.type === "removed").length;
        const modified = diffs.filter((d) => d.type === "modified").length;
        diffResultHtml = makeSectionHtml(
          "diff-summary",
          "checkCircle",
          `Summary: ${diffs.length} differences`,
          `<div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Added</div><div class="dsd-ui-card__value dsd-ui-status--healthy">${added}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Removed</div><div class="dsd-ui-card__value dsd-ui-status--unhealthy">${removed}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Modified</div><div class="dsd-ui-card__value dsd-ui-status--degraded">${modified}</div></div></div>`
        ) + makeSectionHtml(
          "diff-details",
          "fileText",
          "Details",
          `<div class="dsd-ui-list">${diffs.map((d) => {
            const typeClass = d.type === "added" ? "dsd-ui-diff--added" : d.type === "removed" ? "dsd-ui-diff--removed" : "dsd-ui-diff--modified";
            const typeLabel = d.type === "added" ? "+" : d.type === "removed" ? "-" : "~";
            return `<div class="dsd-ui-list-item ${typeClass}"><span class="dsd-ui-diff__type">${typeLabel}</span><span class="dsd-ui-diff__path">${sanitizeAttr(d.path)}</span>${d.type !== "added" ? `<span class="dsd-ui-diff__val dsd-ui-diff__val--old">${_formatValue(d.left)}</span>` : ""}${d.type !== "removed" ? `<span class="dsd-ui-diff__val dsd-ui-diff__val--new">${_formatValue(d.right)}</span>` : ""}</div>`;
          }).join("")}</div>`
        );
      }
    } else {
      diffResultHtml = '<div class="dsd-ui-empty">Selected snapshots not found. They may have been cleared.</div>';
    }
  }
  return makeSectionHtml("diff-controls", "columns", "Snapshot Comparison", selectorHtml) + diffResultHtml;
}
var diff_viewer_default = { renderDiffViewer, setDiffLeft, setDiffRight, getDiffLeft, getDiffRight, clearDiff };
export {
  MODULE_ID,
  VERSION,
  clearDiff,
  diff_viewer_default as default,
  getDiffLeft,
  getDiffRight,
  renderDiffViewer,
  setDiffLeft,
  setDiffRight
};
