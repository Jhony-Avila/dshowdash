import { icon, sanitizeAttr, getAppShell } from "../helpers.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.devtools.panel.tabs.debug-presets";
function renderDebugPresetsTab() {
  const shell = getAppShell();
  if (!shell || !shell.debugPresets) {
    return '<div class="dsd-ui-empty">DebugPresets not available</div>';
  }
  try {
    const current = shell.debugPresets.getCurrent();
    const presets = shell.debugPresets.listPresets();
    const isEnabled = shell.debugPresets.isEnabled();
    const metrics = shell.debugPresets.getMetrics();
    const presetIcons = {
      minimal: "volumeX",
      standard: "volume",
      verbose: "volume2",
      performance: "zap",
      network: "globe",
      memory: "cpu",
      events: "activity",
      regions: "regions"
    };
    const presetsGrid = presets.map((preset) => {
      const isActive = current === preset;
      return `<button class="dsd-ui-preset-btn ${isActive ? "active" : ""}" data-preset="${sanitizeAttr(preset)}"><div class="dsd-ui-preset-btn__icon">${icon(presetIcons[preset] || "presets", 20)}</div><div class="dsd-ui-preset-btn__name">${sanitizeAttr(preset)}</div>${isActive ? `<div class="dsd-ui-preset-btn__check">${icon("check", 14)}</div>` : ""}</button>`;
    }).join("");
    return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("presets")} Debug Presets</div><div class="dsd-ui-toolbar"><button class="dsd-ui-btn" id="btn-disable-preset">${icon("stop", 14)} Disable</button><button class="dsd-ui-btn" id="btn-revert-preset">${icon("undo", 14)} Revert</button></div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Current</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${sanitizeAttr(current || "None")}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Enabled</div><div class="dsd-ui-card__value ${isEnabled ? "dsd-ui-status--healthy" : ""}">${isEnabled ? "YES" : "NO"}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Applied</div><div class="dsd-ui-card__value">${metrics.presetsApplied}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Changes</div><div class="dsd-ui-card__value">${metrics.presetChanges}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("layout")} Available Presets</div><div class="dsd-ui-presets-grid">${presetsGrid}</div></div>`;
  } catch (e) {
    return `<div class="dsd-ui-empty">Error rendering presets: ${sanitizeAttr(e.message)}</div>`;
  }
}
export {
  MODULE_ID,
  VERSION,
  renderDebugPresetsTab
};
