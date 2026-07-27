import { icon, sanitizeAttr, formatDate, getAppShell } from "../helpers.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.devtools.panel.tabs.snapshots";
function renderSnapshotsTab() {
  const shell = getAppShell();
  if (!shell || !shell.stateSnapshots) {
    return '<div class="dsd-ui-empty">StateSnapshots not available</div>';
  }
  try {
    const snapshots = shell.stateSnapshots.getAll();
    const metrics = shell.stateSnapshots.getMetrics();
    const isAuto = shell.stateSnapshots.isAutoSnapshotRunning();
    const snapshotsList = snapshots.length === 0 ? '<div class="dsd-ui-empty">No snapshots captured yet</div>' : snapshots.slice(-10).reverse().map((s) => `<div class="dsd-ui-snapshot-item" data-id="${sanitizeAttr(s.id)}"><div class="dsd-ui-snapshot-item__info"><div class="dsd-ui-snapshot-item__label">${sanitizeAttr(s.label)}</div><div class="dsd-ui-snapshot-item__time">${formatDate(s.timestamp)}</div></div><div class="dsd-ui-snapshot-item__actions"><button class="dsd-ui-btn" data-action="restore" data-id="${sanitizeAttr(s.id)}">${icon("undo", 14)}</button><button class="dsd-ui-btn" data-action="delete" data-id="${sanitizeAttr(s.id)}">${icon("trash", 14)}</button></div></div>`).join("");
    return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("snapshots")} State Snapshots</div><div class="dsd-ui-toolbar"><button class="dsd-ui-btn" id="btn-capture-snapshot">${icon("snapshots", 14)} Capture</button><button class="dsd-ui-btn ${isAuto ? "active" : ""}" id="btn-toggle-auto">${icon(isAuto ? "pause" : "play", 14)} Auto</button><button class="dsd-ui-btn" id="btn-clear-snapshots">${icon("trash", 14)} Clear</button></div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Total</div><div class="dsd-ui-card__value">${snapshots.length}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Captured</div><div class="dsd-ui-card__value">${metrics.snapshotsTaken}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Restored</div><div class="dsd-ui-card__value">${metrics.snapshotsRestored}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Auto</div><div class="dsd-ui-card__value ${isAuto ? "dsd-ui-status--healthy" : ""}">${isAuto ? "ON" : "OFF"}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("fileText")} List (last 10)</div>${snapshotsList}</div>`;
  } catch (e) {
    return `<div class="dsd-ui-empty">Error rendering snapshots: ${sanitizeAttr(e.message)}</div>`;
  }
}
export {
  MODULE_ID,
  VERSION,
  renderSnapshotsTab
};
