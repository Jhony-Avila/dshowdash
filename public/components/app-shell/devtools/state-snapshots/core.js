import { generateId, getSize } from "./constants.js";
import { collectAppShellState, collectPerformanceState, collectAdapterState, collectDOMState } from "./collectors.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.devtools.state-snapshots.core";
function capture(label, metadata, state) {
  const snapshot = {
    id: generateId(),
    label: label || `Snapshot ${state.snapshots.length + 1}`,
    timestamp: Date.now(),
    metadata: metadata || {},
    appShell: collectAppShellState(),
    performance: collectPerformanceState(state.config),
    adapters: collectAdapterState(state.config),
    dom: collectDOMState(state.config)
  };
  snapshot.size = getSize(snapshot);
  state.snapshots.push(snapshot);
  state.metrics.snapshotsTaken++;
  while (state.snapshots.length > state.config.maxSnapshots) {
    state.snapshots.shift();
  }
  state.notify({
    type: "captured",
    snapshot: { id: snapshot.id, label: snapshot.label, timestamp: snapshot.timestamp },
    total: state.snapshots.length
  });
  return snapshot;
}
function restore(snapshotId, options, state) {
  const snapshot = state.snapshots.find((s) => s.id === snapshotId);
  if (!snapshot) return { success: false, error: "Snapshot n\xE3o encontrado" };
  options = options || { layout: true, theme: true, a11y: true, visibility: true };
  const restored = [];
  try {
    const appState = snapshot.appShell;
    const shell = typeof window !== "undefined" && window.AppShell ? window.AppShell : null;
    if (!shell) return { success: false, error: "AppShell not available", restored };
    if (options.layout && appState.layoutPrefs && shell.layoutPrefs?.setPreferences) {
      shell.layoutPrefs.setPreferences(appState.layoutPrefs);
      restored.push("layoutPrefs");
    }
    if (options.layout && appState.layoutPreset && shell.layoutPresets?.apply) {
      shell.layoutPresets.apply(appState.layoutPreset);
      restored.push("layoutPreset");
    }
    if (options.theme && appState.theme && shell.theme?.setTheme) {
      shell.theme.setTheme(appState.theme);
      restored.push("theme");
    }
    if (options.a11y && appState.a11yPresets && shell.a11y?.enableMultiple) {
      shell.a11y.reset?.();
      shell.a11y.enableMultiple(appState.a11yPresets);
      restored.push("a11yPresets");
    }
    if (options.visibility && appState.visibility && shell.visibility) {
      const regions = Object.keys(appState.visibility);
      for (let i = 0; i < regions.length; i++) {
        shell.visibility.setVisibility?.(regions[i], appState.visibility[regions[i]]);
      }
      restored.push("visibility");
    }
    state.metrics.snapshotsRestored++;
    state.notify({ type: "restored", snapshotId, restored });
    return { success: true, restored, snapshotId };
  } catch (error) {
    state.metrics.errors++;
    return { success: false, error: error.message, restored };
  }
}
function compare(snapshotId1, snapshotId2, state) {
  const snap1 = state.snapshots.find((s) => s.id === snapshotId1);
  const snap2 = state.snapshots.find((s) => s.id === snapshotId2);
  if (!snap1 || !snap2) return { error: "Um ou ambos snapshots n\xE3o encontrados" };
  state.metrics.comparisons++;
  const diff = {
    snapshot1: { id: snap1.id, label: snap1.label, timestamp: snap1.timestamp },
    snapshot2: { id: snap2.id, label: snap2.label, timestamp: snap2.timestamp },
    timeDiff: snap2.timestamp - snap1.timestamp,
    changes: []
  };
  const fieldsToCompare = ["theme", "layoutPreset", "debugPreset", "visibility", "regionSizes"];
  for (let i = 0; i < fieldsToCompare.length; i++) {
    const field = fieldsToCompare[i];
    const val1 = JSON.stringify(snap1.appShell?.[field]);
    const val2 = JSON.stringify(snap2.appShell?.[field]);
    if (val1 !== val2) {
      diff.changes.push({ field, before: snap1.appShell?.[field], after: snap2.appShell?.[field] });
    }
  }
  if (snap1.performance?.memory && snap2.performance?.memory) {
    const memDiff = (snap2.performance.memory.usedJSHeapSize || 0) - (snap1.performance.memory.usedJSHeapSize || 0);
    if (memDiff !== 0) {
      diff.changes.push({
        field: "memory.usedJSHeapSize",
        before: snap1.performance.memory.usedJSHeapSize,
        after: snap2.performance.memory.usedJSHeapSize,
        delta: memDiff
      });
    }
  }
  return diff;
}
function getSnapshot(snapshotId, state) {
  return state.snapshots.find((s) => s.id === snapshotId) || null;
}
function getAllSnapshots(state) {
  return state.snapshots.map((s) => ({
    id: s.id,
    label: s.label,
    timestamp: s.timestamp,
    size: s.size
  }));
}
function getLatestSnapshot(state) {
  return state.snapshots.length > 0 ? state.snapshots[state.snapshots.length - 1] : null;
}
function getByLabel(label, state) {
  return state.snapshots.filter((s) => s.label.includes(label));
}
function countSnapshots(state) {
  return state.snapshots.length;
}
function removeSnapshot(snapshotId, state) {
  const idx = state.snapshots.findIndex((s) => s.id === snapshotId);
  if (idx >= 0) {
    state.snapshots.splice(idx, 1);
    return true;
  }
  return false;
}
function clearSnapshots(state) {
  state.snapshots.length = 0;
  state.notify({ type: "cleared" });
}
function exportSnapshot(snapshotId, state) {
  const snapshot = getSnapshot(snapshotId, state);
  if (!snapshot) return null;
  return JSON.stringify(snapshot, null, 2);
}
function exportAllSnapshots(state) {
  return JSON.stringify(state.snapshots, null, 2);
}
function importSnapshot(data, state) {
  try {
    const snapshot = typeof data === "string" ? JSON.parse(data) : data;
    if (!snapshot.id || !snapshot.timestamp) throw new Error("Invalid snapshot format");
    snapshot.id = generateId();
    snapshot.imported = true;
    state.snapshots.push(snapshot);
    return { success: true, id: snapshot.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
export {
  MODULE_ID,
  VERSION,
  capture,
  clearSnapshots,
  compare,
  countSnapshots,
  exportAllSnapshots,
  exportSnapshot,
  getAllSnapshots,
  getByLabel,
  getLatestSnapshot,
  getSnapshot,
  importSnapshot,
  removeSnapshot,
  restore
};
